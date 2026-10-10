"""Verify or restore exact compressed planning bytes without overwriting edits."""
import argparse, gzip, hashlib, json
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('index', type=Path)
parser.add_argument('--only', action='append', default=[])
parser.add_argument('--destination', type=Path)
parser.add_argument('--verify-only', action='store_true')
args = parser.parse_args()
repo = Path(__file__).resolve().parents[1]
destination = (args.destination or repo).resolve()
rows = json.loads(args.index.read_text())['files']
assert len({r['path'] for r in rows}) == len(rows)
assert set(args.only).issubset({r['path'] for r in rows}), 'Unknown evidence path'
selected = [r for r in rows if not args.only or r['path'] in args.only]
digest = lambda data: hashlib.sha256(data).hexdigest()
restored = 0
for row in selected:
    packed_path = repo / row['compressedPath']
    target = destination / row['path']
    assert packed_path.resolve().is_relative_to(repo)
    assert target.resolve().is_relative_to(destination)
    packed = packed_path.read_bytes()
    assert len(packed) == row['compressedBytes'] and digest(packed) == row['compressedSha256']
    data = gzip.decompress(packed)
    assert len(data) == row['bytes'] and digest(data) == row['sha256']
    if args.verify_only:
        continue
    if target.exists():
        assert target.is_file() and digest(target.read_bytes()) == row['sha256'], 'Refuse to replace edited ' + str(target)
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open('xb') as stream:
            stream.write(data)
        restored += 1
print('Verified', len(selected), 'outputs; restored', restored)
