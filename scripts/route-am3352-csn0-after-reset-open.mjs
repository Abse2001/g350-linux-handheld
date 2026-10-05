import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {readStagedCasnD3Restored} from './lib/am3352-staged-casn-d3-restored.mjs'
import {assertOpenCommandPrefixes} from './lib/am3352-open-command-prefixes.mjs'

const [manualDirectory,directory,duration='120']=process.argv.slice(2);assert(manualDirectory&&directory&&!existsSync(`${directory}/result.json`));assert(Number(duration)>0&&Number(duration)<=120)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const prior=read(`${manualDirectory}/result.json`);assert.equal(prior.status,'STAGED_CSN0_AFTER_D3_MANUAL_PREFIX_PLAN_FOUND')
for(const a of [prior.source,prior.nativeD3Run,prior.fixedCopper,prior.manualPrefixPlan,...prior.executionHelpers])verify(a)
const state=readStagedCasnD3Restored(prior.nativeD3Run.path.replace(/\/result.json$/,'')),input=read(prior.fixedCopper.path),prefixes=read(prior.temporaryOpenCommandPrefixes.path)
assert.deepEqual(state.run.source,prior.source);assert.deepEqual(prefixes.map(p=>p.name),['DDR_CSn0','DDR_RESETn']);assert.equal(prefixes[0].cutIndex,32);assert.equal(prefixes[1].cutIndex,10)
const expected=structuredClone(state.input);for(const p of prefixes)expected.traces.find(t=>t.source_trace_id===p.sourceTraceId).route=p.retainedTail
assert.deepEqual(input,expected)
assertOpenCommandPrefixes({...state.run,temporaryOpenCommandPrefixes:prior.temporaryOpenCommandPrefixes},{...input,traces:input.traces.slice(0,134).map(t=>t.source_trace_id===state.opened.sourceTraceId?state.opened.originalTrace:t)},state.source)
const plan=read(prior.manualPrefixPlan.path);assert(plan.every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.1016))
const endpoints=[plan[0],plan.at(-1)].map(({x,y})=>({x,y,layer:'top'})),owner='source_trace_5'
input.connections=[{name:owner,source_trace_id:owner,width:.1016,nominalTraceWidth:.1016,pointsToConnect:endpoints}]
input.buses=[{name:'DDR_COMMAND_CLOCK',busId:'DDR_COMMAND_CLOCK',connectionNames:[owner],traceWidth:.1016,allowedLayers:['top'],maxLengthSkew:.635}];input.differentialPairs=[]
input.bounds={minX:-17.5,maxX:17.5,minY:-17,maxY:9.5}
mkdirSync(directory,{recursive:true});const p=`${directory}/input.simple-route.json`;writeFileSync(p,JSON.stringify(input)+'\n')
const snapshot=`${directory}/native-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/route-am3352-csn0-after-reset-open.mjs'))
const options={fanout:'none',smoothTuning:true},solver=new SOLVERS.BusLanesPipelineSolver(input,options),start=performance.now();let steps=0,next=start+10000,error=null
try{while(!solver.solved&&!solver.failed&&performance.now()-start<Number(duration)*1000){solver.step();steps++;if(performance.now()>next){console.log(JSON.stringify({steps,phase:solver.phase,elapsedSeconds:(performance.now()-start)/1000}));next=performance.now()+10000}}}catch(e){error=String(e);solver.failed=true}
const report={...prior,status:solver.solved?'STAGED_CSN0_NATIVE_PREFIX_RESTORED_RESET_PREFIX_AND_TIMING_REQUIRED':solver.failed?'STAGED_CSN0_NATIVE_PREFIX_WITH_RESET_OPEN_FAILED':'STAGED_CSN0_NATIVE_PREFIX_WITH_RESET_OPEN_TIMEOUT',manualPrefixRun:artifact(`${manualDirectory}/result.json`),input:artifact(p),actualEndpoints:endpoints,
 solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',solverOptions:options,steps,elapsedSeconds:(performance.now()-start)/1000,error:error??solver.error??null,failureCode:solver.failureCode??null,stats:solver.stats,
 pendingCommandPrefixRepairs:solver.solved?1:2,stagedDdrSignalsAfterPhase:31+(solver.solved?1:0),newCompleteReplaySignals:0,wholeByteMatchingQualified:false,executionHelper:artifact(snapshot),exportable:false,fabricationReady:false}
if(solver.solved){
 const output=solver.getOutput();assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces);assert.deepEqual(output.obstacles,input.obstacles);assert.equal(output.traces.length,input.traces.length+1)
 const carrier=output.traces.at(-1);assert.equal(carrier.source_trace_id,owner);assert(carrier.route.every(p=>p.route_type==='wire'&&p.width===.1016&&p.layer==='top'))
 assert(Math.hypot(carrier.route[0].x-endpoints[0].x,carrier.route[0].y-endpoints[0].y)<1e-8&&Math.hypot(carrier.route.at(-1).x-endpoints[1].x,carrier.route.at(-1).y-endpoints[1].y)<1e-8)
 const full=[...carrier.route,...prefixes[0].retainedTail.slice(1)];report.fullCsn0PlanarMm=full.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-full[i].x,p.y-full[i].y),0);report.placementNominalLengthPass=report.fullCsn0PlanarMm>=report.placementNominalRangeMm[0]&&report.fullCsn0PlanarMm<=report.placementNominalRangeMm[1]
 const out=`${directory}/output.simple-route.json`;writeFileSync(out,JSON.stringify(output)+'\n');report.output=artifact(out)
 const fullPath=`${directory}/native-and-manual-csn0.json`;writeFileSync(fullPath,JSON.stringify(full,null,2)+'\n');report.fullCsn0=artifact(fullPath)
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,fullCsn0PlanarMm:report.fullCsn0PlanarMm,stagedDdrSignalsAfterPhase:report.stagedDdrSignalsAfterPhase,pendingResetRepair:1,nominalPass:report.placementNominalLengthPass,exportable:false,fabricationReady:false}));process.exitCode=solver.solved?0:1
