"""Preserve narrow endpoint segment widths through the core's route reversal.

The core can reset the final wire vertex to the source rail width. A repeated
endpoint keeps the preceding real segment at its authored width. This changes
only serialization metadata; replay, Gerber and manufacturing checks are still
required on the emitted circuit.
"""
import json,sys,hashlib
from pathlib import Path
source,out=map(Path,sys.argv[1:3]);assert not out.exists()
cache=json.loads(source.read_text());changes=[]
def segments(route):
 return [(a['x'],a['y'],b['x'],b['y'],a['width'],a['layer']) for a,b in zip(route,route[1:]) if a['route_type']==b['route_type']=='wire' and a['layer']==b['layer'] and (a['x'],a['y'])!=(b['x'],b['y'])]
for t in cache['traces']:
 r=t['route'];before=segments(r)
 for endpoint in ['start','end']:
  p=r[0] if endpoint=='start' else r[-1];adjacent=r[1] if endpoint=='start' else r[-2]
  if p['route_type']!='wire' or abs(p['width']-.1016)>1e-8:continue
  if adjacent['route_type']=='wire' and (p['x'],p['y'],p['width'],p['layer'])==(adjacent['x'],adjacent['y'],adjacent['width'],adjacent['layer']):continue
  q=dict(p);q.pop('start_pcb_port_id',None);q.pop('end_pcb_port_id',None)
  if endpoint=='start':r.insert(1,q)
  else:r.insert(len(r)-1,q)
  changes.append(dict(trace=t['pcb_trace_id'],endpoint=endpoint,x=p['x'],y=p['y']))
 assert segments(r)==before,'Changed real wire geometry or width'
out.write_text(json.dumps(cache,indent=2)+'\n')
Path(str(out)+'.guards.json').write_text(json.dumps(dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),resultSha256=hashlib.sha256(out.read_bytes()).hexdigest(),changes=changes,positiveLengthSegmentsExactlyPreserved=True,requiresFreshSourceAndIndependentChecks=True,fabricationReady=False),indent=2)+'\n')
print('Added endpoint width guards:',len(changes))
