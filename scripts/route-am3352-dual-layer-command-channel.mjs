import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'

const [bootstrap,directory,duration='60']=process.argv.slice(2);assert(bootstrap&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),input=read(prior.channel.input.path)
assert.equal(hash(prior.channel.input.path),prior.channel.input.sha256)
assert.equal(input.layerCount,4);assert.equal(input.connections.length,26);assert.equal(input.traces.length,217)
assert.equal(input.buses.length,25);assert.equal(input.differentialPairs.length,1)
assert.equal(prior.deferredCommandClassTimingRequirement.maxLengthSkew,.635)
assert.equal(input.differentialPairs[0].lengthTolerance,.127)
assert(input.connections.every(c=>c.pointsToConnect.every(p=>['top','bottom'].includes(p.layer))))
assert(input.buses.every(b=>b.allowedLayers.every(l=>['top','bottom'].includes(l))))
input.obstacles=input.obstacles.map(o=>{
 if(!['U_SOC','U_RAM'].includes(o.circuitJsonMetadata?.source_component_name))return o
 const {componentId,...rest}=o;return rest
})
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,882)
mkdirSync(directory,{recursive:true})
const inputPath=`${directory}/channel.input.simple-route.json`;writeFileSync(inputPath,JSON.stringify(input)+'\n')
const solverOptions={fanout:'none',smoothTuning:true}
const solver=new SOLVERS.BusLanesPipelineSolver(input,solverOptions),begun=performance.now()
let iterations=0,next=begun+10000
while(!solver.solved&&!solver.failed&&performance.now()-begun<Number(duration)*1000){
 solver.step();iterations++
 if(performance.now()>next){console.log(JSON.stringify({iterations,phase:solver.phase,childPhase:solver.child?.phase,stats:solver.stats}));next=performance.now()+10000}
}
const report={...prior,status:solver.solved?'DUAL_OUTER_LAYER_COMMAND_CHANNELS_ROUTED_UNQUALIFIED':'DUAL_OUTER_LAYER_COMMAND_CHANNEL_FAILED_OR_TIMEOUT',
 solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',solverOptions,
 priorLocalRun:{path:`${bootstrap}/result.json`,sha256:hash(`${bootstrap}/result.json`)},
 completedSignals:solver.solved?26:0,timingQualified:false,fabricationReady:false,
 channel:{solved:solver.solved,failed:solver.failed,error:solver.error??null,iterations,
 elapsedSeconds:(performance.now()-begun)/1000,phase:solver.phase,childPhase:solver.child?.phase,stats:solver.stats,
 input:{path:inputPath,sha256:hash(inputPath)}}}
if(solver.solved){
 const output=solver.getOutput();assert.equal(output.traces.length,243)
 for(let i=0;i<input.traces.length;i++)assert.deepEqual(output.traces[i],input.traces[i])
 const path=`${directory}/output.simple-route.json`;writeFileSync(path,JSON.stringify(output)+'\n');report.output={path,sha256:hash(path)}
}else{
 // Failed native searches are retained only as a manual repair bootstrap.
 // They do not satisfy the phase, timing limits, or physical checks.
 const path=`${directory}/partial-bootstrap.simple-route.json`
 const traces=solver.child?.traces??[]
 assert(traces.every(t=>input.connections.some(c=>c.name===(t.connection_name??t.source_trace_id))))
 writeFileSync(path,JSON.stringify({...input,traces:[...input.traces,...traces]})+'\n')
 report.partialBootstrap={path,sha256:hash(path),nativeChannels:traces.length,accepted:false,timingQualified:false}
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,channel:report.channel}));process.exitCode=solver.solved?0:1
