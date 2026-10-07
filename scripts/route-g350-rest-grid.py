"""Targeted geometry routing candidate. All native and independent checks remain required."""
import json,sys,math,time,subprocess,os,shutil,hashlib
from pathlib import Path
from collections import defaultdict
sys.path.insert(0,str(Path('.cloud-tools/python-routing').resolve()))
import numpy as np
from shapely import contains_xy,make_valid
from shapely.geometry import Point,LineString,Polygon,box
from shapely.ops import unary_union
from shapely.strtree import STRtree

source_path,srj_path,ground_path,root=map(Path,sys.argv[1:5])
assert not root.exists();root.mkdir()
shutil.copy2('.cloud-tools/g350-grid-path',root/'grid-path.executable')
shutil.copyfile(__file__,root/'worker.executed.py')
shutil.copyfile('scripts/g350-grid-path.cpp',root/'worker.executed.cpp')
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
(root/'execution.json').write_text(json.dumps(dict(source=str(source_path),sourceSha256=sha(source_path),solverInputSha256=sha(srj_path),groundSha256=sha(ground_path),workerSha256=sha(__file__),searchBinarySha256=sha(root/'grid-path.executable'),step=os.environ.get('G350_GRID_STEP','.1'),localEscapes=os.environ.get('G350_GRID_LOCAL_ESCAPES')=='1',searchSeconds=os.environ.get('G350_GRID_SEARCH_SECONDS','15'),fabricationReady=False),indent=2)+'\n')
manifest=json.loads((root/'execution.json').read_text())
manifest['routingParameters']={key:os.environ.get(key) for key in ['G350_GRID_STEP','G350_GRID_NET','G350_GRID_SEARCH_SECONDS','G350_GRID_PRESERVE_SEED','G350_GRID_PRE_FANOUT','G350_GRID_PRE_FANOUT_POWER','G350_GRID_MATCH_FANOUT','G350_GRID_RESERVE_FANOUT_SITES','G350_GRID_FANOUT_SPARE_SITES','G350_GRID_FANOUT_ONLY','G350_GRID_FANOUT_RADIUS','G350_GRID_FANOUT_PRIORITY','G350_GRID_FANOUT_PREFERRED','G350_GRID_FANOUT_GROUND','G350_GRID_GROUND_STITCH_WIDTH','G350_GRID_VIA_COST']}
(root/'execution.json').write_text(json.dumps(manifest,indent=2)+'\n')
circuit=json.loads(source_path.read_text());srj=json.loads(srj_path.read_text())
for typ,key in [('pcb_trace','pcb_trace_id'),('pcb_via','pcb_via_id')]:
    ids=[e[key] for e in circuit if e['type']==typ]
    assert len(ids)==len(set(ids)), 'Input has duplicate '+key
prefix=root.name.replace('-','_')
layers=['top','inner1','inner2','bottom'];step=float(os.environ.get('G350_GRID_STEP','.1'));x0=-38.;y0=-59.;w=round(76/step)+1;h=round(118/step)+1
ports={x['pcb_port_id']:x for x in circuit if x['type']=='pcb_port'}
sp_to_pp={p['source_port_id']:pid for pid,p in ports.items()}
source_traces={x['source_trace_id']:x for x in circuit if x['type']=='source_trace'}
parents={p:p for p in ports}
def find(x):
    while parents[x]!=x:parents[x]=parents[parents[x]];x=parents[x]
    return x
def join(a,b):parents[find(a)]=find(b)
for c in srj['connections']:
    ids=[p['pcb_port_id'] for p in c['pointsToConnect']]
    for p in ids[1:]:join(ids[0],p)
for st in source_traces.values():
    ids=[sp_to_pp[p] for p in st['connected_source_port_ids'] if p in sp_to_pp]
    for p in ids[1:]:join(ids[0],p)
net_ids={key:i+1 for i,key in enumerate(sorted({find(p) for p in ports}))}
port_net={p:net_ids[find(p)] for p in ports}
trace_net={tid:port_net[sp_to_pp[st['connected_source_port_ids'][0]]] for tid,st in source_traces.items() if st['connected_source_port_ids']}
connections=defaultdict(list)
for conn in srj['connections']:connections[port_net[conn['pointsToConnect'][0]['pcb_port_id']]].append(conn)
widths={net:max(c.get('width',.15) for c in cs) for net,cs in connections.items()}
net_names={x['source_net_id']:x['name'] for x in circuit if x['type']=='source_net'}
def label(net):return ','.join(net_names.get(c['name'],c['name']) for c in connections[net])
ground_net=next(n for n in connections if 'GND' in label(n).split(','))
bad_ids=set() if os.environ.get('G350_GRID_PRESERVE_SEED')=='1' else {'source_trace_841','source_trace_847','source_trace_551'}
bad_nets={trace_net[t] for t in bad_ids}
removed={x['pcb_trace_id'] for x in circuit if x['type']=='pcb_trace' and trace_net[x['source_trace_id']] in bad_nets}
circuit=[x for x in circuit if not (x['type']=='pcb_trace' and x['pcb_trace_id'] in removed) and not(x['type']=='pcb_via' and x.get('pcb_trace_id') in removed)]
pcb_trace_net={e['pcb_trace_id']:trace_net[e['source_trace_id']] for e in circuit if e['type']=='pcb_trace'}
objects=[]
def obj(net,ls,shape,kind,pid=None):
    assert shape.is_valid and not shape.is_empty
    objects.append(dict(net=net,layers=ls,shape=shape,kind=kind,pid=pid))
