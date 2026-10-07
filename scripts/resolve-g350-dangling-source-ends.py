"""Bind real KiCad dangling endpoints to their authored route endpoints."""
import hashlib,json,math,sys
from pathlib import Path
source,items_path,output=map(Path,sys.argv[1:4]);assert not output.exists()
c=json.loads(source.read_text());items=json.loads(items_path.read_text())
layers={'F.Cu':'top','In1.Cu':'inner1','In2.Cu':'inner2','B.Cu':'bottom'}
def close(a,b):return math.hypot(a['x']-b['x'],a['y']-b['y'])<1e-5
errors=[];interior=[]
for item in items:
 if item['type']!='track':continue
 matches=[]
 for t in c:
  if t['type']!='pcb_trace':continue
  for i,(a,b) in enumerate(zip(t['route'],t['route'][1:])):
   if a['route_type']==b['route_type']=='wire' and a['layer']==b['layer']==layers[item['layer']] and ((close(a,item['start']) and close(b,item['end'])) or (close(a,item['end']) and close(b,item['start']))):matches.append(t)
 assert len(matches)==1,(item,len(matches))
 t=matches[0];r=t['route'];point=item['danglingPoint']
 endpoints=[name for name,p in [('start',r[0]),('end',r[-1])] if close(p,point)]
 if not endpoints:
  interior.append(dict(uuid=item['uuid'],trace=t['pcb_trace_id'],point=point));continue
 for end in endpoints:errors.append(dict(pcb_trace_id=t['pcb_trace_id'],endpoint=end,center=point,kiCadTrackUuid=item['uuid']))
report=dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),itemsSha256=hashlib.sha256(items_path.read_bytes()).hexdigest(),provenance='Actual KiCad TestTrackEndpointDangling, bound through DRC UUID and source segment geometry',danglingSourceEndpoints=errors,interiorEndpoints=interior,fabricationReady=False)
output.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(dict(routeEndpoints=len(errors),interiorEndpoints=len(interior))))
