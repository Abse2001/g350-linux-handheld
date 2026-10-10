import assert from 'node:assert/strict'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './g350-ddr-physical-checks.mjs'
import {createG350LocalGuard} from './g350-ddr-local-guard.mjs'
import {g350BgaEscapeRegions,g350AvoidsEscapeRegions} from './g350-ddr-bga-escape-regions.mjs'
export const ddrRouteLength=r=>r.slice(1).reduce((n,p,i)=>n+(p.route_type==='via'?1.6:0)+(p.route_type==='wire'&&r[i].route_type==='wire'&&p.layer===r[i].layer?Math.hypot(p.x-r[i].x,p.y-r[i].y):0),0)

export function tuneOneG350DdrTrace(circuit,trace,goalLength,seconds=10,{protectEscapeRegions=false,planningValidator=null,allowNewVias=true,proposalLayersOverride=null}={}){
 assert(planningValidator===null||typeof planningValidator==='function')
 assert.equal(typeof allowNewVias,'boolean')
 assert(proposalLayersOverride===null||Array.isArray(proposalLayersOverride))
 const proposalLayers=proposalLayersOverride??process.env.G350_LENGTH_SIGNAL_LAYERS?.split(',')??['top','inner1','inner2','bottom']
 assert(proposalLayers.length&&new Set(proposalLayers).size===proposalLayers.length&&proposalLayers.every(l=>['top','inner1','inner2','bottom'].includes(l)))
 const windowOrder=process.env.G350_LENGTH_WINDOW_ORDER??'forward'
 assert(['forward','reverse'].includes(windowOrder),'Window order must be forward or reverse')
 const windowIndices=(start,end)=>Array.from({length:Math.max(0,end-start)},(_,i)=>windowOrder==='reverse'?end-i-1:start+i)
 const parent=new Map(); const find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)};
 for(const s of circuit.filter(e=>e.type==='source_trace'))for(const member of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(member));
 const manufacturing=()=>checkG350ViaTrackManufacturingClearance(circuit.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e));
 // Reject electrical bypasses first; an accepted candidate still runs every
 // unchanged full-board physical/manufacturing check below.
 // A caller may use an incremental validator for unqualified planning. Such
 // callers must validate the complete board before retaining each batch and
 // before any source/export promotion. Existing callers keep full checks.
 const passesPhysical=()=>planningValidator?planningValidator(circuit,trace):!checks.checkPcbTraceSelfShorts(circuit).length&&!manufacturing().length&&g350DdrPhysicalChecks.every(n=>checks[n](circuit).length===0)
 const escapeRegions=protectEscapeRegions?g350BgaEscapeRegions(circuit):[]
 const simplifySeconds=Number(process.env.G350_LENGTH_SIMPLIFY_SECONDS??seconds*.35);assert(Number.isFinite(simplifySeconds)&&simplifySeconds>=0&&simplifySeconds<=seconds);
 const simplifyDeadline=Date.now()+simplifySeconds*1000
 // Grid staircases can hide a long clear corridor behind many sub-millimetre
 // pieces. Replace only shortcuts that pass the unchanged complete checks.
 const simplifyGuard=createG350LocalGuard(circuit,trace)
 let simplified=0,shortcutProbes=0
 for(let i=0;i<trace.route.length-3&&simplified<12&&Date.now()<simplifyDeadline;i++){
  const r=trace.route,a=r[i];if(a.route_type!=='wire'||!proposalLayers.includes(a.layer))continue
  let end=i+1;while(end<r.length&&r[end].route_type==='wire'&&r[end].layer===a.layer)end++
  for(let j=end-1;j>=i+3;j--){
   if(Date.now()>simplifyDeadline||shortcutProbes>=200)break
   const b=r[j];if(Math.hypot(a.x-b.x,a.y-b.y)<1||!simplifyGuard([a,b]))continue
   trace.route=[...r.slice(0,i+1),...r.slice(j)]
   shortcutProbes++
   if(passesPhysical()){simplified++;break}
   trace.route=r
  }
 }
 const length=ddrRouteLength,original=structuredClone(trace.route),delta=goalLength-length(original),deadline=Date.now()+seconds*1000;
 const balancedFlag=process.env.G350_LENGTH_BALANCED_SEARCH
 assert(balancedFlag===undefined||['0','1'].includes(balancedFlag))
 const balanced=balancedFlag==='1',rectangleDeadline=balanced?Date.now()+seconds*700:deadline,combDeadline=balanced?Date.now()+seconds*400:deadline
 if(delta<=.005)return {found:delta>=-.635,tries:0};
  let found=false,tries=0
  const localGuard=createG350LocalGuard(circuit,trace)
  const segments=original.slice(0,-1).map((a,i)=>({a,b:original[i+1],i})).filter(s=>s.a.route_type==='wire'&&s.b.route_type==='wire'&&s.a.layer===s.b.layer&&proposalLayers.includes(s.a.layer)&&Math.hypot(s.a.x-s.b.x,s.a.y-s.b.y)>.66).sort((a,b)=>Number(b.a.layer.startsWith('inner'))-Number(a.a.layer.startsWith('inner'))||Math.hypot(b.a.x-b.b.x,b.a.y-b.b.y)-Math.hypot(a.a.x-a.b.x,a.a.y-a.b.y))
  search:for(const {a,b,i}of segments)for(const teeth of [12,8,6,4,3,2,1])for(const fraction of [.8,.6,.4,.25,.15])for(const start of [.1,.2,.35,.5,.65,.8])for(const sign of [1,-1])for(const offset of [0,.04,-.04]){
   if(found)break search
   if(Date.now()>combDeadline)break search
   const span=Math.hypot(b.x-a.x,b.y-a.y),h=delta/(2*teeth),pitch=fraction*span/teeth
   if(h<.22||pitch/2<.22)continue
   if(start*span+offset<.22||start*span+offset+(teeth-1)*pitch+pitch/2>span-.22)continue
   const ux=(b.x-a.x)/span,uy=(b.y-a.y)/span,nx=-uy*sign,ny=ux*sign
   const point=(d,height=0)=>({route_type:'wire',x:a.x+ux*d+nx*height,y:a.y+uy*d+ny*height,layer:a.layer,width:.1016})
   const replacement=[]
   for(let j=0;j<teeth;j++){const d=start*span+offset+j*pitch;replacement.push(point(d),point(d,h),point(d+pitch/2,h),point(d+pitch/2))}
   if(!g350AvoidsEscapeRegions(replacement,escapeRegions))continue
   if(!localGuard([a,...replacement,b]))continue
   trace.route=[...original.slice(0,i+1),...replacement,...original.slice(i+1)]
   assert(Math.abs(length(trace.route)-goalLength)<1e-7)
   tries++
   if(passesPhysical()){found=true;break search}
  }
  // Grow an existing rectangular bend without consuming another straight
  // section. Its two perpendicular legs gain delta/2 each.
  for(const i of windowIndices(0,original.length-3)){
   if(found)break
   if(balanced&&Date.now()>rectangleDeadline)break
   const [a,b,c,d]=original.slice(i,i+4)
   if(!proposalLayers.includes(a.layer)||![a,b,c,d].every(p=>p.route_type==='wire'&&p.layer===a.layer))continue
   const ux=b.x-a.x,uy=b.y-a.y,vx=c.x-b.x,vy=c.y-b.y,h=Math.hypot(ux,uy)
   if(h<.1||Math.hypot(vx,vy)<.22||Math.abs(ux*vx+uy*vy)>1e-7||Math.hypot(ux+d.x-c.x,uy+d.y-c.y)>1e-7)continue
   const nb={...b,x:b.x+ux/h*delta/2,y:b.y+uy/h*delta/2},nc={...c,x:c.x+ux/h*delta/2,y:c.y+uy/h*delta/2}
   if(!g350AvoidsEscapeRegions([a,nb,nc,d],escapeRegions))continue
   if(!localGuard([a,nb,nc,d]))continue
   trace.route=[...original.slice(0,i+1),nb,nc,...original.slice(i+3)]
   assert(Math.abs(length(trace.route)-goalLength)<1e-7);tries++
   if(passesPhysical())found=true
  }
  // Optional real triangular bend insertion for cramped routes whose existing
  // vertices have exhausted their movement. The goal is solved geometrically;
  // unchanged native checks still reject every bypass or clearance failure.
  const insertFlag=process.env.G350_LENGTH_INSERT_BENDS
  assert(insertFlag===undefined||['0','1'].includes(insertFlag))
  const minimumNewBendAngle=Number(process.env.G350_LENGTH_MINIMUM_NEW_BEND_ANGLE_DEGREES??0)
  assert(Number.isFinite(minimumNewBendAngle)&&minimumNewBendAngle>=0&&minimumNewBendAngle<=90)
  const opensCorner=(a,p,b)=>{
   if(!minimumNewBendAngle)return true
   const la=Math.hypot(a.x-p.x,a.y-p.y),lb=Math.hypot(b.x-p.x,b.y-p.y)
   if(!la||!lb)return false
   const cosine=((a.x-p.x)*(b.x-p.x)+(a.y-p.y)*(b.y-p.y))/(la*lb)
   return Math.acos(Math.max(-1,Math.min(1,cosine)))*180/Math.PI>=minimumNewBendAngle
  }
  const blocksFlag=process.env.G350_LENGTH_MOVE_BLOCKS
  assert(blocksFlag===undefined||['0','1'].includes(blocksFlag))
  const blockSizes=process.env.G350_LENGTH_BLOCK_SIZES?.split(',').map(Number)??[2,3,4,6,8,12]
  assert(blockSizes.length>0&&blockSizes.length<=12&&new Set(blockSizes).size===blockSizes.length&&blockSizes.every(n=>Number.isInteger(n)&&n>=2&&n<=64))
  assert(process.env.G350_LENGTH_BLOCK_SIZES===undefined||blocksFlag==='1','Explicit bend groups require block movement')
  // Translate a contiguous bend group when moving one vertex collides with
  // its own neighbouring staircase. Internal copper lengths stay unchanged;
  // solve the two joining legs, then require the same physical checks.
  if(!found&&blocksFlag==='1'){
   blocks:for(const count of blockSizes)for(const i of windowIndices(1,original.length-count)){
    const a=original[i-1],d=original[i+count],block=original.slice(i,i+count)
    if(!proposalLayers.includes(a.layer)||![a,...block,d].every(p=>p.route_type==='wire'&&p.layer===a.layer&&(p.width??.1016)===(a.width??.1016)))continue
    const b=block[0],c=block.at(-1),ab=Math.hypot(b.x-a.x,b.y-a.y),cd=Math.hypot(c.x-d.x,c.y-d.y)
    if(ab<.1||cd<.1)continue
    const gx=(b.x-a.x)/ab+(c.x-d.x)/cd,gy=(b.y-a.y)/ab+(c.y-d.y)/cd
    for(let j=0;j<(balanced?64:16);j++){
     if(Date.now()>deadline)break blocks
     const dx=Math.cos(j*2*Math.PI/(balanced?64:16)),dy=Math.sin(j*2*Math.PI/(balanced?64:16))
     if(gx*dx+gy*dy<-.000001)continue
     const moved=(p,h)=>({...p,x:p.x+dx*h,y:p.y+dy*h})
     const gain=h=>{const nb=moved(b,h),nc=moved(c,h);return Math.hypot(nb.x-a.x,nb.y-a.y)+Math.hypot(nc.x-d.x,nc.y-d.y)-ab-cd}
     let lo=0,hi=delta+ab+cd
     if(gain(hi)<delta)continue
     for(let k=0;k<50;k++){const mid=(lo+hi)/2;if(gain(mid)<delta)lo=mid;else hi=mid}
     const next=block.map(p=>moved(p,(lo+hi)/2)),window=[a,...next,d]
     if(!opensCorner(a,next[0],next[1])||!opensCorner(next.at(-2),next.at(-1),d))continue
     const prev=original[i-2],after=original[i+count+1]
     if(prev?.route_type==='wire'&&prev.layer===a.layer&&!opensCorner(prev,a,next[0]))continue
     if(after?.route_type==='wire'&&after.layer===d.layer&&!opensCorner(next.at(-1),d,after))continue
     if(!g350AvoidsEscapeRegions(window,escapeRegions)||!localGuard(window))continue
     trace.route=[...original.slice(0,i),...next,...original.slice(i+count)]
     assert(Math.abs(length(trace.route)-goalLength)<1e-7);tries++
     if(passesPhysical()){found=true;break blocks}
    }
   }
  }
  if(!found&&insertFlag==='1'){
   const shortSegments=original.slice(0,-1).map((a,i)=>({a,b:original[i+1],i}))
    .filter(s=>s.a.route_type==='wire'&&s.b.route_type==='wire'&&s.a.layer===s.b.layer&&proposalLayers.includes(s.a.layer)&&Math.hypot(s.a.x-s.b.x,s.a.y-s.b.y)>.24)
    .sort((a,b)=>Number(b.a.layer.startsWith('inner'))-Number(a.a.layer.startsWith('inner'))||Math.hypot(b.a.x-b.b.x,b.a.y-b.b.y)-Math.hypot(a.a.x-a.b.x,a.a.y-a.b.y))
   inserted:for(const {a,b,i} of shortSegments)for(const fraction of [.5,.25,.75,.1,.9])for(const sign of [1,-1]){
    if(Date.now()>deadline)break inserted
    const span=Math.hypot(b.x-a.x,b.y-a.y),ux=(b.x-a.x)/span,uy=(b.y-a.y)/span
    const gain=h=>Math.hypot(span*fraction,h)+Math.hypot(span*(1-fraction),h)-span
    let lo=0,hi=delta+span
    for(let k=0;k<60;k++){const mid=(lo+hi)/2;if(gain(mid)<delta)lo=mid;else hi=mid}
    const h=(lo+hi)/2,p={route_type:'wire',x:a.x+ux*span*fraction-uy*h*sign,y:a.y+uy*span*fraction+ux*h*sign,layer:a.layer,width:.1016}
    if(!opensCorner(a,p,b)||!g350AvoidsEscapeRegions([a,p,b],escapeRegions)||!localGuard([a,p,b]))continue
    trace.route=[...original.slice(0,i+1),p,...original.slice(i+1)]
    assert(Math.abs(length(trace.route)-goalLength)<1e-7);tries++
    if(passesPhysical()){found=true;break inserted}
   }
  }
  // A short staircase need not contain a rectangle or a long straight.
  // Move one existing bend, solving its two-leg length exactly. This is only
  // a search proposal; unchanged full checks still qualify every acceptance.
  if(!found&&process.env.G350_LENGTH_MOVE_BENDS==='1'){
   bends:for(const i of windowIndices(1,original.length-1)){
    const [a,b,c]=original.slice(i-1,i+2)
    if(!proposalLayers.includes(a.layer)||![a,b,c].every(p=>p.route_type==='wire'&&p.layer===a.layer))continue
    const ab=Math.hypot(b.x-a.x,b.y-a.y),bc=Math.hypot(b.x-c.x,b.y-c.y)
    if(ab<.1||bc<.1)continue
    const gx=(b.x-a.x)/ab+(b.x-c.x)/bc,gy=(b.y-a.y)/ab+(b.y-c.y)/bc
    const directions=balanced?64:16
    for(let j=0;j<directions;j++){
     if(Date.now()>deadline)break bends
     const dx=Math.cos(j*2*Math.PI/directions),dy=Math.sin(j*2*Math.PI/directions)
     if(gx*dx+gy*dy<-.000001)continue
     const moved=d=>({...b,x:b.x+dx*d,y:b.y+dy*d})
     const gain=d=>{const p=moved(d);return Math.hypot(p.x-a.x,p.y-a.y)+Math.hypot(p.x-c.x,p.y-c.y)-ab-bc}
     let lo=0,hi=delta+Math.max(ab,bc)
     if(gain(hi)<delta)continue
     for(let k=0;k<50;k++){const mid=(lo+hi)/2;if(gain(mid)<delta)lo=mid;else hi=mid}
     const nb=moved((lo+hi)/2)
     if(!opensCorner(a,nb,c)||!g350AvoidsEscapeRegions([a,nb,c],escapeRegions)||!localGuard([a,nb,c]))continue
     trace.route=[...original.slice(0,i),nb,...original.slice(i+1)]
     assert(Math.abs(length(trace.route)-goalLength)<1e-7);tries++
     if(passesPhysical()){found=true;break bends}
    }
   }
  }
  if(!found&&allowNewVias&&delta>3.65){
   alternate:for(const {a,b,i}of segments)for(const layer of ['inner1','inner2','top','bottom'].filter(l=>l!==a.layer&&proposalLayers.includes(l)))for(const sign of [1,-1]){
    if(Date.now()>deadline)break alternate
    const span=Math.hypot(b.x-a.x,b.y-a.y),h=(delta-3.2)/2
    const ux=(b.x-a.x)/span,uy=(b.y-a.y)/span,nx=-uy*sign,ny=ux*sign
    const point=(d,height=0,l=layer)=>({route_type:'wire',x:a.x+ux*d+nx*height,y:a.y+uy*d+ny*height,layer:l,width:.1016})
    const v1=point(.1*span),v2=point(.9*span)
    if(!g350AvoidsEscapeRegions([v1,point(.1*span,h),point(.9*span,h),v2],escapeRegions))continue
    const via=(v,from_layer,to_layer)=>({route_type:'via',x:v.x,y:v.y,from_layer,to_layer,via_diameter:.4572,via_hole_diameter:.254})
    trace.route=[...original.slice(0,i+1),point(.1*span,0,a.layer),via(v1,a.layer,layer),v1,point(.1*span,h),point(.9*span,h),v2,via(v2,layer,a.layer),point(.9*span,0,a.layer),...original.slice(i+1)]
    assert(Math.abs(length(trace.route)-goalLength)<1e-7)
    const viaOffset=circuit.filter(e=>e.type==='pcb_via'&&e.pcb_via_id.startsWith(`tuned_${trace.pcb_trace_id}_`)).length
    const newVias=[v1,v2].map((v,j)=>({type:'pcb_via',pcb_via_id:`tuned_${trace.pcb_trace_id}_${viaOffset+j}`,pcb_trace_id:trace.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:trace.subcircuit_id}))
    circuit.push(...newVias);tries++
    if(passesPhysical()){found=true;break alternate}
    circuit.splice(circuit.length-2,2)
   }
  }
  if(!found)trace.route=original
 return {found,tries,lengthMm:length(trace.route)}
}
