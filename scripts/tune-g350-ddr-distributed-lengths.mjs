// Batch planar-only proposals. Every batch runs unchanged complete physical
// checks; source/export/pad/fill/Gerber qualification is still required.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {gzipSync} from 'node:zlib'
import * as checks from '@tscircuit/checks'
import {tuneOneG350DdrTrace,ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'

const [input,root,roundsText='12',secondsText='4']=process.argv.slice(2)
assert(input&&root&&!fs.existsSync(root));fs.mkdirSync(root,{recursive:true})
const rounds=Number(roundsText),seconds=Number(secondsText)
assert(Number.isInteger(rounds)&&rounds>0&&rounds<=40&&seconds>0&&seconds<=60)
const steps=process.env.G350_LENGTH_STEPS?.split(',').map(Number)??[1.2,.6,.3,.1]
assert(steps.length&&steps.length<=8&&steps.every(n=>Number.isFinite(n)&&n>0&&n<=6)&&steps.every((n,i)=>i===0||n<steps[i-1]))
const proposalLayers=process.env.G350_LENGTH_SIGNAL_LAYERS?.split(',')??['top','inner1','inner2','bottom']
assert(proposalLayers.length&&proposalLayers.every(l=>['top','inner1','inner2','bottom'].includes(l)))
assert.equal(process.env.G350_LENGTH_SIMPLIFY_SECONDS,'0')
assert.equal(process.env.G350_LENGTH_MOVE_BENDS,'1')
const verifyGround=process.env.G350_LENGTH_VERIFY_GROUND==='1'
assert(process.env.G350_LENGTH_VERIFY_GROUND===undefined||['0','1'].includes(process.env.G350_LENGTH_VERIFY_GROUND))
const groundPerUnit=process.env.G350_LENGTH_GROUND_PER_UNIT==='1'
assert(process.env.G350_LENGTH_GROUND_PER_UNIT===undefined||['0','1'].includes(process.env.G350_LENGTH_GROUND_PER_UNIT))
assert(!groundPerUnit||verifyGround,'Per-unit ground checks require the existing fresh baseline and batch checks')
const minimumWindow=Number(process.env.G350_LENGTH_MINIMUM_WINDOW_MM??'Infinity')
assert(process.env.G350_LENGTH_MINIMUM_WINDOW_MM===undefined||(Number.isFinite(minimumWindow)&&minimumWindow>=0&&minimumWindow<=10))
for(const p of ['scripts/tune-g350-ddr-distributed-lengths.mjs','scripts/lib/g350-full-board-length-tuning.mjs','scripts/lib/g350-ddr-planar-planning-validator.mjs','scripts/lib/g350-ddr-local-guard.mjs','scripts/lib/g350-ddr-physical-checks.mjs','scripts/lib/g350-locked-ground-fill.mjs'])fs.copyFileSync(p,root+'/'+p.replaceAll('/','__'))
let circuit=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const baseline=structuredClone(circuit),validator=createG350PlanarPlanningValidator(circuit)
const names=new Map(circuit.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e.name]))
const selectedBuses=process.env.G350_LENGTH_BUSES?.split(',')??['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK']
assert(selectedBuses.length&&new Set(selectedBuses).size===selectedBuses.length&&selectedBuses.every(n=>['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(n)))
const buses=circuit.filter(e=>e.type==='source_bus'&&selectedBuses.includes(e.name))
assert.equal(buses.length,selectedBuses.length)
const selectedSignals=process.env.G350_LENGTH_SIGNALS?.split(',')??null
if(selectedSignals){assert(selectedSignals.length&&new Set(selectedSignals).size===selectedSignals.length);assert(selectedSignals.every(n=>circuit.some(e=>e.type==='source_trace'&&e.name===n&&buses.some(b=>b.source_trace_ids.includes(e.source_trace_id)))))}
const pairs=[['DDR_DQS0','DDR_DQSn0'],['DDR_DQS1','DDR_DQSn1'],['DDR_CK','DDR_CKn']]
const groups=()=>buses.map(b=>{const rows=circuit.filter(e=>e.type==='pcb_trace'&&b.source_trace_ids.includes(e.source_trace_id)).map(t=>({name:names.get(t.source_trace_id),lengthMm:ddrRouteLength(t.route)}));return {name:b.name,rows,skewMm:Math.max(...rows.map(r=>r.lengthMm))-Math.min(...rows.map(r=>r.lengthMm)),limitMm:b.max_length_skew}})
const progress=[],batchChecks=[]
const groundChecks=[]
const unitGroundChecks=[]
if(verifyGround){const g=await fillG350LockedGround(circuit);assert.equal(g.portErrors,0,'Ground-guarded planning requires a connected baseline');groundChecks.push({round:0,portErrors:g.portErrors,elapsedSeconds:g.elapsedSeconds});fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')}
const hash=s=>createHash('sha256').update(s).digest('hex')
const environment=Object.fromEntries(['G350_LENGTH_SIMPLIFY_SECONDS','G350_LENGTH_MOVE_BENDS','G350_LENGTH_BALANCED_SEARCH','G350_LENGTH_SIGNAL_LAYERS','G350_LENGTH_STEPS','G350_LENGTH_BUSES','G350_LENGTH_VERIFY_GROUND','G350_LENGTH_MINIMUM_WINDOW_MM','G350_LENGTH_GROUND_PER_UNIT','G350_LENGTH_SIGNALS','G350_LENGTH_INSERT_BENDS','G350_LENGTH_MINIMUM_NEW_BEND_ANGLE_DEGREES'].map(k=>[k,process.env[k]??null]))
const persist=()=>{
 fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(circuit,null,2)+'\n')
 fs.writeFileSync(root+'/report.json',JSON.stringify({input,inputSha256:hash(fs.readFileSync(input)),checksSha256:hash(fs.readFileSync('node_modules/@tscircuit/checks/dist/index.js')),roundsRequested:rounds,secondsPerProposal:seconds,environment,incrementalChecksScope:'Planar trace proposals; immutable via/pad/board checks reused within a batch, full unchanged checks before retaining every batch',progress,batchChecks,groundChecks,unitGroundChecks,groups:groups(),skewErrors:checks.checkPcbBusLengthSkew(circuit),requiresFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n')
}
for(let round=1;round<=rounds;round++){
 const batchBefore=structuredClone(circuit);let accepted=0
 for(const bus of buses){
  const members=circuit.filter(e=>e.type==='pcb_trace'&&bus.source_trace_ids.includes(e.source_trace_id)),goal=Math.max(...members.map(t=>ddrRouteLength(t.route)))
  const units=members.filter(t=>!pairs.some(p=>p.includes(names.get(t.source_trace_id)))).map(t=>[t.source_trace_id])
  for(const pair of pairs){const ids=members.filter(t=>pair.includes(names.get(t.source_trace_id))).map(t=>t.source_trace_id);if(ids.length===2)units.push(ids)}
  units.sort((a,b)=>ddrRouteLength(circuit.find(t=>t.type==='pcb_trace'&&t.source_trace_id===a[0]).route)-ddrRouteLength(circuit.find(t=>t.type==='pcb_trace'&&t.source_trace_id===b[0]).route))
  for(const ids of units){
   if(selectedSignals&&!ids.every(id=>selectedSignals.includes(names.get(id))))continue
   if(ids.some(id=>!circuit.find(t=>t.type==='pcb_trace'&&t.source_trace_id===id).route.some(p=>p.route_type==='wire'&&proposalLayers.includes(p.layer))))continue
   const before=structuredClone(circuit);let success=false,details=[]
   const lengths=ids.map(id=>ddrRouteLength(circuit.find(t=>t.type==='pcb_trace'&&t.source_trace_id===id).route))
   const busMinimum=Math.min(...members.map(t=>ddrRouteLength(circuit.find(e=>e.type==='pcb_trace'&&e.source_trace_id===t.source_trace_id).route)))
   if(Math.min(...lengths)>busMinimum+minimumWindow)continue
   if(goal-Math.min(...lengths)<=bus.max_length_skew*.8)continue
   for(const step of steps){
    circuit=structuredClone(before);details=[];success=true
    const target=Math.min(goal,Math.max(...lengths)+step)
    for(const id of ids){
     const t=circuit.find(e=>e.type==='pcb_trace'&&e.source_trace_id===id)
     const vias=JSON.stringify(t.route.filter(p=>p.route_type==='via')),ends=JSON.stringify([t.route[0],t.route.at(-1)])
     const result=tuneOneG350DdrTrace(circuit,t,target,seconds,{planningValidator:validator.validate,allowNewVias:false})
     validator.assertImmutable(circuit)
     assert.equal(JSON.stringify(t.route.filter(p=>p.route_type==='via')),vias);assert.equal(JSON.stringify([t.route[0],t.route.at(-1)]),ends)
     if(result.found)delete t.trace_length
     details.push({signal:names.get(id),beforeMm:lengths[ids.indexOf(id)],afterMm:ddrRouteLength(t.route),step,...result})
     success&&=result.found
     if(!success)break
    }
    if(ids.length===2)success&&=Math.abs(details[0].afterMm-(details[1]?.afterMm??Infinity))<=.127
    success&&=details.some(d=>d.afterMm>d.beforeMm+.005)
    if(success&&groundPerUnit){
     const g=await fillG350LockedGround(circuit)
     const record={round,bus:bus.name,signals:ids.map(id=>names.get(id)),step,portErrors:g.portErrors,elapsedSeconds:g.elapsedSeconds,passed:g.portErrors===0}
     if(g.portErrors){
      const payload=JSON.stringify(g.circuit,null,2)+'\n',path=root+'/rejected-unit-ground-'+(unitGroundChecks.length+1)+'.circuit.json.gz',compressed=gzipSync(payload,{level:6})
      fs.writeFileSync(path,compressed)
      record.rejectedArtifact={path,sha256:hash(compressed),originalSha256:hash(payload),originalBytes:Buffer.byteLength(payload)};record.errors=g.errors
      success=false
     }
     unitGroundChecks.push(record);console.log(JSON.stringify({unitGroundCheck:{...record,errors:undefined}}))
    }
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
 let groundPassed=true
 if(passed&&verifyGround){
  const g=await fillG350LockedGround(circuit);groundPassed=g.portErrors===0
  groundChecks.push({round,portErrors:g.portErrors,elapsedSeconds:g.elapsedSeconds,passed:groundPassed,candidateSha256:hash(payload),errors:g.errors})
  if(groundPassed)fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')
  else{fs.writeFileSync(root+`/rejected-ground-batch-${round}.circuit.json`,JSON.stringify(g.circuit,null,2)+'\n');circuit=batchBefore;batchChecks.at(-1).retained=false;batchChecks.at(-1).reason='Fresh native ground connectivity failed; entire batch rolled back'}
 }
 persist();console.log(JSON.stringify({round,accepted,fullPhysicalChecksPassed:passed,groundChecked:verifyGround,freshGroundPassed:verifyGround?groundPassed:null,batchRetained:passed&&groundPassed,skews:groups().map(g=>[g.name,g.skewMm])}))
 assert(passed,'Reject the entire batch on any complete-check failure')
 if(!groundPassed)break
 if(!accepted||groups().every(g=>g.skewMm<=g.limitMm))break
}
assert.deepEqual(circuit.filter(e=>e.type==='pcb_component'),baseline.filter(e=>e.type==='pcb_component'))
persist()
