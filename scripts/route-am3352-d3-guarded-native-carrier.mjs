import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {readStagedCasnD3Open} from './lib/am3352-staged-casn-d3-open.mjs'

const [manualDirectory,directory,duration='120']=process.argv.slice(2);assert(manualDirectory&&directory&&!existsSync(`${directory}/result.json`));assert(Number(duration)>0&&Number(duration)<=120)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const prior=read(`${manualDirectory}/result.json`);assert.equal(prior.status,'STAGED_D3_ACTUAL_PAD_PLAN_FOUND_NATIVE_LEGS_AND_WHOLE_BYTE_MATCHING_REQUIRED')
for(const a of [prior.source,prior.fixedCopper,prior.nativeCasnRun,prior.actualPadPlan,...prior.executionHelpers])verify(a)
const state=readStagedCasnD3Open(prior.nativeCasnRun.path.replace(/\/result.json$/,'')),input=read(prior.fixedCopper.path);assert.deepEqual(input,state.input)
const plan=read(prior.actualPadPlan.path),indices=plan.flatMap((p,i)=>p.route_type==='via'?[i]:[]);assert.equal(indices.length,4)
const vias=indices.map(i=>plan[i]),starts=[0,...indices.map(i=>i+1)],legs=starts.map((start,i)=>plan.slice(start,indices[i]??plan.length))
assert(legs.every((r,i)=>r.length>=2&&r.every(p=>p.route_type==='wire'&&p.width===.1016&&p.layer===(i%2?'bottom':'top'))))
const owner='source_trace_42',selected=3
input.traces.push(...legs.flatMap((route,i)=>i===selected?[]:[{pcb_trace_id:`manual_d3_guarded_leg_${i}`,source_trace_id:owner,connection_name:owner,route}]))
input.obstacles.push(...vias.map((v,i)=>({type:'rect',shape:'circle',center:{x:v.x,y:v.y},width:.4572,height:.4572,layers:['top','inner1','inner2','bottom'],connectedTo:[owner],circuitJsonMetadata:{staged_d3_guarded_via:i}})))
const endpoints=[vias[2],vias[3]].map(({x,y})=>({x,y,layer:'bottom'}))
input.connections=[{name:owner,source_trace_id:owner,width:.1016,nominalTraceWidth:.1016,pointsToConnect:endpoints}]
input.buses=[{name:'DDR_BYTE0',busId:'DDR_BYTE0',connectionNames:[owner],traceWidth:.1016,allowedLayers:['bottom'],maxLengthSkew:.635}];input.differentialPairs=[]
mkdirSync(directory,{recursive:true});const p=`${directory}/input.simple-route.json`;writeFileSync(p,JSON.stringify(input)+'\n')
const snapshot=`${directory}/native-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/route-am3352-d3-guarded-native-carrier.mjs'))
const options={fanout:'none',smoothTuning:true},solver=new SOLVERS.BusLanesPipelineSolver(input,options),start=performance.now();let steps=0,next=start+10000,error=null
try{while(!solver.solved&&!solver.failed&&performance.now()-start<Number(duration)*1000){solver.step();steps++;if(performance.now()>next){console.log(JSON.stringify({steps,phase:solver.phase,elapsedSeconds:(performance.now()-start)/1000}));next=performance.now()+10000}}}catch(e){error=String(e);solver.failed=true}
const report={...prior,status:solver.solved?'STAGED_D3_NATIVE_CARRIER_RESTORED_CSN0_AND_WHOLE_BYTE_CHECKS_REQUIRED':solver.failed?'STAGED_D3_GUARDED_NATIVE_CARRIER_FAILED':'STAGED_D3_GUARDED_NATIVE_CARRIER_TIMEOUT',manualPlanRun:artifact(`${manualDirectory}/result.json`),manualPlan:prior.actualPadPlan,input:artifact(p),actualViaEndpoints:endpoints,
 solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',solverOptions:options,steps,elapsedSeconds:(performance.now()-start)/1000,error:error??solver.error??null,failureCode:solver.failureCode??null,stats:solver.stats,
 pendingD3SignalRepair:solver.solved?0:1,pendingCommandPrefixRepairs:1,stagedDdrSignalsAfterPhase:31+(solver.solved?1:0),wholeByteMatchingQualified:false,newCompleteReplaySignals:0,plannedD3ThroughVias:4,executionHelper:artifact(snapshot),exportable:false,fabricationReady:false}
if(solver.solved){
 const output=solver.getOutput();assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces);assert.deepEqual(output.obstacles,input.obstacles);assert.equal(output.traces.length,input.traces.length+1)
 const carrier=output.traces.at(-1);assert.equal(carrier.source_trace_id,owner);assert(carrier.route.every(p=>p.route_type==='wire'&&p.width===.1016&&p.layer==='bottom'))
 assert(Math.hypot(carrier.route[0].x-endpoints[0].x,carrier.route[0].y-endpoints[0].y)<1e-8&&Math.hypot(carrier.route.at(-1).x-endpoints[1].x,carrier.route.at(-1).y-endpoints[1].y)<1e-8)
 const joined=[];for(let i=0;i<legs.length;i++){joined.push(...(i===selected?carrier.route:legs[i]));if(i<vias.length)joined.push(vias[i])}
 report.fullD3PlanarMm=joined.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-joined[i].x,p.y-joined[i].y),0)
 const out=`${directory}/output.simple-route.json`;writeFileSync(out,JSON.stringify(output)+'\n');report.output=artifact(out)
 const fullPath=`${directory}/native-and-manual-d3.json`;writeFileSync(fullPath,JSON.stringify(joined,null,2)+'\n');report.fullD3=artifact(fullPath)
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,fullD3PlanarMm:report.fullD3PlanarMm,stagedDdrSignalsAfterPhase:report.stagedDdrSignalsAfterPhase,pendingCsn0Repair:1,wholeByteMatchingQualified:false,exportable:false,fabricationReady:false}));process.exitCode=solver.solved?0:1
