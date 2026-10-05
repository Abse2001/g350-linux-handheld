import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS,getSimpleRouteJsonFromCircuitJson} from '@tscircuit/core'

// Native bus_lanes USB0 experiment against every real pad, keepout, and
// existing power/DDR trace. A solved pair still requires independent
// copper, length, return-path and stackup qualification.
const [sourcePath,directory,seconds='45',signalLayer='top',fanout='auto']=process.argv.slice(2)
assert(sourcePath&&directory&&['top','bottom'].includes(signalLayer))
assert(['auto','none','lane-bootstrap'].includes(fanout))
assert(Number(seconds)>0&&Number(seconds)<=120)
const raw=readFileSync(sourcePath),source=JSON.parse(raw)
const type=t=>source.filter(e=>e.type===t),board=type('pcb_board')[0]
assert.equal(board.num_layers,4)
assert.equal(source.filter(e=>e.type.endsWith('_error')).length,0)
const {simpleRouteJson:input}=getSimpleRouteJsonFromCircuitJson({circuitJson:source,
  minTraceWidth:board.min_trace_width,nominalTraceWidth:.15,
  minTraceToPadEdgeClearance:board.min_trace_to_pad_edge_clearance,
  minTraceToHoleEdgeClearance:board.min_trace_to_hole_edge_clearance,
  minViaHoleEdgeToViaHoleEdgeClearance:board.min_via_hole_edge_to_via_hole_edge_clearance,
  minPadEdgeToPadEdgeClearance:board.min_pad_edge_to_pad_edge_clearance,
  minBoardEdgeClearance:board.min_board_edge_clearance,
  minViaPadDiameter:board.min_via_pad_diameter,minViaHoleDiameter:board.min_via_hole_diameter})
const ids=['USB0_DP','USB0_DM'].map(name=>{
  const trace=type('source_trace').find(t=>t.name===name);assert(trace);return trace.source_trace_id
})
input.connections=input.connections.filter(c=>ids.includes(c.name))
assert.equal(input.connections.length,2)
assert(input.connections.every(c=>c.pointsToConnect.length===2))
input.buses=[{name:'USB0_DATA',busId:'USB0_DATA',connectionNames:ids,
  allowedLayers:[signalLayer],traceWidth:.15,maxLengthSkew:.127}]
input.differentialPairs=[{connectionNames:ids,traceGap:.15,lengthTolerance:.127}]
input.allowBlindAndBuriedVias=false
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,type('pcb_smtpad').length)
assert.equal(input.traces.length,type('pcb_trace').length)
for(const original of type('pcb_trace')){
  const converted=input.traces.find(t=>t.pcb_trace_id===original.pcb_trace_id);assert(converted)
  assert.deepEqual(converted.route.map(({route_type,x,y,layer,width})=>({route_type,x,y,layer,width})),
    original.route.map(({route_type,x,y,layer,width})=>({route_type,x,y,layer,width})))
}
mkdirSync(directory,{recursive:true})
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const inputPath=`${directory}/input.simple-route.json`
writeFileSync(inputPath,JSON.stringify(input)+'\n')
const solverOptions=fanout==='none'?{fanout:'none'}:{}
const solver=fanout==='lane-bootstrap'?new SOLVERS.BusLanesSolver(input):new SOLVERS.BusLanesPipelineSolver(input,solverOptions)
const start=performance.now()
let steps=0,next=start+10000
while(!solver.solved&&!solver.failed&&performance.now()-start<Number(seconds)*1000){
  solver.step();steps++
  if(performance.now()>=next){console.log(JSON.stringify({steps,elapsedSeconds:(performance.now()-start)/1000,
    phase:solver.phase,childPhase:solver.child?.phase}));next=performance.now()+10000}
}
const report={status:solver.solved?'NATIVE_USB0_PAIR_ROUTED_PENDING_CHECKS':solver.failed?'NATIVE_USB0_PAIR_FAILED':'NATIVE_USB0_PAIR_TIMEOUT',
  source:{path:sourcePath,sha256:hash(sourcePath)},input:{path:inputPath,sha256:hash(inputPath)},
  solver:fanout==='lane-bootstrap'?'@tscircuit/core SOLVERS.BusLanesSolver':'@tscircuit/core SOLVERS.BusLanesPipelineSolver',
  solverOptions,signalLayer,copperLayers:4,packageCouplingRefinementCompleted:false,
  preservedSourceTraces:input.traces.length,actualPadObstacles:type('pcb_smtpad').length,
  requiredUsbDataNets:2,completedCpuToEsdChannels:solver.solved?2:0,steps,
  elapsedSeconds:(performance.now()-start)/1000,error:solver.error??null,failureCode:solver.failureCode??null,
  nativeDiagnostics:{phase:solver.phase,childPhase:solver.child?.phase,stats:solver.stats},
  traceWidthMm:.15,pairGapMm:.15,maxLengthSkewMm:.127,
  connectorDuplicatePinsRouted:false,chargingPowerRouted:false,ccRouted:false,
  controlledImpedanceQualified:false,linuxInstallerTested:false,originalShellFitVerified:false,fabricationReady:false}
if(solver.solved){
  const output=fanout==='lane-bootstrap'?{...input,traces:[...input.traces,...solver.traces]}:solver.getOutput()
  assert.equal(output.traces.length,input.traces.length+2)
  for(let i=0;i<input.traces.length;i++)assert.deepEqual(output.traces[i],input.traces[i])
  const outputPath=`${directory}/output.simple-route.json`
  writeFileSync(outputPath,JSON.stringify(output)+'\n')
  report.output={path:outputPath,sha256:hash(outputPath)}
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report));process.exitCode=solver.solved?0:1
