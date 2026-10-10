import hashlib,json,pathlib,tarfile
root=pathlib.Path('checks/integrated/g350-inner-ground-timing-progress')
names='''g350-ddr-full-span-replan-181
g350-ddr-new-shortest-growth-182
g350-ddr-middle-span-replan-183
g350-ddr-distributed-growth-184
g350-ddr-d9-outer-detour-185
g350-ddr-d9-deeper-detour-186
g350-ddr-d9-window-comb-187
g350-ddr-d9-translated-window-188
g350-ddr-d9-short-translated-window-189
g350-ddr-distributed-source-190
g350-ddr-distributed-source-preparation-190
g350-ddr-distributed-verified-191
g350-ddr-d9-balanced-search-193
g350-ddr-balanced-distributed-growth-194
g350-ddr-d9-deep-bend-search-195
g350-ddr-d9-reshape-bend-search-196
g350-ddr-distributed-ordered-source-197
g350-ddr-d9-diagnostic-200
g350-ddr-ground-diagnostic-201
g350-ddr-ground-bridges-202
g350-ddr-ground-bridges-203
g350-ddr-ground-bridges-204
g350-ddr-clean-native-fill-205
g350-ddr-ground-astar-206
g350-ddr-outer-restored-207
g350-ddr-outer-restored-native-fill-208
g350-ddr-ground-safe-outer-recovery-212
g350-ddr-casn-bottom-restored-213
g350-ddr-casn-bottom-native-fill-214
g350-ddr-casn-a9-restored-215
g350-ddr-casn-a9-native-fill-216
g350-ddr-ground-safe-combined-217
g350-ddr-casn-top-recovered-218
g350-ddr-casn-top-native-fill-219
g350-ddr-ground-safe-combined-fill-220'''.splitlines()
final=['g350-ddr-inner-ground-preserved-source-209','g350-ddr-inner-ground-preserved-verified-210','g350-ddr-inner-ground-preserved-shorts-211']
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for stem,selected in [('connected-source-209-211',final),('rejected-and-planning-181-201',names[:19]),('ground-recovery-trials-202-220',names[19:])]:
 roots=[pathlib.Path('dist')/n for n in selected];assert all(p.is_dir() for p in roots)
 files=sorted(f for p in roots for f in p.rglob('*') if f.is_file());assert all(not f.is_symlink() for f in files)
 archive=root/(stem+'.tar.gz');manifest=root/(stem+'-manifest.json');assert not archive.exists() and not manifest.exists()
 with tarfile.open(archive,'w:gz',compresslevel=5) as t:
  for f in files:t.add(f,arcname=str(f),recursive=False)
 rows=[dict(path=str(f),bytes=f.stat().st_size,sha256=sha(f)) for f in files]
 with tarfile.open(archive,'r:gz') as t:
  members=t.getmembers();assert len(members)==len(rows)
  for m,r in zip(members,rows):assert m.isfile() and m.name==r['path'] and hashlib.sha256(t.extractfile(m).read()).hexdigest()==r['sha256']
 assert archive.stat().st_size<95_000_000
 manifest.write_text(json.dumps(dict(archive=dict(path=str(archive),bytes=archive.stat().st_size,sha256=sha(archive)),files=rows,explicitOwnedRoots=[str(p) for p in roots],fabricationReady=False),indent=2)+'\n')
 print(json.dumps(dict(manifest=str(manifest),archiveBytes=archive.stat().st_size,members=len(rows),memberVerificationPassed=True)),flush=True)
