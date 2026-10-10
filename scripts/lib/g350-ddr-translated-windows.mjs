// Move an interior same-layer polyline as a rigid shape and solve the added
// terminal-leg length. Pads/vias stay fixed; native validation decides legality.
import assert from 'node:assert/strict'
import {ddrRouteLength} from './g350-full-board-length-tuning.mjs'
import {createG350LocalGuard} from './g350-ddr-local-guard.mjs'
export function growG350TranslatedWindow(circuit,trace,goalLength,seconds,{planningValidator}){
 assert(typeof planningValidator==='function'&&seconds>0&&seconds<=60)
 const original=structuredClone(trace.route),delta=goalLength-ddrRouteLength(original)
 if(delta<=.05)return {found:false,tries:0}
 const deadline=Date.now()+seconds*1000,guard=createG350LocalGuard(circuit,trace),windows=[]
 for(let i=0;i<original.length-3;i++)for(const count of [3,4,6,10,16]){
  const j=i+count;if(j>=original.length)continue
  const r=original.slice(i,j+1),a=r[0],b=r.at(-1)
  if(!r.every(p=>p.route_type==='wire'&&p.layer===a.layer))continue
  if(Math.hypot(r[1].x-a.x,r[1].y-a.y)<.02||Math.hypot(r.at(-2).x-b.x,r.at(-2).y-b.y)<.02)continue
  windows.push({i,j,r,a,b})
 }
 windows.sort((a,b)=>Number(b.a.layer.startsWith('inner'))-Number(a.a.layer.startsWith('inner'))||a.r.length-b.r.length)
 let tries=0,probes=0
 search:for(const {i,j,r,a,b} of windows){
  const first=r[1],last=r.at(-2),oldEnds=Math.hypot(first.x-a.x,first.y-a.y)+Math.hypot(last.x-b.x,last.y-b.y)
  for(let angle=0;angle<64;angle++){
   if(Date.now()>deadline)break search
   const dx=Math.cos(angle*Math.PI/32),dy=Math.sin(angle*Math.PI/32)
   const gain=d=>Math.hypot(first.x+dx*d-a.x,first.y+dy*d-a.y)+Math.hypot(last.x+dx*d-b.x,last.y+dy*d-b.y)-oldEnds
   let lo=0,hi=delta+oldEnds
   if(gain(hi)<delta)continue
   for(let k=0;k<50;k++){const mid=(lo+hi)/2;if(gain(mid)<delta)lo=mid;else hi=mid}
   const d=(lo+hi)/2,moved=r.slice(1,-1).map(p=>({...p,x:p.x+dx*d,y:p.y+dy*d}))
   probes++
   if(!guard([a,...moved,b]))continue
   trace.route=[...original.slice(0,i+1),...moved,...original.slice(j)]
   assert(Math.abs(ddrRouteLength(trace.route)-goalLength)<1e-7)
   tries++
   if(planningValidator(circuit,trace))return {found:true,tries,probes,windowStart:i,windowEnd:j,angle,lengthMm:ddrRouteLength(trace.route)}
   trace.route=original
  }
 }
 trace.route=original
 return {found:false,tries,probes,lengthMm:ddrRouteLength(trace.route)}
}
