"""Guard a temporary KiCad output mirror; never overwrite concurrent edits."""
from pathlib import Path
import hashlib,json,sys
mode,left,right=sys.argv[1:]
def inventory(root):
    root=Path(root)
    rows={}
    for path in sorted(root.rglob('*')):
        assert not path.is_symlink(), 'Output mirror cannot contain symlinks'
        if path.is_file():
            rows[str(path.relative_to(root))]=hashlib.sha256(path.read_bytes()).hexdigest()
    return rows
if mode=='snapshot':
    Path(right).write_text(json.dumps(inventory(left),sort_keys=True)+'\n')
elif mode=='unchanged':
    assert inventory(left)==json.loads(Path(right).read_text()), 'Concurrent KiCad output edits'
elif mode=='equal':
    assert inventory(left)==inventory(right), 'KiCad output copy differs'
else:
    raise AssertionError('Unsupported mirror operation')
