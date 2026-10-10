// Batch planar-only proposals. Every batch runs unchanged complete physical
// checks; source/export/pad/fill/Gerber qualification is still required.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {tuneOneG350DdrTrace,ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'

const [input,root,roundsText='12',secondsText='4']=process.argv.slice(2)
assert(input&&root&&!fs.existsSync(root));fs.mkdirSync(root,{recursive:true})
const rounds=Number(roundsText),seconds=Number(secondsText)
assert(Number.isInteger(rounds)&&rounds>0&&rounds<=40&&seconds>0&&seconds<=60)
assert.equal(process.env.G350_LENGTH_SIMPLIFY_SECONDS,'0')
assert.equal(process.env.G350_LENGTH_MOVE_BENDS,'1')
for(const p of ['scripts/tune-g350-ddr-distributed-lengths.mjs','scripts/lib/g350-full-board-length-tuning.mjs','scripts/lib/g350-ddr-planar-planning-validator.mjs','scripts/lib/g350-ddr-local-guard.mjs','scripts/lib/g350-ddr-physical-checks.mjs'])fs.copyFileSync(p,root+'/'+p.replaceAll('/','__'))
let circuit=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const baseline=structuredClone(circuit),validator=createG350PlanarPlanningValidator(circuit)
const names=new Map(circuit.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e.name]))
const buses=circuit.filter(e=>e.type==='source_bus'&&['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(e.name))
const pairs=[['DDR_DQS0','DDR_DQSn0'],['DDR_DQS1','DDR_DQSn1'],['DDR_CK','DDR_CKn']]
const groups=()=>buses.map(b=>{const rows=circuit.filter(e=>e.type==='pcb_trace'&&b.source_trace_ids.includes(e.source_trace_id)).map(t=>({name:names.get(t.source_trace_id),lengthMm:ddrRouteLength(t.route)}));return {name:b.name,rows,skewMm:Math.max(...rows.map(r=>r.lengthMm))-Math.min(...rows.map(r=>r.lengthMm)),limitMm:b.max_length_skew}})
const progress=[],batchChecks=[]
const hash=s=>createHash('sha256').update(s).digest('hex')
const environment=Object.fromEntries(['G350_LENGTH_SIMPLIFY_SECONDS','G350_LENGTH_MOVE_BENDS','G350_LENGTH_BALANCED_SEARCH'].map(k=>[k,process.env[k]??null]))
const persist=()=>{
 fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(circuit,null,2)+'\n')
 fs.writeFileSync(root+'/report.json',JSON.stringify({input,inputSha256:hash(fs.readFileSync(input)),checksSha256:hash(fs.readFileSync('node_modules/@tscircuit/checks/dist/index.js')),roundsRequested:rounds,secondsPerProposal:seconds,environment,incrementalChecksScope:'Planar trace proposals; immutable via/pad/board checks reused within a batch, full unchanged checks before retaining every batch',progress,batchChecks,groups:groups(),skewErrors:checks.checkPcbBusLengthSkew(circuit),requiresFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n')
}
for(let round=1;round<=rounds;round++){
 const batchBefore=structuredClone(circuit);let accepted=0
 for(const bus of buses){
  const members=circuit.filter(e=>e.type==='pcb_trace'&&bus.source_trace_ids.includes(e.source_trace_id)),goal=Math.max(...members.map(t=>ddrRouteLength(t.route)))
  const units=members.filter(t=>!pairs.some(p=>p.includes(names.get(t.source_trace_id)))).map(t=>[t.source_trace_id])
  for(const pair of pairs){const ids=members.filter(t=>pair.includes(names.get(t.source_trace_id))).map(t=>t.source_trace_id);if(ids.length===2)units.push(ids)}
  units.sort((a,b)=>ddrRouteLength(circuit.find(t=>t.type==='pcb_trace'&&t.source_trace_id===a[0]).route)-ddrRouteLength(circuit.find(t=>t.type==='pcb_trace'&&t.source_trace_id===b[0]).route))
  for(const ids of units){
   const before=structuredClone(circuit);let success=false,details=[]
   const lengths=ids.map(id=>ddrRouteLength(circuit.find(t=>t.type==='pcb_trace'&&t.source_trace_id===id).route))
   if(goal-Math.min(...lengths)<=bus.max_length_skew*.8)continue
   for(const step of [1.2,.6,.3,.1]){
    circuit=structuredClone(before);details=[];success=true
    const target=Math.min(goal,Math.max(...lengths)+step)
    for(const id of ids){
     const t=circuit.find(e=>e.type==='pcb_trace'&&e.source_trace_id===id)
     const vias=JSON.stringify(t.route.filter(p=>p.route_type==='via')),ends=JSON.stringify([t.route[0],t.route.at(-1)])
     const result=tuneOneG350DdrTrace(circuit,t,target,seconds,{planningValidator:validator.validate})
     validator.assertImmutable(circuit)
     assert.equal(JSON.stringify(t.route.filter(p=>p.route_type==='via')),vias);assert.equal(JSON.stringify([t.route[0],t.route.at(-1)]),ends)
     if(result.found)delete t.trace_length
     details.push({signal:names.get(id),beforeMm:lengths[ids.indexOf(id)],afterMm:ddrRouteLength(t.route),step,...result})
     success&&=result.found
     if(!success)break
    }
    if(ids.length===2)success&&=Math.abs(details[0].afterMm-(details[1]?.afterMm??Infinity))<=.127
    if(success)break
   }
   if(!success)circuit=before
   else accepted++
   progress.push({round,bus:bus.name,accepted:success,details});console.log(JSON.stringify(progress.at(-1)))
  }
 }
 const counts=validator.complete(circuit),passed=Object.values(counts).every(n=>n===0)
 const payload=JSON.stringify(circuit,null,2)+'\n'
 batchChecks.push({round,accepted,counts,passed,candidateSha256:hash(payload),groups:groups()})
 if(!passed){fs.writeFileSync(root+`/rejected-batch-${round}.circuit.json`,payload);circuit=batchBefore}
 persist();console.log(JSON.stringify({round,accepted,fullPhysicalChecksPassed:passed,skews:groups().map(g=>[g.name,g.skewMm])}))
 assert(passed,'Reject the entire batch on any complete-check failure')
 if(!accepted||groups().every(g=>g.skewMm<=g.limitMm))break
}
assert.deepEqual(circuit.filter(e=>e.type==='pcb_component'),baseline.filter(e=>e.type==='pcb_component'))
persist()
