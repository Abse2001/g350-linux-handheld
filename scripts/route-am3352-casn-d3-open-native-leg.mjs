import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenD3Signal} from './lib/am3352-open-d3-signal.mjs'

const [manualDirectory,directory,duration='120']=process.argv.slice(2);assert(manualDirectory&&directory&&!existsSync(`${directory}/result.json`));assert(Number(duration)>0&&Number(duration)<=120)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const prior=read(`${manualDirectory}/result.json`),{summary}=readCheckedCommandSummary(prior.checkedSourceSummary)
assert.equal(prior.status,'STAGED_CASN_D3_OPEN_ACTUAL_PAD_PLAN_FOUND_NATIVE_LEGS_AND_REPAIRS_REQUIRED');for(const a of [prior.source,prior.input,prior.actualPadPlan,...prior.executionHelpers])verify(a);assert.deepEqual(summary.source,prior.source)
const source=read(prior.source.path),input=read(prior.input.path);assertOpenD3Signal(prior,input,source)
const plan=read(prior.actualPadPlan.path),viaIndices=plan.flatMap((p,i)=>p.route_type==='via'?[i]:[]);assert.equal(viaIndices.length,2)
const [first,last]=viaIndices,vias=viaIndices.map(i=>plan[i]),topPieces=[plan.slice(0,first),plan.slice(last+1)]
assert(topPieces.every(r=>r.length>=2&&r.every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.1016)))
assert.equal(vias[0].from_layer,'top');assert.equal(vias[0].to_layer,'bottom');assert.equal(vias[1].from_layer,'bottom');assert.equal(vias[1].to_layer,'top')
const owner='source_trace_19',actualEndpoints=vias.map(v=>({x:v.x,y:v.y,layer:'bottom'}))
input.traces.push(...topPieces.map((route,i)=>({pcb_trace_id:`manual_casn_d3_open_top_${i}`,source_trace_id:owner,connection_name:owner,route})))
input.obstacles.push(...vias.map((v,i)=>({type:'rect',shape:'circle',center:{x:v.x,y:v.y},width:.4572,height:.4572,layers:['top','inner1','inner2','bottom'],connectedTo:[owner],circuitJsonMetadata:{staged_casn_d3_open_via:i}})))
input.connections=[{name:owner,source_trace_id:owner,width:.1016,nominalTraceWidth:.1016,pointsToConnect:actualEndpoints}]
input.buses=[{name:'DDR_COMMAND_CLOCK',busId:'DDR_COMMAND_CLOCK',connectionNames:[owner],traceWidth:.1016,allowedLayers:['bottom'],maxLengthSkew:.635}];input.differentialPairs=[];input.bounds={minX:-17.5,maxX:17.5,minY:-38.5,maxY:9.5}
mkdirSync(directory,{recursive:true});const inputPath=`${directory}/input.simple-route.json`;writeFileSync(inputPath,JSON.stringify(input)+'\n')
const snapshot=`${directory}/native-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/route-am3352-casn-d3-open-native-leg.mjs'))
const options={fanout:'none',smoothTuning:true},solver=new SOLVERS.BusLanesPipelineSolver(input,options),start=performance.now();let steps=0,next=start+10000,error=null
try{while(!solver.solved&&!solver.failed&&performance.now()-start<Number(duration)*1000){solver.step();steps++;if(performance.now()>next){console.log(JSON.stringify({steps,phase:solver.phase,elapsedSeconds:(performance.now()-start)/1000}));next=performance.now()+10000}}}catch(e){error=String(e);solver.failed=true}
const report={...prior,status:solver.solved?'STAGED_CASN_D3_OPEN_NATIVE_LEG_ROUTED_D3_AND_CSN0_REPAIRS_REQUIRED':solver.failed?'STAGED_CASN_D3_OPEN_NATIVE_LEG_FAILED':'STAGED_CASN_D3_OPEN_NATIVE_LEG_TIMEOUT',manualPlanRun:artifact(`${manualDirectory}/result.json`),manualPlan:prior.actualPadPlan,input:artifact(inputPath),actualViaEndpoints:actualEndpoints,
 solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',solverOptions:options,steps,elapsedSeconds:(performance.now()-start)/1000,error:error??solver.error??null,failureCode:solver.failureCode??null,stats:solver.stats,
 stagedDdrSignalsAfterPhase:30+(solver.solved?1:0),pendingD3SignalRepair:1,pendingCommandPrefixRepairs:1,newCompleteReplaySignals:0,plannedNewCasnThroughVias:2,executionHelper:artifact(snapshot),exportable:false,fabricationReady:false}
if(solver.solved){
 const output=solver.getOutput();assert.equal(output.traces.length,input.traces.length+1);assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces);assert.deepEqual(output.obstacles,input.obstacles)
 const carrier=output.traces.at(-1);assert.equal(carrier.source_trace_id,owner);assert(carrier.route.every(p=>p.route_type==='wire'&&p.layer==='bottom'&&p.width===.1016))
 assert(Math.hypot(carrier.route[0].x-vias[0].x,carrier.route[0].y-vias[0].y)<1e-8&&Math.hypot(carrier.route.at(-1).x-vias[1].x,carrier.route.at(-1).y-vias[1].y)<1e-8)
 const full=[...topPieces[0],vias[0],...carrier.route,vias[1],...topPieces[1]]
 report.fullCasnPlanarMm=full.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-full[i].x,p.y-full[i].y),0);report.placementNominalRangeMm=summary.placementNominalReview.rangeMm;report.placementNominalLengthPass=report.fullCasnPlanarMm>=report.placementNominalRangeMm[0]&&report.fullCasnPlanarMm<=report.placementNominalRangeMm[1]
 const p=`${directory}/output.simple-route.json`;writeFileSync(p,JSON.stringify(output)+'\n');report.output=artifact(p)
 const fullPath=`${directory}/native-and-manual-casn.json`;writeFileSync(fullPath,JSON.stringify(full,null,2)+'\n');report.fullCasn=artifact(fullPath)
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,fullCasnPlanarMm:report.fullCasnPlanarMm,pendingRepairs:2,nominalPass:report.placementNominalLengthPass,exportable:false,fabricationReady:false}));process.exitCode=solver.solved?0:1
