"""Recover one CPU-to-RAM route from repaired, physically connected DDR copper.

Only selected DDR nets change. Join centre lines must lie within existing
same-net copper. Their real wire width still requires complete clearance
checks. Unused branches/lands are removed; native and independent checks
remain mandatory. No timing or fabrication qualification is asserted.
"""
import json,sys,math,heapq,hashlib
from pathlib import Path
from collections import defaultdict
sys.path.insert(0,str(Path('.cloud-tools/python-routing').resolve()))
from shapely.geometry import Point,LineString
from shapely.ops import unary_union
from shapely.strtree import STRtree

source,out=map(Path,sys.argv[1:3]);assert not out.exists()
selected=set(sys.argv[3].split(','));c=json.loads(source.read_text())
st={e['source_trace_id']:e for e in c if e['type']=='source_trace'}
ports={e['source_port_id']:e for e in c if e['type']=='pcb_port'}
sc={e['source_component_id']:e['name'] for e in c if e['type']=='source_component'}
sp={e['source_port_id']:e for e in c if e['type']=='source_port'}
layers=['top','inner1','inner2','bottom'];changes=[];replace_ids=set();new=[]
key=lambda layer,x,y:(layer,round(x,8),round(y,8))
for name in sorted(selected):
 s=next(e for e in st.values() if e.get('name')==name)
 assert name.startswith('DDR_') and len(s['connected_source_port_ids'])==2
 ts=[e for e in c if e['type']=='pcb_trace' and e['source_trace_id']==s['source_trace_id']]
 tids={e['pcb_trace_id'] for e in ts};vs=[e for e in c if e['type']=='pcb_via' and e.get('pcb_trace_id') in tids]
 terminals={sc[sp[i]['source_component_id']]:ports[i] for i in s['connected_source_port_ids']}
 assert set(terminals)=={'U_SOC','U_RAM'}
 segs=[];metal={layer:[] for layer in layers};cuts=[];graph=defaultdict(dict)
 for t in ts:
  for a,b in zip(t['route'],t['route'][1:]):
   if a['route_type']==b['route_type']=='wire' and a['layer']==b['layer'] and (a['x'],a['y'])!=(b['x'],b['y']):
    assert abs(a['width']-.1016)<1e-9 and abs(b['width']-.1016)<1e-9
    line=LineString([(a['x'],a['y']),(b['x'],b['y'])]);segs.append((a['layer'],line));cuts.append({0.,line.length});metal[a['layer']].append(line.buffer(.0508,quad_segs=32))
 for v in vs:
  for layer in layers:metal[layer].append(Point(v['x'],v['y']).buffer(v['outer_diameter']/2,quad_segs=64))
 for p in terminals.values():
  pad=next(e for e in c if e['type']=='pcb_smtpad' and e.get('pcb_port_id')==p['pcb_port_id'])
  assert pad['shape']=='circle';metal[pad['layer']].append(Point(p['x'],p['y']).buffer(pad['radius'],quad_segs=64))
 metal={layer:unary_union(shapes).buffer(1e-7) for layer,shapes in metal.items()}
 trees={layer:STRtree([line for ls,line in segs if ls==layer]) for layer in layers}
 indices={layer:[i for i,(ls,line) in enumerate(segs) if ls==layer] for layer in layers}
 def edge(a,b,weight,kind):
  if a==b:return
  if b not in graph[a] or graph[a][b][0]>weight:graph[a][b]=(weight,kind);graph[b][a]=(weight,kind)
 def connect_point(layer,p,radius):
  a=key(layer,p.x,p.y);graph[a]
  for local in trees[layer].query(p.buffer(radius)):
   i=indices[layer][int(local)];line=segs[i][1];distance=line.distance(p)
   if distance>radius+1e-9:continue
   fraction=line.project(p);q=line.interpolate(fraction)
   if distance>1e-8:
    join=LineString([(p.x,p.y),(q.x,q.y)])
    if join.difference(metal[layer]).area>1e-9:continue
   cuts[i].add(fraction);edge(a,key(layer,q.x,q.y),distance,'wire')
 for layer,line in segs:
  for x,y in line.coords:connect_point(layer,Point(x,y),.1016)
 for i,(layer,line) in enumerate(segs):
  for local in trees[layer].query(line):
   j=indices[layer][int(local)]
   if j<=i:continue
   hit=line.intersection(segs[j][1])
   for part in list(hit.geoms) if hasattr(hit,'geoms') else [hit]:
    points=[part] if part.geom_type=='Point' else [Point(part.coords[0]),Point(part.coords[-1])] if part.geom_type=='LineString' else []
    for p in points:cuts[i].add(line.project(p));cuts[j].add(segs[j][1].project(p))
 for v in vs:
  for layer in layers:connect_point(layer,Point(v['x'],v['y']),v['outer_diameter']/2+.0508)
  for i,layer in enumerate(layers):
   for other in layers[:i]:edge(key(layer,v['x'],v['y']),key(other,v['x'],v['y']),1.6,'via')
 for p in terminals.values():connect_point(p['layers'][0],Point(p['x'],p['y']),.2508)
 for i,(layer,line) in enumerate(segs):
  ps=[line.interpolate(t) for t in sorted(cuts[i])]
  for a,b in zip(ps,ps[1:]):edge(key(layer,a.x,a.y),key(layer,b.x,b.y),a.distance(b),'wire')
 cpu,ram=terminals['U_SOC'],terminals['U_RAM'];start=key(cpu['layers'][0],cpu['x'],cpu['y']);goal=key(ram['layers'][0],ram['x'],ram['y'])
 queue=[(0.,start)];dist={start:0.};parent={}
 while queue:
  d,node=heapq.heappop(queue)
  if d!=dist[node]:continue
  if node==goal:break
  for nxt,(weight,kind) in graph[node].items():
   nd=d+weight
   if nd<dist.get(nxt,math.inf):dist[nxt]=nd;parent[nxt]=(node,kind);heapq.heappush(queue,(nd,nxt))
 assert goal in dist, (name,'No centre-line route inside existing copper')
 path=[goal];kinds=[]
 while path[-1]!=start:
  prev,kind=parent[path[-1]];path.append(prev);kinds.append(kind)
 path.reverse();kinds.reverse();route=[dict(route_type='wire',layer=start[0],x=start[1],y=start[2],width=.1016,start_pcb_port_id=cpu['pcb_port_id'])];used=set()
 for a,b,kind in zip(path,path[1:],kinds):
  if kind=='via':
   assert a[1:]==b[1:];used.add(a[1:]);route.append(dict(route_type='via',x=a[1],y=a[2],from_layer=a[0],to_layer=b[0],via_diameter=.4572,via_hole_diameter=.254))
  route.append(dict(route_type='wire',layer=b[0],x=b[1],y=b[2],width=.1016))
 route[-1]['end_pcb_port_id']=ram['pcb_port_id'];tid='g350_full_ddr_'+name
 new.append(dict(type='pcb_trace',pcb_trace_id=tid,source_trace_id=s['source_trace_id'],route=route,subcircuit_id=ts[0]['subcircuit_id']))
 for xy in sorted(used):
  v=next(v for v in vs if key('top',v['x'],v['y'])[1:]==xy)
  new.append(dict(v,pcb_trace_id=tid))
 replace_ids|=tids;changes.append(dict(signal=name,oldTraceRecords=len(ts),oldVias=len(vs),retainedVias=len(used),lengthWithNativeViaAllowance=dist[goal]))
result=[e for e in c if not(e['type']=='pcb_trace' and e['pcb_trace_id'] in replace_ids) and not(e['type']=='pcb_via' and e.get('pcb_trace_id') in replace_ids)]+new
out.write_text(json.dumps(result,indent=2)+'\n')
Path(str(out)+'.canonicalization.json').write_text(json.dumps(dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),resultSha256=hashlib.sha256(out.read_bytes()).hexdigest(),changes=changes,requiresNativeAndIndependentChecks=True,fabricationReady=False),indent=2)+'\n')
print(json.dumps(changes))
