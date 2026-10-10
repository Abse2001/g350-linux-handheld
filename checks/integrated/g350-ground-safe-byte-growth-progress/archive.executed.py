import hashlib, json, pathlib, tarfile, re
root = pathlib.Path('checks/integrated/g350-ground-safe-byte-growth-progress')
owned = [pathlib.Path(p) for p in json.loads((root/'explicit-owned-roots.json').read_text())]
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
groups = [('connected-source-319-321', [p for p in owned if int(p.name.rsplit('-',1)[1]) in [319,320,321]])]
for lo,hi in [(222,264),(265,276),(277,292),(300,327)]:
    groups.append((f'planning-{lo}-{hi}', [p for p in owned if lo<=int(p.name.rsplit('-',1)[1])<=hi and int(p.name.rsplit('-',1)[1]) not in [319,320,321]]))
for stem,selected in groups:
    files = sorted(f for p in selected for f in p.rglob('*') if f.is_file())
    if stem=='planning-300-327':
        files += sorted(f for f in pathlib.Path('.cloud-tools/g350-timing-snapshots').rglob('*') if f.is_file())
    assert files and len(files)==len(set(files)) and all(not f.is_symlink() for f in files)
    archive=root/(stem+'.tar.gz');manifest=root/(stem+'-manifest.json')
    assert not archive.exists() and not manifest.exists()
    rows=[dict(path=str(f),bytes=f.stat().st_size,sha256=sha(f)) for f in files]
    with tarfile.open(archive,'w:gz',compresslevel=5) as t:
        for f in files:t.add(f,arcname=str(f),recursive=False)
    with tarfile.open(archive,'r:gz') as t:
        members=t.getmembers();assert len(members)==len(rows)
        for m,r in zip(members,rows):
            assert m.isfile() and m.name==r['path'] and m.size==r['bytes']
            assert hashlib.sha256(t.extractfile(m).read()).hexdigest()==r['sha256']
            assert sha(pathlib.Path(r['path']))==r['sha256'], 'An evidence file changed during archiving'
    assert archive.stat().st_size<95_000_000
    manifest.write_text(json.dumps(dict(archive=dict(path=str(archive),bytes=archive.stat().st_size,sha256=sha(archive)),files=rows,explicitOwnedRoots=[str(p) for p in selected],fabricationReady=False),indent=2)+'\n')
    print(json.dumps(dict(manifest=str(manifest),archiveBytes=archive.stat().st_size,members=len(rows),memberVerificationPassed=True)),flush=True)
