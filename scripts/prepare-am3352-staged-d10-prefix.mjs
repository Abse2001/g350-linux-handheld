import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenCpuTails} from './lib/am3352-open-cpu-tails.mjs'

const [runDirectory,directory]=process.argv.slice(2);assert(runDirectory&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const runPath=`${runDirectory}/result.json`,run=read(runPath)
assert.equal(run.status,'STAGED_CPU_PREFIX_NATIVE_ROUTING_FAILED_OR_TIMEOUT')
const {summary,registration}=readCheckedCommandSummary(run.priorCheckedSummary);assert.equal(registration.signals,27)
for(const a of [run.source,run.input,run.partialNativePrefixes,run.stagedNativeCommand])assert.equal(hash(a.path),a.sha256)
const source=read(run.source.path),input=read(run.input.path),partial=read(run.partialNativePrefixes.path),command=read(run.stagedNativeCommand.path)
assert.deepEqual(run.source,summary.source);assert.deepEqual(command.source,summary.source)
assert.equal(command.status,'GUIDED_NATIVE_CHANNEL_ROUTED_UNQUALIFIED');assert.equal(command.totalDdrSignalsAfterPhase,26)
assert.equal(hash(command.output.path),command.output.sha256)
assert.deepEqual(input.traces,read(command.output.path).traces)
const tails=assertOpenCpuTails(command,{...input,traces:input.traces.slice(0,129)},source)
assert.equal(partial.length,1);assert.equal(partial[0].source_trace_id,'source_trace_40')
const connection=input.connections.find(c=>c.name==='source_trace_40'),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
assert(near(partial[0].route[0],connection.pointsToConnect[0])&&near(partial[0].route.at(-1),connection.pointsToConnect[1]))
assert(partial[0].route.every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.1016))
input.traces.push(partial[0]);input.bounds=run.originalBoardBounds
const st=source.find(e=>e.type==='source_trace'&&e.name==='DDR_D10'),tail=tails.find(t=>t.name==='DDR_D10')
input.connections=[{name:st.source_trace_id,source_trace_id:st.source_trace_id,width:.1016,nominalTraceWidth:.1016,
  pointsToConnect:st.connected_source_port_ids.map(id=>{const p=source.find(e=>e.type==='pcb_port'&&e.source_port_id===id);return{x:p.x,y:p.y,layer:'top',pcb_port_id:p.pcb_port_id,pointId:p.pcb_port_id}})}]
input.buses=[{name:'DDR_CPU_PREFIX_REBUILD',busId:'DDR_CPU_PREFIX_REBUILD',connectionNames:[st.source_trace_id],traceWidth:.1016,allowedLayers:['top'],maxLengthSkew:.635}];input.differentialPairs=[]
mkdirSync(directory,{recursive:true})
const write=(name,value)=>{const path=`${directory}/${name}`;writeFileSync(path,JSON.stringify(value,null,2)+'\n');return artifact(path)}
const stagedFixed=write('staged-fixed-copper.json',input.traces.slice(129))
const report={status:'STAGED_D10_CPU_PREFIX_MANUAL_REPAIR_PREPARATION_NOT_EXPORTABLE',source:summary.source,input:write('input.simple-route.json',input),
  checkedSourceSummary:run.priorCheckedSummary,memoryMap:summary.memoryMap,ramReferenceLayout:summary.ramReferenceLayout,
  sourceCopper:{traces:129,totalSourceTraces:133},preparedLocalEscapes:0,preservedSavedDdr:{...summary.paths,signals:27},
  temporaryOpenCpuTails:run.temporaryOpenCpuTails,stagedFixedCopper:stagedFixed,
  cpuPrefixRebuild:{name:'DDR_D10',sourceTraceId:st.source_trace_id,target:{x:tail.retainedTail[0].x,y:tail.retainedTail[0].y,layer:'top'},nativeD14Run:artifact(runPath),nativeD14Prefix:run.partialNativePrefixes,stagedNativeCommand:run.stagedNativeCommand},
  actualPackagePadStartsAllowed:true,allChannelEndpointsActualTopPads:true,exportable:false,defaultChanged:false,fabricationReady:false}
write('signal-escapes.native.json',[]);write('result.json',report)
console.log(JSON.stringify({status:report.status,target:report.cpuPrefixRebuild.target,retainedTraces:133,retainedThroughVias:147,fabricationReady:false}))
