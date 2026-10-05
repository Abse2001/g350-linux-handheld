import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'

const [pairDirectory,directory]=process.argv.slice(2);assert(pairDirectory&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${pairDirectory}/result.json`)
assert.equal(hash(prior.source.path),prior.source.sha256)
assert.equal(hash(prior.output.path),prior.output.sha256)
const source=read(prior.source.path),input=read(prior.output.path),type=t=>source.filter(e=>e.type===t)
const point=(name,pin)=>{
  const component=type('source_component').find(c=>c.name===name);assert(component)
  const sp=type('source_port').find(p=>p.source_component_id===component.source_component_id&&p.pin_number===pin);assert(sp)
  const pp=type('pcb_port').find(p=>p.source_port_id===sp.source_port_id);assert(pp)
  assert.deepEqual(pp.layers,['top'])
  return {x:pp.x,y:pp.y,layer:'top',pointId:pp.pcb_port_id,pcb_port_id:pp.pcb_port_id,sourcePortId:sp.source_port_id}
}
const definitions=[{name:'USB_CC1_ROUTE',net:'USB_CC1',from:['J_USB',6],to:['R_USB_CC1',1]},
  {name:'USB_CC2_ROUTE',net:'USB_CC2',from:['J_USB',12],to:['R_USB_CC2',1]}]
input.connections=definitions.map(d=>{
  const from=point(...d.from),to=point(...d.to)
  const original=type('source_trace').find(t=>t.connected_source_port_ids.includes(from.sourcePortId));assert(original)
  const obstacle=input.obstacles.find(o=>o.circuitJsonMetadata?.pcb_port_id===to.pcb_port_id);assert(obstacle?.connectedTo.includes(original.source_trace_id))
  d.sourceTraceId=original.source_trace_id
  return {name:original.source_trace_id,source_trace_id:original.source_trace_id,width:.2,nominalTraceWidth:.2,pointsToConnect:[from,to]}
})
input.buses=definitions.map(d=>({name:d.name,busId:d.name,connectionNames:[d.sourceTraceId],traceWidth:.2,allowedLayers:['top']}))
input.differentialPairs=[]
assert.equal(input.traces.length,83)
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,912)
mkdirSync(directory,{recursive:true})
const inputPath=`${directory}/input.simple-route.json`;writeFileSync(inputPath,JSON.stringify(input)+'\n')
const solver=new SOLVERS.BusLanesSolver(input),start=performance.now()
let steps=0
while(!solver.failed&&!solver.solved&&performance.now()-start<45000){solver.step();steps++}
const report={status:solver.solved?'NATIVE_USB_CC_ROUTED_PENDING_CHECKS':'NATIVE_USB_CC_FAILED_OR_TIMEOUT',source:prior.source,
  priorPair:{path:`${pairDirectory}/result.json`,sha256:hash(`${pairDirectory}/result.json`)},input:{path:inputPath,sha256:hash(inputPath)},
  definitions,solver:'@tscircuit/core SOLVERS.BusLanesSolver',steps,elapsedSeconds:(performance.now()-start)/1000,
  error:solver.error??null,completedCcChannels:solver.solved?2:0,sourceTracesRetained:83,actualPadsRetained:912,
  fabricationReady:false,controlledImpedanceQualified:false}
if(solver.solved){
  const output={...input,traces:[...input.traces,...solver.traces]}
  assert.equal(output.traces.length,85)
  const outputPath=`${directory}/output.simple-route.json`;writeFileSync(outputPath,JSON.stringify(output)+'\n')
  report.output={path:outputPath,sha256:hash(outputPath)}
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report));process.exitCode=solver.solved?0:1