def circle(x,y,r):return Point(x,y).buffer(r,quad_segs=32)
for e in circuit:
    typ=e['type']
    if typ=='pcb_smtpad':
        if e['shape']=='circle':shape=circle(e['x'],e['y'],e['radius'])
        elif e['shape']=='rect':
            radius=e.get('corner_radius',0)
            shape=box(e['x']-e['width']/2+radius,e['y']-e['height']/2+radius,e['x']+e['width']/2-radius,e['y']+e['height']/2-radius)
            if radius:shape=shape.buffer(radius,quad_segs=32)
        else:shape=Polygon([(p['x'],p['y']) for p in e['points']])
        obj(port_net.get(e.get('pcb_port_id'),-1),[layers.index(e['layer'])],shape,'pad',e.get('pcb_port_id'))
    elif typ=='pcb_trace':
        route=e['route'];net=trace_net[e['source_trace_id']]
        for a,b in zip(route,route[1:]):
            if a['route_type']==b['route_type']=='wire' and a['layer']==b['layer'] and (a['x'],a['y'])!=(b['x'],b['y']):
                obj(net,[layers.index(a['layer'])],LineString([(a['x'],a['y']),(b['x'],b['y'])]).buffer(a['width']/2,quad_segs=16),'wire')
    elif typ=='pcb_via':obj(pcb_trace_net[e['pcb_trace_id']],list(range(4)),circle(e['x'],e['y'],e['outer_diameter']/2),'via')
    elif typ=='pcb_plated_hole':
        ww,hh=e['outer_width'],e['outer_height'];r=min(ww,hh)/2
        shape=LineString([(e['x'],e['y']-(hh/2-r)),(e['x'],e['y']+(hh/2-r))]).buffer(r,quad_segs=32) if hh>ww else box(e['x']-ww/2,e['y']-hh/2,e['x']+ww/2,e['y']+hh/2)
        obj(port_net[e['pcb_port_id']],list(range(4)),shape,'pad',e['pcb_port_id'])
for poly in json.loads(ground_path.read_text()):
    shape=Polygon(poly['outline'],poly['holes'])
    # KiCad uses weakly simple contours with repeated vertices at touching
    # cutouts. Normalize that representation, retaining only filled area.
    if not shape.is_valid:shape=make_valid(shape)
    parts=list(shape.geoms) if hasattr(shape,'geoms') else [shape]
    for part in parts:
        if part.geom_type=='Polygon' and part.area>0:obj(ground_net,[layers.index(poly['layer'])],part,'zone')
board=next(x for x in circuit if x['type']=='pcb_board');outline=Polygon([(p['x'],p['y']) for p in board['outline']])
# Only one-port rail/host branches may use the board's 4 mil minimum
# inside package escape regions. Explicit two-port widths remain mandatory.
package_ids={e['pcb_component_id'] for e in circuit if e['type']=='pcb_component' and any(sc['type']=='source_component' and sc['source_component_id']==e['source_component_id'] and sc['name'] in ('U_SOC','U_RAM') for sc in circuit)}
package_regions=[]
escape_margin=float(os.environ.get('G350_GRID_ESCAPE_MARGIN','1.5'))
assert 1.5<=escape_margin<=4.5
for cid in package_ids:
    pads=[e for e in circuit if e['type']=='pcb_smtpad' and e['pcb_component_id']==cid]
    package_regions.append(box(min(e['x']-e['radius'] for e in pads)-escape_margin,min(e['y']-e['radius'] for e in pads)-escape_margin,max(e['x']+e['radius'] for e in pads)+escape_margin,max(e['y']+e['radius'] for e in pads)+escape_margin))
escape_region=unary_union(package_regions)
package_source_ports={p['source_port_id'] for p in ports.values() if p['pcb_component_id'] in package_ids}
escape_widths={net:max([.1016]+[st.get('min_trace_thickness',.1016) for tid,st in source_traces.items() if trace_net.get(tid)==net and (len(st['connected_source_port_ids'])>=2 or any(p in package_source_ports for p in st['connected_source_port_ids']))]) for net in connections}
can_neck={net:escape_widths[net]<widths[net] for net in connections}
if os.environ.get('G350_GRID_GROUND_STITCH_WIDTH'):
    stitch_width=float(os.environ['G350_GRID_GROUND_STITCH_WIDTH'])
    assert stitch_width>=escape_widths[ground_net]
    widths[ground_net]=stitch_width
    can_neck[ground_net]=False
