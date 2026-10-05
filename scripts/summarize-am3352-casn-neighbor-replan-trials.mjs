import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenCommandPrefixes} from './lib/am3352-open-command-prefixes.mjs'
import {assertOpenDataWires} from './lib/am3352-open-data-wires.mjs'
import {readStagedCasnAndRepairedCsn0 as readFirstStage} from './lib/am3352-staged-casn-csn0.mjs'
import {readStagedCasnAndRepairedCsn0 as readRetainedStage} from './lib/am3352-staged-casn-retained-ram.mjs'

const [reportPath,last='662']=process.argv.slice(2),lastAttempt=Number(last)
assert(reportPath&&lastAttempt===662,'Review newly issued phases before extending this evidence binder')
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const snapshots=['checks/integrated/helpers/am3352-command-wire-topology-v1.mjs','checks/integrated/helpers/am3352-casn-guided-cpu-v1.mjs'].map(artifact)
const resolvedSnapshots=new Map()
const verify=a=>{
 if(existsSync(a.path)&&hash(a.path)===a.sha256)return a
 const saved=snapshots.find(s=>s.sha256===a.sha256);assert(saved,`Missing executed artifact ${a.path} (${a.sha256})`)
 assert(['scripts/diagnose-am3352-command-corridor-wire-replan.mjs','scripts/prepare-am3352-casn-retained-ram-guided.mjs'].includes(a.path))
 resolvedSnapshots.set(a.path+':'+a.sha256,{recorded:a,immutableSnapshot:saved});return saved
}
const verifyArtifacts=x=>{
 if(!x||typeof x!=='object')return
 if(typeof x.path==='string'&&typeof x.sha256==='string')verify(x)
 for(const v of Object.values(x))verifyArtifacts(v)
}
const checked=artifact('checks/integrated/am3352-ddr-usbc-a6-bootstrap-check-summary.json'),{summary,registration}=readCheckedCommandSummary(checked)
assert.equal(registration.signals,32);assert.equal(registration.traces,134);assert.equal(registration.holes,163)
const source=read(summary.source.path),status=read('design-status.json'),preparation=read('dist/am3352-ddr32-casn-csn-prefix-open-attempt-614/result.json'),preparedInput=read(preparation.input.path)
assert.equal(status.nextDdrPhase.acceptedDefaultDdrSignals,30);assert(status.nextDdrPhase.continuityCandidateDdrSignals>=32);assert.equal(status.originalShellFit.verified,false)
const byAttempt=new Map(),trials=[]
for(const d of readdirSync('dist').filter(d=>/^am3352-ddr32-.*-attempt-\d+$/.test(d))){
 const attempt=Number(d.match(/attempt-(\d+)$/)[1]);if(attempt<626||attempt>lastAttempt)continue
 const path=`dist/${d}/result.json`;assert(existsSync(path),`Missing terminal result ${attempt}`);const r=read(path)
 assert(!byAttempt.has(attempt));assert.deepEqual(r.source,summary.source);assert.deepEqual(r.checkedSourceSummary,checked);verifyArtifacts(r)
 assert.equal(r.exportable,false);assert.equal(r.fabricationReady,false);assert.equal(r.defaultChanged,false)
 if(attempt===626)assert.equal(r.input.sha256,preparation.input.sha256)
 else assert.equal(r.physicalHolesRemoved??r.temporaryOpenDataWires?.physicalHolesRemoved,0)
 assert.equal(r.copperLayers??read(r.input.path).layerCount,4)
 if(r.newCompleteReplaySignals!==undefined)assert.equal(r.newCompleteReplaySignals,0)
 if(r.qualifiedNewDdrSignals!==undefined)assert.equal(r.qualifiedNewDdrSignals,0)
 if(/FAILED|TIMEOUT/.test(r.status))assert(!r.output&&!r.actualPadPlan&&!r.manualPrefixPlan,'A failed phase must not masquerade as a solved route')
 const terminal={...artifact(path),attempt,status:r.status,
  ...(r.elapsedSeconds!==undefined?{elapsedSeconds:r.elapsedSeconds}:{}),
  ...(r.failureCode?{failureCode:r.failureCode}:{}),
  ...(r.hypotheticalOpenedWireNames?{hypotheticalOpenedWireNames:r.hypotheticalOpenedWireNames,cpuReachableFromRam:r.cpuReachableFromRam,minimumLayerTransitions:r.minimumLayerTransitions}:{}),
  ...(r.startReachableFromGoal!==undefined?{signal:r.signal,startReachableFromGoal:r.startReachableFromGoal,minimumLayerTransitions:r.minimumLayerTransitions}:{}),
  ...(r.stagedDdrSignalsAfterPhase!==undefined?{stagedDdrSignalsAfterPhase:r.stagedDdrSignalsAfterPhase}:{}),
  ...(r.fullCasnPlanarMm!==undefined?{fullCasnPlanarMm:r.fullCasnPlanarMm,placementNominalLengthPass:r.placementNominalLengthPass}:{}),
  ...(r.fullCsn0PlanarMm!==undefined?{fullCsn0PlanarMm:r.fullCsn0PlanarMm,placementNominalLengthPass:r.placementNominalLengthPass}:{}),
  checkedCheckpointSignals:32,qualifiedNewDdrSignals:0,exportable:false}
 trials.push(terminal);byAttempt.set(attempt,{r,directory:`dist/${d}`})
}
for(let n=626;n<=lastAttempt;n++)assert(byAttempt.has(n),`Missing issued phase ${n}`)
trials.sort((a,b)=>a.attempt-b.attempt)
const run=n=>byAttempt.get(n).r,length=route=>route.reduce((sum,p,i)=>sum+(i?Math.hypot(p.x-route[i-1].x,p.y-route[i-1].y):0),0),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
const originalObstacles=i=>assert.deepEqual(i.obstacles,preparedInput.obstacles)
for(let n=626;n<=635;n++){
 const r=run(n),i=read(r.input.path);assertOpenCommandPrefixes(r,i,source);assert.deepEqual(i,preparedInput);assert.equal(r.topologyOnly,true);assert.equal(r.viaMutualSpacingQualified,false)
 if(n>=627){assert.equal(r.sourceInputModified,false);assert(r.hypotheticalOpenedWireNames.length>=1)}
}
assert.equal(run(626).cpuReachableFromRam,false)
assert.equal(run(631).cpuReachableFromRam,false);assert.deepEqual(run(631).hypotheticalOpenedWireNames,['DDR_DQM1'])
assert.equal(run(635).cpuReachableFromRam,false);assert.deepEqual(run(635).hypotheticalOpenedWireNames,['DDR_D10'])
assert.equal(run(633).cpuReachableFromRam,true);assert.deepEqual(run(633).hypotheticalOpenedWireNames,['DDR_DQM1','DDR_D10']);assert.equal(run(633).minimumLayerTransitions,0)
const dataPreparationProofs=[636,646].map(n=>{
 const r=run(n),i=read(r.input.path),{opened,prefixes}=assertOpenDataWires(r,i,source);originalObstacles(i)
 assert.equal(opened.length,2);assert.equal(prefixes.length,1);assert.equal(r.stagedPreviouslyConnectedSignals,29)
 if(n===646){assert.deepEqual(opened.map(o=>o.cutIndex),[516,689]);assert(opened.every(o=>o.retainedRouteMode==='RAM_TAIL'))}
 return{attempt:n,input:r.input,opened:opened.map(o=>({signal:o.name,sourceTraceId:o.sourceTraceId,retainedRouteMode:o.retainedRouteMode??'CPU_PAD_MARKER',cutIndex:o.cutIndex})),oldObstaclesPreserved:true,oldPhysicalVias:163}
})
const first=run(637),firstInput=read(first.input.path),firstOutput=read(first.output.path)
assertOpenDataWires(first,firstInput,source);originalObstacles(firstInput)
assert.equal(firstInput.traces.length,134);assert.equal(firstOutput.traces.length,135);assert.deepEqual(firstOutput.traces.slice(0,134),firstInput.traces);assert.deepEqual(firstOutput.obstacles,firstInput.obstacles)
const firstRoute=firstOutput.traces.at(-1);assert.equal(firstRoute.source_trace_id,'source_trace_19');assert(firstRoute.route.every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.1016))
assert.equal(firstRoute.route.length,9);assert(near(firstRoute.route[0],{x:-2.8,y:-6.8})&&near(firstRoute.route.at(-1),{x:-1.6,y:-28.2}))
const firstLength=length(firstRoute.route);assert(Math.abs(firstLength-23.59658729971087)<1e-8);assert.equal(first.stagedDdrSignalsAfterPhase,30)
assert.equal(run(638).failureCode,'local_dogbone_failed');assert.equal(run(639).status,'STAGED_DATA_WIRES_NATIVE_TIMEOUT')
const firstJoined=readFirstStage(byAttempt.get(641).directory);assert.equal(firstJoined.input.traces.length,135);assert.equal(run(641).stagedDdrSignalsAfterPhase,31);assert.equal(run(641).placementNominalLengthPass,true)
for(const n of [642,643,655,657])assert(!run(n).actualPadPlan)
for(const n of [644,645,658,659,662]){assert.equal(run(n).startReachableFromGoal,false);assert.equal(run(n).minimumLayerTransitions,null);assert.equal(run(n).topologyOnly,true)}
assert.equal(run(647).status,'STAGED_CASN_NATIVE_BUS_LANES_TIMEOUT');assertOpenDataWires(run(647),read(run(647).input.path),source)
assert.equal(run(648).status,'STAGED_CASN_RETAINED_RAM_CPU_FANOUT_FAILED');assert.deepEqual(run(648).result.goalBlocked,[false,true])
const retainedCarrierProofs=[651,652].map(n=>{
 const r=run(n),prior=read(r.priorLocalRun.path),i=read(r.input.path),o=read(r.output.path),local=read(prior.localCopper.path)
 assertOpenDataWires(r,{...i,traces:i.traces.slice(0,134)},source);originalObstacles(i)
 assert.equal(i.traces.length,136);assert.equal(o.traces.length,137);assert.deepEqual(o.traces.slice(0,136),i.traces);assert.deepEqual(o.obstacles,i.obstacles)
 assert.deepEqual(i.traces.slice(134),[local[1],local[0]])
 assert.deepEqual(i.connections[0].pointsToConnect,r.actualHandoffs);assert.deepEqual(r.actualPads,[{x:-2.8,y:-6.8,layer:'top'},{x:-1.6,y:-28.2,layer:'top'}])
 local.forEach((t,j)=>{assert.equal(t.source_trace_id,'source_trace_19');assert(near(t.route[0],r.actualPads[j]));assert(near(t.route.at(-1),r.actualHandoffs[j]))})
 const carrier=o.traces.at(-1),layer=n===651?'bottom':'top';assert.equal(carrier.source_trace_id,'source_trace_19');assert(carrier.route.every(p=>p.route_type==='wire'&&p.width===.1016&&p.layer===layer));assert(near(carrier.route[0],r.actualHandoffs[0])&&near(carrier.route.at(-1),r.actualHandoffs[1]))
 assert.equal(local.flatMap(t=>t.route.filter(p=>p.route_type==='via')).length,2);assert.equal(r.stats.phase,'solved');assert.equal(r.stats.dogbones,0)
 const planarMm=local.reduce((sum,t)=>sum+length(t.route),0)+length(carrier.route);assert(Math.abs(planarMm-r.fullCasnPlanarMm)<1e-8);assert.equal(r.placementNominalLengthPass,false);assert.equal(r.stagedDdrSignalsAfterPhase,30)
 return{attempt:n,localRun:r.priorLocalRun,input:r.input,output:r.output,actualPads:r.actualPads,actualHandoffs:r.actualHandoffs,carrierLayer:layer,carrierPlanarMm:length(carrier.route),fullPlanarMm:planarMm,newThroughVias:2,placementNominalLengthPass:false,stillOpen:['DDR_CSn0','DDR_DQM1','DDR_D10'],qualifiedNewDdrSignals:0}
})
const retainedPrefixProofs=[654,661].map(n=>{
 const joined=readRetainedStage(byAttempt.get(n).directory),r=run(n);assert.equal(joined.input.traces.length,137);assert.equal(joined.opened.length,2);assert.equal(r.stagedDdrSignalsAfterPhase,31)
 assert.equal(r.pendingCommandPrefixRepairs,0);assert.equal(r.pendingDataWireRepairs,2);assert.equal(r.placementNominalLengthPass,true)
 return{attempt:n,run:artifact(`${byAttempt.get(n).directory}/result.json`),repairedPrefix:r.repairedPrefix,fullCsn0PlanarMm:r.fullCsn0PlanarMm,newThroughVias:2,stagedConnectedDdrSignals:31,pendingDataRepairs:['DDR_DQM1','DDR_D10'],qualifiedNewDdrSignals:0}
})
assert.equal(run(656).status,'STAGED_DATA_WIRES_NATIVE_TIMEOUT');assert.equal(run(656).stagedDdrSignalsAfterPhase,31);assert.equal(run(656).wholeByteMatchingQualified,false)
const guards=artifact('checks/integrated/am3352-ddr32-data-wire-guard-validation.json'),guardReport=read(guards.path);verifyArtifacts(guardReport);assert.equal(guardReport.status,'PASS');assert(Object.values(guardReport.tests).every(Boolean))
const helpers=['scripts/summarize-am3352-casn-neighbor-replan-trials.mjs','scripts/lib/am3352-open-data-wires.mjs','scripts/lib/am3352-open-command-prefixes.mjs','scripts/prepare-am3352-command-wire-replan.mjs','scripts/diagnose-am3352-command-corridor.mjs','scripts/diagnose-am3352-command-corridor-wire-replan.mjs','scripts/lib/am3352-outer-corridor-topology.mjs','scripts/lib/am3352-guarded-outer-bridge.mjs','scripts/route-am3352-command-wire-replan.mjs','scripts/route-am3352-staged-data-wire-restore.mjs','scripts/repair-am3352-staged-command-prefix.mjs','scripts/route-am3352-staged-prefix-native-leg.mjs','scripts/lib/am3352-staged-casn-csn0.mjs','scripts/repair-am3352-staged-data-pad-path.mjs','scripts/diagnose-am3352-staged-data-corridor.mjs','scripts/prepare-am3352-casn-retained-ram-guided.mjs','scripts/route-am3352-casn-retained-ram-carrier.mjs','scripts/repair-am3352-retained-ram-command-prefix.mjs','scripts/route-am3352-retained-ram-prefix-native-leg.mjs','scripts/lib/am3352-staged-casn-retained-ram.mjs','scripts/repair-am3352-retained-ram-data-path.mjs','scripts/route-am3352-retained-ram-data-restore.mjs','scripts/diagnose-am3352-retained-ram-data-corridor.mjs','scripts/validate-am3352-staged-wire-guards.mjs','scripts/save-am3352-registered-command.mjs'].map(artifact)
const report={status:'DDR32_NATIVE_CASN_AND_CSN0_STAGED_DATA_REPAIRS_UNRESOLVED_NO_NEW_CHECKED_SIGNAL',checkedCopperCheckpoint:checked,activeDefaultSignals:30,activeDefaultOpenSignals:19,checkedCheckpointSignals:32,checkedCheckpointOpenSignals:17,
 trials,executedHelperSnapshotResolutions:[...resolvedSnapshots.values()],dataPreparationProofs,
 topologyFinding:{testedSingleDqm1OpeningConnected:false,testedSingleD10OpeningConnected:false,testedDqm1D10PairConnected:true,minimumLayerTransitionsForPair:0,hypotheticalWireOmissionsOnly:true,globalRoutingImpossibilityClaimed:false},
 firstNativeCasnProof:{attempt:637,input:first.input,output:first.output,actualPadStartsMatch:true,fullTopPlanarMm:firstLength,newThroughVias:0,statsGetterUnavailableInOriginalReport:true,derivedLengthFromActualOutput:true,stagedConnectedSignals:30,stillOpen:['DDR_CSn0','DDR_DQM1','DDR_D10']},
 retainedCarrierProofs,retainedPrefixProofs,guardValidation:guards,pendingNominalRepairSignals:summary.pendingNominalRepairSignals,
 stagedCasnNominalLengthPass:false,dataWholeByteMatchingQualified:false,qualifiedNewDdrSignals:0,allOriginal163HolesRetained:true,physicalHolesRemoved:0,
 nextAction:'Jointly replan CASn and the blocking data/package access copper, including neighboring routes and vias where required; restore DQM1/D10 and retain a genuine native bus_lanes phase. Independently replay and check complete DDR/USB/planes, all-layer shorts, physical DRC and original whole-byte timing before counting a new signal. Match the command lengths and complete host/Linux and measured original-shell layout before release.',
 helpers,activeSolverHandles:[],defaultChanged:false,copperLayers:4,referenceLayersReserved:['inner1','inner2'],originalShellFitVerified:false,fullElectricalTimingQualified:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,trials:trials.length,nativeCasnCarriers:3,nativeCsn0Repairs:3,checkedSignals:32,remaining:17,qualifiedNewSignals:0,fabricationReady:false}))
