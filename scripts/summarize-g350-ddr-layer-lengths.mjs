// Exact geometric inventory only. It cannot infer delay without a stackup and
// package model, and does not change the pinned native matching assertions.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
const [input,out]=process.argv.slice(2);assert(input&&out&&!fs.existsSync(out))
const c=JSON.parse(fs.readFileSync(input)),names=new Map(c.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e.name]))
const rows=c.filter(e=>e.type==='pcb_trace'&&names.get(e.source_trace_id)?.startsWith('DDR_')).map(t=>{
 const planarByLayerMm={top:0,inner1:0,inner2:0,bottom:0},transitions=[]
 for(let i=1;i<t.route.length;i++){
  const a=t.route[i-1],p=t.route[i]
  if(p.route_type==='via')transitions.push({x:p.x,y:p.y,fromLayer:p.from_layer,toLayer:p.to_layer})
  else if(p.route_type===a.route_type&&p.route_type==='wire'&&p.layer===a.layer)planarByLayerMm[p.layer]+=Math.hypot(p.x-a.x,p.y-a.y)
 }
 const planarMm=Object.values(planarByLayerMm).reduce((a,b)=>a+b,0),nativeViaTermMm=1.6*transitions.length,nativeLengthMm=ddrRouteLength(t.route)
 assert(Math.abs(nativeLengthMm-planarMm-nativeViaTermMm)<1e-7)
 return {name:names.get(t.source_trace_id),sourceTraceId:t.source_trace_id,pcbTraceId:t.pcb_trace_id,planarByLayerMm,planarMm,transitionCount:transitions.length,nativeViaTermMm,nativeLengthMm,transitions}
});assert.equal(rows.length,49);assert.equal(new Set(rows.map(r=>r.sourceTraceId)).size,49)
const buses=c.filter(e=>e.type==='source_bus'&&['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(e.name)).map(b=>{
 const members=rows.filter(r=>b.source_trace_ids.includes(r.sourceTraceId)),spread=k=>Math.max(...members.map(r=>r[k]))-Math.min(...members.map(r=>r[k]))
 return {name:b.name,members:members.length,nativeSkewMm:spread('nativeLengthMm'),nativeLimitMm:b.max_length_skew,nativeMatches:spread('nativeLengthMm')<=b.max_length_skew,planarSkewMm:spread('planarMm'),transitionCountRange:[Math.min(...members.map(r=>r.transitionCount)),Math.max(...members.map(r=>r.transitionCount))]}
})
const report={input:{path:input,sha256:createHash('sha256').update(fs.readFileSync(input)).digest('hex')},nativeViaTermMmPerTransition:1.6,delayModelAvailable:false,missingElectricalInputs:['Target DDR clock and timing budget','Manufacturer layer depths and dielectric properties','CPU and RAM package delays','Via/stub parasitics and return path model','Meander coupling and impedance qualification'],buses,rows,fabricationReady:false}
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({buses,delayModelAvailable:false,fabricationReady:false}))
