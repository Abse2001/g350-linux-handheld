"""Connect the remaining CPU analog pad to its actual same-net standard via."""
import json,sys,hashlib
from pathlib import Path
source,out=map(Path,sys.argv[1:3]);assert not out.exists()
c=json.loads(source.read_text())
p=next(e for e in c if e['type']=='pcb_port' and e['pcb_port_id']=='pcb_port_176')
assert abs(p['x']-4.4)<1e-7 and abs(p['y']-20.4)<1e-7
n=next(e['source_net_id'] for e in c if e['type']=='source_net' and e['name']=='ANALOG_1V8')
st={e['source_trace_id']:e for e in c if e['type']=='source_trace'}
s=next(e for e in st.values() if p['source_port_id'] in e['connected_source_port_ids'] and n in e['connected_source_net_ids'])
assert s['min_trace_thickness']<=.1016
owners={e['pcb_trace_id']:e['source_trace_id'] for e in c if e['type']=='pcb_trace'}
v=next(e for e in c if e['type']=='pcb_via' and abs(e['x']-4)<1e-7 and abs(e['y']-20.8)<1e-7 and n in st[owners[e['pcb_trace_id']]]['connected_source_net_ids'])
assert v['layers']==['top','inner1','inner2','bottom']
tid='g350_analog_existing_via_escape'
assert all(e.get('pcb_trace_id')!=tid for e in c)
c.append(dict(type='pcb_trace',pcb_trace_id=tid,source_trace_id=s['source_trace_id'],connection_name=n,subcircuit_id=p['subcircuit_id'],route=[dict(route_type='wire',x=p['x'],y=p['y'],layer='top',width=.1016,start_pcb_port_id=p['pcb_port_id']),dict(route_type='wire',x=v['x'],y=v['y'],layer='top',width=.1016)]))
out.write_text(json.dumps(c,indent=2)+'\n')
Path(str(out)+'.preparation.json').write_text(json.dumps(dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),sharedPhysicalVia=v['pcb_via_id'],newVias=0,requiresNativeAndIndependentChecks=True,fabricationReady=False),indent=2)+'\n')