unique_widths=sorted(set(widths.values())|set(escape_widths.values()))
rasters={width:np.zeros((4,h,w),dtype=np.int16) for width in unique_widths}
via_labels=np.zeros((4,h,w),dtype=np.int16);via_forbidden=np.zeros((h,w),dtype=np.bool_)
existing_via=np.zeros((h,w),dtype=np.int16);via_centres={}
def pixels(shape):
    left,bottom,right,top=shape.bounds
    ix0=max(0,math.floor((left-x0)/step));ix1=min(w,math.ceil((right-x0)/step)+1)
    iy0=max(0,math.floor((bottom-y0)/step));iy1=min(h,math.ceil((top-y0)/step)+1)
    if ix0>=ix1 or iy0>=iy1:return None
    mask=contains_xy(shape,x0+np.arange(ix0,ix1)[None,:]*step,y0+np.arange(iy0,iy1)[:,None]*step)
    return (slice(iy0,iy1),slice(ix0,ix1)),mask
def paint(array,shape,net):
    p=pixels(shape)
    if p is None:return
    slices,mask=p;view=array[slices];empty=mask&(view==0);conflict=mask&(view!=0)&(view!=net);view[empty]=net;view[conflict]=-1
def paint_block(array,shape):
    p=pixels(shape)
    if p is not None:sl,mask=p;array[sl]|=mask
def insert(o):
    if o['kind']=='zone':return
    for width,raster in rasters.items():
        inflated=o['shape'].buffer(.1016+width/2+.001,quad_segs=16)
        for layer in o['layers']:paint(raster[layer],inflated,o['net'])
    clearance=.15 if o['kind']=='via' else .1016
    inflated=o['shape'].buffer(clearance+.4572/2+.001,quad_segs=16)
    for layer in o['layers']:paint(via_labels[layer],inflated,o['net'])
    if o['kind']=='pad':paint_block(via_forbidden,o['shape'].buffer(.254/2+.001,quad_segs=16))
    if o['kind']=='via':
        paint_block(via_forbidden,o['shape'].buffer(.508-.4572/2+.001,quad_segs=16))
        point=o['shape'].centroid; ix=round((point.x-x0)/step);iy=round((point.y-y0)/step)
        if 0<=ix<w and 0<=iy<h:
            assert (iy,ix) not in via_centres or via_centres[iy,ix][2]==o['net']
            existing_via[iy,ix]=o['net'];via_centres[iy,ix]=(point.x,point.y,o['net'])
begun=time.monotonic()
for o in objects:insert(o)
for width,raster in rasters.items():
    allowed=np.zeros((h,w),dtype=np.bool_);paint_block(allowed,outline.buffer(-(.3+width/2+.001)))
    raster[:,~allowed]=-1
allowed=np.zeros((h,w),dtype=np.bool_);paint_block(allowed,outline.buffer(-(.3+.4572/2+.001)));via_forbidden|=~allowed
for e in circuit:
    if e['type']=='pcb_keepout':
        shape=box(e['center']['x']-e['width']/2,e['center']['y']-e['height']/2,e['center']['x']+e['width']/2,e['center']['y']+e['height']/2)
        for width,raster in rasters.items():
            for layer in e['layers']:paint(raster[layers.index(layer)],shape.buffer(width/2+.001),-1)
        paint_block(via_forbidden,shape.buffer(.4572/2+.001))
    if e['type']=='pcb_hole':
        shape=circle(e['x'],e['y'],e['hole_diameter']/2)
        for width,raster in rasters.items():
            for layer in range(4):paint(raster[layer],shape.buffer(.2+width/2+.001),-1)
        paint_block(via_forbidden,shape.buffer(.254+.254/2+.001))
print(json.dumps(dict(stage='raster_ready',objects=len(objects),seconds=time.monotonic()-begun)),flush=True)
def components(net):
    indices=[i for i,o in enumerate(objects) if o['net']==net];ps={i:i for i in indices}
    def root(i):
        while ps[i]!=i:ps[i]=ps[ps[i]];i=ps[i]
        return i
    for layer in range(4):
        ids=[i for i in indices if layer in objects[i]['layers']];shapes=[objects[i]['shape'] for i in ids];tree=STRtree(shapes)
        for j,shape in enumerate(shapes):
            for k in tree.query(shape.buffer(1e-7),predicate='intersects'):
                if k>j:ps[root(ids[int(k)])]=root(ids[j])
    groups=defaultdict(list)
    for i in indices:groups[root(i)].append(i)
    return sorted(groups.values(),key=lambda ids:(len({objects[i]['pid'] for i in ids if objects[i]['pid']}),len(ids),-sum(objects[i]['pid'] in cpu_port_ids for i in ids)),reverse=True)
