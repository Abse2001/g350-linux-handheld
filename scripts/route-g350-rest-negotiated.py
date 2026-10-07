"""Candidate-only routing with reversible rip-up. No check is waived."""
import os,sys,json,math,time,runpy,shutil,itertools
from pathlib import Path
from collections import defaultdict
import numpy as np
source,srj,ground,root=map(Path,sys.argv[1:5]);assert not root.exists();root.mkdir()
initial_argv=sys.argv[:]
os.environ['G350_GRID_NET']='__INITIALIZE_ONLY__';os.environ['G350_GRID_PRE_FANOUT']='0'
sys.argv=['scripts/route-g350-rest-grid.py',str(source),str(srj),str(ground),str(root/'geometry')]
g=runpy.run_path('scripts/route-g350-rest-grid.py');sys.argv=initial_argv
shutil.copy2('.cloud-tools/g350-grid-negotiated-path',root/'search.executable');shutil.copyfile(__file__,root/'worker.executed.py');shutil.copyfile('scripts/g350-grid-path.cpp',root/'worker.executed.cpp')
(root/'execution.json').write_text(json.dumps(dict(source=str(source),sourceSha256=g['sha'](source),solverInputSha256=g['sha'](srj),groundSha256=g['sha'](ground),searchSha256=g['sha'](root/'search.executable'),workerSha256=g['sha'](__file__),routingParameters={key:os.environ.get(key) for key in ['G350_GRID_STEP','G350_GRID_SEARCH_SECONDS','G350_GRID_PRESERVE_SEED','G350_GRID_GROUND_STITCH_WIDTH','G350_NEGOTIATED_ATTEMPTS','G350_NEGOTIATED_CLEAR_VIAS','G350_NEGOTIATED_POWER_FIRST','G350_NEGOTIATED_PROTECT_DDR','G350_NEGOTIATED_GROUND_FIRST','G350_NEGOTIATED_PROTECT_GROUND_AFTER','G350_NEGOTIATED_NETS','G350_NEGOTIATED_RESUME','G350_NEGOTIATED_RESUME_ALL']},fabricationReady=False),indent=2)+'\n')
objects=g['objects'];ports=g['ports'];connections=g['connections'];source_traces=g['source_traces'];widths=g['widths'];layers=g['layers'];root_objects=len(objects)
w,h,step,x0,y0=[g[k] for k in ['w','h','step','x0','y0']]
Point,LineString,STRtree,unary_union=[g[k] for k in ['Point','LineString','STRtree','unary_union']]
circle,paint_block,components=[g[k] for k in ['circle','paint_block','components']]
netlabel=g['label'];ground_net=g['ground_net'];ddr_nets=g['ddr_nets'];trace_net=g['trace_net']
extra=[];mutable_ids=set();serial=itertools.count();history=np.zeros((4,h,w),dtype=np.uint8);events=[];begun=time.monotonic()
if os.environ.get('G350_NEGOTIATED_RESUME'):
    resume_path=Path(os.environ['G350_NEGOTIATED_RESUME']);resume=json.loads(resume_path.read_text())
    fixed_trace_ids={e['pcb_trace_id'] for e in g['circuit'] if e['type']=='pcb_trace'}
    candidates={e['pcb_trace_id']:e for e in resume if e['type']=='pcb_trace' and e['pcb_trace_id'] not in fixed_trace_ids and (os.environ.get('G350_NEGOTIATED_RESUME_ALL')=='1' or 'negotiated' in e['pcb_trace_id'] or e['pcb_trace_id'].startswith('g350_full_ddr_')) and 'XTAL' not in netlabel(trace_net[e['source_trace_id']])}
    resumed_objects=[];rejected=set()
    fixed=[o for o in objects if o['kind']!='zone'];trees=[STRtree([o['shape'] for o in fixed if layer in o['layers']]) for layer in range(4)];layer_objects=[[o for o in fixed if layer in o['layers']] for layer in range(4)]
    for tid,t in candidates.items():
        net=trace_net[t['source_trace_id']]
        for a,b in zip(t['route'],t['route'][1:]):
            if a['route_type']==b['route_type']=='wire' and a['layer']==b['layer'] and (a['x'],a['y'])!=(b['x'],b['y']):
                layer=layers.index(a['layer']);shape=LineString([(a['x'],a['y']),(b['x'],b['y'])]).buffer(a['width']/2,quad_segs=16)
                if any(layer_objects[layer][int(i)]['net']!=net for i in trees[layer].query(shape.buffer(.1016+.0005),predicate='intersects')):rejected.add(tid)
                resumed_objects.append(dict(net=net,layers=[layer],shape=shape,kind='wire',pid=None,mutable=True,trace_id=tid))
    resumed_vias=[]
    for e in resume:
        if e['type']!='pcb_via' or e.get('pcb_trace_id') not in candidates:continue
        tid=e['pcb_trace_id'];net=trace_net[candidates[tid]['source_trace_id']];shape=circle(e['x'],e['y'],.4572/2)
        coincident=any(o['kind']=='via' and o['net']==net and shape.centroid.distance(o['shape'].centroid)<1e-7 for o in fixed)
        if coincident:continue
        for o in fixed:
            if o['net']!=net and shape.distance(o['shape'])<(.15 if o['kind']=='via' else .1016)+.0005:rejected.add(tid)
            if o['kind']=='via' and shape.centroid.distance(o['shape'].centroid)<.508+.001:rejected.add(tid)
        resumed_vias.append(e);resumed_objects.append(dict(net=net,layers=list(range(4)),shape=shape,kind='via',pid=None,mutable=True,trace_id=tid))
    extra.extend(t for tid,t in candidates.items() if tid not in rejected);extra.extend(v for v in resumed_vias if v['pcb_trace_id'] not in rejected)
    objects.extend(o for o in resumed_objects if o['trace_id'] not in rejected);mutable_ids.update(tid for tid in candidates if tid not in rejected)
    (root/'resume.json').write_text(json.dumps(dict(source=str(resume_path),sourceSha256=g['sha'](resume_path),consideredTraces=len(candidates),retainedTraces=len(candidates)-len(rejected),removedConflictingTraces=sorted(rejected),fabricationReady=False),indent=2)+'\n')
