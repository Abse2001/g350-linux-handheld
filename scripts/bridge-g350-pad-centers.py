"""Add real short copper from selected pad centres to existing same-net wires.

Each bridge must lie entirely inside the pad or existing wire copper. This
supports native indexed port contacts without inventing connectivity. Full
native and independent checks remain required.
"""
import hashlib, json, sys
from pathlib import Path
sys.path.insert(0,str(Path('.cloud-tools/python-routing').resolve()))
from shapely.geometry import Point, LineString, Polygon, box
from shapely.ops import unary_union, nearest_points

source,out=map(Path,sys.argv[1:3]);selected=sys.argv[3].split(',')
assert not out.exists()
c=json.loads(source.read_text());parents={}
def find(x):
    parents.setdefault(x,x)
    if parents[x]!=x:parents[x]=find(parents[x])
    return parents[x]
traces={e['source_trace_id']:e for e in c if e['type']=='source_trace'}
for st in traces.values():
    for member in st['connected_source_port_ids']+st['connected_source_net_ids']:
        parents[find(st['source_trace_id'])]=find(member)
rows=[]
for pid in selected:
    port=next(e for e in c if e['type']=='pcb_port' and e['pcb_port_id']==pid)
    owners=[s for s in traces.values() if s['connected_source_port_ids']==[port['source_port_id']]]
    assert len(owners)==1
    st=owners[0];width=st.get('min_trace_thickness',.1016)
    pads=[e for e in c if e['type']=='pcb_smtpad' and e.get('pcb_port_id')==pid]
    assert pads and len({p['layer'] for p in pads})==1
    layer=pads[0]['layer'];shapes=[]
    for p in pads:
        if p['shape']=='polygon':shape=Polygon([(q['x'],q['y']) for q in p['points']])
        elif p['shape']=='circle':shape=Point(p['x'],p['y']).buffer(p['radius'],quad_segs=64)
        else:
            r=p.get('corner_radius',0)
            shape=box(p['x']-p['width']/2+r,p['y']-p['height']/2+r,p['x']+p['width']/2-r,p['y']+p['height']/2-r)
            if r:shape=shape.buffer(r,quad_segs=64)
        shapes.append(shape)
    pad=unary_union(shapes);centre=Point(port['x'],port['y']);options=[]
    trace_owners={t['pcb_trace_id']:t['source_trace_id'] for t in c if t['type']=='pcb_trace'}
    for via in c:
        if via['type']!='pcb_via' or layer not in via['layers']:continue
        if find(trace_owners[via['pcb_trace_id']])!=find(st['source_trace_id']):continue
        target=Point(via['x'],via['y']);land=target.buffer(via['outer_diameter']/2,quad_segs=64)
        if not land.intersects(pad) or centre.distance(target)<1e-8:continue
        bridge=LineString([centre,target]).buffer(width/2,quad_segs=64)
        if bridge.difference(pad.union(land).buffer(1e-7)).area<=1e-10:
            options.append((centre.distance(target),target,via['pcb_trace_id']))
    for t in c:
        if t['type']!='pcb_trace' or find(t['source_trace_id'])!=find(st['source_trace_id']):continue
        for a,b in zip(t['route'],t['route'][1:]):
            if a['route_type']!=b['route_type'] or a['route_type']!='wire' or a['layer']!=layer or b['layer']!=layer:continue
            if (a['x'],a['y'])==(b['x'],b['y']):continue
            line=LineString([(a['x'],a['y']),(b['x'],b['y'])]);wire=line.buffer(a['width']/2,quad_segs=64)
            if not wire.intersects(pad):continue
            target=nearest_points(centre,line)[1]
            if centre.distance(target)<1e-8:continue
            bridge=LineString([centre,target]).buffer(width/2,quad_segs=64)
            if bridge.difference(pad.union(wire).buffer(1e-7)).area>1e-10:continue
            options.append((centre.distance(target),target,t['pcb_trace_id']))
    assert options,(pid,'No bridge contained within existing pad/wire copper')
    distance,target,contact=min(options,key=lambda row:row[0]);tid='g350_pad_centre_bridge_'+pid
    assert not any(e.get('pcb_trace_id')==tid for e in c)
    c.append(dict(type='pcb_trace',pcb_trace_id=tid,source_trace_id=st['source_trace_id'],
                  subcircuit_id=st['subcircuit_id'],route=[
                      dict(route_type='wire',x=port['x'],y=port['y'],layer=layer,width=width,start_pcb_port_id=pid),
                      dict(route_type='wire',x=target.x,y=target.y,layer=layer,width=width)]))
    rows.append(dict(port=pid,sourceTrace=st['source_trace_id'],contactTrace=contact,lengthMm=distance,
                     bridgeContainedWithinExistingCopper=True))
out.write_text(json.dumps(c,indent=2)+'\n')
Path(str(out)+'.bridges.json').write_text(json.dumps(dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
    resultSha256=hashlib.sha256(out.read_bytes()).hexdigest(),bridges=rows,requiresIndependentVerification=True,
    fabricationReady=False),indent=2)+'\n')
print(json.dumps(rows))
