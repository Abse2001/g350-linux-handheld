import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {readRoutingSourceSnapshot} from './lib/am3352-routing-source-snapshot.mjs'

// Prepare all RAM command dogbones jointly before manual CPU fanouts.
// Virtual bottom CPU targets are preparation descriptors only. The saved
// channel input retains the actual top CPU pads and the source netlist.
const [bootstrap,directory]=process.argv.slice(2);assert(bootstrap&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),actual=read(`${bootstrap}/input.simple-route.json`)
assert.deepEqual(prior.temporaryOpenSignals,['DDR_DQS1','DDR_DQSn1'])
const source=readRoutingSourceSnapshot(prior.source).circuit
const bus=actual.buses.find(b=>b.name==='DDR_COMMAND_CLOCK');assert(bus);assert.equal(bus.connectionNames.length,26)
assert.deepEqual(bus.allowedLayers,['top'])
const names=new Set(bus.connectionNames),input=structuredClone(actual)
input.connections=input.connections.filter(c=>names.has(c.name)).map(c=>{
  assert(c.pointsToConnect.every(p=>p.layer==='top'))
  return {...c,pointsToConnect:[{x:c.pointsToConnect[0].x,y:c.pointsToConnect[0].y,layer:'bottom'},c.pointsToConnect[1]]}
})
input.buses=[{...structuredClone(bus),allowedLayers:['bottom']}]
input.differentialPairs=input.differentialPairs.filter(p=>p.connectionNames.every(n=>names.has(n)))
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,882)
assert.deepEqual(input.traces,actual.traces);assert.deepEqual(input.obstacles,actual.obstacles)
const solver=new SOLVERS.BusLanesPipelineSolver(input);solver.prepare()
assert.equal(solver.escapes.length,26)
for(const t of solver.escapes){
  const c=actual.connections.find(c=>c.name===t.source_trace_id);assert(c)
  assert.equal(t.pcb_trace_id,`local_dogbone_${c.name}_1`)
  assert(Math.hypot(t.route[0].x-c.pointsToConnect[1].x,t.route[0].y-c.pointsToConnect[1].y)<1e-6)
  assert.equal(t.route[0].layer,'top');assert.equal(t.route.at(-1).layer,'bottom')
  assert.equal(t.route.filter(p=>p.route_type==='via').length,1)
}
assert.equal(source.filter(e=>e.type==='pcb_trace').length,89)
mkdirSync(directory,{recursive:true})
writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(actual)+'\n')
writeFileSync(`${directory}/native-ram-preparation.input.json`,JSON.stringify(input)+'\n')
writeFileSync(`${directory}/signal-escapes.native.json`,JSON.stringify(solver.escapes,null,2)+'\n')
const report={...prior,status:'NATIVE_RAM_COMMAND_DOGBONES_PREPARED_CPU_PADS_UNMODIFIED',preparedLocalEscapes:26,
  input:{path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)},
  nativeRamOnlyPreparation:{input:{path:`${directory}/native-ram-preparation.input.json`,sha256:hash(`${directory}/native-ram-preparation.input.json`)},
    solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver.prepare',ramPadDogbones:26,
    virtualCpuTargetDescriptors:26,virtualCpuTargetsExported:false,actualCpuPadEndpointsUnchanged:true,
    scope:'RAM-only native dogbone bootstrap. Manual CPU paths must begin at actual top-layer numeric pads. No intermediate virtual target may be exported.'},
  fabricationReady:false,completedSignalChannels:0}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,ramDogbones:26,actualSourceTracesRetained:89,actualPadObstacles:882}))
