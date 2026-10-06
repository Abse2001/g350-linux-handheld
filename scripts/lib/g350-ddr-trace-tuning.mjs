import assert from 'node:assert/strict'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './g350-ddr-physical-checks.mjs'
import {createG350LocalGuard} from './g350-ddr-local-guard.mjs'
import {g350BgaEscapeRegions,g350AvoidsEscapeRegions} from './g350-ddr-bga-escape-regions.mjs'
export const ddrRouteLength=r=>r.slice(1).reduce((n,p,i)=>n+(p.route_type==='via'?1.6:0)+(p.route_type==='wire'&&r[i].route_type==='wire'&&p.layer===r[i].layer?Math.hypot(p.x-r[i].x,p.y-r[i].y):0),0)

export function tuneOneG350DdrTrace(circuit,trace,goalLength,seconds=10,{protectEscapeRegions=false}={}){
 const escapeRegions=protectEscapeRegions?g350BgaEscapeRegions(circuit):[]
 const simplifyDeadline=Date.now()+seconds*350
 // Grid staircases can hide a long clear corridor behind many sub-millimetre
 // pieces. Replace only shortcuts that pass the unchanged complete checks.
 const simplifyGuard=createG350LocalGuard(circuit,trace)
 let simplified=0,shortcutProbes=0
 for(let i=0;i<trace.route.length-3&&simplified<12&&Date.now()<simplifyDeadline;i++){
  const r=trace.route,a=r[i];if(a.route_type!=='wire')continue
  let end=i+1;while(end<r.length&&r[end].route_type==='wire'&&r[end].layer===a.layer)end++
  for(let j=end-1;j>=i+3;j--){
   if(Date.now()>simplifyDeadline||shortcutProbes>=200)break
   const b=r[j];if(Math.hypot(a.x-b.x,a.y-b.y)<1||!simplifyGuard([a,b]))continue
   trace.route=[...r.slice(0,i+1),...r.slice(j)]
   shortcutProbes++
   if(!checkG350ViaTrackManufacturingClearance(circuit).length&&g350DdrPhysicalChecks.every(n=>checks[n](circuit).length===0)){simplified++;break}
   trace.route=r
  }
 }
 const length=ddrRouteLength,original=structuredClone(trace.route),delta=goalLength-length(original),deadline=Date.now()+seconds*1000,preparation={physicalChecks:g350DdrPhysicalChecks};
 if(delta<=.05)return {found:delta>=-.635,tries:0};
  let found=false,tries=0
  const localGuard=createG350LocalGuard(circuit,trace)
  const segments=original.slice(0,-1).map((a,i)=>({a,b:original[i+1],i})).filter(s=>s.a.route_type==='wire'&&s.b.route_type==='wire'&&s.a.layer===s.b.layer&&Math.hypot(s.a.x-s.b.x,s.a.y-s.b.y)>1).sort((a,b)=>Number(b.a.layer.startsWith('inner'))-Number(a.a.layer.startsWith('inner'))||Math.hypot(b.a.x-b.b.x,b.a.y-b.b.y)-Math.hypot(a.a.x-a.b.x,a.a.y-a.b.y))
  search:for(const {a,b,i}of segments)for(const teeth of [12,8,6,4,3,2,1])for(const fraction of [.8,.6,.4,.25,.15])for(const start of [.1,.2,.35,.5,.65,.8])for(const sign of [1,-1])for(const offset of [0,.04,-.04]){
   if(found)break search
   if(Date.now()>deadline)break search
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
   if(!checkG350ViaTrackManufacturingClearance(circuit).length&&preparation.physicalChecks.every(name=>checks[name](circuit).length===0)){found=true;break search}
  }
  // Grow an existing rectangular bend without consuming another straight
  // section. Its two perpendicular legs gain delta/2 each.
  for(let i=0;i<original.length-3&&!found;i++){
   const [a,b,c,d]=original.slice(i,i+4)
   if(![a,b,c,d].every(p=>p.route_type==='wire'&&p.layer===a.layer))continue
   const ux=b.x-a.x,uy=b.y-a.y,vx=c.x-b.x,vy=c.y-b.y,h=Math.hypot(ux,uy)
   if(h<.1||Math.hypot(vx,vy)<.22||Math.abs(ux*vx+uy*vy)>1e-7||Math.hypot(ux+d.x-c.x,uy+d.y-c.y)>1e-7)continue
   const nb={...b,x:b.x+ux/h*delta/2,y:b.y+uy/h*delta/2},nc={...c,x:c.x+ux/h*delta/2,y:c.y+uy/h*delta/2}
   if(!g350AvoidsEscapeRegions([a,nb,nc,d],escapeRegions))continue
   if(!localGuard([a,nb,nc,d]))continue
   trace.route=[...original.slice(0,i+1),nb,nc,...original.slice(i+3)]
   assert(Math.abs(length(trace.route)-goalLength)<1e-7);tries++
   if(!checkG350ViaTrackManufacturingClearance(circuit).length&&preparation.physicalChecks.every(name=>checks[name](circuit).length===0))found=true
  }
  if(!found&&delta>3.65){
   alternate:for(const {a,b,i}of segments)for(const layer of ['inner1','inner2','top','bottom'].filter(l=>l!==a.layer))for(const sign of [1,-1]){
    if(Date.now()>deadline)break alternate
    const span=Math.hypot(b.x-a.x,b.y-a.y),h=(delta-3.2)/2
    const ux=(b.x-a.x)/span,uy=(b.y-a.y)/span,nx=-uy*sign,ny=ux*sign
    const point=(d,height=0,l=layer)=>({route_type:'wire',x:a.x+ux*d+nx*height,y:a.y+uy*d+ny*height,layer:l,width:.1016})
    const v1=point(.1*span),v2=point(.9*span)
    if(!g350AvoidsEscapeRegions([v1,point(.1*span,h),point(.9*span,h),v2],escapeRegions))continue
    const via=(v,from_layer,to_layer)=>({route_type:'via',x:v.x,y:v.y,from_layer,to_layer,via_diameter:.4572,via_hole_diameter:.254})
    trace.route=[...original.slice(0,i+1),point(.1*span,0,a.layer),via(v1,a.layer,layer),v1,point(.1*span,h),point(.9*span,h),v2,via(v2,layer,a.layer),point(.9*span,0,a.layer),...original.slice(i+1)]
    assert(Math.abs(length(trace.route)-goalLength)<1e-7)
    const newVias=[v1,v2].map((v,j)=>({type:'pcb_via',pcb_via_id:`tuned_${trace.pcb_trace_id}_${j}`,pcb_trace_id:trace.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:trace.subcircuit_id}))
    circuit.push(...newVias);tries++
    if(!checkG350ViaTrackManufacturingClearance(circuit).length&&preparation.physicalChecks.every(name=>checks[name](circuit).length===0)){found=true;break alternate}
    circuit.splice(circuit.length-2,2)
   }
  }
  if(!found)trace.route=original
 return {found,tries,lengthMm:length(trace.route)}
}