def save():
    for name,contents in [('candidate.circuit.json',g['circuit']+extra),('progress.json',dict(seconds=time.monotonic()-begun,attempts=len(events),events=events,newRecords=len(extra),fabricationReady=False))]:
        temporary=root/(name+'.tmp');temporary.write_text(json.dumps(contents,indent=2)+'\n');temporary.replace(root/name)
def goal_for(main,net,width):
    goal=np.zeros((4,h,w),dtype=np.bool_)
    for i in main:
        o=objects[i]
        for layer in o['layers']:paint_block(goal[layer],o['shape'])
    centres={}
    for o in objects:
        if o['kind']!='via':continue
        p=o['shape'].centroid;ix=round((p.x-x0)/step);iy=round((p.y-y0)/step)
        if o['net']==net:
            centres[iy,ix]=(p.x,p.y)
            region=g['pixels'](o['shape'].buffer(width/2+.001))
            if region:
                sl,mask=region
                for layer in o['layers']:goal[layer][sl]&=~mask
    for i in main:
        o=objects[i]
        if o['kind']=='via':
            p=o['shape'].centroid;ix=round((p.x-x0)/step);iy=round((p.y-y0)/step)
            for layer in o['layers']:goal[layer,iy,ix]=True
    return goal,centres
pending=list(g['order']);failed=set();last_changes=0;rounds=0
if os.environ.get('G350_NEGOTIATED_ONLY_OPEN')=='1':
    def is_open(net):
        required={p['pcb_port_id'] for c in connections[net] for p in c['pointsToConnect']}
        return sum(any(objects[i]['pid'] in required for i in ids) for ids in components(net))>1
    pending=[net for net in pending if is_open(net)]
