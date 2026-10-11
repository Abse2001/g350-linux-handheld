// Retain complete, physically checked outer-layer channels from rejected plans.
// Missing channels and supply branches remain explicit; this never qualifies a board.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,jointPath,root]=process.argv.slice(2)
assert(input&&jointPath&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const inputSha=hash(input),jointSha=hash(jointPath)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const joint=JSON.parse(fs.readFileSync(jointPath)).filter(e=>!e.type.includes('error'))
for(const type of ['source_trace','source_bus','source_port','source_net','source_component','pcb_board','pcb_port','pcb_smtpad','pcb_component'])assert.deepEqual(base.filter(e=>e.type===type),joint.filter(e=>e.type===type),type)
const names=new Map(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>[e.source_trace_id,e.name]));assert.equal(names.size,49)
const routes=base.filter(e=>e.type==='pcb_trace'&&names.has(e.source_trace_id));assert(routes.length>0&&routes.length<=49);assert.equal(new Set(routes.map(t=>t.source_trace_id)).size,routes.length)
const ids=new Set(routes.map(t=>t.pcb_trace_id)),outside=e=>!(['pcb_trace','pcb_via'].includes(e.type)&&ids.has(e.pcb_trace_id))
const fixed=base.filter(outside),byId=new Map(routes.map(t=>[t.pcb_trace_id,t]))
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const ownerToId=new Map(routes.map(t=>[find(t.source_trace_id),t.pcb_trace_id]))
const ram=base.find(e=>e.type==='pcb_component'&&base.some(s=>s.type==='source_component'&&s.name==='U_RAM'&&s.source_component_id===e.source_component_id));assert(ram)
const ramPorts=new Set(base.filter(e=>e.type==='pcb_port'&&e.pcb_component_id===ram.pcb_component_id).map(p=>p.pcb_port_id))
const local=joint.filter(e=>e.type==='pcb_trace'&&(names.has(e.source_trace_id)||ramPorts.has(e.route[0]?.start_pcb_port_id)))
assert.equal(local.filter(t=>names.has(t.source_trace_id)).length,98)
assert.equal(local.filter(t=>!names.has(t.source_trace_id)).length,42)
function reservations(keep){
 const sourceIds=new Set([...keep].map(id=>byId.get(id).source_trace_id))
 const selected=new Set(local.filter(t=>!sourceIds.has(t.source_trace_id)).map(t=>t.pcb_trace_id))
 return joint.filter(e=>['pcb_trace','pcb_via'].includes(e.type)&&selected.has(e.pcb_trace_id))
}
const make=keep=>[...structuredClone(fixed),...structuredClone(base.filter(e=>['pcb_trace','pcb_via'].includes(e.type)&&keep.has(e.pcb_trace_id)))]
function qualify(keep){
 const circuit=make(keep),physical=[...structuredClone(circuit),...structuredClone(reservations(keep))]
 const details=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](structuredClone(n==='checkTracesAreContiguous'?circuit:physical))]))
 details.manufacturing=checkG350ViaTrackManufacturingClearance(physical.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e))
 return {circuit,physical,details,counts:Object.fromEntries(Object.entries(details).map(([n,e])=>[n,e.length]))}
}
function conflicts(result,keep){
 const vias=new Map(result.physical.filter(e=>e.type==='pcb_via').map(v=>[v.pcb_via_id,v.pcb_trace_id]))
 const edges=new Map([...keep].map(id=>[id,new Set()])),invalid=new Set()
 for(const [check,errors]of Object.entries(result.details))for(const error of errors){
  const affected=new Set()
  const add=id=>{if(keep.has(id))affected.add(id)}
  if(error.pcb_trace_id)add(error.pcb_trace_id)
  for(const vid of [error.pcb_via_id,...(error.pcb_via_ids??[])])if(vid)add(vias.get(vid))
  if(error.source_trace_id)add(ownerToId.get(find(error.source_trace_id)))
  if(check==='checkEachPcbTraceNonOverlapping')for(const id of keep){
   const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
   if(new RegExp('(?:^|_)'+escaped+'(?:_|$)').test(error.pcb_trace_error_id??''))add(id)
  }
  assert(affected.size>0,'Unattributed native error: '+JSON.stringify(error))
  if(affected.size===1)invalid.add([...affected][0])
  else for(const a of affected)for(const b of affected)if(a!==b)edges.get(a).add(b)
 }
 return {edges,invalid}
}
fs.mkdirSync(root);fs.copyFileSync('scripts/select-g350-outer-ddr-clean-carriers.mjs',root+'/helper.executed.mjs')
let keep=new Set(ids),result=qualify(keep);const history=[]
for(let round=0;round<4;round++){
 history.push({round,carriers:keep.size,counts:result.counts})
 if(Object.values(result.counts).every(n=>n===0))break
 const {edges,invalid}=conflicts(result,keep),remaining=new Set([...keep].filter(id=>!invalid.has(id))),selected=new Set()
 while(remaining.size){
  const best=[...remaining].sort((a,b)=>[...edges.get(a)].filter(id=>remaining.has(id)).length-[...edges.get(b)].filter(id=>remaining.has(id)).length||a.localeCompare(b))[0]
  selected.add(best);remaining.delete(best);for(const id of edges.get(best))remaining.delete(id)
 }
 assert(selected.size<keep.size,'Selection must reduce actual conflicts')
 keep=selected;result=qualify(keep)
}
const passed=Object.values(result.counts).every(n=>n===0)
assert.deepEqual(result.circuit.filter(outside),fixed)
for(const t of result.circuit.filter(e=>e.type==='pcb_trace'&&keep.has(e.pcb_trace_id))){
 assert.deepEqual(t,byId.get(t.pcb_trace_id))
 assert(t.route[0].start_pcb_port_id&&t.route.at(-1).end_pcb_port_id)
 assert(t.route.every(p=>p.route_type==='wire'?['top','bottom'].includes(p.layer):p.route_type==='via'&&['top','bottom'].includes(p.from_layer)&&['top','bottom'].includes(p.to_layer)&&p.from_layer!==p.to_layer))
}
assert.equal(hash(input),inputSha);assert.equal(hash(jointPath),jointSha)
fs.writeFileSync(root+'/partial-planning.circuit.json',JSON.stringify(result.circuit,null,2)+'\n')
fs.writeFileSync(root+'/physical-with-all-local-reservations.circuit.json',JSON.stringify(result.physical,null,2)+'\n')
const selectedNames=[...keep].map(id=>names.get(byId.get(id).source_trace_id))
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:inputSha},jointReference:{path:jointPath,sha256:jointSha},history,counts:result.counts,details:result.details,selectedNames,physicallyCheckedCompleteOuterChannels:passed?keep.size:0,required:49,missingDdrChannels:49-keep.size,allMissingCpuRamAnd42ReferenceFanoutsReserved:true,unchangedSelectedCopperAndAllForeignRecords:true,physicalPassed:passed,wholeBoardSourceReferenceGroundMatchingAndCadUnqualified:true,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({selectedNames,counts:result.counts,physicalPassed:passed,missing:49-keep.size}));process.exitCode=passed&&keep.size?0:2
