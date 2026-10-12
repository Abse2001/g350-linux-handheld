#!/usr/bin/env python3
"""Read-only installed-tree snapshot, content archive and byte verification."""
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import stat
import tarfile


def utc():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def encoded(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def save(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n')


def inventory(root):
    paths = [root]
    for directory, dirs, files in os.walk(root, followlinks=False):
        paths.extend(Path(directory) / name for name in dirs + files)
    entries = []
    for path in sorted(paths, key=lambda p: p.relative_to(root).as_posix()):
        info = path.lstat()
        item = {'path': path.relative_to(root).as_posix(),
                'mode': stat.S_IMODE(info.st_mode)}
        if stat.S_ISLNK(info.st_mode):
            resolved = path.resolve(strict=True)
            if not resolved.is_relative_to(root):
                raise ValueError(f'External dependency symlink requires a separately reviewed content closure: {path} -> {resolved}')
            item.update(type='symlink', target=os.readlink(path),
                        realpath=str(resolved),
                        resolvedRelativePath=resolved.relative_to(root).as_posix())
        elif stat.S_ISDIR(info.st_mode):
            item.update(type='directory')
        elif stat.S_ISREG(info.st_mode):
            item.update(type='file', bytes=info.st_size, sha256=sha(path))
        else:
            raise ValueError(f'Unsupported installed-tree entry: {path}')
        entries.append(item)
    return {'root': str(root), 'excludedPaths': [],
            'externalSymlinks': [], 'entries': entries,
            'treeSha256': hashlib.sha256(encoded(entries)).hexdigest(),
            'fileBytes': sum(e.get('bytes', 0) for e in entries),
            'files': sum(e['type'] == 'file' for e in entries),
            'directories': sum(e['type'] == 'directory' for e in entries),
            'symlinks': sum(e['type'] == 'symlink' for e in entries)}


parser = argparse.ArgumentParser()
parser.add_argument('--root', required=True)
parser.add_argument('--output-directory', required=True)
parser.add_argument('--verify-only', action='store_true')
args = parser.parse_args()
root = Path(args.root).resolve(strict=True)
assert root.is_dir() and root.name == 'node_modules'
output = Path(args.output_directory).resolve()
start = utc()
if args.verify_only:
    expected = json.loads((output / 'tree-before.json').read_bytes())
    current = inventory(root)
    result = {'utc': utc(), 'root': str(root), 'treeSha256': current['treeSha256'],
              'expectedTreeSha256': expected['treeSha256'],
              'unchanged': current['entries'] == expected['entries'],
              'excludedPaths': [], 'toolSha256': sha(Path(__file__))}
    print(json.dumps(result))
    raise SystemExit(0 if result['unchanged'] else 1)

assert not output.exists(), 'Use a new output directory; never replace an existing archive'
output.mkdir(parents=True)
before = inventory(root)
save(output / 'tree-before.json', before)
archive = output / 'installed-node-modules.tar.gz'
with tarfile.open(archive, 'w:gz', compresslevel=1, format=tarfile.PAX_FORMAT) as tar:
    for entry in before['entries']:
        relative = entry['path']
        member = tarfile.TarInfo('node_modules' if relative == '.' else f'node_modules/{relative}')
        member.mode = entry['mode']
        member.mtime = 0
        if entry['type'] == 'directory':
            member.type = tarfile.DIRTYPE
            tar.addfile(member)
        elif entry['type'] == 'symlink':
            member.type = tarfile.SYMTYPE
            member.linkname = entry['target']
            tar.addfile(member)
        else:
            member.type = tarfile.REGTYPE
            member.size = entry['bytes']
            with (root / relative).open('rb') as stream:
                tar.addfile(member, stream)

archive_entries = []
with tarfile.open(archive, 'r:gz') as tar:
    for member in tar:
        relative = '.' if member.name == 'node_modules' else member.name.removeprefix('node_modules/')
        entry = {'path': relative, 'mode': member.mode}
        if member.isdir():
            entry.update(type='directory')
        elif member.issym():
            expected = next(e for e in before['entries'] if e['path'] == relative)
            entry.update(type='symlink', target=member.linkname,
                         realpath=expected['realpath'], resolvedRelativePath=expected['resolvedRelativePath'])
        elif member.isfile():
            stream = tar.extractfile(member)
            assert stream is not None
            h = hashlib.sha256()
            for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                h.update(chunk)
            entry.update(type='file', bytes=member.size, sha256=h.hexdigest())
        else:
            raise ValueError(f'Unexpected archive entry: {member.name}')
        archive_entries.append(entry)
assert archive_entries == before['entries'], 'Archived content does not equal audited installed bytes'
after = inventory(root)
save(output / 'tree-after-archive.json', after)
assert before['entries'] == after['entries'], 'Installed bytes changed during archive creation'
receipt = {'startedUtc': start, 'completedUtc': utc(),
           'nature': 'Read-only installed dependency content snapshot; not a lockfile and not a source commit.',
           'root': str(root), 'installedTreeUnchanged': True,
           'treeSha256': before['treeSha256'],
           'beforeManifestSha256': sha(output / 'tree-before.json'),
           'afterManifestSha256': sha(output / 'tree-after-archive.json'),
           'archivePath': str(archive), 'archiveSha256': sha(archive),
           'archiveBytes': archive.stat().st_size,
           'archiveContentVerified': True, 'contentSelfContained': True,
           'externalSymlinks': [], 'excludedPaths': [],
           'files': before['files'], 'directories': before['directories'],
           'symlinks': before['symlinks'], 'fileBytes': before['fileBytes'],
           'toolPath': str(Path(__file__).resolve()), 'toolSha256': sha(Path(__file__)),
           'restorePolicy': 'Verify existing tree and archive; do not silently overwrite differing installed modules.'}
save(output / 'archive-receipt.json', receipt)
print(json.dumps(receipt), flush=True)
