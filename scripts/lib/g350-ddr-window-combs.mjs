// Replace a same-layer staircase window with a longer planar comb. This is a
// proposal generator, not qualification; the caller supplies native validation.
import assert from 'node:assert/strict'
import {ddrRouteLength} from './g350-full-board-length-tuning.mjs'
import {createG350LocalGuard} from './g350-ddr-local-guard.mjs'
export function growG350DdrWindowComb(circuit,trace,goalLength,seconds,{planningValidator}){
 assert(typeof planningValidator==='function'&&seconds>0&&seconds<=60)
 const original=structuredClone(trace.route),delta=goalLength-ddrRouteLength(original)
 if(delta<=.05)return {found:false,tries:0}
 const deadline=Date.now()+seconds*1000,guard=createG350LocalGuard(circuit,trace),windows=[]
 for(let i=0;i<original.length-3;i++){
  const a=original[i];if(a.route_type!=='wire')continue
  for(const count of [4,6,10,16,24,32,48,64]){
   const j=i+count;if(j>=original.length)continue
   const window=original.slice(i,j+1),b=window.at(-1)
   if(!window.every(p=>p.route_type==='wire'&&p.layer===a.layer))continue
   const span=Math.hypot(b.x-a.x,b.y-a.y)
   if(span<1||span>12)continue
   windows.push({i,j,a,b,span,removedMm:ddrRouteLength(window)})
  }
 }
 windows.sort((a,b)=>Number(b.a.layer.startsWith('inner'))-Number(a.a.layer.startsWith('inner'))||b.span-a.span)
 let tries=0,probes=0
 search:for(const {i,j,a,b,span,removedMm} of windows){
  const ux=(b.x-a.x)/span,uy=(b.y-a.y)/span
  const extra=delta+removedMm-span
  for(const teeth of [12,8,6,4,3,2,1])for(const fraction of [.85,.7,.55,.4])for(const start of [.05,.15,.3,.45,.6])for(const sign of [1,-1]){
   if(Date.now()>deadline)break search
   const height=extra/(2*teeth),pitch=fraction*span/teeth
   if(height<.22||pitch/2<.22||start*span<.22||start*span+(teeth-1)*pitch+pitch/2>span-.22)continue
   const point=(d,h=0)=>({route_type:'wire',x:a.x+ux*d-uy*sign*h,y:a.y+uy*d+ux*sign*h,layer:a.layer,width:.1016})
   const replacement=[]
   for(let k=0;k<teeth;k++){
    const d=start*span+k*pitch;replacement.push(point(d),point(d,height),point(d+pitch/2,height),point(d+pitch/2))
   }
   probes++
   if(!guard([a,...replacement,b]))continue
   trace.route=[...original.slice(0,i+1),...replacement,...original.slice(j)]
   assert(Math.abs(ddrRouteLength(trace.route)-goalLength)<1e-7)
   tries++
   if(planningValidator(circuit,trace))return {found:true,tries,probes,windowStart:i,windowEnd:j,teeth,lengthMm:ddrRouteLength(trace.route)}
   trace.route=original
  }
 }
 trace.route=original
 return {found:false,tries,probes,lengthMm:ddrRouteLength(trace.route)}
}
