import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {readStagedCasnD3Open} from './lib/am3352-staged-casn-d3-open.mjs'

const [casnDirectory,directory,duration='120']=process.argv.slice(2);assert(casnDirectory&&directory&&!existsSync(`${directory}/result.json`));assert(Number(duration)>0&&Number(duration)<=120)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const {source,input,run,opened}=readStagedCasnD3Open(casnDirectory),st=source.find(e=>e.type==='source_trace'&&e.source_trace_id===opened.sourceTraceId)
const endpoints=st.connected_source_port_ids.map(id=>{const p=source.find(e=>e.type==='pcb_port'&&e.source_port_id===id);assert(p);return{x:p.x,y:p.y,layer:'top',pointId:p.pcb_port_id,pcb_port_id:p.pcb_port_id}})
input.connections=[{name:st.source_trace_id,source_trace_id:st.source_trace_id,width:.1016,nominalTraceWidth:.1016,pointsToConnect:endpoints}]
input.buses=[{name:'DDR_BYTE0',busId:'DDR_BYTE0',connectionNames:[st.source_trace_id],traceWidth:.1016,allowedLayers:['bottom'],maxLengthSkew:.635}];input.differentialPairs=[]
mkdirSync(directory,{recursive:true});const p=`${directory}/input.simple-route.json`;writeFileSync(p,JSON.stringify(input)+'\n')
const snapshot=`${directory}/native-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/route-am3352-d3-after-casn.mjs'))
const solver=new SOLVERS.BusLanesPipelineSolver(input),start=performance.now();let steps=0,next=start+10000,error=null
try{while(!solver.solved&&!solver.failed&&performance.now()-start<Number(duration)*1000){solver.step();steps++;if(performance.now()>next){console.log(JSON.stringify({steps,phase:solver.phase,elapsedSeconds:(performance.now()-start)/1000}));next=performance.now()+10000}}}catch(e){error=String(e);solver.failed=true}
const report={...run,status:solver.solved?'STAGED_D3_NATIVE_RESTORED_CSN0_AND_WHOLE_BYTE_CHECKS_REQUIRED':solver.failed?'STAGED_D3_NATIVE_REPAIR_FAILED':'STAGED_D3_NATIVE_REPAIR_TIMEOUT',nativeCasnRun:artifact(`${casnDirectory}/result.json`),input:artifact(p),actualEndpoints:endpoints,
 solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',steps,elapsedSeconds:(performance.now()-start)/1000,error:error??solver.error??null,failureCode:solver.failureCode??null,stats:solver.stats,
 pendingD3SignalRepair:solver.solved?0:1,pendingCommandPrefixRepairs:1,stagedDdrSignalsAfterPhase:31+(solver.solved?1:0),wholeByteMatchingQualified:false,newCompleteReplaySignals:0,executionHelper:artifact(snapshot),exportable:false,fabricationReady:false}
// The inherited CASn result is provenance, not this phase's output.
delete report.output
if(solver.solved){const output=solver.getOutput();assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces);assert.deepEqual(output.obstacles,input.obstacles);assert(output.traces.slice(input.traces.length).some(t=>t.source_trace_id===st.source_trace_id));const out=`${directory}/output.simple-route.json`;writeFileSync(out,JSON.stringify(output)+'\n');report.output=artifact(out)}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,elapsedSeconds:report.elapsedSeconds,failureCode:report.failureCode,stagedDdrSignalsAfterPhase:report.stagedDdrSignalsAfterPhase,wholeByteMatchingQualified:false,exportable:false,fabricationReady:false}));process.exitCode=solver.solved?0:1
