import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenDataWires} from './lib/am3352-open-data-wires.mjs'

const [casnDirectory,directory,layer='bottom',duration='120']=process.argv.slice(2)
assert(casnDirectory&&directory&&!existsSync(`${directory}/result.json`));assert(['top','bottom'].includes(layer));assert(Number(duration)>0&&Number(duration)<=120)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const prior=read(`${casnDirectory}/result.json`),{summary,registration}=readCheckedCommandSummary(prior.checkedSourceSummary)
assert.equal(prior.status,'STAGED_CASN_NATIVE_BUS_LANES_ROUTED_NEIGHBOR_REPAIRS_REQUIRED')
for(const a of [prior.source,prior.input,prior.output])verify(a);assert.deepEqual(summary.source,prior.source)
const source=read(prior.source.path),initial=read(prior.input.path),{opened,prefixes}=assertOpenDataWires(prior,initial,source),input=read(prior.output.path)
assert.equal(opened.length,2);assert.equal(prefixes.length,1);assert.equal(input.traces.length,registration.traces+1)
assert.equal(JSON.stringify(input.traces.slice(0,registration.traces)),JSON.stringify(initial.traces))
const casn=input.traces.at(-1);assert.equal(casn.source_trace_id,'source_trace_19');assert(casn.route.every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.1016))
assert(Math.hypot(casn.route[0].x+2.8,casn.route[0].y+6.8)<1e-8);assert(Math.hypot(casn.route.at(-1).x+1.6,casn.route.at(-1).y+28.2)<1e-8)
input.connections=opened.map(o=>{const st=source.find(e=>e.type==='source_trace'&&e.source_trace_id===o.sourceTraceId);assert(st);const pointsToConnect=st.connected_source_port_ids.map(id=>{const p=source.find(e=>e.type==='pcb_port'&&e.source_port_id===id);assert(p);return{x:p.x,y:p.y,layer:'top',pointId:p.pcb_port_id,pcb_port_id:p.pcb_port_id}});return{name:st.source_trace_id,source_trace_id:st.source_trace_id,width:.1016,nominalTraceWidth:.1016,pointsToConnect}})
const bus=source.find(e=>e.type==='source_bus'&&e.name==='DDR_BYTE1');assert(bus);assert(input.connections.every(c=>bus.source_trace_ids.includes(c.name)))
input.buses=[{name:'DDR_BYTE1',busId:'DDR_BYTE1',connectionNames:input.connections.map(c=>c.name),traceWidth:.1016,allowedLayers:[layer],maxLengthSkew:.635}];input.differentialPairs=[]
assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false);assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254)
assert.equal(JSON.stringify(input.obstacles),JSON.stringify(initial.obstacles))
mkdirSync(directory,{recursive:true});const inputPath=`${directory}/input.simple-route.json`;writeFileSync(inputPath,JSON.stringify(input)+'\n')
const helperSnapshot=`${directory}/native-helper.executed.mjs`;writeFileSync(helperSnapshot,readFileSync('scripts/route-am3352-staged-data-wire-restore.mjs'))
const solver=new SOLVERS.BusLanesPipelineSolver(input),start=performance.now();let steps=0,next=start+10000,error=null
try{while(!solver.solved&&!solver.failed&&performance.now()-start<Number(duration)*1000){solver.step();steps++;if(performance.now()>next){console.log(JSON.stringify({steps,phase:solver.phase,elapsedSeconds:(performance.now()-start)/1000}));next=performance.now()+10000}}}catch(e){error=String(e);solver.failed=true}
const report={status:solver.solved?'STAGED_DATA_WIRES_NATIVE_ROUTED_CSN0_REPAIR_AND_WHOLE_BYTE_MATCHING_REQUIRED':solver.failed?'STAGED_DATA_WIRES_NATIVE_FAILED':'STAGED_DATA_WIRES_NATIVE_TIMEOUT',source:prior.source,checkedSourceSummary:prior.checkedSourceSummary,priorNativeCasn:artifact(`${casnDirectory}/result.json`),priorOutput:prior.output,input:artifact(inputPath),
 temporaryOpenCommandPrefixes:prior.temporaryOpenCommandPrefixes,temporaryOpenDataWires:prior.temporaryOpenDataWires,restoringSignals:opened.map(o=>o.name),signalLayer:layer,solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',coreVersion:read('node_modules/@tscircuit/core/package.json').version,capacityAutorouterVersion:read('node_modules/@tscircuit/capacity-autorouter/package.json').version,
 steps,elapsedSeconds:(performance.now()-start)/1000,phase:solver.phase,error:error??solver.error??null,failureCode:solver.failureCode??null,stats:solver.stats,
 pendingDataWireRepairs:solver.solved?0:opened.length,pendingCommandPrefixRepairs:prefixes.length,stagedPreviouslyConnectedSignals:prior.stagedDdrSignalsAfterPhase,stagedDdrSignalsAfterPhase:prior.stagedDdrSignalsAfterPhase+(solver.solved?opened.length:0),
 wholeByteMatchingQualified:false,newCompleteReplaySignals:0,retainedSourceThroughVias:registration.holes,physicalHolesRemoved:0,copperLayers:4,referenceLayersReserved:['inner1','inner2'],exportable:false,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false,executionHelper:artifact(helperSnapshot)}
if(solver.solved){const output=solver.getOutput();assert.equal(output.traces.length,input.traces.length+opened.length);assert.equal(JSON.stringify(output.traces.slice(0,input.traces.length)),JSON.stringify(input.traces));const p=`${directory}/output.simple-route.json`;writeFileSync(p,JSON.stringify(output)+'\n');report.output=artifact(p)}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,elapsedSeconds:report.elapsedSeconds,stagedDdrSignalsAfterPhase:report.stagedDdrSignalsAfterPhase,wholeByteMatchingQualified:false,newCompleteReplaySignals:0,exportable:false,fabricationReady:false}))
process.exitCode=solver.solved?0:1
