"""Verify archive parts and restore frozen evidence without replacing edits."""
from pathlib import Path
import gzip
import hashlib
import io
import json
import shutil
import tarfile
import sys

root = Path(__file__).resolve().parents[1]
index = json.loads((root / 'cloud/artifacts/manifest.json').read_text())
expected = {f['path']: f for f in index['files']}
verify_only = '--verify-only' in sys.argv
verify_archive = '--verify-archive' in sys.argv
def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        while chunk := f.read(1024 * 1024):
            h.update(chunk)
    return h.hexdigest()
for part in index['parts']:
    path = root / part['path']
    assert path.stat().st_size == part['bytes'] and digest(path) == part['sha256'], f'Archive part mismatch: {path}'
if verify_only:
    print(f'Verified {len(index["parts"])} archive parts')
    sys.exit(0)
if not verify_archive and all((root / p).is_file() and digest(root / p) == e['sha256'] for p, e in expected.items()):
    print(f'All {len(expected)} restored evidence files already match')
    sys.exit(0)

class Reader(io.RawIOBase):
    def __init__(self):
        self.parts = iter(index['parts'])
        self.current = None
    def readable(self):
        return True
    def readinto(self, b):
        while True:
            if self.current is None:
                part = next(self.parts, None)
                if part is None:
                    return 0
                self.current = (root / part['path']).open('rb')
            count = self.current.readinto(b)
            if count:
                return count
            self.current.close()
            self.current = None
    def close(self):
        if self.current:
            self.current.close()
        super().close()

seen = set()
with io.BufferedReader(Reader()) as parts, gzip.GzipFile(fileobj=parts) as compressed:
    with tarfile.open(fileobj=compressed, mode='r|') as archive:
        for member in archive:
            assert member.isfile() and member.name in expected and member.name not in seen, 'Unindexed or unsafe archive member'
            p = root / member.name
            assert p.resolve().is_relative_to(root), 'Unsafe evidence path'
            item = expected[member.name]
            assert member.size == item['bytes']
            existing = p.is_file()
            if existing and not verify_archive:
                assert digest(p) == item['sha256'], f'Preserve edited evidence: {member.name}'
            source = archive.extractfile(member)
            h = hashlib.sha256()
            if not existing and not verify_archive:
                p.parent.mkdir(parents=True, exist_ok=True)
                destination = p.open('xb')
            else:
                destination = None
            try:
                while chunk := source.read(1024 * 1024):
                    h.update(chunk)
                    if destination:
                        destination.write(chunk)
            finally:
                if destination:
                    destination.close()
            assert h.hexdigest() == item['sha256'], f'Evidence member mismatch: {member.name}'
            seen.add(member.name)
assert seen == set(expected), 'Archive missing evidence members'
print(f'{"Verified archive contents" if verify_archive else "Restored and verified"}: {len(seen)} evidence files')
