"""Preserve checked matched DDR and remove only conflicting non-DDR branches.

This prepares a separate recovery trial; it never qualifies connectivity.
"""
import json,sys,hashlib
from pathlib import Path
sys.path.insert(0,str(Path('.cloud-tools/python-routing').resolve()))
from shapely.geometry import Point,LineString
from shapely.strtree import STRtree
source,output=map(Path,sys.argv[1:3]);assert not output.exists()
c=json.loads(source.read_text());ddr={e['source_trace_id'] for e in c if e['type']=='source_trace' and e.get('name','').startswith('DDR_')};assert len(ddr)==49
traces={e['pcb_trace_id']:e for e in c if e['type']=='pcb_trace'};fixed={tid for tid,t in traces.items() if t['source_trace_id'] in ddr};layers=['top','inner1','inner2','bottom'];objects={l:[] for l in layers};via_shapes=[]
for tid in fixed:
 t=traces[tid]
 for a,b in zip(t['route'],t['route'][1:]):
  if a['route_type']==b['route_type']=='wire' and a['layer']==b['layer'] and (a['x'],a['y'])!=(b['x'],b['y']):objects[a['layer']].append(LineString([(a['x'],a['y']),(b['x'],b['y'])]).buffer(b.get('width',.1016)/2,quad_segs=16))
for v in c:
 if v['type']=='pcb_via' and v.get('pcb_trace_id') in fixed:
  shape=Point(v['x'],v['y']).buffer(v['outer_diameter']/2,quad_segs=32);via_shapes.append(shape)
  for l in layers:objects[l].append(shape)
trees={l:STRtree(shapes) for l,shapes in objects.items()};vtree=STRtree(via_shapes);removed=set();removed_vias=[]
for tid,t in traces.items():
 if tid in fixed:continue
 for a,b in zip(t['route'],t['route'][1:]):
  if a['route_type']==b['route_type']=='wire' and a['layer']==b['layer'] and (a['x'],a['y'])!=(b['x'],b['y']):
   shape=LineString([(a['x'],a['y']),(b['x'],b['y'])]).buffer(b.get('width',.1016)/2,quad_segs=16);l=a['layer']
   if any(shape.distance(objects[l][int(i)])<.1016+.001 for i in trees[l].query(shape.buffer(.1026),predicate='intersects')):removed.add(tid)
for v in c:
 if v['type']!='pcb_via' or v.get('pcb_trace_id') in fixed:continue
 shape=Point(v['x'],v['y']).buffer(v['outer_diameter']/2,quad_segs=32)
 conflict=any(shape.distance(objects[l][int(i)])<.1026 for l in layers for i in trees[l].query(shape.buffer(.1026),predicate='intersects'))
 conflict|=any(shape.distance(via_shapes[int(i)])<.151 for i in vtree.query(shape.buffer(.151),predicate='intersects'))
 if conflict:removed.add(v['pcb_trace_id']);removed_vias.append(v)
# A removed full barrel must not survive as an implicit layer change elsewhere.
for v in removed_vias:
 for tid,t in traces.items():
  if tid not in fixed and any(p['route_type']=='via' and abs(p['x']-v['x'])<1e-7 and abs(p['y']-v['y'])<1e-7 for p in t['route']):removed.add(tid)
result=[e for e in c if not(e['type']=='pcb_trace' and e['pcb_trace_id'] in removed) and not(e['type']=='pcb_via' and e.get('pcb_trace_id') in removed)]
assert [e for e in result if e['type']=='pcb_trace' and e['pcb_trace_id'] in fixed]==[e for e in c if e['type']=='pcb_trace' and e['pcb_trace_id'] in fixed]
output.write_text(json.dumps(result,indent=2)+'\n');Path(str(output)+'.report.json').write_text(json.dumps(dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),removedTraceIds=sorted(removed),removedTraceRecords=len(removed),matchedDdrExactlyPreserved=True,requiresFullRoutingAndQualification=True,fabricationReady=False),indent=2)+'\n');print(json.dumps(dict(removedTraceRecords=len(removed),matchedDdrExactlyPreserved=True,fabricationReady=False)))
