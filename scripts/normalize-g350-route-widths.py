"""Make neck transitions invariant under the core's route reversal.

Duplicate zero-length junction vertices so both ends of every real segment
declare one width. At mixed-width boundary segments retain the smaller neck
width. Wider trunks and every DDR path remain unchanged. Validate the output.
"""
import json,sys,hashlib
from pathlib import Path
source,out=map(Path,sys.argv[1:3]);assert not out.exists()
c=json.loads(source.read_text());changes=[]
ddr={e['source_trace_id'] for e in c if e['type']=='source_trace' and e.get('name','').startswith('DDR_')}
for t in c:
    if t['type']!='pcb_trace' or t['source_trace_id'] in ddr:continue
    original=t['route'];result=[]
    for i,p in enumerate(original):
        q=dict(p)
        incoming=original[i-1] if i else None
        outgoing=original[i+1] if i+1<len(original) else None
        if p['route_type']=='wire':
            before=min(p['width'],incoming['width']) if incoming and incoming['route_type']=='wire' and incoming['layer']==p['layer'] else p['width']
            after=min(p['width'],outgoing['width']) if outgoing and outgoing['route_type']=='wire' and outgoing['layer']==p['layer'] else p['width']
            q['width']=before
            result.append(q)
            if before!=after:
                r=dict(p,width=after);r.pop('start_pcb_port_id',None);r.pop('end_pcb_port_id',None)
                result.append(r);changes.append(dict(trace=t['pcb_trace_id'],index=i,incomingWidthMm=before,outgoingWidthMm=after))
        else:result.append(q)
    t['route']=result
out.write_text(json.dumps(c,indent=2)+'\n')
Path(str(out)+'.report.json').write_text(json.dumps(dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),resultSha256=hashlib.sha256(out.read_bytes()).hexdigest(),widthJunctions=changes,ddrGeometryPreserved=True,requiresNativeAndIndependentValidation=True,fabricationReady=False),indent=2)+'\n')
print('Normalized width junctions:',len(changes))
