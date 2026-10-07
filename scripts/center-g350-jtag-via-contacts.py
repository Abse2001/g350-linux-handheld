"""Center selected nets' wire vertices that terminate inside their own via lands.

Native clearance and independent KiCad DRC must validate the resulting geometry.
"""
import json,sys,math,hashlib
from pathlib import Path
source,out=map(Path,sys.argv[1:3]);assert not out.exists()
selected=set(sys.argv[3].split(',')) if len(sys.argv)>3 else {'JTAG_EMU1'}
c=json.loads(source.read_text());nets={e['source_net_id']:e['name'] for e in c if e['type']=='source_net'}
st={e['source_trace_id']:e for e in c if e['type']=='source_trace'}
owners={e['pcb_trace_id']:frozenset(n for n in st[e['source_trace_id']]['connected_source_net_ids'] if nets.get(n) in selected) for e in c if e['type']=='pcb_trace'}
ids={tid for tid,names in owners.items() if names}
vias=[v for v in c if v['type']=='pcb_via' and v.get('pcb_trace_id') in ids];changes=[]
for t in c:
    if t['type']!='pcb_trace' or t['pcb_trace_id'] not in ids:continue
    for i,p in enumerate(t['route']):
        if p['route_type']!='wire' or p.get('start_pcb_port_id') or p.get('end_pcb_port_id'):continue
        near=[v for v in vias if owners[v['pcb_trace_id']] & owners[t['pcb_trace_id']] and 1e-7<math.hypot(p['x']-v['x'],p['y']-v['y'])<(v['outer_diameter']+p['width'])/2]
        if near:
            v=min(near,key=lambda v:math.hypot(p['x']-v['x'],p['y']-v['y']))
            changes.append(dict(trace=t['pcb_trace_id'],index=i,previous=[p['x'],p['y']],center=[v['x'],v['y']]))
            p['x'],p['y']=v['x'],v['y']
out.write_text(json.dumps(c,indent=2)+'\n')
Path(str(out)+'.report.json').write_text(json.dumps(dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),resultSha256=hashlib.sha256(out.read_bytes()).hexdigest(),changes=changes,requiresNativeAndIndependentChecks=True,fabricationReady=False),indent=2)+'\n')
print('Centered vertices:',len(changes))
