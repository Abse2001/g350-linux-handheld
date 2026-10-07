"""Restore a hash-indexed routing checkpoint without replacing local edits."""
import argparse
import hashlib
import json
from pathlib import Path
import tarfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('manifest', type=Path)
parser.add_argument('--verify-archive', action='store_true')
parser.add_argument('--destination', type=Path)
args = parser.parse_args()
project = Path(__file__).resolve().parents[1]
destination = (args.destination or project).resolve()
manifest = json.loads(args.manifest.read_text())
expected = {row['path']: row for row in manifest['files']}
assert len(expected) == len(manifest['files']), 'Duplicate evidence paths'
archive_row = manifest['archive']
archive_path = project / archive_row['path']

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        while chunk := stream.read(1024 * 1024):
            h.update(chunk)
    return h.hexdigest()

assert archive_path.stat().st_size == archive_row['bytes']
assert digest(archive_path) == archive_row['sha256'], 'Archive hash mismatch'
seen = set()
restored = 0
with tarfile.open(archive_path, 'r:gz') as archive:
    for member in archive:
        assert member.isfile() and member.name in expected and member.name not in seen
        target = destination / member.name
        assert target.resolve().is_relative_to(destination), 'Unsafe archive path'
        row = expected[member.name]
        assert member.size == row['bytes']
        payload = archive.extractfile(member).read()
        assert hashlib.sha256(payload).hexdigest() == row['sha256']
        seen.add(member.name)
        if args.verify_archive:
            continue
        if target.exists():
            assert target.is_file() and digest(target) == row['sha256'], (
                f'Preserving differing local evidence: {target}'
            )
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open('xb') as stream:
            stream.write(payload)
        assert digest(target) == row['sha256']
        restored += 1
assert seen == set(expected), 'Archive omitted indexed evidence'
print(f'Verified {len(seen)} evidence members; restored {restored}')
