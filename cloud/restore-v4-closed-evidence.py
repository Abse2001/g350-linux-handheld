"""Build, restore and verify the explicit closed V4 evidence archive only.

No runtime/solver import, Git, network, routing, installation or Start execution.
All writes are confined to a new private evidence namespace and indexed records.
"""
import argparse
import gzip
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import stat
import tarfile

BOARD = Path('/workspace/g350-linux-handheld')
SOLVER = Path('/workspace/bus-lanes-solver')
PRIVATE = BOARD / '.cloud-tools'
PREP = PRIVATE / 'continued-v4-closed-runs-persistence-next'
TRUSTED_DEPS = SOLVER / 'node_modules'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(path):
    value = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def canonical(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def safe_name(name):
    require(type(name) is str, 'String member required')
    relative = PurePosixPath(name)
    require(relative.parts and not relative.is_absolute() and str(relative) == name,
            'Canonical relative member required')
    require(all(part not in ('.', '..', '.git', 'node_modules', '__pycache__') for part in relative.parts),
            'Excluded member path')
    return name


def real_ancestry(path, stop=Path('/workspace'), missing=False):
    path = Path(os.path.abspath(path))
    for parent in (path, *path.parents):
        if parent.exists() or parent.is_symlink():
            require(parent.is_dir() and not parent.is_symlink(), 'Nonreal directory ancestry: ' + str(parent))
        else:
            require(missing, 'Missing real directory: ' + str(parent))
        if parent == stop:
            return path
    raise ValueError('Ancestry outside expected workspace')


def evidence_root(path, missing=False):
    path = Path(os.path.abspath(path))
    require(path.is_relative_to(PRIVATE) and path != PRIVATE,
            'Private evidence root required')
    require(path.relative_to(PRIVATE).parts[0].startswith('ti-ddr-v7-diagnostics-restored-'),
            'Declared V4 restored namespace required')
    return real_ancestry(path, PRIVATE, missing=missing)


def row_valid(row):
    safe_name(row['path'])
    require(type(row['bytes']) is int and 0 <= row['bytes'] <= 64 * 1024**2,
            'Bounded integer file size required')
    require(type(row['mode']) is int and 0 <= row['mode'] <= 0o777, 'Safe integer filesystem mode required')
    value = row['sha256']
    require(type(value) is str and len(value) == 64 and all(c in '0123456789abcdef' for c in value),
            'SHA256 descriptor required')


def inventory_rows(inventory):
    require(inventory['fabricationReady'] is False and inventory['accepted49'] is False,
            'Evidence-only inventory required')
    rows = {}
    for row in inventory['files']:
        row_valid(row)
        require(row['path'] not in rows, 'Duplicate archive member')
        rows[row['path']] = row
    require(len(rows) <= 6000 and sum(row['bytes'] for row in rows.values()) <= 512 * 1024**2,
            'Explicit archive record/byte bounds exceeded')
    for name in rows:
        require(not any(str(parent) in rows for parent in PurePosixPath(name).parents if str(parent) != '.'),
                'Archive file/parent conflict')
    return rows


def real_source(path):
    path = Path(path)
    require(path.is_absolute() and (path.is_relative_to(BOARD) or path.is_relative_to(SOLVER)),
            'Explicit source outside two project roots')
    real_ancestry(path.parent)
    require(stat.S_ISREG(path.lstat().st_mode) and not path.is_symlink(), 'Regular source record required')
    return path


def file_matches(path, row, modes=True):
    require(stat.S_ISREG(path.lstat().st_mode) and not path.is_symlink(), 'Regular target required')
    require(path.stat().st_size == row['bytes'] and digest(path) == row['sha256'],
            'Preserving differing evidence bytes: ' + str(path))
    if modes:
        require(stat.S_IMODE(path.stat().st_mode) == row['mode'], 'Evidence mode differs: ' + str(path))


def target(root, name, missing=False):
    path = root / safe_name(name)
    real_ancestry(path.parent, root.parent, missing=missing)
    require(path.is_relative_to(root), 'Target escaped restoration root')
    if path.exists() or path.is_symlink():
        require(stat.S_ISREG(path.lstat().st_mode) and not path.is_symlink(), 'Nonregular/symlink evidence target')
    else:
        require(missing, 'Indexed target missing')
    return path


def resolver_recipes(rows):
    sources = [str(PurePosixPath(name).parent) for name in rows
               if name.startswith('solver/.cache/') and name.endswith('/source/package.json')]
    return sorted({name for source in sources for name in (source + '/node_modules',
                   str(PurePosixPath(source).parent) + '/node_modules')})


def check_resolvers(root, rows, allow_missing=True):
    recipes = resolver_recipes(rows)
    for name in recipes:
        path = root / name
        real_ancestry(path.parent, root.parent, missing=allow_missing)
        if path.exists() or path.is_symlink():
            require(path.is_symlink() and os.readlink(path) == str(TRUSTED_DEPS),
                    'Preserving foreign resolver: ' + str(path))
            require(TRUSTED_DEPS.is_dir() and path.resolve() == TRUSTED_DEPS, 'Trusted resolver unavailable')
        else:
            require(allow_missing, 'Declared resolver missing')
    return recipes


def source_closures(inventory, rows, read_member):
    full = inventory['fullSource']
    source = json.loads(read_member(full['manifestMember']))
    require(len(source['sourceFiles']) == full['count'] == 928, 'Exact source928 cardinality required')
    require(canonical({'sourceFiles': source['sourceFiles'], 'filesystemModes': source['filesystemModes']})
            == full['closureSha256'] == source['sourceClosureSha256'], 'Full source closure differs')
    expected_names = {full['sourceMemberRoot'] + '/' + row['path'] for row in source['sourceFiles']}
    actual_names = {name for name in rows if name.startswith(full['sourceMemberRoot'] + '/')}
    require(actual_names == expected_names, 'Archive source928 missing/extra member')
    by_path = {}
    for row in source['sourceFiles']:
        name = full['sourceMemberRoot'] + '/' + safe_name(row['path'])
        indexed = rows[name]
        require(indexed['bytes'] == row['bytes'] and indexed['sha256'] == row['sha256']
                and indexed['mode'] == source['filesystemModes'][row['path']], 'Source928 projection differs')
        by_path[row['path']] = row
    runtime_info = inventory['runtimeSource']
    runtime = json.loads(read_member(runtime_info['manifestMember']))
    require(len(runtime['files']) == runtime_info['count'] == 126, 'Exact runtime126 cardinality required')
    require(canonical(runtime['files']) == runtime_info['closureSha256']
            == runtime['sourceClosureSha256'], 'Runtime closure differs')
    for row in runtime['files']:
        require(row['path'] in by_path and all(row[k] == by_path[row['path']][k] for k in ('bytes', 'sha256'))
                and row['mode'] == source['filesystemModes'][row['path']], 'Runtime/full source projection differs')
    for root in inventory['runtimeMemberRoots']:
        expected = {root + '/' + row['path'] for row in runtime['files']}
        actual = {name for name in rows if name.startswith(root + '/')}
        require(actual == expected, 'Copied runtime126 missing/extra indexed files')
        for row in runtime['files']:
            indexed = rows[root + '/' + row['path']]
            require(all(indexed[k] == row[k] for k in ('bytes', 'sha256', 'mode')), 'Copied runtime bytes/mode differ')
    return {'fullSourceFiles': 928, 'runtimeFiles': 126, 'runtimeCopies': len(inventory['runtimeMemberRoots'])}


def physical_source_census(root, source_member, rows, allow_missing):
    source = root / source_member
    expected = {name.removeprefix(source_member + '/') for name in rows if name.startswith(source_member + '/')}
    allowed_directories = {str(parent) for name in expected for parent in PurePosixPath(name).parents
                           if str(parent) != '.'}
    if not source.exists() and not source.is_symlink():
        require(allow_missing, 'Source tree missing')
        return
    real_ancestry(source, root.parent)
    actual = set()
    for current, directories, files in os.walk(source, followlinks=False):
        for name in list(directories):
            path = Path(current) / name
            relative = str(path.relative_to(source))
            if name == 'node_modules':
                require(path.is_symlink() and os.readlink(path) == str(TRUSTED_DEPS), 'Unexpected source resolver')
                directories.remove(name)
            else:
                require(not path.is_symlink() and relative in allowed_directories,
                        'Unexpected physical source directory/link')
        for name in files:
            path = Path(current) / name
            relative = str(path.relative_to(source))
            require(not path.is_symlink() and stat.S_ISREG(path.lstat().st_mode) and relative in expected,
                    'Unexpected physical source file/link')
            actual.add(relative)
    require(actual <= expected and (allow_missing or actual == expected), 'Source physical census missing/extra')


def verify_mappings(inventory, rows, prior_map):
    indexed = {row['sourcePath']: row for row in rows.values()}
    require(len(indexed) == len(rows), 'Duplicate original source mapping')
    prior = {}
    bindings = {row['path']: row for row in inventory['priorArchiveBindings']}
    for row in inventory['priorMappings']:
        require(row['originalPath'] not in indexed and row['originalPath'] not in prior, 'Conflicting prior original path')
        binding = bindings[row['manifestPath']]
        manifest_path = real_source(binding['path'])
        require(digest(manifest_path) == binding['sha256'] == row['manifestSha256'], 'Prior manifest identity differs')
        manifest = json.loads(manifest_path.read_bytes())
        require(manifest['archive'] == binding['archive'], 'Prior archive binding differs')
        require(binding['path'] in prior_map, 'Explicit prior restoration map missing')
        root = Path(prior_map[binding['path']])
        allowed = ('ti-ddr-followup-restored-2026-10-12', 'ti-ddr-v7-followup-restored-2026-10-12',
                   'ti-ddr-v7-diagnostics-restored-2026-10-13')
        require(root.parent == PRIVATE and root.name in allowed, 'Exact trusted prior restoration root required')
        real_ancestry(root, PRIVATE)
        matches = [entry for entry in manifest['files'] if entry['path'] == row['member']
                   and entry.get('sourcePath') == row['originalPath']]
        require(len(matches) == 1 and all(matches[0][k] == row[k] for k in ('bytes', 'sha256', 'mode')),
                'Prior mapping differs from exact trusted member')
        file_matches(target(root, row['member']), row)
        prior[row['originalPath']] = row
    prerequisites = {row['path']: row for row in inventory['trustedRuntimePrerequisites']}
    for row in prerequisites.values():
        # Binaries are checked as external prerequisites; never added to archive.
        file_matches(real_source(row['path']), row)
    available = {**indexed, **prior, **prerequisites}
    for row in inventory['declaredExternalBindings']:
        require(row['path'] in available and all(available[row['path']][k] == row[k] for k in ('bytes', 'sha256', 'mode')),
                'Unresolved declared external record')
    return len(prior)


def build(inventory_path, expected_sha, archive, external):
    require(digest(real_source(inventory_path)) == expected_sha, 'Exact inventory hash required')
    inventory = json.loads(inventory_path.read_bytes())
    rows = inventory_rows(inventory)
    require('manifest.json' not in rows, 'Internal index name reserved')
    archive, external = Path(archive).absolute(), Path(external).absolute()
    require(archive.parent == PREP and external.parent == PREP, 'New artifacts confined to preparation root')
    real_ancestry(PREP, PRIVATE)
    require(not archive.exists() and not archive.is_symlink() and not external.exists() and not external.is_symlink(),
            'Never replace archive or external index')
    for row in rows.values():
        file_matches(real_source(row['sourcePath']), row)
    closures = source_closures(inventory, rows, lambda name: Path(rows[name]['sourcePath']).read_bytes())
    index_bytes = inventory_path.read_bytes()
    index_row = {'sourcePath': str(inventory_path), 'path': 'manifest.json', 'bytes': len(index_bytes),
                 'sha256': hashlib.sha256(index_bytes).hexdigest(), 'mode': 0o600,
                 'role': 'Frozen internal explicit inventory; no route acceptance or future authority'}
    with archive.open('xb') as raw:
        with gzip.GzipFile(filename='', fileobj=raw, mode='wb', compresslevel=1, mtime=0) as zipped:
            with tarfile.open(fileobj=zipped, mode='w', format=tarfile.PAX_FORMAT) as output:
                for name, row in sorted({**rows, 'manifest.json': index_row}.items()):
                    info = tarfile.TarInfo(name)
                    info.size, info.mode, info.mtime, info.uid, info.gid = row['bytes'], row['mode'], 0, 0, 0
                    info.uname = info.gname = ''
                    if name == 'manifest.json':
                        output.addfile(info, io.BytesIO(index_bytes))
                    else:
                        with Path(row['sourcePath']).open('rb') as stream:
                            output.addfile(info, stream)
    archive.chmod(0o600)
    result = {**inventory, 'archive': {'path': str(archive), 'bytes': archive.stat().st_size,
                                     'sha256': digest(archive)},
              'files': [row for _, row in sorted({**rows, 'manifest.json': index_row}.items())],
              'internalInventorySha256': expected_sha, 'archiveBuildClosure': closures}
    with external.open('x') as stream:
        stream.write(json.dumps(result, indent=2, sort_keys=True) + '\n')
    external.chmod(0o600)
    print(json.dumps({'archiveSha256': result['archive']['sha256'], 'archiveBytes': result['archive']['bytes'],
                      'manifestSha256': digest(external), 'members': len(result['files']),
                      'archiveCreated': True, 'accepted49': False, 'fabricationReady': False}, sort_keys=True))


def verify_archive(manifest, archive):
    row = manifest['archive']
    require(archive.stat().st_size == row['bytes'] and digest(archive) == row['sha256'], 'Archive identity differs')
    rows = inventory_rows(manifest)
    seen, metadata = set(), {}
    needed = {manifest['fullSource']['manifestMember'], manifest['runtimeSource']['manifestMember'], 'manifest.json'}
    with tarfile.open(archive, 'r:gz') as source:
        for member in source:
            require(member.isfile() and member.name in rows and member.name not in seen, 'Nonregular/unindexed/duplicate tar member')
            row = rows[member.name]
            require(member.size == row['bytes'] and member.mode == row['mode'], 'Tar size/mode differs')
            stream = source.extractfile(member)
            value, copied, chunks = hashlib.sha256(), 0, []
            for block in iter(lambda: stream.read(1024 * 1024), b''):
                value.update(block)
                copied += len(block)
                if member.name in needed:
                    chunks.append(block)
            require(copied == row['bytes'] and value.hexdigest() == row['sha256'], 'Tar payload differs')
            if member.name in needed:
                metadata[member.name] = b''.join(chunks)
            seen.add(member.name)
    require(seen == set(rows), 'Tar omitted indexed member')
    require(hashlib.sha256(metadata['manifest.json']).hexdigest() == manifest['internalInventorySha256'], 'Internal inventory differs')
    internal = json.loads(metadata['manifest.json'])
    require(internal['files'] == [row for row in manifest['files'] if row['path'] != 'manifest.json'], 'Internal/external rows differ')
    closure = source_closures(manifest, rows, lambda name: metadata[name])
    return rows, closure


def restore(manifest_path, expected_sha, archive, root, prior_map, verify_only=False):
    require(digest(real_source(manifest_path)) == expected_sha, 'Exact external manifest hash required')
    manifest = json.loads(manifest_path.read_bytes())
    rows, closure = verify_archive(manifest, archive)
    root = evidence_root(root, missing=not verify_only)
    prior_count = verify_mappings(manifest, rows, prior_map)
    recipes = check_resolvers(root, rows, allow_missing=not verify_only)
    source_roots = [manifest['fullSource']['sourceMemberRoot'], *manifest['runtimeMemberRoots']]
    for source_member in source_roots:
        physical_source_census(root, source_member, rows, allow_missing=not verify_only)
    # All archive bytes, prior mappings, ancestry and existing conflicts are
    # checked before the first directory/file/mode/resolver mutation.
    for name, row in rows.items():
        path = target(root, name, missing=not verify_only)
        if path.exists():
            file_matches(path, row, modes=verify_only)
    restored = changed_modes = created_links = 0
    if not verify_only:
        root.mkdir(mode=0o700, parents=True, exist_ok=True)
        with tarfile.open(archive, 'r:gz') as source:
            for member in source:
                row = rows[member.name]
                path = target(root, member.name, missing=True)
                if not path.exists():
                    path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
                    real_ancestry(path.parent, root.parent)
                    with path.open('xb') as stream:
                        payload = source.extractfile(member)
                        for block in iter(lambda: payload.read(1024 * 1024), b''):
                            stream.write(block)
                    restored += 1
                file_matches(path, row, modes=False)
                if stat.S_IMODE(path.stat().st_mode) != row['mode']:
                    path.chmod(row['mode'])
                    changed_modes += 1
                file_matches(path, row)
        for name in recipes:
            path = root / name
            real_ancestry(path.parent, root.parent)
            if not path.exists() and not path.is_symlink():
                require(TRUSTED_DEPS.is_dir(), 'Trusted installed dependencies unavailable')
                path.symlink_to(TRUSTED_DEPS, target_is_directory=True)
                created_links += 1
    for name, row in rows.items():
        file_matches(target(root, name), row)
    check_resolvers(root, rows, allow_missing=False)
    for source_member in source_roots:
        physical_source_census(root, source_member, rows, allow_missing=False)
    print(json.dumps({'membersVerified': len(rows), 'priorMappingsVerified': prior_count, **closure,
                      'restoredFiles': restored, 'changedModes': changed_modes, 'createdResolverLinks': created_links,
                      'runnableLegacyControllersQualified': False, 'privateGitReconstructed': False,
                      'installedDependencyTreeAuditedHere': False, 'accepted49': False, 'fabricationReady': False}, sort_keys=True))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    build_parser = commands.add_parser('build')
    build_parser.add_argument('--inventory', type=Path, required=True)
    build_parser.add_argument('--inventory-sha256', required=True)
    build_parser.add_argument('--archive', type=Path, required=True)
    build_parser.add_argument('--manifest', type=Path, required=True)
    for command in ('restore', 'verify'):
        sub = commands.add_parser(command)
        sub.add_argument('--manifest', type=Path, required=True)
        sub.add_argument('--manifest-sha256', required=True)
        sub.add_argument('--archive', type=Path, required=True)
        sub.add_argument('--destination', type=Path, required=True)
        sub.add_argument('--prior-map', type=Path, required=True)
    args = parser.parse_args()
    if args.command == 'build':
        build(args.inventory, args.inventory_sha256, args.archive, args.manifest)
    else:
        restore(args.manifest, args.manifest_sha256, args.archive, args.destination,
                json.loads(args.prior_map.read_bytes()), verify_only=args.command == 'verify')


if __name__ == '__main__':
    main()
