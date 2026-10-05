import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'

// Preserve actual native bus_lanes byte0 copper and let the local general
// autorouter repair the other channels. No finished-board import, hidden
// copper layer or deletion of obstacles. End-to-end skew and physical DRC
// are mandatory after this trial; a solve alone cannot qualify DDR.
const bootstrapPath='dist/am3352-host-four-layer-attempt-21/phase-2.input.simple-route.json'
const fullPath='dist/am3352-four-layer-native-coordinated-dogbones/input.simple-route.json'
const directory=process.argv[2]??'dist/am3352-host-four-layer-repair-attempt-25'
const seconds=Number(process.argv[3]??90)
assert(Number.isFinite(seconds)&&seconds>0&&seconds<=180)
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const input=JSON.parse(readFileSync(bootstrapPath)),full=JSON.parse(readFileSync(fullPath))
assert.equal(input.layerCount,4);assert.equal(full.layerCount,4)
assert.equal(input.traces.length,11);assert.equal(full.connections.length,49)
assert.equal(input.allowBlindAndBuriedVias,false)
const completed=new Set(input.traces.map(t=>t.source_trace_id??t.connection_name))
assert.equal(completed.size,11)
input.connections=full.connections.filter(c=>!completed.has(c.name))
assert.equal(input.connections.length,38)
input.buses=full.buses.filter(b=>!b.connectionNames.every(n=>completed.has(n)))
assert(input.buses.every(b=>b.connectionNames.every(n=>!completed.has(n))))
input.differentialPairs=full.differentialPairs.filter(p=>p.connectionNames.every(n=>!completed.has(n)))
const originalPads=full.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id)
for(const o of originalPads)assert(input.obstacles.some(p=>p.circuitJsonMetadata?.pcb_smtpad_id===o.circuitJsonMetadata.pcb_smtpad_id&&Math.hypot(p.center.x-o.center.x,p.center.y-o.center.y)<1e-6))
mkdirSync(directory,{recursive:true})
writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(input)+'\n')
const solver=new SOLVERS.AutoroutingPipelineSolver9_PreloadedTraceGraph(input,{effort:2})
const start=performance.now();let steps=0,next=start+10000
while(!solver.solved&&!solver.failed&&performance.now()-start<seconds*1000){
  if(typeof solver.stepAsync==='function')await solver.stepAsync();else solver.step()
  steps++
  if(performance.now()>=next){console.log(JSON.stringify({steps,elapsedSeconds:(performance.now()-start)/1000,progress:solver.progress}));next=performance.now()+10000}
}
const report={status:solver.solved?'FOUR_LAYER_REPAIR_SOLVED_PENDING_CONNECTIVITY_SKEW_AND_DRC':solver.failed?'FOUR_LAYER_REPAIR_FAILED':'FOUR_LAYER_REPAIR_TIMEOUT',
  nativeBootstrap:{path:bootstrapPath,sha256:hash(bootstrapPath),unchangedSignals:11},
  completeDdrInput:{path:fullPath,sha256:hash(fullPath)},solver:'SOLVERS.AutoroutingPipelineSolver9_PreloadedTraceGraph',
  copperLayerCount:4,maxCopperLayers:4,remainingConnections:38,actualPadObstacles:originalPads.length,
  input:{path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)},
  steps,elapsedSeconds:(performance.now()-start)/1000,error:solver.error??null,fabricationReady:false,
  scope:'General-router DDR repair after native bus_lanes bootstrap. Not yet independently checked; timing, power copper, planes and complete handheld remain required.'}
if(solver.solved){
  const traces=solver.getOutputSimplifiedPcbTraces()
  writeFileSync(`${directory}/output.native-traces.json`,JSON.stringify(traces)+'\n')
  report.output={path:`${directory}/output.native-traces.json`,sha256:hash(`${directory}/output.native-traces.json`),tracePieces:traces.length}
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
process.exitCode=solver.solved?0:1
