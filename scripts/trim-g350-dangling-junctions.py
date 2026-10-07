"""Retain the useful portion of a reported branch between same-net junctions.

KiCad's dangling-end warning does not make an entire track disposable: another
branch can join its middle. Restore those intervals after conservative pruning.
This is a candidate generator, never a connectivity or manufacturing waiver.
"""
import copy, json, math, sys
from pathlib import Path
sys.path.insert(0, str(Path('.cloud-tools/python-routing').resolve()))
from shapely.geometry import LineString, Point, Polygon, box
from shapely.affinity import rotate, translate
from shapely.ops import nearest_points

original, items_path, pruned, output = map(Path, sys.argv[1:5])
assert not output.exists()
c = json.loads(original.read_text())
result = json.loads(pruned.read_text())
items = json.loads(items_path.read_text())
parent = {}
def find(x):
    parent.setdefault(x, x)
    if parent[x] != x: parent[x] = find(parent[x])
    return parent[x]
def union(a,b): parent[find(a)] = find(b)
for s in c:
    if s['type'] == 'source_trace':
        for m in s['connected_source_port_ids'] + s['connected_source_net_ids']: union(s['source_trace_id'],m)
ports = {p['pcb_port_id']:find(p['source_port_id']) for p in c if p['type']=='pcb_port'}
traces = [t for t in c if t['type']=='pcb_trace']
segments = []
for t in traces:
    for i,(a,b) in enumerate(zip(t['route'],t['route'][1:])):
        if a['route_type']==b['route_type']=='wire' and a['layer']==b['layer'] and math.hypot(a['x']-b['x'],a['y']-b['y'])>1e-7:
            segments.append((t,i,a,b,LineString([(a['x'],a['y']),(b['x'],b['y'])])))
removed_via_points = [Point(item['start']['x'],item['start']['y']) for item in items if item['type']=='via']
vias = [v for v in c if v['type']=='pcb_via' and not any(p.distance(Point(v['x'],v['y']))<1e-5 for p in removed_via_points)]
owners = {t['pcb_trace_id']:find(t['source_trace_id']) for t in traces}
pad_shapes = []
for p in c:
    if p['type'] not in ('pcb_smtpad','pcb_plated_hole') or p.get('pcb_port_id') not in ports: continue
    if p.get('shape')=='circle': shape=Point(0,0).buffer(p.get('radius',p.get('outer_diameter',0)/2))
    elif p.get('shape')=='polygon':
        shape=Polygon([(q['x'],q['y']) for q in p['points']])
        pad_shapes.append((ports[p['pcb_port_id']],p.get('layer'),shape));continue
    else:
        w=p.get('width',p.get('outer_width'));h=p.get('height',p.get('outer_height'))
        assert w and h,p
        shape=box(-w/2,-h/2,w/2,h/2)
        shape=rotate(shape,p.get('ccw_rotation',0),origin=(0,0))
    shape=translate(shape,p['x'],p['y'])
    for layer in [p['layer']] if p['type']=='pcb_smtpad' else p['layers']:
        pad_shapes.append((ports[p['pcb_port_id']],layer,shape))
layers={'F.Cu':'top','In1.Cu':'inner1','In2.Cu':'inner2','B.Cu':'bottom'}
changes=[]
for item in items:
    if item['type']!='track':continue
    needle=LineString([(item['start']['x'],item['start']['y']),(item['end']['x'],item['end']['y'])])
    matched=[s for s in segments if s[2]['layer']==layers[item['layer']] and s[4].hausdorff_distance(needle)<1e-5]
    assert len(matched)==1,(item,len(matched))
    t,index,a,b,line=matched[0];net=find(t['source_trace_id']);contacts=[]
    for other,j,oa,ob,shape in segments:
        if other is t and j==index:continue
        if find(other['source_trace_id'])!=net or oa['layer']!=a['layer']:continue
        inter=line.intersection(shape)
        if inter.is_empty:
            # Rounded track caps can bridge two centerlines without crossing.
            # Preserve that real copper contact; fresh KiCad must confirm it.
            if line.distance(shape) < (a['width']+oa['width'])/2-1e-6:
                contacts.append(line.project(nearest_points(line,shape)[0]))
            continue
        points=[inter] if inter.geom_type=='Point' else list(inter.geoms) if inter.geom_type=='MultiPoint' else [Point(inter.bounds[0],inter.bounds[1]),Point(inter.bounds[2],inter.bounds[3])]
        contacts.extend(line.project(p) for p in points)
    for v in vias:
        if owners[v['pcb_trace_id']]!=net:continue
        p=Point(v['x'],v['y'])
        if line.distance(p)<v['outer_diameter']/2+a['width']/2-1e-6:contacts.append(line.project(p))
    for pnet,layer,shape in pad_shapes:
        if pnet!=net or layer!=a['layer']:continue
        if line.distance(shape)<a['width']/2-1e-6:contacts.append(line.project(shape.centroid))
    if 'danglingPoint' in item:
        free = Point(item['danglingPoint']['x'], item['danglingPoint']['y'])
        assert min(free.distance(Point(*line.coords[0])), free.distance(Point(*line.coords[-1]))) < 1e-5
        position = line.project(free)
        # A proximity to a rounded cap is not an anchored endpoint. KiCad's
        # actual connectivity marks this end free; trim to the next junction.
        contacts = [x for x in contacts if abs(x-position) > 1e-5]
    contacts=sorted(set(round(max(0,min(line.length,x)),9) for x in contacts))
    if len(contacts)<2 or contacts[-1]-contacts[0]<1e-7:continue
    start,end=line.interpolate(contacts[0]),line.interpolate(contacts[-1])
    route=[dict(route_type='wire',x=p.x,y=p.y,layer=a['layer'],width=a['width']) for p in [start,end]]
    for new,old in zip(route,[a,b]):
        if math.hypot(new['x']-old['x'],new['y']-old['y'])<1e-6:
            for key in ('start_pcb_port_id','end_pcb_port_id'):
                if key in old:new[key]=old[key]
    trace={**copy.deepcopy(t),'pcb_trace_id':'g350_trimmed_'+item['uuid'],'route':route}
    result.append(trace)
    changes.append(dict(uuid=item['uuid'],originalTrace=t['pcb_trace_id'],originalLength=line.length,retainedLength=contacts[-1]-contacts[0],contacts=contacts))
output.write_text(json.dumps(result,indent=2)+'\n')
Path(str(output)+'.junctions.json').write_text(json.dumps(dict(restoredUsefulIntervals=changes,requiresFreshReplayAndAllChecks=True,fabricationReady=False),indent=2)+'\n')
print(json.dumps(dict(retainedJunctionIntervals=len(changes),removedTailLengthMm=sum(c['originalLength']-c['retainedLength'] for c in changes))))
