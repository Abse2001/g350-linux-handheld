// Diagnostic planar shortcuts toward each complete bus's current minimum.
// No holes, layer transitions, endpoints, logical constraints or foreign wires change.
// Fresh source, native ground and independent CAD qualification remain mandatory.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350LocalGuard} from './lib/g350-ddr-local-guard.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
const [input,root,secondsText='12']=process.argv.slice(2)
assert(input&&root&&!fs.existsSync(root)); fs.mkdirSync(root)
const seconds=Number(secondsText);assert(seconds>0&&seconds<=60)
const original=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const circuit=structuredClone(original),validator=createG350PlanarPlanningValidator(original)
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
for(const p of ['scripts/shorten-g350-ddr-common-target.mjs','scripts/lib/g350-ddr-planar-planning-validator.mjs','scripts/lib/g350-ddr-local-guard.mjs'])fs.copyFileSync(p,root+'/'+p.replaceAll('/','__'))
const names=new Map(circuit.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e.name]))
const buses=circuit.filter(e=>e.type==='source_bus'&&['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(e.name))
const rows=b=>circuit.filter(e=>e.type==='pcb_trace'&&b.source_trace_ids.includes(e.source_trace_id)).map(t=>({name:names.get(t.source_trace_id),mm:ddrRouteLength(t.route)}))
const before=buses.map(b=>({name:b.name,rows:rows(b)})),changes=[],proposals=[]
const selected=process.env.G350_SHORTEN_SIGNALS?.split(',');if(selected)assert(selected.every(n=>[...names.values()].includes(n)))
const includePairs=process.env.G350_SHORTEN_INCLUDE_PAIRS==='1'
const explicitTarget=process.env.G350_SHORTEN_TARGET_MM===undefined?null:Number(process.env.G350_SHORTEN_TARGET_MM)
assert(explicitTarget===null||Number.isFinite(explicitTarget)&&explicitTarget>0&&explicitTarget<100)
for(const bus of buses){
 if(selected&&!bus.source_trace_ids.some(id=>selected.includes(names.get(id))))continue
 const target=explicitTarget??Math.min(...rows(bus).map(r=>r.mm))+.15
 for(const trace of circuit.filter(e=>e.type==='pcb_trace'&&bus.source_trace_ids.includes(e.source_trace_id))){
  const name=names.get(trace.source_trace_id)
  if(!includePairs&&/DQS|DQSn|^DDR_CK[n]?$/.test(name)||selected&&!selected.includes(name))continue
  const initial=ddrRouteLength(trace.route),guard=createG350LocalGuard(circuit,trace),deadline=Date.now()+seconds*1000
  let edits=0,probes=0
  while(ddrRouteLength(trace.route)>target+.01&&edits<40&&Date.now()<deadline){
   const r=trace.route,delta=ddrRouteLength(r)-target,candidates=[]
   for(let i=0;i<r.length-2;i++){
    const a=r[i];if(a.route_type!=='wire')continue
    let cumulative=0,previousGain=0
    for(let j=i+1;j<r.length;j++){
     const p=r[j-1],b=r[j];if(b.route_type!=='wire'||b.layer!==a.layer||p.route_type!=='wire'||b.width!==a.width)break
     const span=Math.hypot(b.x-p.x,b.y-p.y);cumulative+=span
     const gain=cumulative-Math.hypot(b.x-a.x,b.y-a.y)
     if(j-i<2||gain<.015){previousGain=gain;continue}
     let replacement,candidateGain
     if(gain<=delta){replacement=[...r.slice(0,i+1),...r.slice(j)];candidateGain=gain;if(!guard([a,b])){previousGain=gain;continue}}
     else if(previousGain<=delta){
      let lo=0,hi=1;const q=f=>({...b,x:p.x+(b.x-p.x)*f,y:p.y+(b.y-p.y)*f})
      for(let k=0;k<45;k++){let f=(lo+hi)/2,v=q(f),g=cumulative-span+span*f-Math.hypot(v.x-a.x,v.y-a.y);if(g<delta)lo=f;else hi=f}
      const point=q((lo+hi)/2);if(!guard([a,point,b])){previousGain=gain;continue}
      replacement=[...r.slice(0,i+1),point,...r.slice(j)];candidateGain=delta
     }else{previousGain=gain;continue}
     assert(Math.abs(ddrRouteLength(replacement)-(ddrRouteLength(r)-candidateGain))<1e-7)
     candidates.push({i,j,gain:candidateGain,route:replacement});previousGain=gain
    }
   }
   candidates.sort((a,b)=>b.gain-a.gain)
   let accepted=false
   for(const c of candidates){if(Date.now()>deadline||probes>=100)break;probes++;trace.route=c.route
    const valid=validator.validate(circuit,trace);proposals.push({name,i:c.i,j:c.j,gainMm:c.gain,accepted:valid})
    if(valid){accepted=true;edits++;break}trace.route=r
   }
   if(!accepted)break
  }
  delete trace.trace_length
  const after=ddrRouteLength(trace.route)
  if(initial-after>.001){changes.push({name,bus:bus.name,targetMm:target,beforeMm:initial,afterMm:after,edits,probes});console.log(JSON.stringify(changes.at(-1)))}
 }
 const counts=validator.complete(circuit);assert(Object.values(counts).every(n=>n===0))
 fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(circuit,null,2)+'\n')
}
validator.assertImmutable(circuit)
for(const t of circuit.filter(e=>e.type==='pcb_trace')){
 const old=original.find(e=>e.type==='pcb_trace'&&e.pcb_trace_id===t.pcb_trace_id)
 if(!names.get(t.source_trace_id)?.startsWith('DDR_'))assert.deepEqual(t,old)
 assert.deepEqual(t.route.filter(p=>p.route_type==='via'),old.route.filter(p=>p.route_type==='via'))
 assert.deepEqual(t.route[0],old.route[0]);assert.deepEqual(t.route.at(-1),old.route.at(-1))
}
const counts=validator.complete(circuit)
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:hash(input)},secondsPerTrace:seconds,includePairs,explicitTarget,changes,proposals,before,after:buses.map(b=>({name:b.name,rows:rows(b),skewMm:Math.max(...rows(b).map(r=>r.mm))-Math.min(...rows(b).map(r=>r.mm))})),physicalCounts:counts,nativeSkew:checks.checkPcbBusLengthSkew(circuit),planningOnly:true,requiresFreshGroundSourceAndIndependentChecks:true,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({changes:changes.length,after:buses.map(b=>({name:b.name,skew:Math.max(...rows(b).map(r=>r.mm))-Math.min(...rows(b).map(r=>r.mm))}))}))
