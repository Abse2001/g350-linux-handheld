"""Package explicit board evidence roots with exact hashes; never sweep the repo."""
from pathlib import Path
import argparse,hashlib,json,tarfile,re
p=argparse.ArgumentParser(description=__doc__);p.add_argument('manifest',type=Path);p.add_argument('roots',nargs='+',type=Path);a=p.parse_args()
repo=Path.cwd().resolve();manifest=a.manifest;archive=manifest.with_name(manifest.name.removesuffix('-manifest.json')+'.tar.gz')
assert manifest.as_posix().startswith('checks/integrated/') and manifest.name.endswith('-manifest.json')
assert not manifest.exists() and not archive.exists()
paths=set()
for root in a.roots:
 assert root.exists() and root.resolve().is_relative_to(repo)
 assert str(root).startswith(('dist/','.cloud-tools/g350-timing-snapshots/'))
 paths.update([root] if root.is_file() else (p for p in root.rglob('*') if p.is_file()))
assert paths
patterns=[re.compile(x) for x in [rb'gh[pousr]_[A-Za-z0-9]{30,}',rb'github_pat_[A-Za-z0-9_]{40,}',rb'sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}',rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----']]
rows=[]
for path in sorted(paths):
 assert not path.is_symlink();data=path.read_bytes();assert not any(p.search(data) for p in patterns),path
 rows.append(dict(path=path.as_posix(),bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
manifest.parent.mkdir(parents=True,exist_ok=True)
with tarfile.open(archive,'w:gz',compresslevel=6) as t:
 for row in rows:
  path=Path(row['path']);assert hashlib.sha256(path.read_bytes()).hexdigest()==row['sha256'],'Mutable evidence: '+str(path)
  t.add(path,arcname=row['path'],recursive=False)
assert archive.stat().st_size<90*1024*1024,'Use smaller explicit evidence groups'
manifest.write_text(json.dumps(dict(archive=dict(path=archive.as_posix(),bytes=archive.stat().st_size,sha256=hashlib.sha256(archive.read_bytes()).hexdigest()),files=rows,restore='python3 scripts/restore-g350-routing-evidence.py '+manifest.as_posix()),indent=2)+'\n')
print('Packaged',len(rows),'members in',archive.stat().st_size,'bytes')
