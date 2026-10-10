// Replace an existing acute window with real, equal-length copper. Planning only.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350LocalGuard} from './lib/g350-ddr-local-guard.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'
function reshapeConstantLengthWindow(circuit,trace,goalLength,seconds,{planningValidator}){
 assert(typeof planningValidator==='function'&&seconds>0&&seconds<=90)
 const original=structuredClone(trace.route),delta=goalLength-ddrRouteLength(original)
 assert(Math.abs(delta)<1e-7)
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

const [input,root,name='DDR_D8',secondsText='90']=process.argv.slice(2),seconds=Number(secondsText)
assert(input&&root&&!fs.existsSync(root)&&name==='DDR_D8'&&seconds>0&&seconds<=90)
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),inputHash=hash(input)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),c=structuredClone(base),sid=c.find(e=>e.type==='source_trace'&&e.name===name).source_trace_id,t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===sid),original=structuredClone(t),validator=createG350PlanarPlanningValidator(base)
const anglesPass=r=>r.every((p,i)=>{const a=r[i-1],b=r[i+1];if(!a||!b||![a,p,b].every(q=>q.route_type==='wire'&&q.layer===p.layer))return true;const la=Math.hypot(a.x-p.x,a.y-p.y),lb=Math.hypot(b.x-p.x,b.y-p.y);return la<1e-9||lb<1e-9||Math.acos(Math.max(-1,Math.min(1,((a.x-p.x)*(b.x-p.x)+(a.y-p.y)*(b.y-p.y))/(la*lb))))*180/Math.PI>=25-1e-7})
assert(!anglesPass(original.route),'Select a route with existing acute bends')
fs.mkdirSync(root)
for(const p of ['scripts/smooth-g350-ddr-constant-length-windows.mjs','scripts/lib/g350-ddr-planar-planning-validator.mjs','scripts/lib/g350-ddr-local-guard.mjs','scripts/lib/g350-ddr-physical-checks.mjs','scripts/lib/g350-full-board-length-tuning.mjs','scripts/lib/g350-locked-ground-fill.mjs','scripts/lib/g350-locked-ground-fill-worker.mjs'])fs.copyFileSync(p,root+'/'+p.replaceAll('/','__'))
assert.equal((await fillG350LockedGround(c)).portErrors,0)
const beforeMm=ddrRouteLength(t.route),result=reshapeConstantLengthWindow(c,t,beforeMm,seconds,{planningValidator:(c,t)=>anglesPass(t.route)&&validator.validate(c,t)})
let ground=null,retained=false
if(result.found){
 assert(anglesPass(t.route));assert(Math.abs(ddrRouteLength(t.route)-beforeMm)<1e-7)
 const g=await fillG350LockedGround(c);ground={portErrors:g.portErrors,elapsedSeconds:g.elapsedSeconds};retained=g.portErrors===0
 if(retained){delete t.trace_length;fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')}
 else fs.writeFileSync(root+'/rejected-ground.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')
}
if(!retained)Object.assign(t,original)
validator.assertImmutable(c);assert.deepEqual(c.filter(e=>e!==t),base.filter(e=>e.type!=='pcb_trace'||e.pcb_trace_id!==t.pcb_trace_id))
assert.deepEqual(t.route.filter(p=>p.route_type==='via'),original.route.filter(p=>p.route_type==='via'));assert.deepEqual([t.route[0],t.route.at(-1)],[original.route[0],original.route.at(-1)])
const counts=validator.complete(c);for(const n of ['checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'])counts[n]=checks[n](c).length
assert(Object.values(counts).every(n=>n===0));assert.equal(hash(input),inputHash)
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n');const report={input:{path:input,sha256:inputHash},name,seconds,beforeMm,afterMm:ddrRouteLength(t.route),result,retained,ground,counts,allBendsAtLeast25Degrees:anglesPass(t.route),originalBarrelsEndpointsAndForeignRecordsExactlyPreserved:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false};fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));process.exitCode=retained?0:1
