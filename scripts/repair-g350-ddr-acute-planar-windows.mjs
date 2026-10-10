// Smooth existing acute windows without adding holes or changing other copper.
// Planning only: source replay and independent CAD/Gerber qualification follow.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350LocalGuard} from './lib/g350-ddr-local-guard.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'
const [input,root,name,secondsText='60']=process.argv.slice(2),seconds=Number(secondsText)
assert(input&&root&&!fs.existsSync(root)&&/^DDR_D(?:8|9|1[0-5]|QM1)$/.test(name)&&seconds>0&&seconds<=90)
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),inputHash=hash(input)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const baseline=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),c=structuredClone(baseline)
const sid=c.find(e=>e.type==='source_trace'&&e.name===name)?.source_trace_id,t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===sid);assert(t)
const original=structuredClone(t),validator=createG350PlanarPlanningValidator(baseline),guard=createG350LocalGuard(c,t)
const bus=c.find(e=>e.type==='source_bus'&&e.source_trace_ids.includes(sid)&&e.source_trace_ids.length>2);assert(bus)
const lengths=()=>c.filter(e=>e.type==='pcb_trace'&&bus.source_trace_ids.includes(e.source_trace_id)).map(e=>ddrRouteLength(e.route))
const minimum=Math.min(...lengths()),skew=()=>Math.max(...lengths())-Math.min(...lengths()),beforeSkew=skew()
const acute=r=>r.flatMap((p,i)=>{
 const a=r[i-1],b=r[i+1];if(!a||!b||![a,p,b].every(q=>q.route_type==='wire'&&q.layer===p.layer))return []
 const la=Math.hypot(a.x-p.x,a.y-p.y),lb=Math.hypot(b.x-p.x,b.y-p.y);if(la<1e-9||lb<1e-9)return []
 const angle=Math.acos(Math.max(-1,Math.min(1,((a.x-p.x)*(b.x-p.x)+(a.y-p.y)*(b.y-p.y))/(la*lb))))*180/Math.PI
 return angle<25-1e-7?[{index:i,x:p.x,y:p.y,layer:p.layer,angle}]:[]
})
const beforeAcute=acute(t.route);assert(beforeAcute.length,'Select a route with existing acute bends')
fs.mkdirSync(root)
for(const p of ['scripts/repair-g350-ddr-acute-planar-windows.mjs','scripts/lib/g350-full-board-length-tuning.mjs','scripts/lib/g350-ddr-local-guard.mjs','scripts/lib/g350-ddr-planar-planning-validator.mjs','scripts/lib/g350-ddr-physical-checks.mjs','scripts/lib/g350-locked-ground-fill.mjs','scripts/lib/g350-locked-ground-fill-worker.mjs'])fs.copyFileSync(p,root+'/'+p.replaceAll('/','__'))
assert.equal((await fillG350LockedGround(c)).portErrors,0)
const progress=[],deadline=Date.now()+seconds*1000;let probes=0
for(let round=1;round<=8&&Date.now()<deadline;round++){
 const r=t.route,bad=acute(r);if(!bad.length)break
 let best=null
 // Partial relaxation can remove an acute corner whose complete chord would
 // overshoot the existing shortest member. No new acute vertex is permitted.
 for(const bend of bad){
  const i=bend.index,a=r[i-1],p=r[i],b=r[i+1],la=Math.hypot(a.x-p.x,a.y-p.y),lb=Math.hypot(b.x-p.x,b.y-p.y),f=la/(la+lb)
  const target={x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f}
  for(const fraction of [.1,.2,.3,.4,.5,.6,.7,.8,.9,1]){
   if(Date.now()>=deadline)break
   const q={...p,x:p.x+(target.x-p.x)*fraction,y:p.y+(target.y-p.y)*fraction},next=[...r.slice(0,i),q,...r.slice(i+1)],remaining=acute(next),length=ddrRouteLength(next)
   if(length<minimum-1e-7||length>=ddrRouteLength(r)-.005||remaining.length>=bad.length)continue
   if(remaining.some(p=>!bad.some(q=>p.x===q.x&&p.y===q.y&&p.layer===q.layer))||!guard([a,q,b]))continue
   t.route=next;probes++
   if(validator.validate(c,t)&&skew()<=beforeSkew+1e-7&&(!best||remaining.length<best.remaining.length||remaining.length===best.remaining.length&&length<best.length))best={route:next,remaining,length,first:i,last:i}
   t.route=r
  }
 }
 for(const bend of bad)for(const left of [1,2,3,4,6,8,12])for(const right of [1,2,3,4,6,8,12]){
  if(Date.now()>=deadline)break
  const first=bend.index-left,last=bend.index+right;if(first<0||last>=r.length)continue
  const a=r[first],b=r[last];if(!r.slice(first,last+1).every(p=>p.route_type==='wire'&&p.layer===a.layer))continue
  const next=[...r.slice(0,first+1),...r.slice(last)],remaining=acute(next),length=ddrRouteLength(next)
  if(length<minimum-1e-7||length>=ddrRouteLength(r)-.005||remaining.length>=bad.length)continue
  if(remaining.some(p=>!bad.some(q=>p.x===q.x&&p.y===q.y&&p.layer===q.layer)))continue
  if(!guard([a,b]))continue
  t.route=next;probes++
  if(validator.validate(c,t)&&skew()<=beforeSkew+1e-7&&(!best||remaining.length<best.remaining.length||remaining.length===best.remaining.length&&length<best.length))best={route:next,remaining,length,first,last}
  t.route=r
 }
 if(!best)break
 t.route=best.route
 const ground=await fillG350LockedGround(c),counts=validator.complete(c)
 const retained=ground.portErrors===0&&Object.values(counts).every(n=>n===0)&&skew()<=beforeSkew+1e-7
 progress.push({round,first:best.first,last:best.last,beforeAcute:bad.length,afterAcute:best.remaining.length,afterMm:best.length,groundPortErrors:ground.portErrors,counts,retained})
 if(!retained){fs.writeFileSync(root+'/rejected-ground.circuit.json',JSON.stringify(ground.circuit,null,2)+'\n');t.route=r;break}
 delete t.trace_length;fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(ground.circuit,null,2)+'\n')
}
validator.assertImmutable(c)
assert.deepEqual(c.filter(e=>e!==t),baseline.filter(e=>e.type!=='pcb_trace'||e.pcb_trace_id!==t.pcb_trace_id))
assert.deepEqual(t.route.filter(p=>p.route_type==='via'),original.route.filter(p=>p.route_type==='via'))
assert.deepEqual([t.route[0],t.route.at(-1)],[original.route[0],original.route.at(-1)])
const counts=validator.complete(c)
for(const n of ['checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'])counts[n]=checks[n](c).length
assert(Object.values(counts).every(n=>n===0));assert.equal(hash(input),inputHash)
const report={input:{path:input,sha256:inputHash},name,seconds,beforeMm:ddrRouteLength(original.route),afterMm:ddrRouteLength(t.route),beforeAcute,afterAcute:acute(t.route),beforeSkew,afterSkew:skew(),probes,progress,counts,originalBarrelsEndpointsForeignCopperAndDefinitionsExactlyPreserved:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false}
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n');fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));process.exitCode=progress.some(p=>p.retained)?0:1