cpu_ids={e['pcb_component_id'] for e in circuit if e['type']=='pcb_component' and any(sc['type']=='source_component' and sc['source_component_id']==e['source_component_id'] and sc['name']=='U_SOC' for sc in circuit)}
cpu_port_ids={e['pcb_port_id'] for e in circuit if e['type']=='pcb_smtpad' and e['pcb_component_id'] in cpu_ids}
new_traces=[];reports=[]
def save():
    for name,data in [('candidate.circuit.json',[e for e in circuit if not e['type'].endswith('_error')]+new_traces),('progress.json',dict(seconds=time.monotonic()-begun,removedTraceIds=sorted(removed),netReports=reports,newPaths=len(new_traces),fabricationReady=False))]:
        temporary=root/(name+'.tmp');temporary.write_text(json.dumps(data,indent=2)+'\n');temporary.replace(root/name)
escape_mask=np.zeros((h,w),dtype=np.bool_);paint_block(escape_mask,escape_region)
package_nets={port_net[e['pcb_port_id']] for e in circuit if e['type']=='pcb_smtpad' and e['pcb_component_id'] in package_ids}
ddr_nets={trace_net[tid] for tid,st in source_traces.items() if st.get('name','').startswith('DDR_')}
order=sorted(connections,key=lambda n:(n==ground_net,0 if n in package_nets and n not in ddr_nets and escape_widths[n]>.1016 else (1 if escape_widths[n]>.1016 else (2 if n in ddr_nets else 3)),len({p['pcb_port_id'] for c in connections[n] for p in c['pointsToConnect']})))
# Allocate short package escapes before any long routes consume via sites.
if os.environ.get('G350_GRID_PRE_FANOUT')=='1':
    rail_tokens={'GND','IO_3V3','DDR_1V5','VDDS_1V8','ANALOG_1V8','VDD_CORE','VDD_MPU','DDR_VREF'}
    fanout_ports=[]
    for net in connections:
        if (net==ground_net and os.environ.get('G350_GRID_FANOUT_GROUND')!='1') or 'XTAL' in label(net):continue
        required={p['pcb_port_id'] for conn in connections[net] for p in conn['pointsToConnect']}
        for pid in required:
            pad=next((e for e in circuit if e['type']=='pcb_smtpad' and e.get('pcb_port_id')==pid),None)
            if pad is None:continue
            cid=pad['pcb_component_id'];bga=cid in package_ids
            if not bga and sum(e['type']=='pcb_smtpad' and e['pcb_component_id']==cid for e in circuit)<4:continue
            if bga and os.environ.get('G350_GRID_PRE_FANOUT_POWER')!='1' and (set(label(net).split(','))&rail_tokens or any(token.startswith('CAP_') for token in label(net).split(','))):continue
            group=next(g for g in components(net) if any(objects[i]['pid']==pid for i in g))
            if any(objects[i]['kind'] in ('wire','via') for i in group):continue
            fanout_ports.append((pid,net))
    matched_slots={}
    if os.environ.get('G350_GRID_MATCH_FANOUT')=='1':
        from scipy.ndimage import label as label_pixels
        fanout_radius=float(os.environ.get('G350_GRID_FANOUT_RADIUS','1.2'))
        assert 1.2<=fanout_radius<=3.6
        deltas=[sign*(.4+.8*i) for i in range(round((fanout_radius-.4)/.8)+1) for sign in [-1,1]]
        choices={};owners={};net_for_pid=dict(fanout_ports)
        for pid,net in fanout_ports:
            pad=next(e for e in circuit if e['type']=='pcb_smtpad' and e.get('pcb_port_id')==pid)
            if pad['pcb_component_id'] not in package_ids:continue
            p=ports[pid];ww=escape_widths[net];raster=rasters[ww][0];sx=round((p['x']-x0)/step);sy=round((p['y']-y0)/step)
            reach_box=round((fanout_radius+.4)/step);left=max(0,sx-reach_box);right=min(w,sx+reach_box+1);bottom=max(0,sy-reach_box);top=min(h,sy+reach_box+1)
            local=raster[bottom:top,left:right];labs,_=label_pixels((local==0)|(local==net));component=labs[sy-bottom,sx-left]
            candidates=[]
            for dx in deltas:
                for dy in deltas:
                    ix=round((p['x']+dx-x0)/step);iy=round((p['y']+dy-y0)/step)
                    if component and left<=ix<right and bottom<=iy<top and labs[iy-bottom,ix-left]==component and not via_forbidden[iy,ix] and np.all((via_labels[:,iy,ix]==0)|(via_labels[:,iy,ix]==net)):
                        candidates.append((dx*dx+dy*dy,(iy,ix)))
            choices[pid]=[site for _,site in sorted(candidates)]
        from scipy.optimize import linear_sum_assignment
        pids=sorted(choices);sites=sorted({site for c in choices.values() for site in c});site_index={site:i for i,site in enumerate(sites)}
        preferred={}
        if os.environ.get('G350_GRID_FANOUT_PREFERRED'):
            for row in json.loads(Path(os.environ['G350_GRID_FANOUT_PREFERRED']).read_text()):
                if row['status']=='ESCAPED':
                    x,y=row['via'];preferred[row['port']]=(round((y-y0)/step),round((x-x0)/step))
        costs=np.full((len(pids),len(sites)),1e12,dtype=float)
        for i,pid in enumerate(pids):
            p=ports[pid];net=net_for_pid[pid];usb='USB0_DP' in label(net) or 'USB0_DM' in label(net)
            for site in choices[pid]:
                iy,ix=site;x=x0+ix*step;y=y0+iy*step
                outward_penalty=100 if usb and abs(x)<abs(p['x']) else 0
                stability_penalty=.05 if pid in preferred and site!=preferred[pid] else 0
                costs[i,site_index[site]]=((x-p['x'])**2+(y-p['y'])**2+outward_penalty+stability_penalty)*1e6+site_index[site]*1e-6
        rows,cols=linear_sum_assignment(costs)
        matched_slots={pids[i]:sites[j] for i,j in zip(rows,cols) if costs[i,j]<1e11}
        # BYPASS is a lone PMIC terminal. Reserve its exit before neighboring
        # shared power pins take staggered via sites and enclose that terminal.
        fanout_ports.sort(key=lambda pn:(pn[0] not in choices,0 if label(pn[1])=='PMIC_BYPASS' else 1,len(choices.get(pn[0],[])) if pn[0] in choices else len({p['pcb_port_id'] for conn in connections[pn[1]] for p in conn['pointsToConnect']}),pn[0]))
        (root/'fanout-matching.json').write_text(json.dumps(dict(requested=len(choices),matched=len(matched_slots),unmatched=[p for p in choices if p not in matched_slots],candidateCounts={p:len(c) for p,c in choices.items()},assignedSites={pid:[x0+ix*step,y0+iy*step] for pid,(iy,ix) in matched_slots.items()}),indent=2)+'\n')
        print(json.dumps(dict(stage='fanout_matching',requested=len(choices),matched=len(matched_slots))),flush=True)
        if os.environ.get('G350_GRID_RESERVE_FANOUT_SITES')=='1':
            # Reserve every assigned land before drawing any escape wire.
            # These are planning obstacles only: they never enter the copper
            # connectivity graph or the exported circuit until actually routed.
            for pid,(iy,ix) in matched_slots.items():
                shape=circle(x0+ix*step,y0+iy*step,.4572/2)
                for width,raster in rasters.items():
                    for layer in range(4):paint(raster[layer],shape.buffer(.1016+width/2+.001,quad_segs=16),net_for_pid[pid])
    if os.environ.get('G350_GRID_FANOUT_PRIORITY'):
        priority={pid:i for i,pid in enumerate(os.environ['G350_GRID_FANOUT_PRIORITY'].split(','))}
        fanout_ports.sort(key=lambda pn:(pn[0] not in priority,priority.get(pn[0],0)))
    fanout_report=[]
    for pid,net in fanout_ports:
        p=ports[pid];pad=next(e for e in circuit if e['type']=='pcb_smtpad' and e.get('pcb_port_id')==pid);cid=pad['pcb_component_id'];bga=cid in package_ids
        cs=connections[net];globals=[conn for conn in cs if conn['name'].startswith('source_net_')];owner=(globals or cs)[0]['name'];st_id=cs[0].get('source_trace_id')
        if globals:st_id=min((tid for tid,st in source_traces.items() if owner in st.get('connected_source_net_ids',[])),key=lambda tid:source_traces[tid].get('min_trace_thickness',.1016))
        wire_width=max(escape_widths[net],source_traces[st_id].get('min_trace_thickness',.1016));usb='USB0_DP' in label(net) or 'USB0_DM' in label(net);sl=layers.index(pad['layer'])
        if wire_width not in rasters:fanout_report.append(dict(port=pid,net=label(net),status='UNSUPPORTED_SOURCE_WIDTH',width=wire_width));continue
        blocked=(rasters[wire_width]!=0)&(rasters[wire_width]!=net)
        for l in range(4):
            if l!=sl:blocked[l]=True
        allowed=(~via_forbidden)&np.all((via_labels==0)|(via_labels==net),axis=0)
        goal=np.zeros((4,h,w),dtype=np.bool_)
        if bga and pid in matched_slots:
            iy,ix=matched_slots[pid];candidates=[(x0+ix*step,y0+iy*step)]
            if os.environ.get('G350_GRID_FANOUT_SPARE_SITES')=='1':
                reserved=set(matched_slots.values())
                candidates += [(x0+ix*step,y0+iy*step) for iy,ix in choices[pid] if (iy,ix) not in reserved]
        elif bga:
            candidates=[(p['x']+dx,p['y']+dy) for dx in [-1.2,-.4,.4,1.2] for dy in [-1.2,-.4,.4,1.2]]
        elif pad['shape']=='rect':
            component=next(e for e in circuit if e['type']=='pcb_component' and e['pcb_component_id']==cid)
            horizontal=pad['width']>pad['height'];delta=p['x']-component['center']['x'] if horizontal else p['y']-component['center']['y'];direction=1 if delta>=0 else -1
            extent=(pad['width'] if horizontal else pad['height'])/2
            candidates=[(p['x']+(direction*(extent+.4+row*.8) if horizontal else shift),p['y']+(shift if horizontal else direction*(extent+.4+row*.8))) for row in range(4) for shift in [0,-.1,.1]]
        else:
            fanout_report.append(dict(port=pid,net=label(net),status='UNSUPPORTED_FANOUT_PAD'));continue
        for x,y in candidates:
            ix=round((x-x0)/step);iy=round((y-y0)/step)
            if 0<=ix<w and 0<=iy<h and allowed[iy,ix] and not blocked[sl,iy,ix]:goal[sl,iy,ix]=True
        sx=round((p['x']-x0)/step);sy=round((p['y']-y0)/step)
        if not goal.any() or blocked[sl,sy,sx]:fanout_report.append(dict(port=pid,net=label(net),status='NO_FREE_DOGBONE'));continue
        blocked.tofile(root/'blocked.bin');np.zeros((h,w),dtype=np.bool_).tofile(root/'via.bin');goal.tofile(root/'goal.bin')
        run=subprocess.run([str(root/'grid-path.executable'),str(w),str(h),str(sx),str(sy),str(sl),str(root/'blocked.bin'),str(root/'via.bin'),str(root/'goal.bin'),'3'],capture_output=True,text=True,check=True)
        if not run.stdout.startswith('PATH'):fanout_report.append(dict(port=pid,net=label(net),status=run.stdout.strip()));continue
        ids=list(map(int,run.stdout.splitlines()[1].split()));xy=[(x0+(k%w)*step,y0+((k%(w*h))//w)*step) for k in ids]
        compact=[xy[0]]
        for i in range(1,len(xy)-1):
            a,b,c=xy[i-1:i+2]
            if abs((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]))>1e-8:compact.append(b)
        compact.append(xy[-1]);xy=compact
        cs=connections[net];globals=[conn for conn in cs if conn['name'].startswith('source_net_')];owner=(globals or cs)[0]['name'];st_id=cs[0].get('source_trace_id')
        if globals:st_id=min((tid for tid,st in source_traces.items() if owner in st.get('connected_source_net_ids',[])),key=lambda tid:source_traces[tid].get('min_trace_thickness',.1016))
        tid=prefix+'_fanout_'+str(len(new_traces));route=[dict(route_type='wire',x=round(x,7),y=round(y,7),layer=layers[sl],width=wire_width) for x,y in xy]
        route[0]['start_pcb_port_id']=pid;x,y=xy[-1];to_layer=('bottom' if sl==0 else 'top') if usb else 'inner1'
        route.append(dict(route_type='via',x=round(x,7),y=round(y,7),from_layer=layers[sl],to_layer=to_layer,via_diameter=.4572,via_hole_diameter=.254))
        route.append(dict(route_type='wire',x=round(x,7),y=round(y,7),layer=to_layer,width=wire_width))
        new_traces.append(dict(type='pcb_trace',pcb_trace_id=tid,source_trace_id=st_id,connection_name=owner,route=route,subcircuit_id='subcircuit_source_group_0'))
        new_traces.append(dict(type='pcb_via',pcb_via_id=prefix+'_via_'+str(len(new_traces)),pcb_trace_id=tid,source_trace_id=st_id,x=round(x,7),y=round(y,7),outer_diameter=.4572,hole_diameter=.254,layers=layers,from_layer='top',to_layer='bottom',subcircuit_id='subcircuit_source_group_0'))
        for a,b in zip(xy,xy[1:]):
            o=dict(net=net,layers=[sl],shape=LineString([a,b]).buffer(wire_width/2,quad_segs=16),kind='wire',pid=None);objects.append(o);insert(o)
        o=dict(net=net,layers=list(range(4)),shape=circle(x,y,.4572/2),kind='via',pid=None);objects.append(o);insert(o)
        fanout_report.append(dict(port=pid,net=label(net),status='ESCAPED',via=[x,y]))
        if len(fanout_report)%20==0:
            print(json.dumps(dict(stage='package_fanout_progress',attempted=len(fanout_report),escaped=sum(r['status']=='ESCAPED' for r in fanout_report))),flush=True)
            save()
    (root/'fanouts.json').write_text(json.dumps(fanout_report,indent=2)+'\n');save()
    print(json.dumps(dict(stage='package_fanouts',escaped=sum(r['status']=='ESCAPED' for r in fanout_report),attempted=len(fanout_report))),flush=True)
if os.environ.get("G350_GRID_FANOUT_ONLY")=="1":order=[]
for net in order:
    if os.environ.get("G350_GRID_NET") and not set(os.environ["G350_GRID_NET"].split(","))&set(label(net).split(",")):continue
    if len(reports)>=int(sys.argv[5] if len(sys.argv)>5 else 999):break
    required={p['pcb_port_id'] for c in connections[net] for p in c['pointsToConnect']};width=widths[net]
    cs=connections[net];global_cs=[c for c in cs if c['name'].startswith('source_net_')];owner=(global_cs or cs)[0]['name']
    st_id=cs[0].get('source_trace_id')
    if global_cs:st_id=min((t for t,st in source_traces.items() if owner in st.get('connected_source_net_ids',[])),key=lambda t:source_traces[t].get('min_trace_thickness',.1016))
    restricted='XTAL_IN' in label(net) or 'XTAL_DRIVE' in label(net)
    usb='USB0_DP' in label(net) or 'USB0_DM' in label(net)
    failures=[];added=0
    for attempt in range(100):
        groups=components(net);groups=[g for g in groups if any(objects[i]['pid'] in required for i in g)]
        if len(groups)<=1:break
        main=groups[0];others=groups[1:];target=unary_union([objects[i]['shape'] for i in main])
        starts=sorted((objects[i]['pid'] for g in others for i in g if objects[i]['pid'] in required),key=lambda pid:Point(ports[pid]['x'],ports[pid]['y']).distance(target))
        goal=np.zeros((4,h,w),dtype=np.bool_)
        for i in main:
            o=objects[i]
            for layer in o['layers']:paint_block(goal[layer],o['shape'])
        active_raster=np.where(escape_mask[None,:,:],rasters[escape_widths[net]],rasters[width]) if can_neck[net] and not restricted and not usb else rasters[width]
        blocked=(active_raster!=0)&(active_raster!=net)
        if os.environ.get('G350_GRID_LOCAL_ESCAPES')=='1' and not restricted:
            # Reserve BGA surface channels for short pad-to-via escapes.
            # Long connections use other layers, preserving future access.
            access=np.zeros((h,w),dtype=np.bool_)
            for pid,p in ports.items():
                if port_net[pid]==net:paint_block(access,circle(p['x'],p['y'],.9))
            blocked[0]|=escape_mask&~access
        # Tracks must end at exact via centres, never at the edge of a land.
        for o in objects:
            if o['net']==net and o['kind']=='via':
                region=pixels(o['shape'].buffer(width/2+.001))
                if region is not None:
                    slices,mask=region
                    for layer in o['layers']:goal[layer][slices]&=~mask
        for i in main:
            o=objects[i]
            if o['kind']=='via':
                point=o['shape'].centroid;ix=round((point.x-x0)/step);iy=round((point.y-y0)/step)
                for layer in o['layers']:goal[layer,iy,ix]=True
        if restricted:blocked[1:]=True
        if usb:blocked[1:3]=True
        via=((~via_forbidden)&np.all((via_labels==0)|(via_labels==net),axis=0))|(existing_via==net)
        if restricted:via[:]=False
        goal&=~blocked
        blocked.tofile(root/'blocked.bin');via.tofile(root/'via.bin');goal.tofile(root/'goal.bin')
        path=None;start_pid=None
        start_options=[]
        for group in others:
            for i in group:
                o=objects[i]
                if o['kind'] in ('wire','via'):
                    point=o['shape'].centroid
                    for layer in sorted(o['layers'],key=lambda l:l not in (1,2)):
                        start_options.append((point.distance(target),point.x,point.y,layer,'existing_copper'))
        for pid in starts:
            p=ports[pid];start_options.append((Point(p['x'],p['y']).distance(target),p['x'],p['y'],layers.index(p['layers'][0]),pid))
        options=[];seen_options=set()
        for _,x,y,sl,pid in sorted(start_options):
            sx=round((x-x0)/step);sy=round((y-y0)/step)
            if (sx,sy,sl) in seen_options or blocked[sl,sy,sx]:continue
            if pid=='existing_copper' and any(o['net']==net and o['kind']=='via' and o['shape'].buffer(width/2+.001).covers(Point(x,y)) for o in objects) and existing_via[sy,sx]!=net:continue
            seen_options.add((sx,sy,sl));options.append((sx,sy,sl,pid))
        if options:
            sx,sy,sl,pid=options[0]
            starts_arg=','.join(str(sl*w*h+sy*w+sx) for sx,sy,sl,pid in options)
            command=[str(root/'grid-path.executable'),str(w),str(h),str(sx),str(sy),str(sl),str(root/'blocked.bin'),str(root/'via.bin'),str(root/'goal.bin'),os.environ.get('G350_GRID_SEARCH_SECONDS','15'),starts_arg,'1' if net in ddr_nets else '0']
            if os.environ.get('G350_GRID_VIA_COST'):command+=['-',os.environ['G350_GRID_VIA_COST']]
            run=subprocess.run(command,capture_output=True,text=True,check=True)
            if run.stdout.startswith('PATH'):
                ids=list(map(int,run.stdout.splitlines()[1].split()));path=[(k//(w*h),x0+(k%w)*step,y0+((k%(w*h))//w)*step) for k in ids];start_pid=pid
        if path is None:
            if os.environ.get('G350_GRID_DIAGNOSTICS'):
                np.savez_compressed(root/'failed-net.npz',blocked=blocked,via=via,goal=goal,options=np.array(options,dtype=object))
            failures.append(dict(reason='No legal grid access/path for remaining pad group',freeStartOptions=len(options),padStarts=len(starts),search=run.stdout.strip() if options else 'No starts'));break
        for index,(layer,x,y) in enumerate(path):
            iy=round((y-y0)/step);ix=round((x-x0)/step)
            if existing_via[iy,ix]==net and (index in (0,len(path)-1) or (index and path[index-1][0]!=layer) or (index+1<len(path) and path[index+1][0]!=layer)):
                xx,yy,_=via_centres[iy,ix];path[index]=(layer,xx,yy)
        def local_width(point):
            return escape_widths[net] if can_neck[net] and not restricted and not usb and escape_region.covers(Point(point[1],point[2])) else width
        compact=[path[0]]
        for i in range(1,len(path)-1):
            a,b,c=path[i-1:i+2]
            if a[0]!=b[0] or b[0]!=c[0] or local_width(a)!=local_width(b) or local_width(b)!=local_width(c) or abs((b[1]-a[1])*(c[2]-b[2])-(b[2]-a[2])*(c[1]-b[1]))>1e-8:compact.append(b)
        compact.append(path[-1]);path=compact
        foreign_trees=[STRtree([o['shape'] for o in objects if o['net']!=net and o['kind']!='zone' and layer in o['layers']]) for layer in range(4)]
        route=[];planned=[];valid=True
        for a,b in zip(path,path[1:]):
            if a[0]==b[0]:
                shape=LineString([(a[1],a[2]),(b[1],b[2])]).buffer(max(local_width(a),local_width(b))/2+.0005,quad_segs=16)
                if len(foreign_trees[a[0]].query(shape.buffer(.1016),predicate='intersects')):valid=False;break
                planned.append(dict(net=net,layers=[a[0]],shape=shape.buffer(-.0005),kind='wire',pid=None))
            elif existing_via[round((a[2]-y0)/step),round((a[1]-x0)/step)]!=net:
                planned.append(dict(net=net,layers=list(range(4)),shape=circle(a[1],a[2],.4572/2),kind='via',pid=None))
        if restricted:
            proposed=sum(math.hypot(b[1]-a[1],b[2]-a[2]) for a,b in zip(path,path[1:]) if a[0]==b[0])
            existing=sum(math.hypot(b['x']-a['x'],b['y']-a['y']) for t in circuit+new_traces if t['type']=='pcb_trace' and trace_net[t['source_trace_id']]==net for a,b in zip(t['route'],t['route'][1:]) if a['route_type']==b['route_type']=='wire' and a['layer']==b['layer'])
            if proposed+existing>10:
                failures.append(dict(reason='Declared clock length limit',existingMm=existing,proposedMm=proposed,limitMm=10));valid=False
        if not valid:failures.append('Grid path failed continuous clearance/length validation');break
        # Remove only collinear grid vertices; preserve every real layer change.
        keep=[path[0]]
        for i in range(1,len(path)-1):
            a,b,c=path[i-1:i+2]
            if a[0]!=b[0] or b[0]!=c[0] or local_width(a)!=local_width(b) or local_width(b)!=local_width(c) or abs((b[1]-a[1])*(c[2]-b[2])-(b[2]-a[2])*(c[1]-b[1]))>1e-8:keep.append(b)
        keep.append(path[-1])
        for i,p in enumerate(keep):
            layer,x,y=p
            if i and keep[i-1][0]!=layer:
                prev=keep[i-1]
                if existing_via[round((y-y0)/step),round((x-x0)/step)]!=net:
                    route.append(dict(route_type='via',x=round(x,7),y=round(y,7),from_layer=layers[prev[0]],to_layer=layers[layer],layers=layers,via_diameter=.4572,via_hole_diameter=.254))
            route.append(dict(route_type='wire',x=round(x,7),y=round(y,7),layer=layers[layer],width=local_width(p)))
        tid=prefix+'_trace_'+str(len(new_traces));new_traces.append(dict(type='pcb_trace',pcb_trace_id=tid,source_trace_id=st_id,connection_name=owner,route=route,subcircuit_id='subcircuit_source_group_0'))
        for p in route:
            if p['route_type']=='via':new_traces.append(dict(type='pcb_via',pcb_via_id=prefix+'_via_'+str(len(new_traces)),pcb_trace_id=tid,source_trace_id=st_id,x=p['x'],y=p['y'],outer_diameter=.4572,hole_diameter=.254,layers=layers,from_layer='top',to_layer='bottom',subcircuit_id='subcircuit_source_group_0'))
        for o in planned:objects.append(o);insert(o)
        added+=1
        save()
        print(json.dumps(dict(stage='net_join',net=label(net),addedPaths=added,previousPadGroups=len(groups),seconds=time.monotonic()-begun)),flush=True)
    groups=components(net);pad_groups=[g for g in groups if any(objects[i]['pid'] in required for i in g)]
    report=dict(net=label(net),requiredPads=len(required),padGroups=len(pad_groups),addedPaths=added,failures=failures);reports.append(report);save();print(json.dumps(report),flush=True)
save()
