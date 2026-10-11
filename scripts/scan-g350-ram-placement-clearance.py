"""Geometric placement screening only; native/source/CAD qualification remains mandatory."""
import argparse, hashlib, json, math, sys
from pathlib import Path
sys.path.insert(0, str(Path('.cloud-tools/python-routing').resolve()))
from shapely.geometry import Point, LineString, box, Polygon
from shapely.strtree import STRtree

p = argparse.ArgumentParser()
p.add_argument('input'); p.add_argument('root')
p.add_argument('--spacing',type=float,default=.4)
p.add_argument('--min-x',type=float,default=-14);p.add_argument('--max-x',type=float,default=14)
p.add_argument('--min-y',type=float,default=.4);p.add_argument('--max-y',type=float,default=9.2)
a = p.parse_args(); src = Path(a.input); root = Path(a.root)
assert not root.exists()
raw = src.read_bytes(); base = json.loads(raw)
components = {e['source_component_id']: e.get('name') for e in base if e['type'] == 'source_component'}
ram = next(e for e in base if e['type'] == 'pcb_component' and components.get(e.get('source_component_id')) == 'U_RAM')
pads = [e for e in base if e['type'] == 'pcb_smtpad' and e.get('pcb_component_id') == ram['pcb_component_id']]
ports = {e['pcb_port_id']: e['source_port_id'] for e in base if e['type'] == 'pcb_port'}
parent = {}
def find(v):
    parent.setdefault(v, v)
    if parent[v] != v: parent[v] = find(parent[v])
    return parent[v]
for e in base:
    if e['type'] == 'source_trace':
        for v in e['connected_source_port_ids'] + e['connected_source_net_ids']: parent[find(e['source_trace_id'])] = find(v)
ddr = {e['source_trace_id'] for e in base if e['type'] == 'source_trace' and str(e.get('name', '')).startswith('DDR_')}
traces = [e for e in base if e['type'] == 'pcb_trace']
refs = [t for t in traces if t['source_trace_id'] not in ddr and any(q['route_type'] == 'wire' and q.get('layer') == 'top' and any(math.hypot(q['x']-b['x'], q['y']-b['y']) < 1e-8 for b in pads) for q in t['route'])]
assert len(refs) == 36
removed = {t['pcb_trace_id'] for t in traces if t['source_trace_id'] in ddr} | {t['pcb_trace_id'] for t in refs}
owners = {t['pcb_trace_id']: find(t['source_trace_id']) for t in traces}
shapes, shape_owners, kinds = [], [], []
def add(shape, owner, kind): shapes.append(shape); shape_owners.append(owner); kinds.append(kind)
for t in traces:
    if t['pcb_trace_id'] in removed: continue
    for q, r in zip(t['route'], t['route'][1:]):
        if q['route_type'] == r['route_type'] == 'wire' and q['layer'] == r['layer'] == 'top' and math.hypot(q['x']-r['x'],q['y']-r['y']) > 1e-8:
            add(LineString([(q['x'],q['y']),(r['x'],r['y'])]).buffer((r.get('width',.1016)/2)+.1016,quad_segs=12),owners[t['pcb_trace_id']], 'trace')
for e in base:
    if e['type'] == 'pcb_via' and e.get('pcb_trace_id') not in removed:
        add(Point(e['x'],e['y']).buffer(e['outer_diameter']/2+.1016,quad_segs=16), owners.get(e.get('pcb_trace_id'), 'FIXED_HOLE'), 'via')
    elif e['type'] == 'pcb_smtpad' and e.get('pcb_component_id') != ram['pcb_component_id'] and e.get('layer') == 'top':
        w=e.get('width',2*e.get('radius',0));h=e.get('height',w)
        if e['shape']=='polygon':
            shape=Polygon([(q['x'],q['y']) for q in e['points']]).buffer(.15)
        else:
            shape=Point(e['x'],e['y']).buffer(w/2+.15,quad_segs=16) if e['shape']=='circle' else box(e['x']-w/2,e['y']-h/2,e['x']+w/2,e['y']+h/2).buffer(.15)
        add(shape,find(ports.get(e.get('pcb_port_id'),e['pcb_smtpad_id'])),'pad')
tree=STRtree(shapes)
bodies=[e for e in base if e['type']=='pcb_component' and e['pcb_component_id']!=ram['pcb_component_id'] and e['layer']==ram['layer'] and not e.get('do_not_place') and not e.get('is_allowed_to_be_off_board')]
outline=Polygon([(q['x'],q['y']) for q in next(e for e in base if e['type']=='pcb_board')['outline']])
assert a.spacing in [.4,.8,1.6] and a.min_x<a.max_x and a.min_y<a.max_y
results=[]
for rotation in [90,270,0,180]:
    turns=((rotation-ram['rotation'])%360)//90
    w,h=(ram['height'],ram['width']) if turns%2 else (ram['width'],ram['height'])
    for xi in range(round((a.max_x-a.min_x)/a.spacing)+1):
        x=a.min_x+xi*a.spacing
        for yi in range(round((a.max_y-a.min_y)/a.spacing)+1):
            y=a.min_y+yi*a.spacing
            if not outline.contains(box(x-w/2-.3,y-h/2-.3,x+w/2+.3,y+h/2+.3)):continue
            if any(abs(e['center']['x']-x)<(w+e['width'])/2+.2 and abs(e['center']['y']-y)<(h+e['height'])/2+.2 for e in bodies):continue
            hits=0;counts={'trace':0,'via':0,'pad':0}
            for e in pads:
                px,py=e['x']-ram['center']['x'],e['y']-ram['center']['y']
                for _ in range(turns):px,py=-py,px
                disk=Point(px+x,py+y).buffer(e.get('radius',e.get('width',.42)/2),quad_segs=16)
                own=find(ports[e['pcb_port_id']])
                for index in tree.query(disk,predicate='intersects'):
                    if own!=shape_owners[index]:hits+=1;counts[kinds[index]]+=1
            results.append({'x':round(x,4),'y':round(y,4),'rotation':rotation,'collisionScore':hits,'counts':counts,'distanceToCpuCenterMm':math.hypot(x,y-20)})
results.sort(key=lambda r:(r['collisionScore'],r['distanceToCpuCenterMm']))
root.mkdir();(root/'helper.executed.py').write_bytes(Path(__file__).read_bytes())
(root/'report.json').write_text(json.dumps({'input':{'path':str(src),'sha256':hashlib.sha256(raw).hexdigest()},'screenBounds':vars(a),'screened':len(results),'best':results[:100],'zeroCollisionPlacements':sum(r['collisionScore']==0 for r in results),'removedDdrCarriers':49,'removedRamReferences':36,'outsideCopperPreserved':True,'screeningOnly':True,'requiresNativeAndSourceAndGroundAndCadQualification':True,'fabricationReady':False},indent=2)+'\n')
assert src.read_bytes()==raw
print(json.dumps({'screened':len(results),'zeroCollisionPlacements':sum(r['collisionScore']==0 for r in results),'best':results[:5]}))
