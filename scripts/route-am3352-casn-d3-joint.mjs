import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenD3Signal} from './lib/am3352-open-d3-signal.mjs'

const [preparation,directory,casnLayer='both',duration='120',fanout='auto']=process.argv.slice(2)
assert(preparation&&directory&&!existsSync(`${directory}/result.json`));assert(['top','bottom','both'].includes(casnLayer));assert(Number(duration)>0&&Number(duration)<=120);assert(['auto','none'].includes(fanout))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const prior=read(`${preparation}/result.json`),{summary,registration}=readCheckedCommandSummary(prior.checkedSourceSummary)
assert.equal(prior.status,'STAGED_CASN_D3_WIRES_AND_SIGNAL_HOLES_OPEN_NOT_EXPORTABLE');verify(prior.source);verify(prior.input);assert.deepEqual(prior.source,summary.source)
const source=read(prior.source.path),input=read(prior.input.path),{opened:openedSignal,prefixes}=assertOpenD3Signal(prior,input,source),opened=[openedSignal]
assert.equal(opened.length,1);assert.equal(prefixes.length,1);assert.equal(input.traces.length,registration.traces)
const point=id=>{const p=source.find(e=>e.type==='pcb_port'&&e.source_port_id===id);assert(p);return{x:p.x,y:p.y,layer:'top',pointId:p.pcb_port_id,pcb_port_id:p.pcb_port_id}}
const dataConnections=opened.map(o=>{
 const st=source.find(e=>e.type==='source_trace'&&e.source_trace_id===o.sourceTraceId);assert(st)
 const p=point(st.connected_source_port_ids[1])
 return{name:st.source_trace_id,source_trace_id:st.source_trace_id,width:.1016,nominalTraceWidth:.1016,pointsToConnect:[point(st.connected_source_port_ids[0]),p]}
})
const casn=input.connections[0];assert.equal(casn.name,'source_trace_19')
input.connections=[...dataConnections,casn]
input.buses=[{name:'DDR_BYTE0',busId:'DDR_BYTE0',connectionNames:dataConnections.map(c=>c.name),traceWidth:.1016,allowedLayers:['bottom'],maxLengthSkew:.635},{name:'DDR_COMMAND_CLOCK',busId:'DDR_COMMAND_CLOCK',connectionNames:[casn.name],traceWidth:.1016,allowedLayers:casnLayer==='both'?['top','bottom']:[casnLayer],maxLengthSkew:.635}]
input.differentialPairs=[];input.bounds={minX:-17.5,maxX:17.5,minY:-38.5,maxY:9.5}
assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false);assert.equal(input.minTraceWidth,.1016);assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254)
mkdirSync(directory,{recursive:true});const inputPath=`${directory}/input.simple-route.json`;writeFileSync(inputPath,JSON.stringify(input)+'\n')
const helper=`${directory}/native-helper.executed.mjs`;writeFileSync(helper,readFileSync('scripts/route-am3352-casn-d3-joint.mjs'))
const options={smoothTuning:true,...fanout==='none'?{fanout:'none'}:{}},solver=new SOLVERS.BusLanesPipelineSolver(input,options),start=performance.now();let steps=0,next=start+10000,error=null
try{while(!solver.solved&&!solver.failed&&performance.now()-start<Number(duration)*1000){solver.step();steps++;if(performance.now()>next){console.log(JSON.stringify({steps,phase:solver.phase,elapsedSeconds:(performance.now()-start)/1000}));next=performance.now()+10000}}}catch(e){error=String(e);solver.failed=true}
const report={...prior,status:solver.solved?'STAGED_CASN_D3_JOINT_NATIVE_ROUTED_CSN0_AND_WHOLE_BYTE_CHECKS_REQUIRED':solver.failed?'STAGED_CASN_D3_JOINT_NATIVE_FAILED':'STAGED_CASN_D3_JOINT_NATIVE_TIMEOUT',
 priorPreparation:artifact(`${preparation}/result.json`),input:artifact(inputPath),restoringSignals:opened.map(o=>o.name),casnSignalLayers:input.buses[1].allowedLayers,dataSignalLayers:['bottom'],actualEndpoints:input.connections.map(c=>({sourceTraceId:c.source_trace_id,points:c.pointsToConnect})),
 solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',solverOptions:options,coreVersion:read('node_modules/@tscircuit/core/package.json').version,capacityAutorouterVersion:read('node_modules/@tscircuit/capacity-autorouter/package.json').version,
 steps,elapsedSeconds:(performance.now()-start)/1000,phase:solver.phase,error:error??solver.error??null,failureCode:solver.failureCode??null,stats:solver.stats,
 pendingD3SignalRepair:solver.solved?0:1,pendingCommandPrefixRepairs:1,stagedPreviouslyConnectedSignals:30,stagedDdrSignalsAfterPhase:30+(solver.solved?2:0),
 wholeByteMatchingQualified:false,newCompleteReplaySignals:0,frozenSourceThroughVias:163,retainedStageThroughVias:161,stagedSignalHolesOmitted:2,physicalSourceModified:false,copperLayers:4,referenceLayersReserved:['inner1','inner2'],exportable:false,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false,executionHelper:artifact(helper)}
if(solver.solved){const output=solver.getOutput();assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces);assert.deepEqual(output.obstacles,input.obstacles);const added=output.traces.slice(input.traces.length);assert(input.connections.every(c=>added.some(t=>t.source_trace_id===c.source_trace_id)));const p=`${directory}/output.simple-route.json`;writeFileSync(p,JSON.stringify(output)+'\n');report.output=artifact(p)}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,elapsedSeconds:report.elapsedSeconds,failureCode:report.failureCode,stagedDdrSignalsAfterPhase:report.stagedDdrSignalsAfterPhase,qualifiedNewSignals:0,exportable:false,fabricationReady:false}));process.exitCode=solver.solved?0:1
