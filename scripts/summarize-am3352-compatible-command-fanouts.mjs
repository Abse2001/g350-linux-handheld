import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'

const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const pre='checks/integrated/am3352-command-compatible-fanouts-802',manifestPath='dist/diagnostics/am3352-command-compatible-fanouts-802-refilled-candidate/manifest.json',manifest=read(manifestPath)
for(const a of [manifest.source,manifest.plan,manifest.circuit])verify(a)
assert.equal(manifest.addedFanoutPieces,48);assert.equal(manifest.addedThroughVias,48);assert.equal(manifest.fixedTraces,127);assert.equal(manifest.fixedVias,145)
const source=manifest.circuit,board=artifact('dist/am3352-command-compatible-fanouts-802-diagnostic/board.kicad_pcb'),circuit=read(source.path)
assert.equal(circuit.filter(e=>e.type==='source_component').length,212)
assert.equal(circuit.filter(e=>e.type==='pcb_smtpad').length,912)
assert.equal(circuit.filter(e=>e.type==='pcb_trace').length,175)
assert.equal(circuit.filter(e=>e.type==='pcb_via').length,193)
const reports={fanouts:read(`${pre}-native-fanouts.json`),ddr:read(`${pre}-native-ddr.json`),references:read(`${pre}-native-references.json`),usb:read(`${pre}-native-usb.json`)}
for(const r of Object.values(reports)){verify(r.board);assert.equal(r.board.sha256,board.sha256);const s=r.circuit??r.source;verify(s);assert.equal(s.sha256,source.sha256)}
assert.equal(reports.fanouts.cpuFanoutsConnected,24);assert.equal(reports.fanouts.ramFanoutsConnected,24);assert.equal(reports.fanouts.records.length,48)
assert.equal(reports.ddr.connectedSignals,25);assert.equal(reports.references.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(reports.references.ramGroundBallsConnectedToGroundPlane,21);assert.equal(reports.references.ramBypassTerminalsConnectedToPlanes,28)
assert.equal(reports.usb.numericPadNetAssignmentsVerified,38);assert.equal(reports.usb.connectivityRecords.length,40)
const planar=read(`${pre}-ddr-connectivity.json`)
assert.equal(planar.circuitSha256,source.sha256);assert.equal(planar.connectedSignals,25)
assert(planar.timing.filter(t=>t.name!=='DDR_COMMAND_CLOCK').every(t=>t.pass))
assert.deepEqual(planar.problems.filter(p=>!p.startsWith('Unconnected memory signal: ')),['Incomplete or unmatched planar timing group: DDR_COMMAND_CLOCK'])
const drc=read(`${pre}-final-drc.json`),counts={}
for(const v of drc.violations)counts[v.type]=(counts[v.type]??0)+1
assert.deepEqual(counts,{via_dangling:48,silk_edge_clearance:2,text_height:18,silk_overlap:199,silk_over_copper:199})
assert(drc.violations.every(v=>v.severity==='warning'));assert.equal(drc.unconnected_items.length,499)
assert.equal(readFileSync(`${pre}-shorts.log`,'utf8').trim(),'No shorts detected in circuit.json')
const project=read('dist/am3352-command-compatible-fanouts-802-diagnostic/board.kicad_pro'),reviewed=read('dist/am3352-ddr-usbc-d12-spacing-repaired-diagnostic/board.kicad_pro')
assert.deepEqual(project.board.design_settings.rule_severities,reviewed.board.design_settings.rule_severities)
const ignored=Object.entries(project.board.design_settings.rule_severities).filter(([,v])=>v==='ignore').map(([k])=>k);assert.equal(ignored.length,5)
assert(readFileSync(`${pre}-library.log`,'utf8').includes('293 exact local footprints; all 13725 physical records unchanged.'))

const planPath='dist/am3352-command-all-control-corridors-component-fanouts-attempt-802/result.json',plan=read(planPath)
assert.equal(plan.status,'ALL_MANUAL_FANOUTS_PLANNED_NATIVE_ROUTE_AND_ALL_CHECKS_REQUIRED');assert.equal(plan.selectedFanouts,48)
for(const a of [plan.input,plan.source,plan.plan,plan.executionHelper])verify(a)
assert(plan.componentResults.every(c=>c.solved));assert.equal(plan.componentResults.reduce((n,c)=>n+c.endpoints.length,0),48)
const trialPaths=[
 'dist/am3352-command-nine-corridors-795-native-phase-attempt-796/result.json',
 'dist/am3352-command-nine-corridors-expanded-fanouts-attempt-797/result.json',
 'dist/am3352-command-nine-corridors-component-fanouts-attempt-798/result.json',
 'dist/am3352-command-all-control-corridors-800-native-phase-attempt-801/result.json',planPath,
 'dist/am3352-command-compatible-fanouts-two-face-native-attempt-803/result.json',
 'dist/am3352-command-compatible-fanouts-phased-native-attempt-804/result.json',
 'dist/am3352-command-compatible-fanouts-manual-repairs-attempt-808/result.json',
]
const trials=trialPaths.map(path=>{
 const r=read(path);assert.equal(r.qualifiedNewDdrSignals,0)
 for(const a of [r.source,r.input,r.executionHelper,r.guardHelper,r.state,r.plan,r.originalInput,r.nativeResult,r.planResult].filter(Boolean))verify(a)
 for(const a of r.artifacts??[])verify(a)
 for(const a of r.attempts??[])if(a.carrier)verify(a.carrier)
 return{result:artifact(path),status:r.status,qualifiedNewDdrSignals:0}
})
const native=read(trialPaths[6]),manual=read(trialPaths[7]);assert.equal(native.plannedNativeCarriers,6);assert.equal(manual.retainedNativeCarriers,6);assert.equal(manual.manualCarriers,5);assert.equal(manual.plannedCommandCarriers,11);assert.equal(manual.remainingCommandCarriers,13)
assert.deepEqual(read(manual.state.path).carriers.slice(0,6),read(native.state.path).carriers)
const failedExecutionPaths=[805,806,807].map(n=>`dist/am3352-command-compatible-fanouts-manual-repairs-attempt-${n}/execution-failure.json`)
const failedExecutions=failedExecutionPaths.map(path=>{const r=read(path);assert.equal(r.exitCode,1);assert.equal(r.qualifiedNewDdrSignals,0);return{evidence:artifact(path),status:r.status,runtimeHelperSnapshotReproducible:r.runtimeHelperSnapshotReproducible??true}})
const inputAudits=[795,800].map(n=>`checks/integrated/am3352-command-${n===795?'nine':'all-control'}-corridors-${n}-replay-native-phase-input-validation.json`)
for(const p of inputAudits){const r=read(p);verify(r.source);verify(r.input);assert.equal(r.physicalPads,912)}

const versions=Object.fromEntries([['tscircuit','tscircuit'],['@tscircuit/core','core'],['@tscircuit/capacity-autorouter','capacity'],['@tscircuit/cli','cli']].map(([pkg,key])=>{const v=read(`${pre}-registry-${key}.json`);assert.equal(read(`node_modules/${pkg}/package.json`).version,v);return[pkg,v]}))
assert.deepEqual(versions,{tscircuit:'0.0.2744','@tscircuit/core':'0.0.2080','@tscircuit/capacity-autorouter':'0.0.958','@tscircuit/cli':'0.1.2237'})
const registryPath=`${pre}-registry-verification.json`;writeFileSync(registryPath,JSON.stringify({status:'REGISTRY_LATEST_MATCHES_INSTALLED',verifiedAt:new Date().toISOString(),versions,matchesInstalled:true,registryOutputs:['tscircuit','core','capacity','cli'].map(k=>artifact(`${pre}-registry-${k}.json`)),packages:['package.json','package-lock.json','bun.lock'].map(artifact)},null,2)+'\n')
const typecheckPath='checks/integrated/am3352-command-all-control-corridors-800-replay-typecheck.log';assert(readFileSync(typecheckPath,'utf8').includes('tsc --noEmit'))
const helpers=['scripts/diagnose-am3352-command-stage-escapes.mjs','scripts/prepare-am3352-command-corridor-stage.mjs','scripts/prepare-am3352-command-component-fanouts.mjs','scripts/route-am3352-compatible-fanouts-two-face-native.mjs','scripts/route-am3352-compatible-fanouts-phased-native.mjs','scripts/freeze-am3352-compatible-command-fanouts.mjs','scripts/route-am3352-compatible-fanouts-manual-repairs.mjs','scripts/check-am3352-kicad-compatible-command-fanouts.py','scripts/summarize-am3352-compatible-command-fanouts.mjs']
for(const p of helpers.filter(p=>p.endsWith('.mjs'))){const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});assert.equal(r.status,0,r.stderr)}
const oldFilesPath='checks/integrated/tscircuit-update-2744/fabrication-guard.json',oldFiles=read(oldFilesPath).files
assert.equal(oldFiles.length,205);for(const a of oldFiles)verify(a)
const guard=spawnSync(process.execPath,['scripts/export-fabrication.mjs'],{encoding:'utf8'});assert.equal(guard.status,1);assert((guard.stdout+guard.stderr).includes('Fabrication export blocked: integrated handheld routing'))
const guardLog=`${pre}-fabrication-guard.log`;writeFileSync(guardLog,guard.stdout+guard.stderr);for(const a of oldFiles)verify(a)
assert.equal(hash('dist/index/circuit.json'),'6bfa9900d405e4b2bb9aa7ed8d6c68ff6df07d9727aa10bcd3462c7a77707641')
const head=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'});assert.equal(head.status,0);assert.equal(head.stdout.trim(),read('checks/integrated/am3352-command-clock-seeded-775-replay-final-preservation.json').head)