if os.environ.get('G350_NEGOTIATED_NETS'):
    selected=set(os.environ['G350_NEGOTIATED_NETS'].split(','))
    pending=[net for net in pending if selected & set(netlabel(net).split(','))]
if os.environ.get('G350_NEGOTIATED_GROUND_FIRST')=='1':pending.sort(key=lambda n:n!=ground_net)
if os.environ.get('G350_NEGOTIATED_POWER_FIRST')=='1':
    pending.sort(key=lambda n:(n==ground_net,0 if widths[n]>.15 else (1 if n in ddr_nets else 2),-len({p['pcb_port_id'] for c in connections[n] for p in c['pointsToConnect']})))
if os.environ.get('G350_NEGOTIATED_DDR_FIRST')=='1':pending.sort(key=lambda n:n not in ddr_nets)
max_attempts=int(os.environ.get('G350_NEGOTIATED_ATTEMPTS','600'))
manifest=json.loads((root/'execution.json').read_text())
for key in ['G350_NEGOTIATED_ONLY_OPEN','G350_NEGOTIATED_KEEP_VIAS','G350_NEGOTIATED_LOCAL_RIP','G350_NEGOTIATED_DDR_FIRST','G350_GRID_VIA_COST','G350_GRID_ESCAPE_MARGIN']:
    manifest['routingParameters'][key]=os.environ.get(key)
