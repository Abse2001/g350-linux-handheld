import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'

// Reserve every DDR endpoint together rather than letting an early byte
// consume a later byte's legal dogbone sites. All routing stays native.
const inputPath=process.argv[2]??'dist/am3352-host-native-dogbones/input.simple-route.json'
const outputDirectory=process.argv[3]??'dist/am3352-host-coordinated-ddr'
const seconds=Number(process.argv[4]??90)
assert(Number.isFinite(seconds)&&seconds>0&&seconds<=600)
const raw=readFileSync(inputPath),input=JSON.parse(raw)
assert.equal(input.connections.length,49)
assert.equal(input.traces?.length??0,0)
assert.equal(input.layerCount,4,'Current reroute is limited to four copper layers')
const layers=['top','inner1','inner2','bottom']
assert(input.buses.every(b=>b.allowedLayers?.length&&b.allowedLayers.every(l=>layers.includes(l))))
assert.equal(input.minViaPadDiameter,.35)
assert.equal(input.minViaHoleDiameter,.15)
assert.equal(new Set(input.buses.flatMap(b=>b.connectionNames)).size,49)
mkdirSync(outputDirectory,{recursive:true})
const solver=new SOLVERS.BusLanesPipelineSolver(input)
const start=performance.now(),deadline=start+seconds*1000
let nextProgress=start+10000,steps=0
while(!solver.solved&&!solver.failed&&performance.now()<deadline) {
  solver.step();steps++
  if(performance.now()>=nextProgress) {
    console.log(JSON.stringify({elapsedSeconds:(performance.now()-start)/1000,steps,
      phase:solver.phase,childPhase:solver.child?.phase,completedLanePieces:solver.completedLanes?.length??0}))
    nextProgress=performance.now()+10000
  }
}
const report={status:solver.solved?'NATIVE_COMPLETE_DDR_SOLVE_PENDING_PHYSICAL_CHECKS':solver.failed?'NATIVE_DDR_SOLVE_FAILED':'NATIVE_DDR_SOLVE_TIMEOUT',
  solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',coreVersion:JSON.parse(readFileSync('node_modules/@tscircuit/core/package.json')).version,
  input:{path:inputPath,sha256:createHash('sha256').update(raw).digest('hex')},elapsedSeconds:(performance.now()-start)/1000,steps,
  phase:solver.phase,childPhase:solver.child?.phase,error:solver.error??null,failureCode:solver.failureCode??null,
  copperLayerCount:4,preparedEscapes:solver.escapes?.length??0,completedLanePieces:solver.completedLanes?.length??0,fabricationReady:false}
if(solver.solved) {
  const output=solver.getOutput()
  assert.equal(output.traces.length,49)
  writeFileSync(`${outputDirectory}/output.simple-route.json`,JSON.stringify(output)+'\n')
  report.output={path:`${outputDirectory}/output.simple-route.json`,sha256:createHash('sha256').update(readFileSync(`${outputDirectory}/output.simple-route.json`)).digest('hex')}
}
writeFileSync(`${outputDirectory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report))
process.exitCode=solver.solved?0:1
