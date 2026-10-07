"""Attach native port metadata only where real wire copper touches the numeric pad.

Imported routes can contact a pad in the middle of a segment. The native indexed
port checker requires an explicit port label at that contact. Insert collinear
vertices with validated labels, preserving all DDR records and actual copper.
"""
import json,sys,math
from pathlib import Path
sys.path.insert(0,str(Path('.cloud-tools/python-routing').resolve()))
from shapely.geometry import Point,LineString,Polygon,box
from shapely.ops import nearest_points
from shapely.strtree import STRtree
input_path,srj_path,out=map(Path,sys.argv[1:4]);assert not out.exists()
c=json.loads(input_path.read_text());srj=json.loads(srj_path.read_text())
ports={p['pcb_port_id']:p for p in c if p['type']=='pcb_port'}
sp_to_pp={p['source_port_id']:pid for pid,p in ports.items()}
st={s['source_trace_id']:s for s in c if s['type']=='source_trace'}
parent={p:p for p in ports}
def find(p):
    while parent[p]!=p:parent[p]=parent[parent[p]];p=parent[p]
    return p
def join(a,b):parent[find(a)]=find(b)
for conn in srj['connections']:
    ids=[p['pcb_port_id'] for p in conn['pointsToConnect']]
    for p in ids[1:]:join(ids[0],p)
for s in st.values():
    ids=[sp_to_pp[p] for p in s['connected_source_port_ids'] if p in sp_to_pp]
    for p in ids[1:]:join(ids[0],p)
pads={layer:[] for layer in ['top','inner1','inner2','bottom']}
for e in c:
    if e['type']=='pcb_smtpad':
        if e['shape']=='circle':shape=Point(e['x'],e['y']).buffer(e['radius'],quad_segs=64)
        elif e['shape']=='rect':
            radius=e.get('corner_radius',0)
            shape=box(e['x']-e['width']/2+radius,e['y']-e['height']/2+radius,e['x']+e['width']/2-radius,e['y']+e['height']/2-radius)
            if radius:shape=shape.buffer(radius,quad_segs=32)
        else:shape=Polygon([(p['x'],p['y']) for p in e['points']])
        if e.get('pcb_port_id'):pads[e['layer']].append((e['pcb_port_id'],shape))
    elif e['type']=='pcb_plated_hole':
        ww,hh=e['outer_width'],e['outer_height'];r=min(ww,hh)/2
        shape=LineString([(e['x'],e['y']-(hh/2-r)),(e['x'],e['y']+(hh/2-r))]).buffer(r,quad_segs=64) if hh>ww else box(e['x']-ww/2,e['y']-hh/2,e['x']+ww/2,e['y']+hh/2)
        for layer in e['layers']:pads[layer].append((e['pcb_port_id'],shape))
trees={layer:STRtree([shape for _,shape in entries]) for layer,entries in pads.items()}
contacts=[];before_ddr=[e for e in c if e['type']=='pcb_trace' and st[e['source_trace_id']].get('name','').startswith('DDR_')]
frozen=json.dumps(before_ddr,sort_keys=True)
for trace in [e for e in c if e['type']=='pcb_trace']:
    if st[trace['source_trace_id']].get('name','').startswith('DDR_'):continue
    source_port=st[trace['source_trace_id']]['connected_source_port_ids'][0];net=find(sp_to_pp[source_port])
    route=trace['route'];result=[];seen=set()
    for index,a in enumerate(route):
        result.append(dict(a))
        if index+1==len(route):continue
        b=route[index+1]
        if a['route_type']!='wire' or b['route_type']!='wire' or a['layer']!=b['layer'] or (a['x'],a['y'])==(b['x'],b['y']):continue
        line=LineString([(a['x'],a['y']),(b['x'],b['y'])]);tube=line.buffer(a['width']/2,quad_segs=64)
        inserted=[]
        for hit in trees[a['layer']].query(tube,predicate='intersects'):
            pid,shape=pads[a['layer']][int(hit)]
            assert find(pid)==net, (trace['pcb_trace_id'],pid,'Foreign-net physical pad contact')
            if pid in seen:continue
            seen.add(pid);point=nearest_points(line,shape)[0];fraction=line.project(point)/line.length
            assert line.distance(shape)<=a['width']/2+1e-8
            inserted.append((fraction,pid,point.x,point.y))
            contacts.append(dict(trace=trace['pcb_trace_id'],port=pid,layer=a['layer'],wireToPadDistanceMm=line.distance(shape)))
        for fraction,pid,x,y in sorted(inserted):
            result.append(dict(route_type='wire',x=x,y=y,layer=a['layer'],width=a['width'],start_pcb_port_id=pid))
    trace['route']=result
assert frozen==json.dumps(before_ddr,sort_keys=True),'DDR records changed'
out.write_text(json.dumps(c,indent=2)+'\n')
Path(str(out)+'.contacts.json').write_text(json.dumps(dict(source=str(input_path),validatedContacts=len(contacts),ddrExactlyPreserved=True,contacts=contacts),indent=2)+'\n')
print('Validated physical pad contacts:',len(contacts))
