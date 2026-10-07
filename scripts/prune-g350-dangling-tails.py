"""Trim unbranched non-DDR dead tails at real same-net wire intersections.

Preserve every labelled port, declared via and DDR trace. Full native and
independent connectivity checks are required; this only removes copper.
"""
import json,sys,hashlib
from pathlib import Path
sys.path.insert(0,str(Path('.cloud-tools/python-routing').resolve()))
from shapely.geometry import LineString,Point
source,report,out=map(Path,sys.argv[1:4]);assert not out.exists()
c=json.loads(source.read_text());d=json.loads(report.read_text());assert d['sourceSha256']==hashlib.sha256(source.read_bytes()).hexdigest()
parents={}
def find(x):
 parents.setdefault(x,x)
 if parents[x]!=x:parents[x]=find(parents[x])
 return parents[x]
st={e['source_trace_id']:e for e in c if e['type']=='source_trace'}
for s in st.values():
 for member in s['connected_source_port_ids']+s['connected_source_net_ids']:parents[find(s['source_trace_id'])]=find(member)
ts={e['pcb_trace_id']:e for e in c if e['type']=='pcb_trace'};changes=[]
def segments(t):
 for a,b in zip(t['route'],t['route'][1:]):
  if a['route_type']==b['route_type']=='wire' and a['layer']==b['layer'] and (a['x'],a['y'])!=(b['x'],b['y']):yield a,b,LineString([(a['x'],a['y']),(b['x'],b['y'])])
for err in d['results']['checkDanglingTraces']:
 t=ts[err['pcb_trace_id']]
 if st[t['source_trace_id']].get('name','').startswith('DDR_'):continue
 reverse=err['pcb_trace_error_id'].endswith('_end');r=list(reversed(t['route'])) if reverse else list(t['route'])
 ownvias=[e for e in c if e['type']=='pcb_via' and e.get('pcb_trace_id')==t['pcb_trace_id']]
 foreign=[(a,b,line) for other in ts.values() if other is not t and find(other['source_trace_id'])==find(t['source_trace_id']) for a,b,line in segments(other)]
 removed=[];found=None
 for i,(a,b) in enumerate(zip(r,r[1:])):
  if a['route_type']=='via':
   # Stop the dead branch at its real retained full-depth land. Nothing past
   # that contact is removed and every declared via remains in the inventory.
   new=r[i:]
   if i and len(new)>=2:
    found=(list(reversed(new)) if reverse else new,sum(seg.length for seg in removed),[a['x'],a['y']])
   break
  if a['route_type']!=b['route_type'] or a['route_type']!='wire' or a['layer']!=b['layer']:break
  if a.get('start_pcb_port_id') or a.get('end_pcb_port_id'):break
  if (a['x'],a['y'])==(b['x'],b['y']):continue
  line=LineString([(a['x'],a['y']),(b['x'],b['y'])]);options=[]
  for u,v,otherline in foreign:
   if u['layer']!=a['layer']:continue
   # Preserve a branch that joins by real copper overlap without crossing
   # centre lines. Retain .02 mm of overlap rather than trimming through it.
   hit=line.intersection(otherline.buffer(max(0,(a['width']+u['width'])/2-.02)))
   if hit.is_empty:continue
   geoms=list(hit.geoms) if hasattr(hit,'geoms') else [hit]
   for g in geoms:
    pts=[g] if g.geom_type=='Point' else [Point(g.coords[0]),Point(g.coords[-1])] if g.geom_type=='LineString' else []
    options.extend((line.project(q),q) for q in pts)
  if options:
   length,q=min(options,key=lambda e:e[0]);cut=LineString([(a['x'],a['y']),(q.x,q.y)]) if length>1e-8 else None
   deleted=removed+([cut] if cut else [])
   if any(any(seg.distance(Point(v['x'],v['y']))<1e-6 for seg in deleted) and Point(v['x'],v['y']).distance(q)>1e-6 for v in ownvias):break
   point=dict(a,x=q.x,y=q.y);point.pop('start_pcb_port_id',None);point.pop('end_pcb_port_id',None)
   new=[point]+r[i+1:]
   if len(new)<2:break
   found=(list(reversed(new)) if reverse else new,sum(seg.length for seg in deleted),[q.x,q.y]);break
  if any(line.distance(Point(v['x'],v['y']))<1e-6 for v in ownvias):
   contact=i+1
   while contact<len(r) and r[contact]['route_type']=='wire' and (r[contact]['x'],r[contact]['y'])==(b['x'],b['y']):contact+=1
   if contact<len(r) and r[contact]['route_type']=='via' and (b['x'],b['y'])==(r[contact]['x'],r[contact]['y']):
    new=r[contact:]
    if len(new)>=2:
     found=(list(reversed(new)) if reverse else new,sum(seg.length for seg in removed)+line.length,[b['x'],b['y']])
   break
  removed.append(line)
 if found:
  t['route']=found[0];changes.append(dict(trace=t['pcb_trace_id'],endpoint='end' if reverse else 'start',removedLengthMm=found[1],intersection=found[2]))
out.write_text(json.dumps(c,indent=2)+'\n')
Path(str(out)+'.pruning.json').write_text(json.dumps(dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),resultSha256=hashlib.sha256(out.read_bytes()).hexdigest(),changes=changes,requiresIndependentChecks=True,fabricationReady=False),indent=2)+'\n')
print(json.dumps(changes))
