"""Preserve ignored board evidence in size-limited, hash-indexed archive parts."""
from pathlib import Path
import gzip
import hashlib
import json
import re
import subprocess
import tarfile

root = Path.cwd()
destination = root / 'cloud/artifacts'
destination.mkdir(parents=True, exist_ok=True)
if list(destination.glob('board-evidence.tar.gz.part-*')):
    raise RuntimeError('Preserve existing evidence archive; choose a new snapshot')
paths = set()
for directory in ('dist', 'reference', '.tscircuit'):
    if Path(directory).exists():
        paths.update(p for p in Path(directory).rglob('*') if p.is_file())
ignored = subprocess.run(['git', 'ls-files', '--others', '--ignored', '--exclude-standard', '-z', 'checks'],
                         capture_output=True, check=True).stdout
paths.update(Path(p.decode()) for p in ignored.split(b'\0') if p)
patterns = [re.compile(p) for p in (
    rb'gh[pousr]_[A-Za-z0-9]{30,}', rb'github_pat_[A-Za-z0-9_]{40,}',
    rb'sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}', rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
)]
entries = []
for p in sorted(paths):
    if p.is_symlink() or not p.is_file():
        raise RuntimeError(f'Unexpected evidence member: {p}')
    digest = hashlib.sha256()
    tail = b''
    with p.open('rb') as source:
        while block := source.read(1024 * 1024):
            digest.update(block)
            window = tail + block
            if any(pattern.search(window) for pattern in patterns):
                raise RuntimeError(f'Potential credential found; review {p} without publishing')
            tail = window[-256:]
    entries.append({'path': p.as_posix(), 'bytes': p.stat().st_size, 'sha256': digest.hexdigest()})
index = {'format': 'concatenated-gzip-tar-parts-v1', 'files': entries,
         'restore': 'python3 scripts/restore-cloud-evidence.py', 'parts': [],
         'excluded': ['node_modules (reinstall from lockfile)', '.git (GitHub history)',
                      'tmp (disposable scratch and registry/account scripts)',
                      '.env and account/credential files (never transferred)']}

class Parts:
    limit = 40 * 1024 * 1024
    def __init__(self):
        self.handle = None
        self.size = 0
        self.digest = None
    def finish(self):
        if self.handle:
            self.handle.close()
            index['parts'].append({'path': self.name, 'bytes': self.size,
                                   'sha256': self.digest.hexdigest()})
            self.handle = None
    def write(self, data):
        original = len(data)
        while data:
            if self.handle is None:
                self.name = f'cloud/artifacts/board-evidence.tar.gz.part-{len(index["parts"]):03d}'
                self.handle = open(self.name, 'xb')
                self.size = 0
                self.digest = hashlib.sha256()
            amount = min(len(data), self.limit - self.size)
            block, data = data[:amount], data[amount:]
            self.handle.write(block)
            self.digest.update(block)
            self.size += amount
            if self.size == self.limit:
                self.finish()
        return original
    def flush(self):
        if self.handle:
            self.handle.flush()

parts = Parts()
with gzip.GzipFile(fileobj=parts, mode='wb', compresslevel=6, mtime=0) as compressed:
    with tarfile.open(fileobj=compressed, mode='w|', format=tarfile.PAX_FORMAT) as archive:
        for item in entries:
            archive.add(item['path'], arcname=item['path'], recursive=False)
parts.finish()
Path('cloud/artifacts/manifest.json').write_text(json.dumps(index, indent=2) + '\n')
print(f'Preserved {len(entries)} evidence files, {sum(e["bytes"] for e in entries)} uncompressed bytes, '
      f'{sum(e["bytes"] for e in index["parts"])} compressed bytes in {len(index["parts"])} parts')
