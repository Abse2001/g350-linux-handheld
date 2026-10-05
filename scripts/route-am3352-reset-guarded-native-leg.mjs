import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {readStagedCasnD3Csn0} from './lib/am3352-staged-casn-d3-csn0.mjs'

const [manualDirectory,directory,duration='60']=process.argv.slice(2);assert(manualDirectory&&directory&&!existsSync(`${directory}/result.json`));assert(Number(duration)>0&&Number(duration)<=120)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const prior=read(`${manualDirectory}/result.json`);assert.equal(prior.status,'STAGED_RESET_PREFIX_REPAIR_FOUND_COMPLETE_REPLAY_AND_TIMING_CHECKS_REQUIRED')
for(const a of [prior.source,prior.nativeCsn0Run,prior.fixedCopper,prior.manualResetPrefix,...prior.executionHelpers])verify(a)
const state=readStagedCasnD3Csn0(prior.nativeCsn0Run.path.replace(/\/result.json$/,'')),input=read(prior.fixedCopper.path);assert.deepEqual(input,state.input)
const plan=read(prior.manualResetPrefix.path),indices=plan.flatMap((p,i)=>p.route_type==='via'?[i]:[]);assert.equal(indices.length,2)
const vias=indices.map(i=>plan[i]),top=[plan.slice(0,indices[0]),plan.slice(indices[1]+1)],owner='source_trace_10'
assert(top.every(r=>r.length>=2&&r.every(p=>p.route_type==='wire'&&p.width===.1016&&p.layer==='top')))
input.traces.push(...top.map((route,i)=>({pcb_trace_id:`manual_reset_guarded_top_${i}`,source_trace_id:owner,connection_name:owner,route})))
input.obstacles.push(...vias.map((v,i)=>({type:'rect',shape:'circle',center:{x:v.x,y:v.y},width:.4572,height:.4572,layers:['top','inner1','inner2','bottom'],connectedTo:[owner],circuitJsonMetadata:{staged_reset_guarded_via:i}})))
const endpoints=vias.map(({x,y})=>({x,y,layer:'bottom'}));input.connections=[{name:owner,source_trace_id:owner,width:.1016,nominalTraceWidth:.1016,pointsToConnect:endpoints}]
// Reset is asynchronous and outside the DDR command/clock matching group.
input.buses=[{name:'DDR_RESET_RECOVERY',busId:'DDR_RESET_RECOVERY',connectionNames:[owner],traceWidth:.1016,allowedLayers:['bottom']}];input.differentialPairs=[];input.bounds={minX:-17.5,maxX:17.5,minY:-17,maxY:9.5}
mkdirSync(directory,{recursive:true});const p=`${directory}/input.simple-route.json`;writeFileSync(p,JSON.stringify(input)+'\n')
const snapshot=`${directory}/native-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/route-am3352-reset-guarded-native-leg.mjs'))
const options={fanout:'none',smoothTuning:true},solver=new SOLVERS.BusLanesPipelineSolver(input,options),start=performance.now();let steps=0,next=start+10000,error=null
try{while(!solver.solved&&!solver.failed&&performance.now()-start<Number(duration)*1000){solver.step();steps++;if(performance.now()>next){console.log(JSON.stringify({steps,phase:solver.phase,elapsedSeconds:(performance.now()-start)/1000}));next=performance.now()+10000}}}catch(e){error=String(e);solver.failed=true}
const report={...prior,status:solver.solved?'STAGED_ALL_CASN_NEIGHBORS_REPAIRED_COMPLETE_REPLAY_AND_TIMING_CHECKS_REQUIRED':solver.failed?'STAGED_RESET_GUARDED_NATIVE_LEG_FAILED':'STAGED_RESET_GUARDED_NATIVE_LEG_TIMEOUT',manualPlanRun:artifact(`${manualDirectory}/result.json`),manualPlan:prior.manualResetPrefix,input:artifact(p),actualViaEndpoints:endpoints,
 solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',solverOptions:options,steps,elapsedSeconds:(performance.now()-start)/1000,error:error??solver.error??null,failureCode:solver.failureCode??null,stats:solver.stats,
 pendingCommandPrefixRepairs:solver.solved?0:1,stagedDdrSignalsAfterPhase:32+(solver.solved?1:0),plannedResetThroughVias:2,newCompleteReplaySignals:0,wholeByteMatchingQualified:false,executionHelper:artifact(snapshot),exportable:false,fabricationReady:false}
if(solver.solved){
 const output=solver.getOutput();assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces);assert.deepEqual(output.obstacles,input.obstacles);assert.equal(output.traces.length,input.traces.length+1)
 const carrier=output.traces.at(-1);assert.equal(carrier.source_trace_id,owner);assert(carrier.route.every(p=>p.route_type==='wire'&&p.width===.1016&&p.layer==='bottom'))
 assert(Math.hypot(carrier.route[0].x-endpoints[0].x,carrier.route[0].y-endpoints[0].y)<1e-8&&Math.hypot(carrier.route.at(-1).x-endpoints[1].x,carrier.route.at(-1).y-endpoints[1].y)<1e-8)
 const prefix=[...top[0],vias[0],...carrier.route,vias[1],...top[1]],reset=state.prefixes.find(p=>p.name==='DDR_RESETn'),full=[...prefix,...reset.retainedTail.slice(1)]
 report.fullResetPlanarMm=full.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-full[i].x,p.y-full[i].y),0)
 const out=`${directory}/output.simple-route.json`;writeFileSync(out,JSON.stringify(output)+'\n');report.output=artifact(out)
 const fullPath=`${directory}/native-and-manual-reset.json`;writeFileSync(fullPath,JSON.stringify(full,null,2)+'\n');report.fullReset=artifact(fullPath)
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,fullResetPlanarMm:report.fullResetPlanarMm,stagedDdrSignalsAfterPhase:report.stagedDdrSignalsAfterPhase,pendingRepairs:report.pendingCommandPrefixRepairs,qualifiedNewSignals:0,exportable:false,fabricationReady:false}));process.exitCode=solver.solved?0:1
