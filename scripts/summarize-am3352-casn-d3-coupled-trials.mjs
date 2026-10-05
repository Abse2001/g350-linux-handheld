import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenD3Signal} from './lib/am3352-open-d3-signal.mjs'
import {readStagedCasnD3Open} from './lib/am3352-staged-casn-d3-open.mjs'
import {readStagedCasnD3Restored} from './lib/am3352-staged-casn-d3-restored.mjs'
import {readStagedCasnD3Csn0} from './lib/am3352-staged-casn-d3-csn0.mjs'

const [reportPath,last='688']=process.argv.slice(2);assert(reportPath&&Number(last)===688)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const verify=a=>assert.equal(hash(a.path),a.sha256,`Changed executed artifact ${a.path}`)
const verifyArtifacts=x=>{if(!x||typeof x!=='object')return;if(typeof x.path==='string'&&typeof x.sha256==='string')verify(x);for(const v of Object.values(x))verifyArtifacts(v)}
const checked=artifact('checks/integrated/am3352-ddr-usbc-a6-bootstrap-check-summary.json'),{summary,registration}=readCheckedCommandSummary(checked),source=read(summary.source.path)
assert.equal(registration.signals,32);assert.equal(registration.holes,163)
const dirs=readdirSync('dist').filter(d=>/^am3352-ddr(?:32|33)-.*-attempt-\d+$/.test(d)),byAttempt=new Map(),trials=[]
for(const d of dirs){const n=Number(d.match(/(\d+)$/)[1]);if(n<663||n>688)continue;assert(!byAttempt.has(n));const path=`dist/${d}/result.json`;assert(existsSync(path));const r=read(path);verifyArtifacts(r)
 assert.equal(r.fabricationReady,false);assert.equal(r.defaultChanged,false)
 if(n<=683){assert.deepEqual(r.source,summary.source);assert.deepEqual(r.checkedSourceSummary,checked);assert.equal(r.exportable,false)}
 if(/FAILED|TIMEOUT|NO_CANDIDATE/.test(r.status))assert(!r.output&&!r.paths,'Failed phases cannot provide new routed copper')
 byAttempt.set(n,{r,directory:`dist/${d}`});trials.push({...artifact(path),attempt:n,status:r.status,
  ...(r.solver?{solver:r.solver,elapsedSeconds:r.elapsedSeconds,failureCode:r.failureCode,stats:r.stats}:{}),
  ...(r.hypotheticalOpenedWireNames?{hypotheticalOpenedWireNames:r.hypotheticalOpenedWireNames,cpuReachableFromRam:r.cpuReachableFromRam,minimumLayerTransitions:r.minimumLayerTransitions}:{}),
  ...(r.signal?{signal:r.signal}:{}),...(r.afterPlanarMm!==undefined?{afterPlanarMm:r.afterPlanarMm}:{}),...(r.stagedDdrSignalsAfterPhase!==undefined?{stagedDdrSignalsAfterPhase:r.stagedDdrSignalsAfterPhase}:{}),
  ...(r.fullCasnPlanarMm!==undefined?{fullCasnPlanarMm:r.fullCasnPlanarMm}:{}),...(r.fullD3PlanarMm!==undefined?{fullD3PlanarMm:r.fullD3PlanarMm}:{}),...(r.fullCsn0PlanarMm!==undefined?{fullCsn0PlanarMm:r.fullCsn0PlanarMm}:{}),...(r.fullResetPlanarMm!==undefined?{fullResetPlanarMm:r.fullResetPlanarMm}:{}),
  fabricationReady:false})
}
for(let n=663;n<=688;n++)assert(byAttempt.has(n),`Missing terminal phase ${n}`);trials.sort((a,b)=>a.attempt-b.attempt)
const run=n=>byAttempt.get(n).r
assert.equal(run(663).failureCode,'local_dogbone_failed');assert.equal(run(664).status,'STAGED_CASN_DATA_JOINT_NATIVE_TIMEOUT')
for(let n=665;n<=669;n++){
 const r=run(n);assert.equal(r.topologyOnly,true);assert.equal(r.physicalHolesRemoved,0);assert.equal(r.sourceInputModified,false);assert.equal(r.hypotheticalOmittedSignalHoles.length,2)
 for(const h of r.hypotheticalOmittedSignalHoles){const v=source.find(v=>v.type==='pcb_via'&&v.pcb_via_id===h.pcbViaId);assert(v);assert.equal(v.source_net_id,undefined);assert.equal(v.x,h.x);assert.equal(v.y,h.y);assert.equal(v.outer_diameter,.4572);assert.equal(v.hole_diameter,.254)}
 assert.equal(r.cpuReachableFromRam,n===667)
}
assert.deepEqual(run(667).hypotheticalOpenedWireNames,['DDR_D3']);assert.deepEqual(run(667).hypotheticalOmittedSignalHoles.map(h=>h.pcbViaId),['pcb_via_145','pcb_via_146']);assert.equal(run(667).minimumLayerTransitions,2)
const prep=run(670);assertOpenD3Signal(prep,read(prep.input.path),source);assert.equal(prep.stagedSignalHolesOmitted,2);assert.equal(prep.physicalSourceModified,false)
const casn=readStagedCasnD3Open(byAttempt.get(673).directory),d3=readStagedCasnD3Restored(byAttempt.get(676).directory),csn=readStagedCasnD3Csn0(byAttempt.get(681).directory)
assert.equal(casn.input.traces.length,135);assert.equal(d3.input.traces.length,135);assert.equal(csn.input.traces.length,135)
assert.equal(run(672).failureCode,'local_dogbone_failed');assert.equal(run(674).failureCode,'local_dogbone_failed')
const nativeProofs=[[673,'source_trace_19','bottom',2,'fullCasn'],[676,'source_trace_42','bottom',4,'fullD3'],[681,'source_trace_5','top',0,'fullCsn0'],[683,'source_trace_10','bottom',2,'fullReset']].map(([n,owner,layer,vias,key])=>{
 const r=run(n),i=read(r.input.path),o=read(r.output.path),t=o.traces.at(-1),full=read(r[key].path)
 assert.equal(r.solver,'@tscircuit/core SOLVERS.BusLanesPipelineSolver');assert.equal(r.solverOptions.fanout,'none');assert.equal(r.stats.phase,'solved')
 assert.deepEqual(o.traces.slice(0,i.traces.length),i.traces);assert.equal(o.traces.length,i.traces.length+1);assert.deepEqual(o.obstacles,i.obstacles)
 assert.equal(t.source_trace_id,owner);assert(t.route.every(p=>p.route_type==='wire'&&p.layer===layer&&p.width===.1016));assert.equal(full.filter(p=>p.route_type==='via').length,vias)
 return{attempt:n,run:artifact(`${byAttempt.get(n).directory}/result.json`),input:r.input,output:r.output,fullJoinedRoute:r[key],nativeLayer:layer,throughVias:vias,fullyReconstructedBySourceAuditor:true}
})
assert(!run(677).manualPrefixPlan&&!run(678).manualPrefixPlan)
assert.equal(run(679).result.newVias,6);assert(run(679).fullCsn0PlanarMm>74)
assert.equal(run(680).result.newVias,0);assert.equal(run(680).pendingCommandPrefixRepairs,2);assert.equal(run(681).pendingCommandPrefixRepairs,1)
assert.equal(run(682).pendingCommandPrefixRepairs,0);assert.equal(run(683).pendingCommandPrefixRepairs,0);assert.equal(run(683).stagedDdrSignalsAfterPhase,33)
assert.equal(run(684).status,'GUARDED_REPLAY_WIRE_LENGTH_NO_CANDIDATE');assert.equal(run(685).status,'D3_RETAINED_NATIVE_MEANDER_PACKAGE_REPAIR_FAILED');assert.equal(run(686).status,'GUARDED_REPLAY_WIRE_LENGTH_NO_CANDIDATE')
for(const n of [687,688]){assert.equal(run(n).status,'GUARDED_REPLAY_WIRE_LENGTH_ADDED_INDEPENDENT_CHECKS_REQUIRED');assert.equal(run(n).newPhysicalHoles,0);assert.equal(run(n).clearanceMethod,'exact segment-to-circle/rectangle/segment geometry')}
assert.equal(run(687).signal,'DDR_D3');assert(Math.abs(run(687).afterPlanarMm-30.727783540546866)<1e-8);assert.equal(run(688).signal,'DDR_CASn');assert(Math.abs(run(688).afterPlanarMm-43.02)<1e-8)
const diagnostic=artifact('checks/integrated/am3352-ddr-usbc-casn-d3-coupled-check-summary.json'),matched=artifact('checks/integrated/am3352-ddr-usbc-casn-d3-matched-check-summary.json'),nominal=artifact('checks/integrated/am3352-ddr-usbc-casn-nominal-d3-matched-check-summary.json')
for(const a of [diagnostic,matched,nominal]){const r=read(a.path);verifyArtifacts(r);assert.equal(r.connectedDdrSignals,33);assert.equal(r.throughVias,169);assert.equal(r.gerberShortsAllLayers,0);assert.equal(r.independentPhysicalViolationsAllSeverities,0);assert.equal(r.fabricationReady,false);assert.equal(r.defaultChanged,false)}
assert.equal(read(diagnostic.path).bothBytePlanarTimingPass,false);assert.equal(read(matched.path).bothBytePlanarTimingPass,true);const latest=read(nominal.path);assert(latest.bothBytePlanarTimingPass&&latest.allThreeDifferentialPairPlanarTimingPass&&latest.casnNominalLengthPass);assert.equal(latest.csnNominalLengthPass,false)
const guards=artifact('checks/integrated/am3352-ddr32-d3-signal-guard-validation.json'),g=read(guards.path);verifyArtifacts(g);assert.equal(g.status,'PASS');assert(Object.values(g.tests).every(Boolean))
const helpers=['scripts/summarize-am3352-casn-d3-coupled-trials.mjs','scripts/check-am3352-casn-d3-coupled-source.mjs','scripts/summarize-am3352-casn-d3-coupled-checks.mjs','scripts/lib/am3352-open-d3-signal.mjs','scripts/lib/am3352-staged-casn-d3-open.mjs','scripts/lib/am3352-staged-casn-d3-restored.mjs','scripts/lib/am3352-staged-casn-d3-csn0.mjs','scripts/save-am3352-casn-d3-coupled-replay.mjs','scripts/tune-am3352-replayed-path.mjs','scripts/repair-am3352-d3-retained-meander.mjs'].map(artifact)
const report={status:'DDR33_CASN_NOMINAL_NATIVE_COUPLED_REPLAY_COPPER_AND_BYTE_MATCHING_CHECKED_HOST_INCOMPLETE',initialCheckedSource:checked,priorRegisteredCheckpointSignals:32,newCopperCheckpointEvidence:nominal,checkedCopperSignals:33,remainingDdrSignals:16,activeDefaultSignals:30,
 trials,nativeProofs,initialUnmatchedReplay:diagnostic,d3MatchedReplay:matched,casnNominalAndD3MatchedReplay:nominal,
 topologyFinding:{testedD3WireAndItsTwoSignalHolesOpeningConnected:true,minimumLayerTransitionsInCounterfactualModel:2,powerAndGroundHolesAlwaysFixed:true,otherTestedProfilesConnected:false,globalMinimalityOrImpossibilityClaimed:false},
 replannedOriginalD3SignalHoles:['pcb_via_145','pcb_via_146'],originalOtherHolesPreserved:161,newSignalHoles:8,completeReplayedHoles:169,allOpenedSignalsRestored:true,remainingOpenedSignalRepairs:[],nativeBusLanesBootstrap:true,manualRepairs:true,
 guardedExactWireTunings:[{attempt:687,signal:'DDR_D3',teeth:run(687).tuning.teeth,planarMm:latest.routes.DDR_D3.planarMm,newHoles:0},{attempt:688,signal:'DDR_CASn',teeth:run(688).tuning.teeth,planarMm:latest.routes.DDR_CASn.planarMm,newHoles:0}],
 bothCompleteBytePlanarTimingPass:true,allThreeDifferentialPairPlanarTimingPass:true,casnNominalLengthPass:true,csnNominalLengthPass:false,pendingNominalRepairSignals:latest.pendingNominalRepairSignals,gerberShortsAllLayers:0,independentPhysicalViolationsAllSeverities:0,guardValidation:guards,
 nextAction:'Use the checked 33-signal native/manual bootstrap to route the remaining 16 address/control signals; shorten CSn0 and repair CK/CKn/CKE/A3/A6 nominal lengths while preserving both whole byte groups and physical checks. Complete electrical DDR qualification, power/storage/display/controls/audio/Linux and measured original G350 shell integration before release.',
 helpers,activeSolverHandles:[],defaultChanged:false,copperLayers:4,fullElectricalTimingQualified:false,originalShellFitVerified:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,trials:trials.length,connected:33,open:16,shorts:0,physicalViolations:0,fabricationReady:false}))
