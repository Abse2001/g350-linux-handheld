"""Resolve mixed local CPU escape conflicts; native checks still gate the result."""
import hashlib,json,math,sys
from pathlib import Path
sys.path.insert(0,str(Path('.cloud-tools/python-routing').resolve()))
from shapely.geometry import Point,LineString
fresh_path,reference_path,root=map(Path,sys.argv[1:4]);assert not root.exists()
fresh=json.loads(fresh_path.read_text());base=json.loads(reference_path.read_text())
names={e['source_trace_id']:e.get('name') for e in base if e['type']=='source_trace'}
original={e['source_trace_id']:e for e in base if e['type']=='pcb_trace' and str(names.get(e['source_trace_id'],'')).startswith('DDR_')}
assert len(original)==49 and len(fresh)==49
fresh={t['source_trace_id']:t for t in fresh};assert fresh.keys()==original.keys()
legacy={}
for sid,t in original.items():
    i=next(i for i,v in enumerate(t['route']) if v['route_type']=='via')
    head=json.loads(json.dumps(t['route'][:i+1]));v=head[-1]
    physical=next(e for e in base if e['type']=='pcb_via' and e['pcb_trace_id']==t['pcb_trace_id'] and math.hypot(e['x']-v['x'],e['y']-v['y'])<1e-8)
    assert physical['layers']==['top','inner1','inner2','bottom'] and physical['hole_diameter']==.254 and physical['outer_diameter']==.4572
    v['to_layer']='bottom';v['layers']=physical['layers']
    head.append({'route_type':'wire','x':v['x'],'y':v['y'],'layer':'bottom','width':.1016})
    legacy[sid]={'type':'pcb_trace','pcb_trace_id':fresh[sid]['pcb_trace_id'],'source_trace_id':sid,'connectsTo':fresh[sid]['connectsTo'],'route':head}
reverted={sid for sid in original if names[sid] in ['DDR_RESETn','DDR_D14']}
history=[]
for iteration in range(50):
    mixed={sid:legacy[sid] if sid in reverted else fresh[sid] for sid in original}
    geometry={}
    for sid,t in mixed.items():
        v=next(p for p in t['route'] if p['route_type']=='via')
        segments=[LineString([(a['x'],a['y']),(b['x'],b['y'])]) for a,b in zip(t['route'],t['route'][1:]) if a['route_type']==b['route_type']=='wire' and a['layer']==b['layer']=='top' and math.hypot(a['x']-b['x'],a['y']-b['y'])>1e-8]
        geometry[sid]=(Point(v['x'],v['y']),segments)
    additions=set();conflicts=[];keys=list(original)
    for i,a in enumerate(keys):
        for b in keys[i+1:]:
            va,sa=geometry[a];vb,sb=geometry[b]
            reasons=[]
            if va.distance(vb)<.4572+.254-1e-7:reasons.append('annulus spacing')
            if any(va.distance(s)<.4572/2+.1016+.1016/2-1e-7 for s in sb) or any(vb.distance(s)<.4572/2+.1016+.1016/2-1e-7 for s in sa):reasons.append('via to foreign stub')
            if any(x.distance(y)<.1016*2-1e-7 for x in sa for y in sb):reasons.append('foreign stubs')
            if not reasons:continue
            assert (a in reverted)!=(b in reverted),(names[a],names[b],reasons,'Unexpected pure fresh/legacy conflict')
            additions.add(b if a in reverted else a);conflicts.append({'a':names[a],'b':names[b],'reasons':reasons})
    history.append({'iteration':iteration,'revertedNames':sorted(names[s] for s in reverted),'conflicts':conflicts})
    if not additions:break
    reverted.update(additions)
else:raise AssertionError('Reversion closure did not finish')
output=[mixed[sid] for sid in original]
root.mkdir();(root/'helper.executed.py').write_bytes(Path(__file__).read_bytes())
(root/'mixed-local-escapes.json').write_text(json.dumps(output,indent=2)+'\n')
(root/'report.json').write_text(json.dumps({'freshSha256':hashlib.sha256(fresh_path.read_bytes()).hexdigest(),'referenceSha256':hashlib.sha256(reference_path.read_bytes()).hexdigest(),'revertedNames':sorted(names[s] for s in reverted),'freshEscapesRetained':49-len(reverted),'history':history,'geometricScreenOnly':True,'requiresNativeQualification':True,'completeDdrCarriers':0,'fabricationReady':False},indent=2)+'\n')
print(json.dumps({'freshEscapesRetained':49-len(reverted),'revertedNames':sorted(names[s] for s in reverted)}))