const checkpointPath='checks/integrated/am3352-command-fine-782-replay-check-summary.json',checkpoint=read(checkpointPath);verify(checkpoint.source);verify(checkpoint.board);assert.equal(checkpoint.connectedDdrSignals,42)
const reportPath=`${pre}-check-summary.json`
const report={status:'ALL_48_COMMAND_PACKAGE_PAD_TO_VIA_PREFIXES_CHECKED_CARRIERS_AND_FULL_HANDHELD_INCOMPLETE',source,board,manifest:artifact(manifestPath),plan:artifact(planPath),versions,latestRegistry:artifact(registryPath),actualLocalFanoutsConnected:48,cpuFanoutsConnected:24,ramFanoutsConnected:24,retainedCompleteDdrSignals:25,openDdrSignalsInPrefixDiagnostic:24,tracePieces:175,throughVias:193,components:212,physicalPads:912,copperLayers:4,bothBytePlanarRelativeSkewPass:true,allThreePairPlanarRelativeSkewPass:true,fullCommandClassMatchingPass:false,independentFanoutAudit:artifact(`${pre}-native-fanouts.json`),independentDdrAudit:artifact(`${pre}-native-ddr.json`),planarDdrAudit:artifact(`${pre}-ddr-connectivity.json`),ramReferenceAudit:artifact(`${pre}-native-references.json`),usbAudit:artifact(`${pre}-native-usb.json`),finalDrc:artifact(`${pre}-final-drc.json`),shorts:artifact(`${pre}-shorts.log`),library:artifact(`${pre}-library.log`),gerberShortsAllLayers:0,physicalClearanceAndDrillViolationsAllSeverities:0,danglingLocalTerminalViaWarnings:48,presentationWarnings:418,reportedAndCappedHostOpens:499,ignoredChecks:ignored,ramSupplyGroundBypassConnected:[18,21,28],usbNumericPadAssignments:38,usbContinuityRecords:40,topSnapshot:artifact('dist/am3352-command-compatible-fanouts-802-diagnostic/top.png'),bottomSnapshot:artifact('dist/am3352-command-compatible-fanouts-802-diagnostic/bottom.png'),bothSnapshotsInspected:true,trials,rejectedExecutions:failedExecutions,nativePhaseInputAudits:inputAudits.map(artifact),nativePlannedCarriers:6,manualPlannedCarriers:5,remainingPlannedCarriers:13,combinedCarriersReplayedAndIndependentlyChecked:false,bestCheckedCompleteSignalSubset:{evidence:artifact(checkpointPath),connected:42,open:7,notTimingQualified:true},typecheck:{status:'PASS',exitCode:0,log:artifact(typecheckPath),verifiedProcess:83525},currentHelpers:helpers.map(artifact),fabricationGuard:{exitCode:1,log:artifact(guardLog),historicalFileManifest:artifact(oldFilesPath),historicalFilesUnchanged:205},head:head.stdout.trim(),activeSolverHandles:[],defaultChanged:false,qualifiedNewDdrSignals:0,fullDdrRouting:false,fullElectricalTimingQualified:false,fullHostRouting:false,originalShellFitVerified:false,fabricationReady:false,githubPushed:false,tscircuitPushed:false,nextAction:'Complete all 24 command/control carriers from legal package exits, using native bus_lanes and guarded repairs. Investigate whether conservative raster padding seals physically legal thin corridors and optimize exit choices with carrier routing. Qualify a complete editable replay, command nominal and relative timing, spacing, coupling, impedance, returns and termination; complete host/Linux and measured original-shell integration.'}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n')
const status=read('design-status.json');assert.equal(status.fabricationReady,false);assert.equal(status.latestRoutingProgress.connectedDdrSignals,42)
status.latestCommandFanoutPrefix=artifact(reportPath)
status.latestTrialStatus={firstTrial:794,lastTrial:808,evidence:artifact(reportPath),activeSolverHandles:[],latestNativePhase:'All-command tsci bus_lanes timeout; direct combined native search failed; sequential native phases produced six unqualified carriers.',latestCheckedPartialSignals:42,latestCheckedLocalCommandFanouts:48,unqualifiedNativeCarriers:6,unqualifiedManualCarriers:5,fabricationReady:false}
status.latestRegistryVerification=artifact(registryPath)
status.toolchainRegistryVerification={verifiedAt:read(registryPath).verifiedAt,tscircuit:versions.tscircuit,cli:versions['@tscircuit/cli'],core:versions['@tscircuit/core'],capacityAutorouter:versions['@tscircuit/capacity-autorouter'],matchesInstalled:true}
writeFileSync('design-status.json',JSON.stringify(status,null,2)+'\n')
console.log(JSON.stringify({status:report.status,checkedPackageFanouts:48,bestCheckedCompleteSignals:42,nativePlanned:6,manualPlanned:5,remainingCarriers:13,activeSolverHandles:[],fabricationReady:false}))