(root/'execution.json').write_text(json.dumps(manifest,indent=2)+'\n')
while pending and len(events)<max_attempts:
    net=pending.pop(0);required={p['pcb_port_id'] for c in connections[net] for p in c['pointsToConnect']}
    cs=connections[net];global_cs=[c for c in cs if c['name'].startswith('source_net_')];owner=(global_cs or cs)[0]['name'];st_id=cs[0].get('source_trace_id')
    if global_cs:st_id=min((t for t,st in source_traces.items() if owner in st.get('connected_source_net_ids',[])),key=lambda t:source_traces[t].get('min_trace_thickness',.1016))
    width=widths[net];restricted='XTAL_IN' in netlabel(net) or 'XTAL_DRIVE' in netlabel(net);usb='USB0_DP' in netlabel(net) or 'USB0_DM' in netlabel(net)
    ripups=set();added=0;reason=None
    rejected_access=np.zeros((4,h,w),dtype=np.bool_);clearance_retries=0
    for iteration in range(150):
        groups=[ids for ids in components(net) if any(objects[i]['pid'] in required for i in ids)]
        if len(groups)<=1:break
        main,others=groups[0],groups[1:];target=unary_union([objects[i]['shape'] for i in main]);goal,centres=goal_for(main,net,width)
        active=np.where(g['escape_mask'][None,:,:],g['rasters'][g['escape_widths'][net]],g['rasters'][width]) if g['can_neck'][net] and not restricted and not usb else g['rasters'][width]
        blocked=((active!=0)&(active!=net))|rejected_access
        if os.environ.get('G350_NEGOTIATED_KEEP_VIAS')=='1':
            for o in objects:
                if not o.get('mutable') or o['net']==net or o['kind']!='via':continue
                for clearance_width,inside in [(width,False),(g['escape_widths'][net],True)] if g['can_neck'][net] and not restricted and not usb else [(width,None)]:
                    region=g['pixels'](o['shape'].buffer(.1016+clearance_width/2+.001))
                    if region:
                        slices,mask=region
                        if inside is not None:mask=mask & (g['escape_mask'][slices] if inside else ~g['escape_mask'][slices])
                        for layer in o['layers']:blocked[layer][slices]|=mask
        if os.environ.get('G350_NEGOTIATED_PROTECT_DDR')=='1' and net not in ddr_nets:
            for o in objects:
                if o.get('mutable') and o['net'] in ddr_nets:
                    region=g['pixels'](o['shape'].buffer(.1016+width/2+.001))
                    if region:
                        slices,mask=region
                        for layer in o['layers']:blocked[layer][slices]|=mask
        if restricted:blocked[1:]=True
        if usb:blocked[1:3]=True
        goal&=~blocked
        via=(~g['via_forbidden'])&np.all((g['via_labels']==0)|(g['via_labels']==net),axis=0)
        own_holes=np.zeros((h,w),dtype=np.bool_)
        for o in objects:
            if o.get('mutable') and o['net']==net and o['kind']=='via':paint_block(own_holes,o['shape'].buffer(.508-.4572/2+.001))
        via&=~own_holes
        # A through-via occupies all four layers. Wire-step penalties do not
        # price its full land/drill footprint, so keep new via sites clear of
        # existing mutable copper rather than repeatedly ripping up four nets.
        if os.environ.get('G350_NEGOTIATED_CLEAR_VIAS')=='1':
            foreign_via_footprints=np.zeros((h,w),dtype=np.bool_)
            for o in objects:
                if o.get('mutable') and o['net']!=net:
                    clearance=.15 if o['kind']=='via' else .1016
                    paint_block(foreign_via_footprints,o['shape'].buffer(clearance+.4572/2+.001))
            via&=~foreign_via_footprints
        for (iy,ix) in centres:via[iy,ix]=True
        if restricted:via[:]=False
        penalty=history.copy()
        for o in objects:
            if not o.get('mutable') or o['net']==net:continue
            region=g['pixels'](o['shape'].buffer(.1016+width/2+.001))
            if region is None:continue
            slices,mask=region
            for layer in o['layers']:
                view=penalty[layer][slices];view[mask]=np.minimum(240,view[mask].astype(np.uint16)+100).astype(np.uint8)
        opts=[];seen=set()
        for group in others:
            for i in group:
                o=objects[i]
                if o['kind']=='pad' and o['pid'] in required:
                    p=ports[o['pid']];x,y=p['x'],p['y'];pls=o['layers']
                elif o['kind'] in ('wire','via'):
                    p=o['shape'].centroid;x,y=p.x,p.y;pls=o['layers']
                else:continue
                for layer in pls:
                    ix=round((x-x0)/step);iy=round((y-y0)/step)
                    if (ix,iy,layer) in seen or blocked[layer,iy,ix]:continue
                    if o['kind']=='wire' and any(v['kind']=='via' and v['net']==net and v['shape'].buffer(width/2+.001).covers(Point(x,y)) for v in objects) and (iy,ix) not in centres:continue
                    seen.add((ix,iy,layer));opts.append((Point(x,y).distance(target),ix,iy,layer))
        if not opts:reason='No legal access to remaining component';break
        opts.sort();_,sx,sy,sl=opts[0]
        for filename,array in [('blocked.bin',blocked),('via.bin',via),('goal.bin',goal),('penalty.bin',penalty)]:array.tofile(root/filename)
        starts=','.join(str(layer*w*h+iy*w+ix) for _,ix,iy,layer in opts)
        run=__import__('subprocess').run([str(root/'search.executable'),str(w),str(h),str(sx),str(sy),str(sl),str(root/'blocked.bin'),str(root/'via.bin'),str(root/'goal.bin'),os.environ.get('G350_GRID_SEARCH_SECONDS','15'),starts,'1' if net in ddr_nets else '0',str(root/'penalty.bin'),os.environ.get('G350_GRID_VIA_COST','30')],capture_output=True,text=True,check=True)
        if not run.stdout.startswith('PATH'):
            reason=run.stdout.strip()
            diagnostic=root/('failed-access-'+str(net)+'-'+str(len(events))+'.npz')
            np.savez_compressed(diagnostic,blocked=blocked,via=via,goal=goal,starts=np.array([(ix,iy,layer) for _,ix,iy,layer in opts]),width=width,escapeWidth=g['escape_widths'][net],canNeck=g['can_neck'][net])
            print(json.dumps(dict(stage='failed_access_saved',net=netlabel(net),file=str(diagnostic),reason=reason,width=width,escapeWidth=g['escape_widths'][net],canNeck=g['can_neck'][net])),flush=True)
            break
        ids=list(map(int,run.stdout.splitlines()[1].split()));path=[(k//(w*h),x0+(k%w)*step,y0+((k%(w*h))//w)*step) for k in ids]
        for i,(layer,x,y) in enumerate(path):
            key=(round((y-y0)/step),round((x-x0)/step))
            if key in centres and (i in (0,len(path)-1) or (i and path[i-1][0]!=layer) or (i+1<len(path) and path[i+1][0]!=layer)):
                x,y=centres[key];path[i]=(layer,x,y)
        def local_width(p):return g['escape_widths'][net] if g['can_neck'][net] and not restricted and not usb and g['escape_region'].covers(Point(p[1],p[2])) else width
        compact=[path[0]]
        for i in range(1,len(path)-1):
            a,b,c=path[i-1:i+2]
            if a[0]!=b[0] or b[0]!=c[0] or local_width(a)!=local_width(b) or local_width(b)!=local_width(c) or abs((b[1]-a[1])*(c[2]-b[2])-(b[2]-a[2])*(c[1]-b[1]))>1e-8:compact.append(b)
        compact.append(path[-1]);path=compact
        proposed=sum(math.hypot(b[1]-a[1],b[2]-a[2]) for a,b in zip(path,path[1:]) if a[0]==b[0])
        existing=sum(math.hypot(b['x']-a['x'],b['y']-a['y']) for t in g['circuit']+extra if t['type']=='pcb_trace' and trace_net[t['source_trace_id']]==net for a,b in zip(t['route'],t['route'][1:]) if a['route_type']==b['route_type']=='wire' and a['layer']==b['layer'])
        if restricted and proposed+existing>10:reason='Crystal network would exceed 10 mm';break
        planned=[];route=[];conflicts=set();valid=True
        fixed=[o for o in objects if o['net']!=net and not o.get('mutable') and o['kind']!='zone'];mutables=[o for o in objects if o['net']!=net and o.get('mutable')]
        fixed_by_layer=[[o for o in fixed if layer in o['layers']] for layer in range(4)];mutable_by_layer=[[o for o in mutables if layer in o['layers']] for layer in range(4)]
        ft=[STRtree([o['shape'] for o in os]) for os in fixed_by_layer];mt=[STRtree([o['shape'] for o in os]) for os in mutable_by_layer]
        tid=root.name.replace('-','_')+'_trace_'+str(next(serial))
        for a,b in zip(path,path[1:]):
            if a[0]==b[0]:
                width_segment=max(local_width(a),local_width(b));shape=LineString([(a[1],a[2]),(b[1],b[2])]).buffer(width_segment/2,quad_segs=16)
                blockers=ft[a[0]].query(shape.buffer(.1016+.0005),predicate='intersects')
                if len(blockers):
                    valid=False
                    for index in blockers:
                        obstacle=fixed_by_layer[a[0]][int(index)]
                        # Reject grid access near the actual failed continuous
                        # segment, retaining the original clearance and width.
                        region=g['pixels'](obstacle['shape'].buffer(.1016+width_segment/2+step*.75).intersection(LineString([(a[1],a[2]),(b[1],b[2])]).buffer(step*2)))
                        if region:
                            slices,mask=region;rejected_access[a[0]][slices]|=mask
                        print(json.dumps(dict(stage='continuous_clearance_reject',net=netlabel(net),layer=layers[a[0]],segment=[a,b],width=width_segment,obstacleKind=obstacle['kind'],obstaclePort=obstacle.get('pid'),obstacleNet=netlabel(obstacle['net']) if obstacle['net'] in connections else str(obstacle['net']),obstacleBounds=obstacle['shape'].bounds)),flush=True)
                    break
                for i in mt[a[0]].query(shape.buffer(.1016+.0005),predicate='intersects'):conflicts.add(mutable_by_layer[a[0]][int(i)]['trace_id'])
                planned.append(dict(net=net,layers=[a[0]],shape=shape,kind='wire',pid=None,mutable=True,trace_id=tid))
                aa=dict(route_type='wire',x=round(a[1],7),y=round(a[2],7),layer=layers[a[0]],width=width_segment);bb=dict(route_type='wire',x=round(b[1],7),y=round(b[2],7),layer=layers[b[0]],width=width_segment)
                if not route or route[-1]!=aa:route.append(aa)
                route.append(bb)
            else:
                key=round((a[2]-y0)/step),round((a[1]-x0)/step)
                if key not in centres:
                    shape=circle(a[1],a[2],.4572/2)
                    for o in fixed:
                        clearance=.15 if o['kind']=='via' else .1016
                        if shape.distance(o['shape'])<clearance-1e-7:valid=False;break
                    if not valid:break
                    for o in mutables:
                        if shape.distance(o['shape'])<(.15 if o['kind']=='via' else .1016)+.0005:conflicts.add(o['trace_id'])
                    planned.append(dict(net=net,layers=list(range(4)),shape=shape,kind='via',pid=None,mutable=True,trace_id=tid))
                    route.append(dict(route_type='via',x=round(a[1],7),y=round(a[2],7),from_layer=layers[a[0]],to_layer=layers[b[0]],via_diameter=.4572,via_hole_diameter=.254))
                route.append(dict(route_type='wire',x=round(b[1],7),y=round(b[2],7),layer=layers[b[0]],width=local_width(b)))
        if not valid:
            clearance_retries+=1
            if clearance_retries<=20 and np.any(rejected_access):continue
            reason='Continuous fixed-copper clearance failed';break
        if conflicts:
            doomed=conflicts
            affected={o['net'] for o in objects if o.get('trace_id') in doomed}
            retained=[];retained_objects=[];retained_ids=set()
            if os.environ.get('G350_NEGOTIATED_LOCAL_RIP')=='1':
                for old in [e for e in extra if e['type']=='pcb_trace' and e['pcb_trace_id'] in doomed]:
                    oldnet=trace_net[old['source_trace_id']];route_old=old['route'];cuts=set()
                    oldvias=[v for v in extra if v['type']=='pcb_via' and v.get('pcb_trace_id')==old['pcb_trace_id']]
                    # Via preservation is a prerequisite for local wire repairs.
                    assert os.environ.get('G350_NEGOTIATED_KEEP_VIAS')=='1'
                    assert all(circle(v['x'],v['y'],.4572/2).distance(o['shape'])>=.1016-.000001 for v in oldvias for o in planned)
                    for j,(a,b) in enumerate(zip(route_old,route_old[1:])):
                        if a['route_type']!=b['route_type'] or a['route_type']!='wire' or a['layer']!=b['layer'] or (a['x'],a['y'])==(b['x'],b['y']):continue
                        shape=LineString([(a['x'],a['y']),(b['x'],b['y'])]).buffer(a['width']/2,quad_segs=16)
                        if any(layers.index(a['layer']) in o['layers'] and shape.distance(o['shape'])<.1016+.0005 for o in planned):cuts.add(j)
                    assert cuts,'Conflict must identify actual wire sections'
                    starts=[0]+[j+1 for j in sorted(cuts)];ends=sorted(cuts)+[len(route_old)-1]
                    via_owner={}
                    for first,last in zip(starts,ends):
                        piece=route_old[first:last+1]
                        if len(piece)<2:continue
                        tid_new=old['pcb_trace_id']+'_local_'+str(next(serial));retained_ids.add(tid_new)
                        retained.append({**old,'pcb_trace_id':tid_new,'route':piece})
                        for a,b in zip(piece,piece[1:]):
                            if a['route_type']==b['route_type']=='wire' and a['layer']==b['layer'] and (a['x'],a['y'])!=(b['x'],b['y']):
                                retained_objects.append(dict(net=oldnet,layers=[layers.index(a['layer'])],shape=LineString([(a['x'],a['y']),(b['x'],b['y'])]).buffer(a['width']/2,quad_segs=16),kind='wire',pid=None,mutable=True,trace_id=tid_new))
                        for p in piece:
                            if p['route_type']=='via':via_owner[p['x'],p['y']]=tid_new
                    for v in oldvias:
                        owner_via=via_owner.get((v['x'],v['y']))
                        if owner_via is None:
                            # Preserve the full-depth land as an explicit same-net
                            # contact even when both adjoining wires were trimmed.
                            owner_via=old['pcb_trace_id']+'_local_'+str(next(serial));retained_ids.add(owner_via)
                            retained.append({**old,'pcb_trace_id':owner_via,'route':[dict(route_type='wire',x=v['x'],y=v['y'],layer=layers[0],width=.1016),dict(route_type='via',x=v['x'],y=v['y'],from_layer=layers[0],to_layer=layers[3],via_diameter=.4572,via_hole_diameter=.254),dict(route_type='wire',x=v['x'],y=v['y'],layer=layers[3],width=.1016)]})
                        retained.append({**v,'pcb_trace_id':owner_via})
                        retained_objects.append(dict(net=oldnet,layers=list(range(4)),shape=circle(v['x'],v['y'],.4572/2),kind='via',pid=None,mutable=True,trace_id=owner_via))
            objects[:]=[o for o in objects if o.get('trace_id') not in doomed]
            extra[:]=[e for e in extra if (e.get('pcb_trace_id') if e['type']=='pcb_via' else e['pcb_trace_id']) not in doomed]
            objects.extend(retained_objects);extra.extend(retained);mutable_ids.update(retained_ids)
            mutable_ids-=doomed;ripups|=affected
            for victim in affected:
                if victim not in pending:pending.append(victim)
            for o in planned:
                for layer in o['layers']:
                    region=g['pixels'](o['shape'].buffer(.1016+width/2))
                    if region is None:continue
                    slices,mask=region;view=history[layer][slices];view[mask]=np.minimum(160,view[mask].astype(np.uint16)+8).astype(np.uint8)
        mutable_ids.add(tid);objects.extend(planned)
        extra.append(dict(type='pcb_trace',pcb_trace_id=tid,source_trace_id=st_id,connection_name=owner,route=route,subcircuit_id='subcircuit_source_group_0'))
        for p in route:
            if p['route_type']=='via':extra.append(dict(type='pcb_via',pcb_via_id=root.name.replace('-','_')+'_via_'+str(next(serial)),pcb_trace_id=tid,source_trace_id=st_id,x=p['x'],y=p['y'],outer_diameter=.4572,hole_diameter=.254,layers=layers,from_layer='top',to_layer='bottom',subcircuit_id='subcircuit_source_group_0'))
        added+=1
        save()
        print(json.dumps(dict(stage='net_join',net=netlabel(net),added=added,previousPadGroups=len(groups),seconds=time.monotonic()-begun)),flush=True)
    groups=[ids for ids in components(net) if any(objects[i]['pid'] in required for i in ids)];complete=len(groups)<=1
    if complete:failed.discard(net)
    else:failed.add(net)
    if complete and net==ground_net and os.environ.get('G350_NEGOTIATED_PROTECT_GROUND_AFTER')=='1':
        # Preserve newly connected ground escapes while other nets recover.
        # Paint them into the same hard-clearance model as the fixed seed.
        for o in objects:
            if o['net']==ground_net and o.get('mutable'):
                o['mutable']=False;g['insert'](o)
    event=dict(net=netlabel(net),complete=complete,padGroups=len(groups),added=added,rippedNets=[netlabel(n) for n in sorted(ripups)],reason=reason,pending=len(pending));events.append(event);save();print(json.dumps(event),flush=True)
    if not pending and failed and rounds<3:
        rounds+=1;pending=list(failed);failed.clear()
final=[]
for net in connections:
    required={p['pcb_port_id'] for c in connections[net] for p in c['pointsToConnect']};groups=[ids for ids in components(net) if any(objects[i]['pid'] in required for i in ids)];final.append(dict(net=netlabel(net),requiredPads=len(required),padGroups=len(groups)))
(root/'final-connectivity-model.json').write_text(json.dumps(dict(nets=final,complete=sum(n['padGroups']==1 for n in final),total=len(final),requiresIndependentVerification=True,fabricationReady=False),indent=2)+'\n');save()
