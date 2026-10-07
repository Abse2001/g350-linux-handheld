"""Extract one actual CPU-to-RAM conductor path per DDR signal.

Routes assembled by rip-up routing can contain unused branches. This extracts
shortest paths from their actual same-net copper contacts; it never labels an
unconnected endpoint as connected. Native and independent checks remain required.
"""
import sys,json,math,heapq,hashlib
from pathlib import Path
from collections import defaultdict
sys.path.insert(0,str(Path('.cloud-tools/python-routing').resolve()))
from shapely.geometry import Point,LineString
from shapely.strtree import STRtree

source,out=map(Path,sys.argv[1:3]);assert not out.exists()
partial='--complete-only' in sys.argv[3:]
c=json.loads(source.read_text());layers=['top','inner1','inner2','bottom']
ports={e['source_port_id']:e for e in c if e['type']=='pcb_port'}
signals=[e for e in c if e['type']=='source_trace' and e.get('name','').startswith('DDR_')]
assert len(signals)==49
replacement=[];remove=set();report=[]
for st in signals:
    tid=st['source_trace_id'];traces=[e for e in c if e['type']=='pcb_trace' and e.get('source_trace_id')==tid]
    assert len(st['connected_source_port_ids'])==2
    ends=[ports[p] for p in st['connected_source_port_ids']]
    segments=[];via_points={}
    for t in traces:
        for a,b in zip(t['route'],t['route'][1:]):
            if a['route_type']==b['route_type']=='wire' and a['layer']==b['layer'] and (a['x'],a['y'])!=(b['x'],b['y']):
                segments.append(dict(layer=a['layer'],width=a['width'],line=LineString([(a['x'],a['y']),(b['x'],b['y'])])))
    trace_ids={t['pcb_trace_id'] for t in traces}
    for v in c:
        if v['type']=='pcb_via' and v.get('pcb_trace_id') in trace_ids:
            assert v['layers']==layers and abs(v['outer_diameter']-.4572)<1e-8 and abs(v['hole_diameter']-.254)<1e-8
            via_points[round(v['x'],7),round(v['y'],7)]=v
    graph=defaultdict(dict)
    def node(layer,x,y):return (layer,round(x,7),round(y,7))
    def add(a,b,width,kind='wire'):
        if a==b:return
        weight=1.6 if kind=='via' else math.hypot(b[1]-a[1],b[2]-a[2])
        if b not in graph[a] or weight<graph[a][b][0]:
            graph[a][b]=(weight,width,kind);graph[b][a]=(weight,width,kind)
    split=[{0.,s['line'].length} for s in segments]
    by_layer={layer:[i for i,s in enumerate(segments) if s['layer']==layer] for layer in layers}
    trees={layer:STRtree([segments[i]['line'] for i in ids]) for layer,ids in by_layer.items()}
    for i,s in enumerate(segments):
        line=s['line'];ids=by_layer[s['layer']];tree=trees[s['layer']]
        for xy in line.coords:
            p=Point(xy);a=node(s['layer'],*xy)
            for k in tree.query(p.buffer(.1016+1e-7),predicate='intersects'):
                j=ids[int(k)];other=segments[j];reach=(s['width']+other['width'])/2
                if j==i or p.distance(other['line'])>reach+1e-7:continue
                d=other['line'].project(p);q=other['line'].interpolate(d)
                split[j].add(d);add(a,node(s['layer'],q.x,q.y),min(s['width'],other['width']))
        # Actual same-layer crossings can occur inside two segments.
        for k in tree.query(line,predicate='intersects'):
            j=ids[int(k)]
            if j<=i:continue
            hit=line.intersection(segments[j]['line'])
            coords=list(hit.coords) if hasattr(hit,'coords') else []
            for xy in coords:
                p=Point(xy);split[i].add(line.project(p));split[j].add(segments[j]['line'].project(p))
    for (x,y),v in via_points.items():
        p=Point(x,y)
        for layer in layers:
            vn=node(layer,x,y)
            for k in trees[layer].query(p.buffer(.2794+1e-7),predicate='intersects'):
                j=by_layer[layer][int(k)];s=segments[j]
                if p.distance(s['line'])>v['outer_diameter']/2+s['width']/2+1e-7:continue
                d=s['line'].project(p);q=s['line'].interpolate(d);split[j].add(d)
                add(vn,node(layer,q.x,q.y),s['width'])
            for other in layers:
                if layer!=other:add(vn,node(other,x,y),.1016,'via')
    for i,s in enumerate(segments):
        ds=sorted(split[i])
        for a,b in zip(ds,ds[1:]):
            aa=s['line'].interpolate(a);bb=s['line'].interpolate(b)
            add(node(s['layer'],aa.x,aa.y),node(s['layer'],bb.x,bb.y),s['width'])
    # Pads themselves join conductors. A router may terminate inside the RAM
    # land away from the saved fanout's centreline; retain that real contact.
    for p in ends:
        pad=next(e for e in c if e['type']=='pcb_smtpad' and e.get('pcb_port_id')==p['pcb_port_id'])
        assert pad['shape']=='circle'
        layer=p['layers'][0];point=Point(p['x'],p['y']);pn=node(layer,p['x'],p['y'])
        for k in trees[layer].query(point.buffer(pad['radius']+.1)):
            j=by_layer[layer][int(k)];s=segments[j]
            if point.distance(s['line'])>pad['radius']+s['width']/2+1e-7:continue
            d=s['line'].project(point);q=s['line'].interpolate(d)
            add(pn,node(layer,q.x,q.y),s['width'])
            # The earlier split-edge pass has already run. Split this interval
            # too, so an interior physical pad contact enters the wire graph.
            before=max(x for x in split[j] if x<=d+1e-9);after=min(x for x in split[j] if x>=d-1e-9)
            for position in [before,after]:
                r=s['line'].interpolate(position);add(node(layer,q.x,q.y),node(layer,r.x,r.y),s['width'])
    endnodes=[node(p['layers'][0],p['x'],p['y']) for p in ends]
    start,finish=endnodes;dist={start:0.};prev={};queue=[(0.,start)]
    while queue:
        d,a=heapq.heappop(queue)
        if d!=dist[a]:continue
        if a==finish:break
        for b,(weight,width,kind) in graph[a].items():
            nd=d+weight
            if nd<dist.get(b,math.inf)-1e-10:
                dist[b]=nd;prev[b]=(a,width,kind);heapq.heappush(queue,(nd,b))
    if finish not in dist:
        report.append(dict(name=st['name'],connected=False,inputTraces=len(traces)))
        assert partial, 'Unconnected DDR signal: '+st['name']
        continue
    if len(traces)==1:
        # Preserve the six native pair bootstrap routes exactly.
        report.append(dict(name=st['name'],connected=True,preserved=True,nativeLengthMm=dist[finish]))
        continue
    edges=[];b=finish
    while b!=start:
        a,width,kind=prev[b];edges.append((a,b,width,kind));b=a
    edges.reverse();newid='g350_full_ddr_'+st['name'];route=[];vias=[];used_vias=set()
    def wire(a,width):return dict(route_type='wire',layer=a[0],x=a[1],y=a[2],width=width)
    for a,b,width,kind in edges:
        if kind=='wire':
            aa=wire(a,width);bb=wire(b,width)
            if not route or route[-1]!=aa:route.append(aa)
            route.append(bb)
        else:
            assert a[1:]==b[1:]
            xy=a[1:];assert xy not in used_vias,'Conductor path revisits one physical via'
            used_vias.add(xy)
            aa=wire(a,width)
            if not route or route[-1]!=aa:route.append(aa)
            route.append(dict(route_type='via',x=a[1],y=a[2],from_layer=a[0],to_layer=b[0],via_diameter=.4572,via_hole_diameter=.254))
            route.append(wire(b,width))
            vias.append(dict(type='pcb_via',pcb_via_id=newid+'_via_'+str(len(vias)),pcb_trace_id=newid,source_trace_id=tid,x=a[1],y=a[2],outer_diameter=.4572,hole_diameter=.254,layers=layers,from_layer='top',to_layer='bottom',subcircuit_id='subcircuit_source_group_0'))
    route[0]['start_pcb_port_id']=ends[0]['pcb_port_id'];route[-1]['end_pcb_port_id']=ends[1]['pcb_port_id']
    replacement.append(dict(type='pcb_trace',pcb_trace_id=newid,source_trace_id=tid,connection_name=tid,route=route,subcircuit_id='subcircuit_source_group_0'));replacement.extend(vias);remove|=trace_ids
    report.append(dict(name=st['name'],connected=True,inputTraces=len(traces),outputTraces=1,nativeLengthMm=dist[finish],vias=len(vias)))
result=[e for e in c if not ((e['type']=='pcb_trace' and e['pcb_trace_id'] in remove) or (e['type']=='pcb_via' and e.get('pcb_trace_id') in remove))]+replacement
out.write_text(json.dumps(result,indent=2)+'\n')
Path(str(out)+'.report.json').write_text(json.dumps(dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),resultSha256=hashlib.sha256(out.read_bytes()).hexdigest(),connected=sum(r['connected'] for r in report),total=49,signals=report,requiresNativeAndIndependentChecks=True,fabricationReady=False),indent=2)+'\n')
print(json.dumps(dict(connected=sum(r['connected'] for r in report),total=49,removedTraces=len(remove),fabricationReady=False)))
