import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenCpuTails} from './lib/am3352-open-cpu-tails.mjs'

const [channelDirectory,directory,duration='60']=process.argv.slice(2);assert(channelDirectory&&directory)
assert(Number(duration)>0&&Number(duration)<=180)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const channelPath=`${channelDirectory}/result.json`,channel=read(channelPath)
assert.equal(channel.status,'GUIDED_NATIVE_CHANNEL_ROUTED_UNQUALIFIED');assert.equal(channel.pendingCpuTailRepairs,2);assert.equal(channel.exportable,false)
const {summary,registration}=readCheckedCommandSummary(channel.checkedSourceSummary)
assert.equal(registration.signals,27);assert.deepEqual(channel.source,summary.source)
for(const a of [channel.source,channel.output,channel.channel.input,channel.manualLocalCopper??channel.priorLocalRun])if(a)assert.equal(hash(a.path),a.sha256)
const source=read(channel.source.path),input=read(channel.output.path),priorInput=read(channel.channel.input.path)
assert.deepEqual(input.traces.slice(0,priorInput.traces.length),priorInput.traces)
assert.equal(input.traces.length,132)
const tails=assertOpenCpuTails(channel,{...input,traces:input.traces.slice(0,129)},source)
input.connections=tails.map(t=>{
  const st=source.find(e=>e.type==='source_trace'&&e.source_trace_id===t.sourceTraceId)
  const pp=source.find(e=>e.type==='pcb_port'&&e.source_port_id===st.connected_source_port_ids[0]),end=t.retainedTail[0]
  assert(pp.y>-15&&end.layer==='top')
  return {name:st.source_trace_id,source_trace_id:st.source_trace_id,width:.1016,nominalTraceWidth:.1016,
    pointsToConnect:[{x:pp.x,y:pp.y,layer:'top',pcb_port_id:pp.pcb_port_id,pointId:pp.pcb_port_id},{x:end.x,y:end.y,layer:'top'}]}
})
input.buses=[{name:'DDR_CPU_PREFIX_REBUILD',busId:'DDR_CPU_PREFIX_REBUILD',connectionNames:tails.map(t=>t.sourceTraceId),traceWidth:.1016,allowedLayers:['top'],maxLengthSkew:.635}]
input.differentialPairs=[]
const originalBounds=input.bounds
// Tighten only the new prefix search region inside the existing reference
// planes. All source obstacles and copper, including out-of-region records,
// remain present. The authored board outline is not changed by this solve.
input.bounds={minX:-9,maxX:3,minY:-11,maxY:-3}
mkdirSync(directory,{recursive:true});const inputPath=`${directory}/input.simple-route.json`;writeFileSync(inputPath,JSON.stringify(input)+'\n')
const options={fanout:'none',smoothTuning:true},solver=new SOLVERS.BusLanesPipelineSolver(input,options),begun=performance.now()
let iterations=0,next=begun+10000
while(!solver.failed&&!solver.solved&&performance.now()-begun<Number(duration)*1000){solver.step();iterations++;if(performance.now()>next){console.log(JSON.stringify({iterations,seconds:(performance.now()-begun)/1000,stats:solver.stats}));next=performance.now()+10000}}
const report={status:solver.solved?'STAGED_CSN_AND_TWO_CPU_PREFIXES_ROUTED_REPLAY_AND_MATCHING_REQUIRED':'STAGED_CPU_PREFIX_NATIVE_ROUTING_FAILED_OR_TIMEOUT',
  source:summary.source,priorCheckedSummary:channel.checkedSourceSummary,stagedNativeCommand:artifact(channelPath),temporaryOpenCpuTails:channel.temporaryOpenCpuTails,
  input:artifact(inputPath),originalBoardBounds:originalBounds,newPrefixSearchBounds:input.bounds,allFixedCopperAndObstaclesRetained:true,
  nativeBusLanesBootstrap:true,solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',solverOptions:options,
  priorDefaultDdrSignals:27,newCommand:'DDR_CSn0',rebuiltDataSignals:['DDR_D10','DDR_D14'],completedCandidateDdrSignals:solver.solved?28:26,
  fullByteAndCommandClassMatchingDeferred:true,iterations,elapsedSeconds:(performance.now()-begun)/1000,stats:solver.stats,error:solver.error??null,
  exportable:false,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false}
if(solver.solved){const output=solver.getOutput();assert.equal(output.traces.length,input.traces.length+2);assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces);const path=`${directory}/output.simple-route.json`;writeFileSync(path,JSON.stringify(output)+'\n');report.output=artifact(path)}
else if(solver.child?.traces?.length){
  const partial=structuredClone(solver.child.traces)
  for(const t of partial){
    const c=input.connections.find(c=>c.name===(t.source_trace_id??t.connection_name));assert(c)
    const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
    assert(near(t.route[0],c.pointsToConnect[0])&&near(t.route.at(-1),c.pointsToConnect[1])||near(t.route[0],c.pointsToConnect[1])&&near(t.route.at(-1),c.pointsToConnect[0]))
    assert(t.route.every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.1016))
  }
  const path=`${directory}/partial-prefixes.json`;writeFileSync(path,JSON.stringify(partial)+'\n');report.partialNativePrefixes=artifact(path)
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));process.exitCode=solver.solved?0:1
