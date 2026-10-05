import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {readRoutingSourceSnapshot} from './lib/am3352-routing-source-snapshot.mjs'

const [bootstrap,directory,duration='45']=process.argv.slice(2);assert(bootstrap&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),actual=read(`${bootstrap}/input.simple-route.json`)
const source=readRoutingSourceSnapshot(prior.source).circuit
assert.equal(prior.preservedSavedDdr.signals,22)
const reset=source.find(e=>e.type==='source_trace'&&e.name==='DDR_RESETn');assert(reset)
const input=structuredClone(actual)
input.connections=input.connections.filter(c=>c.name===reset.source_trace_id)
input.buses=input.buses.filter(b=>b.name==='DDR_RESET')
input.differentialPairs=[]
assert.equal(input.connections.length,1);assert.equal(input.buses.length,1)
assert.deepEqual(input.buses[0].allowedLayers,['top'])
assert.deepEqual(input.obstacles,actual.obstacles);assert.deepEqual(input.traces,actual.traces)
assert.equal(input.traces.length,91);assert.equal(input.layerCount,4)
mkdirSync(directory,{recursive:true})
const path=`${directory}/input.simple-route.json`;writeFileSync(path,JSON.stringify(input)+'\n')
const solver=new SOLVERS.BusLanesPipelineSolver(input),start=performance.now()
let iterations=0,next=start+10000
while(!solver.solved&&!solver.failed&&performance.now()-start<Number(duration)*1000){
  solver.step();iterations++
  if(performance.now()>next){console.log(JSON.stringify({iterations,phase:solver.phase,childPhase:solver.child?.phase,elapsedSeconds:(performance.now()-start)/1000}));next=performance.now()+10000}
}
const report={...prior,status:solver.solved?'NATIVE_RESET_ROUTED_PENDING_INDEPENDENT_CHECKS':'NATIVE_RESET_FAILED_OR_TIMEOUT',bus:'DDR_RESET',
  input:{path,sha256:hash(path)},sourceTracesRetained:91,previouslySavedDdrSignals:22,completedSignals:solver.solved?1:0,
  totalDdrSignalsAfterPhase:solver.solved?23:22,remainingSynchronousSignals:26,
  channel:{solved:solver.solved,failed:solver.failed,error:solver.error??null,iterations,elapsedSeconds:(performance.now()-start)/1000,
    phase:solver.phase,childPhase:solver.child?.phase,stats:solver.stats},fabricationReady:false}
if(solver.solved){
  const output=solver.getOutput();assert.equal(output.traces.length,92)
  for(let i=0;i<91;i++)assert.deepEqual(output.traces[i],input.traces[i])
  const t=output.traces[91];assert.equal(t.source_trace_id,reset.source_trace_id)
  assert(t.route.every(p=>p.route_type!=='wire'||p.layer==='top'))
  const out=`${directory}/output.simple-route.json`;writeFileSync(out,JSON.stringify(output)+'\n')
  report.output={path:out,sha256:hash(out)}
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,channel:report.channel}));process.exitCode=solver.solved?0:1
