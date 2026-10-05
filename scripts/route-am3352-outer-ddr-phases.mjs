import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'

// Replay the source's four native bus_lanes phases independently. The earlier
// all-bus trial tried the 26-lane command bus first and discarded every lane
// after its failure. Keep all physical obstacles and previously solved copper.
const inputPath=process.argv[2]??'dist/am3352-four-layer-outer-reserved-attempt-27/input.simple-route.json'
const directory=process.argv[3]??'dist/am3352-four-layer-outer-phased-attempt-30'
const seconds=Number(process.argv[4]??60)
assert(Number.isFinite(seconds)&&seconds>0&&seconds<=180)
const original=JSON.parse(readFileSync(inputPath))
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
assert.equal(original.layerCount,4)
assert.equal(original.connections.length,49)
assert([2,41,69].includes(original.traces.length),'Keep all audited source copper, including package and bypass escapes')
assert.equal(original.allowBlindAndBuriedVias,false)
assert.equal(original.minViaPadDiameter,.4572)
assert.equal(original.minViaHoleDiameter,.254)
assert(original.buses.every(b=>b.allowedLayers.length===1&&['top','bottom'].includes(b.allowedLayers[0])))
assert.equal(original.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,882)
mkdirSync(directory,{recursive:true})
const report={status:'OUTER_LAYER_NATIVE_PHASES_IN_PROGRESS',input:{path:inputPath,sha256:hash(inputPath)},
  copperLayerCount:4,signalLayers:['top','bottom'],reservedReferenceLayers:{inner1:'GND',inner2:'DDR_1V5'},
  solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',actualPadObstacles:882,
  phases:[],completedSignals:0,requiredSignals:49,fabricationReady:false,
  scope:'Native phased DDR trial on the actual host. Supply, reference plane connections, complete handheld and electrical timing remain incomplete.'}
let retained=structuredClone(original.traces)
const finish=()=>writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
for(const [index,bus] of original.buses.entries()){
  const names=new Set(bus.connectionNames)
  const input={...structuredClone(original),traces:structuredClone(retained),
    connections:original.connections.filter(c=>names.has(c.name)),buses:[bus],
    differentialPairs:original.differentialPairs.filter(p=>p.connectionNames.every(n=>names.has(n)))}
  const phasePath=`${directory}/phase-${index+1}.input.simple-route.json`
  writeFileSync(phasePath,JSON.stringify(input)+'\n')
  const solver=new SOLVERS.BusLanesPipelineSolver(input),start=performance.now()
  let steps=0,next=start+10000
  while(!solver.solved&&!solver.failed&&performance.now()-start<seconds*1000){
    solver.step();steps++
    if(performance.now()>=next){console.log(JSON.stringify({phase:bus.name,steps,elapsedSeconds:(performance.now()-start)/1000,solverPhase:solver.phase}));next=performance.now()+10000}
  }
  const phase={name:bus.name,input:{path:phasePath,sha256:hash(phasePath)},
    solved:solver.solved,failed:solver.failed,steps,elapsedSeconds:(performance.now()-start)/1000,
    preparedEscapes:solver.escapes.length,error:solver.error??null,failureCode:solver.failureCode??null}
  report.phases.push(phase)
  if(!solver.solved){report.status=solver.failed?'OUTER_LAYER_NATIVE_PHASE_FAILED':'OUTER_LAYER_NATIVE_PHASE_TIMEOUT';finish();process.exitCode=1;break}
  const output=solver.getOutput()
  assert.equal(output.traces.length,retained.length+names.size)
  for(let i=0;i<retained.length;i++)assert.deepEqual(output.traces[i],retained[i],'Prior copper must remain byte-for-byte intact')
  for(const t of output.traces.slice(retained.length)){
    assert(names.has(t.source_trace_id))
    assert(t.route.every(p=>p.route_type!=='wire'||['top','bottom'].includes(p.layer)))
    for(const p of t.route.filter(p=>p.route_type==='via')){
      assert.equal(p.via_diameter,.4572);assert.equal(p.via_hole_diameter,.254)
      assert.deepEqual(p.layers,['top','inner1','inner2','bottom'])
    }
  }
  retained=output.traces;report.completedSignals+=names.size
  const outputPath=`${directory}/phase-${index+1}.output.simple-route.json`
  writeFileSync(outputPath,JSON.stringify(output)+'\n')
  phase.output={path:outputPath,sha256:hash(outputPath)}
  const checkpoint={...original,traces:retained}
  writeFileSync(`${directory}/checkpoint.simple-route.json`,JSON.stringify(checkpoint)+'\n')
  finish();console.log(JSON.stringify(phase))
}
if(report.completedSignals===49){report.status='OUTER_LAYER_NATIVE_PHASES_SOLVED_PENDING_INDEPENDENT_CHECKS';finish()}
console.log(JSON.stringify(report))
