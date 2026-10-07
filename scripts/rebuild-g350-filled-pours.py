"""Replace stale derived GND fills with the exact independently checked fill.

No signal copper, logical membership or placement is changed. This binds the
Circuit JSON Gerber check to a freshly filled KiCad board; it is not an
editable-source replay or fabrication qualification.
"""
import hashlib,json,sys
from pathlib import Path
sys.path.insert(0,str(Path('.cloud-tools/python-routing').resolve()))
from shapely.geometry import Polygon
from shapely import make_valid
source,board,polygons,connectivity,out=map(Path,sys.argv[1:6])
assert not out.exists()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
c=json.loads(source.read_text());report=json.loads(connectivity.read_text())
assert report['boardSha256']==sha(board) and report['circuitSha256']==sha(source)
net=next(e['source_net_id'] for e in c if e['type']=='source_net' and e['name']=='GND')
old=[e for e in c if e['type']=='pcb_copper_pour']
assert old and all(e['source_net_id']==net for e in old)
result=[e for e in c if e['type']!='pcb_copper_pour'];count=0
for row in json.loads(polygons.read_text()):
    shape=Polygon(row['outline'],row['holes'])
    if not shape.is_valid:shape=make_valid(shape)
    parts=list(shape.geoms) if hasattr(shape,'geoms') else [shape]
    for part in parts:
        if part.geom_type!='Polygon' or part.area<=0:continue
        vertices=lambda ring:[dict(x=x,y=y) for x,y in list(ring.coords)[:-1]]
        result.append(dict(type='pcb_copper_pour',pcb_copper_pour_id='g350_fresh_filled_gnd_'+str(count),
            source_net_id=net,subcircuit_id=old[0]['subcircuit_id'],covered_with_solder_mask=True,
            shape='brep',layer=row['layer'],brep_shape=dict(outer_ring=dict(vertices=vertices(part.exterior)),
            inner_rings=[dict(vertices=vertices(ring)) for ring in part.interiors])))
        count+=1
assert count>0
assert [e for e in result if e['type']!='pcb_copper_pour']==[e for e in c if e['type']!='pcb_copper_pour']
out.write_text(json.dumps(result,indent=2)+'\n')
Path(str(out)+'.fills.json').write_text(json.dumps(dict(sourceSha256=sha(source),boardSha256=sha(board),
    polygonsSha256=sha(polygons),connectivitySha256=sha(connectivity),resultSha256=sha(out),
    oldFills=len(old),newFills=count,signalCopperAndPlacementExactlyPreserved=True,
    independentlyConnectedConnections=report['connectedConnections'],requiredConnections=report['requiredConnections'],
    requiresEditableSourceReplay=True,fabricationReady=False),indent=2)+'\n')
print(json.dumps(dict(oldFills=len(old),newFills=count,signalCopperExactlyPreserved=True)))
