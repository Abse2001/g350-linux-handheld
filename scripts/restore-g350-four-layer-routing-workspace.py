#!/usr/bin/env python3
"""Verify or restore the saved experimental routing workspace without running SDKs."""
import argparse
import hashlib
import json
import os
import shutil
from pathlib import Path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--restore', action='store_true', help='Restore missing /tmp files; refuse differing existing files.')
    parser.add_argument('--saved-directory', type=Path, default=Path(__file__).resolve().parents[1] / '.cloud-tools/ddr-four-layer-manual-2026-10-16')
    args = parser.parse_args()
    saved = args.saved_directory.resolve()
    manifest = json.loads((saved / 'WORKSPACE_RESTORE_MANIFEST.json').read_text())
    entries = manifest['files']
    destinations = set()
    cross_repository_root = Path(__file__).resolve().parents[2] / 'bus-lanes-solver/.cache/root-routing-progress'
    # Validate all saved bytes and all existing destinations before any write.
    for row in entries:
        source = (saved / row['savedPath']).resolve()
        target = Path(row['restorePath'])
        temporary_target = str(target).startswith('/tmp/g350-') and target.resolve().is_relative_to('/tmp')
        cross_repository_target = target.parent == cross_repository_root and target.name.endswith('.json') and target.resolve().parent == cross_repository_root.resolve()
        if not source.is_relative_to(saved) or not target.is_absolute() or not (temporary_target or cross_repository_target):
            raise ValueError('Unexpected saved or restoration path: ' + str(target))
        if str(target) in destinations:
            raise ValueError('Duplicate destination: ' + str(target))
        destinations.add(str(target))
        if source.stat().st_size != row['bytes'] or digest(source) != row['sha256']:
            raise ValueError('Saved bytes differ: ' + str(source))
        if 'mode' in row and (not isinstance(row['mode'], int) or row['mode'] < 0 or row['mode'] > 0o777):
            raise ValueError('Unexpected file mode: ' + str(target))
        if target.exists() and (target.is_symlink() or not target.is_file() or digest(target) != row['sha256']):
            raise ValueError('Existing destination differs; preserve it and investigate: ' + str(target))
        if target.exists() and 'mode' in row and target.stat().st_mode & 0o777 != row['mode']:
            raise ValueError('Existing destination mode differs; preserve it and investigate: ' + str(target))
    restored = 0
    if args.restore:
        for row in entries:
            source = saved / row['savedPath']
            target = Path(row['restorePath'])
            if target.exists():
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            # Exclusive creation prevents replacing another task's concurrent work.
            with source.open('rb') as reader, target.open('xb') as writer:
                shutil.copyfileobj(reader, writer)
                if 'mode' in row:
                    os.fchmod(writer.fileno(), row['mode'])
            if digest(target) != row['sha256']:
                raise ValueError('Restored bytes differ: ' + str(target))
            restored += 1
        source_parent = Path(manifest['solverSourceRoot']).parent
        dependencies = Path(__file__).resolve().parents[2] / 'bus-lanes-solver/node_modules'
        link = source_parent / 'node_modules'
        if not dependencies.is_dir():
            raise ValueError('Install the pinned solver dependencies first: ' + str(dependencies))
        if link.is_symlink():
            if link.resolve() != dependencies.resolve():
                raise ValueError('Existing solver dependency link differs: ' + str(link))
        elif link.exists():
            raise ValueError('Existing solver dependency directory is not the recorded link: ' + str(link))
        else:
            link.symlink_to(dependencies, target_is_directory=True)
    print(json.dumps({'savedFilesVerified': len(entries), 'restoredFiles': restored,
                      'mode': 'restore' if args.restore else 'verify',
                      'routingExecuted': False, 'all49Accepted': False, 'fabricationReady': False}))


if __name__ == '__main__':
    main()
