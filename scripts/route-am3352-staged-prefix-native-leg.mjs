import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenDataWires} from './lib/am3352-open-data-wires.mjs'

const [manualDirectory,directory,duration='60']=process.argv.slice(2)
assert(manualDirectory&&directory&&!existsSync(`${directory}/result.json`));assert(Number(duration)>0&&Number(duration)<=120)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const manual=read(`${manualDirectory}/result.json`),{summary,registration}=readCheckedCommandSummary(manual.checkedSourceSummary)
assert.equal(manual.status,'STAGED_CSN0_MANUAL_PREFIX_PLAN_FOUND_REPLAY_AND_TIMING_CHECKS_REQUIRED')
for(const a of [manual.source,manual.priorNativeCasn,manual.priorOutput,manual.manualPrefixPlan])verify(a);assert.deepEqual(summary.source,manual.source)
const casn=read(manual.priorNativeCasn.path),source=read(manual.source.path),fixed=read(casn.input.path),{opened,prefixes}=assertOpenDataWires(casn,fixed,source),input=read(manual.priorOutput.path),plan=read(manual.manualPrefixPlan.path)
assert.equal(input.traces.length,registration.traces+1);assert.equal(JSON.stringify(input.traces.slice(0,registration.traces)),JSON.stringify(fixed.traces))
assert.equal(JSON.stringify(input.obstacles),JSON.stringify(fixed.obstacles))
const viaIndices=plan.flatMap((p,i)=>p.route_type==='via'?[i]:[]);assert.equal(viaIndices.length,2)
const [first,last]=viaIndices,vias=viaIndices.map(i=>plan[i]);assert(vias.every(p=>p.via_diameter===.4572&&p.via_hole_diameter===.254));assert.equal(vias[0].from_layer,'top');assert.equal(vias[0].to_layer,'bottom');assert.equal(vias[1].from_layer,'bottom');assert.equal(vias[1].to_layer,'top')
assert(Math.hypot(vias[0].x-vias[1].x,vias[0].y-vias[1].y)>=.508-1e-8)
const owner='source_trace_5',topPieces=[plan.slice(0,first),plan.slice(last+1)]
assert(topPieces.every(r=>r.length>=2&&r.every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.1016)))
input.traces.push(...topPieces.map((route,i)=>({pcb_trace_id:`manual_csn0_prefix_top_${i}`,source_trace_id:owner,connection_name:owner,route})))
input.obstacles.push(...vias.map((v,i)=>({type:'rect',shape:'circle',center:{x:v.x,y:v.y},width:.4572,height:.4572,layers:['top','inner1','inner2','bottom'],connectedTo:[owner],circuitJsonMetadata:{staged_manual_prefix_via:i}})))
const endpoints=vias.map(v=>({x:v.x,y:v.y,layer:'bottom'}))
input.connections=[{name:owner,source_trace_id:owner,width:.1016,nominalTraceWidth:.1016,pointsToConnect:endpoints}]
input.buses=[{name:'DDR_COMMAND_CLOCK',busId:'DDR_COMMAND_CLOCK',connectionNames:[owner],traceWidth:.1016,allowedLayers:['bottom'],maxLengthSkew:.635}];input.differentialPairs=[]
input.bounds={minX:-12,maxX:4,minY:-12,maxY:-3};assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false)
mkdirSync(directory,{recursive:true});const inputPath=`${directory}/input.simple-route.json`;writeFileSync(inputPath,JSON.stringify(input)+'\n')
const helperSnapshot=`${directory}/native-helper.executed.mjs`;writeFileSync(helperSnapshot,readFileSync('scripts/route-am3352-staged-prefix-native-leg.mjs'))
const options={fanout:'none',smoothTuning:true},solver=new SOLVERS.BusLanesPipelineSolver(input,options),start=performance.now();let steps=0,error=null
try{while(!solver.solved&&!solver.failed&&performance.now()-start<Number(duration)*1000){solver.step();steps++}}catch(e){error=String(e);solver.failed=true}
const report={status:solver.solved?'STAGED_CSN0_NATIVE_PREFIX_LEG_ROUTED_DATA_REPAIRS_AND_REPLAY_CHECKS_REQUIRED':solver.failed?'STAGED_CSN0_NATIVE_PREFIX_LEG_FAILED':'STAGED_CSN0_NATIVE_PREFIX_LEG_TIMEOUT',source:manual.source,checkedSourceSummary:manual.checkedSourceSummary,priorNativeCasn:manual.priorNativeCasn,manualPrefixRun:artifact(`${manualDirectory}/result.json`),manualPrefixPlan:manual.manualPrefixPlan,input:artifact(inputPath),actualViaEndpoints:endpoints,
 temporaryOpenCommandPrefixes:manual.temporaryOpenCommandPrefixes,temporaryOpenDataWires:manual.temporaryOpenDataWires,solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',solverOptions:options,steps,elapsedSeconds:(performance.now()-start)/1000,error:error??solver.error??null,failureCode:solver.failureCode??null,stats:solver.stats,
 pendingDataWireRepairs:opened.length,pendingCommandPrefixRepairs:solver.solved?0:prefixes.length,stagedDdrSignalsAfterPhase:casn.stagedDdrSignalsAfterPhase+(solver.solved?1:0),newCompleteReplaySignals:0,retainedSourceThroughVias:registration.holes,plannedNewThroughVias:2,physicalHolesRemoved:0,
 copperLayers:4,referenceLayersReserved:['inner1','inner2'],exportable:false,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false,executionHelper:artifact(helperSnapshot)}
if(solver.solved){
 const output=solver.getOutput();assert.equal(output.traces.length,input.traces.length+1);assert.equal(JSON.stringify(output.traces.slice(0,input.traces.length)),JSON.stringify(input.traces));const carrier=output.traces.at(-1);assert.equal(carrier.source_trace_id,owner);assert(carrier.route.every(p=>p.route_type==='wire'&&p.layer==='bottom'&&p.width===.1016))
 assert(Math.hypot(carrier.route[0].x-endpoints[0].x,carrier.route[0].y-endpoints[0].y)<1e-8);assert(Math.hypot(carrier.route.at(-1).x-endpoints[1].x,carrier.route.at(-1).y-endpoints[1].y)<1e-8)
 const fullPrefix=[...topPieces[0],vias[0],...carrier.route,vias[1],...topPieces[1]],full=[...fullPrefix,...prefixes[0].retainedTail.slice(1)]
 report.fullCsn0PlanarMm=full.reduce((sum,p,i)=>sum+(i?Math.hypot(p.x-full[i-1].x,p.y-full[i-1].y):0),0);report.placementNominalRangeMm=summary.placementNominalReview.rangeMm;report.placementNominalLengthPass=report.fullCsn0PlanarMm>=report.placementNominalRangeMm[0]&&report.fullCsn0PlanarMm<=report.placementNominalRangeMm[1]
 const p=`${directory}/output.simple-route.json`;writeFileSync(p,JSON.stringify(output)+'\n');report.output=artifact(p)
 const prefixPath=`${directory}/native-and-manual-prefix.json`;writeFileSync(prefixPath,JSON.stringify(fullPrefix,null,2)+'\n');report.repairedPrefix=artifact(prefixPath)
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,fullCsn0PlanarMm:report.fullCsn0PlanarMm,nominalPass:report.placementNominalLengthPass,pendingDataWireRepairs:opened.length,newCompleteReplaySignals:0,exportable:false,fabricationReady:false}));process.exitCode=solver.solved?0:1
