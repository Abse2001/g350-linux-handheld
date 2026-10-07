// Trial shortcuts preserve ports, layers, vias and every other net. Full native
// and independent checks must qualify the result before editable-source replay.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {createG350LocalGuard} from './lib/g350-ddr-local-guard.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,out]=process.argv.slice(2)
assert(input&&out&&!fs.existsSync(out));fs.mkdirSync(out,{recursive:true})
const circuit=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const names=new Map(circuit.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e.name]))
const length=r=>r.slice(1).reduce((s,p,i)=>s+(p.route_type==='via'?1.6:0)+(p.route_type==='wire'&&r[i].route_type==='wire'&&p.layer===r[i].layer?Math.hypot(p.x-r[i].x,p.y-r[i].y):0),0)
const changes=[],rejected=[]
const parent=new Map()
const find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of circuit.filter(e=>e.type==='source_trace'))for(const member of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(member))
const physical=()=>{
 const result={}
 for(const name of g350DdrPhysicalChecks){const errors=checks[name](circuit);if(errors.length)result[name]=errors}
 const strict=checkG350ViaTrackManufacturingClearance(circuit.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e))
 if(strict.length)result.manufacturingViaTrack=strict
 return result
}
assert.equal(Object.keys(physical()).length,0,'Input must pass physical checks')
for(const trace of circuit.filter(e=>e.type==='pcb_trace')){
 const name=names.get(trace.source_trace_id)
 if(!name?.startsWith('DDR_')||/DQS|DQSn|^DDR_CK[n]?$|RESET/.test(name))continue
 const target=/^DDR_D/.test(name)?34:37.2
 const original=structuredClone(trace.route),before=length(original)
 if(before<=target+.01)continue
 const guard=createG350LocalGuard(circuit,trace)
 let edits=0
 while(edits<20){
  const route=trace.route,total=length(route),candidates=[]
  for(let i=0;i<route.length-2;i++){
   const a=route[i];if(a.route_type!=='wire')continue
   let old=0
   for(let j=i+1;j<route.length;j++){
    const b=route[j],prev=route[j-1]
    if(b.route_type!=='wire'||b.layer!==a.layer||prev.route_type!=='wire'||Math.abs((b.width??.1016)-(a.width??.1016))>1e-8)break
    old+=Math.hypot(prev.x-b.x,prev.y-b.y)
    if(j-i<2)continue
    const gain=old-Math.hypot(a.x-b.x,a.y-b.y)
    if(gain<.02||total-gain<target-.001||!guard([a,b]))continue
    candidates.push({i,j,gain})
   }
  }
  if(!candidates.length)break
  candidates.sort((a,b)=>b.gain-a.gain)
  const best=candidates[0];trace.route=[...route.slice(0,best.i+1),...route.slice(best.j)];edits++
 }
 if(!edits)continue
 const failures=physical()
 if(Object.keys(failures).length){trace.route=original;rejected.push({name,edits,checks:Object.fromEntries(Object.entries(failures).map(([n,e])=>[n,e.length]))});continue}
 delete trace.trace_length
 changes.push({name,beforeMm:before,afterMm:length(trace.route),edits})
 console.log(JSON.stringify(changes.at(-1)))
}
const failures=physical();assert.equal(Object.keys(failures).length,0)
const report={inputSha256:createHash('sha256').update(fs.readFileSync(input)).digest('hex'),changes,rejected,physicalErrors:failures,remainingSkew:checks.checkPcbBusLengthSkew(circuit),fabricationReady:false,requiresFreshSourceAndIndependentVerification:true}
fs.writeFileSync(`${out}/candidate.circuit.json`,JSON.stringify(circuit,null,2)+'\n')
fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({changed:changes.length,rejected:rejected.length}))
