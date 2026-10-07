"""Trim an unused route tail to its first exact same-net copper junction.

Use an actual native dangling-end report. Keep DDR, pads, logic and placements
unchanged, and qualify the candidate with fresh all-pad connectivity and DRC.
"""
import copy, hashlib, json, math, sys
from pathlib import Path
sys.path.insert(0,str(Path('.cloud-tools/python-routing').resolve()))
from shapely.geometry import LineString, Point
from shapely.ops import nearest_points

source, report_path, output=map(Path,sys.argv[1:4]);assert not output.exists()
c=json.loads(source.read_text());report=json.loads(report_path.read_text())
assert report['sourceSha256']==hashlib.sha256(source.read_bytes()).hexdigest()
from_kicad='danglingSourceEndpoints' in report
errors=report['danglingSourceEndpoints'] if from_kicad else report['results']['checkDanglingTraces'];selected={e['pcb_trace_id'] for e in errors}
parent={}
def find(x):
 parent.setdefault(x,x)
 if parent[x]!=x:parent[x]=find(parent[x])
 return parent[x]
for s in c:
 if s['type']=='source_trace':
  for m in s['connected_source_port_ids']+s['connected_source_net_ids']:parent[find(s['source_trace_id'])]=find(m)
ddr={s['source_trace_id'] for s in c if s['type']=='source_trace' and s.get('name','').startswith('DDR_')}
segments=[]
for t in c:
 if t['type']!='pcb_trace':continue
 for a,b in zip(t['route'],t['route'][1:]):
  if a['route_type']==b['route_type']=='wire' and a['layer']==b['layer'] and math.hypot(a['x']-b['x'],a['y']-b['y'])>1e-7:
   segments.append((find(t['source_trace_id']),a['layer'],LineString([(a['x'],a['y']),(b['x'],b['y'])]),t['pcb_trace_id'],a['width']))
owners={t['pcb_trace_id']:find(t['source_trace_id']) for t in c if t['type']=='pcb_trace'}
vias=[v for v in c if v['type']=='pcb_via']
changes=[];replacement={}
for tid in selected:
 t=next(t for t in c if t['type']=='pcb_trace' and t['pcb_trace_id']==tid);assert t['source_trace_id'] not in ddr
 r=copy.deepcopy(t['route']);net=find(t['source_trace_id']);ends=[e for e in errors if e['pcb_trace_id']==tid]
 for e in ends:
  start=e['endpoint']=='start' if from_kicad else e['pcb_trace_error_id'].endswith('_start');route=list(reversed(r)) if start else r
  found=None
  for i in range(len(route)-2,-1,-1):
   a,b=route[i:i+2]
   if a['route_type']=='via':
    via=next(v for v in vias if math.hypot(v['x']-a['x'],v['y']-a['y'])<1e-6)
    vp=Point(a['x'],a['y'])
    if any(n==net and other!=tid and shape.distance(vp)<via['outer_diameter']/2+width/2-1e-6 for n,layer,shape,other,width in segments):
     wire={**b,'route_type':'wire','x':a['x'],'y':a['y']}
     if b['route_type']!='wire':wire=dict(route_type='wire',x=a['x'],y=a['y'],layer=a['to_layer'],width=.1016)
     found=route[:i+1]+[wire];p=vp;break
   if a['route_type']!= 'wire' or b['route_type']!='wire' or a['layer']!=b['layer']:continue
   if math.hypot(a['x']-b['x'],a['y']-b['y'])<1e-7:continue
   line=LineString([(a['x'],a['y']),(b['x'],b['y'])]);contacts=[]
   for n,layer,shape,other,width in segments:
    if n!=net or layer!=a['layer'] or other==tid:continue
    inter=line.intersection(shape)
    if inter.is_empty:
     if line.distance(shape)<(a['width']+width)/2-1e-6:
      contacts.append(line.project(nearest_points(line,shape)[0]))
     continue
    if inter.geom_type=='Point':ps=[inter]
    elif inter.geom_type=='MultiPoint':ps=list(inter.geoms)
    else:ps=[Point(*inter.coords[0]),Point(*inter.coords[-1])] if hasattr(inter,'coords') else []
    contacts.extend(line.project(p) for p in ps)
   for v in vias:
    if owners[v['pcb_trace_id']]!=net:continue
    vp=Point(v['x'],v['y'])
    if line.distance(vp)<v['outer_diameter']/2+a['width']/2-1e-6:contacts.append(line.project(vp))
   if from_kicad:
    free=Point(e['center']['x'],e['center']['y'])
    contacts=[x for x in contacts if line.interpolate(x).distance(free)>1e-5]
   if not contacts:continue
   p=line.interpolate(max(contacts));last={**a,'x':p.x,'y':p.y}
   last.pop('start_pcb_port_id',None);last.pop('end_pcb_port_id',None)
   found=route[:i+1]+[last];break
  if found is None:
   # An entire unjoined branch is a removal trial, not a connectivity claim.
   # The independent numeric-pad check must reject any required connection loss.
   changes.append(dict(trace=tid,endpoint='entire_branch',removedVertices=len(route),requiresIndependentConnectivityProof=True))
   r=[]
   break
  removed=len(route)-len(found);r=list(reversed(found)) if start else found
  changes.append(dict(trace=tid,endpoint='start' if start else 'end',removedVertices=removed,newEndpoint=dict(x=p.x,y=p.y)))
 replacement[tid]={**t,'route':r}
result=[]
for e in c:
 if e['type']=='pcb_trace' and e['pcb_trace_id'] in replacement:
  if replacement[e['pcb_trace_id']]['route']:result.append(replacement[e['pcb_trace_id']])
 elif e['type']=='pcb_via' and e.get('pcb_trace_id') in replacement:
  route=replacement[e['pcb_trace_id']]['route']
  if any(p['route_type']=='via' and math.hypot(p['x']-e['x'],p['y']-e['y'])<1e-6 for p in route):result.append(e)
 else:result.append(e)
output.write_text(json.dumps(result,indent=2)+'\n')
Path(str(output)+'.tail-trims.json').write_text(json.dumps(dict(changes=changes,requiresFreshReplayAndAllChecks=True,fabricationReady=False),indent=2)+'\n')
print(json.dumps(dict(trimmedEndpoints=len(changes),changes=changes)))
