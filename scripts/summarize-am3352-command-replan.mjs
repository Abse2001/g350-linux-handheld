import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'

const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const prefix='checks/integrated/am3352-command-manual-fanouts-763'
const circuitPath='dist/diagnostics/am3352-command-manual-fanouts-763-refilled-candidate/circuit.json'
const boardPath='dist/am3352-command-manual-fanouts-763-diagnostic/board.kicad_pcb'
const circuit=read(circuitPath),source=artifact(circuitPath),board=artifact(boardPath)
const inputAudit=read('checks/integrated/am3352-command-replan-input-preservation.json')
const phaseAudit=read('checks/integrated/am3352-command-replan-native-phase-758-preservation.json')
for(const r of [inputAudit,phaseAudit]){assert.equal(r.status,'COMMAND_REPLAN_INPUT_REAL_PAD_AND_FIXED_COPPER_PRESERVATION_PASS');for(const a of [r.source,r.input])assert.equal(hash(a.path),a.sha256)}
const fanouts=read(`${prefix}-native-fanouts.json`),ddr=read(`${prefix}-native-ddr.json`),references=read(`${prefix}-native-references.json`),usb=read(`${prefix}-native-usb.json`)
for(const r of [fanouts,ddr,references,usb]){
 assert.equal(r.board.sha256,board.sha256);assert.equal(hash(r.board.path),board.sha256)
 const a=r.circuit??r.source;assert.equal(a.sha256,source.sha256);assert.equal(hash(a.path),source.sha256)
}
assert.equal(fanouts.cpuFanoutsConnected,26);assert.equal(fanouts.ramFanoutsConnected,26);assert.equal(fanouts.physicalVias,193)
assert.equal(ddr.connectedSignals,23);assert.equal(references.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(references.ramGroundBallsConnectedToGroundPlane,21);assert.equal(references.ramBypassTerminalsConnectedToPlanes,28)
assert.equal(usb.numericPadNetAssignmentsVerified,38);assert.equal(usb.connectivityRecords.length,40)
const drc=read(`${prefix}-final-drc.json`),counts={}
for(const v of drc.violations)counts[v.type]=(counts[v.type]??0)+1
assert.deepEqual(counts,{via_dangling:52,silk_edge_clearance:2,text_height:18,silk_overlap:199,silk_over_copper:199})
assert(drc.violations.every(v=>v.severity==='warning'));assert.equal(drc.unconnected_items.length,499)
const project=read('dist/am3352-command-manual-fanouts-763-diagnostic/board.kicad_pro')
const reviewedProject=read('dist/am3352-ddr-usbc-d12-spacing-repaired-diagnostic/board.kicad_pro')
assert.deepEqual(project.board.design_settings.rule_severities,reviewedProject.board.design_settings.rule_severities)
const ignoredChecks=Object.entries(project.board.design_settings.rule_severities).filter(([,v])=>v==='ignore').map(([k])=>k);assert.equal(ignoredChecks.length,5)
assert.equal(readFileSync(`${prefix}-refilled-shorts.log`,'utf8').trim(),'No shorts detected in circuit.json')
const freeze=read('dist/diagnostics/am3352-command-manual-fanouts-763-refilled-candidate/manifest.json');assert.equal(freeze.circuit.sha256,source.sha256);assert(freeze.referencePoursRefilled)
assert.equal(circuit.filter(e=>e.type==='pcb_trace').length,177);assert.equal(circuit.filter(e=>e.type==='pcb_via').length,193)
const plan=read('dist/am3352-ddr23-command-replan-manual-fanouts-attempt-763/result.json');assert.equal(plan.selectedFanouts,52);assert.equal(plan.assignmentAttempts,52)
const terminalTrialPaths=[
 'dist/am3352-ddr33-direct-planar-native-attempt-755/result.json',
 'dist/am3352-ddr33-manual-fanout-assignment-attempt-756/result.json',
 'dist/am3352-ddr33-distant-manual-fanout-assignment-attempt-757/result.json',
 'dist/am3352-ddr23-command-replan-native-attempt-758/result.json',
 'dist/am3352-ddr23-command-replan-manual-fanouts-attempt-759/result.json',
 'dist/am3352-ddr23-command-replan-manual-fanouts-attempt-761/result.json',
 'dist/am3352-ddr23-command-replan-manual-carriers-attempt-762/result.json',
 'dist/am3352-ddr23-command-replan-manual-fanouts-attempt-763/result.json',
 'dist/am3352-ddr23-command-replan-manual-carriers-bootstrap-attempt-764/result.json',
 'dist/am3352-ddr23-command-replan-manual-clock-carriers-attempt-765/result.json',
]
const trials=terminalTrialPaths.map(path=>{const r=read(path);assert.equal(r.qualifiedNewDdrSignals,0);if(r.executionHelper){assert.equal(hash(r.executionHelper.path),r.executionHelper.sha256);const check=spawnSync(process.execPath,['--check',r.executionHelper.path],{encoding:'utf8'});assert.equal(check.status,0,check.stderr)}return {result:artifact(path),status:r.status,elapsedSeconds:r.elapsedSeconds??null,qualifiedNewDdrSignals:0}})
const phase=read(terminalTrialPaths[3]);assert.equal(phase.code,1);assert(phase.sourceDefinitionsUnchanged);assert.equal(phase.phases[0].connections,26)
assert.equal(hash(phase.execution.path),phase.execution.sha256)
const phaseExecution=read(phase.execution.path)
for(const d of phaseExecution.definitions)assert.equal(hash(d.path),d.sha256)
assert.equal(hash(phaseExecution.executionHelper.path),phaseExecution.executionHelper.sha256)
const phaseHelperCheck=spawnSync(process.execPath,['--check',phaseExecution.executionHelper.path],{encoding:'utf8'});assert.equal(phaseHelperCheck.status,0,phaseHelperCheck.stderr)
const helpers=['scripts/check-am3352-command-replan-input.mjs','scripts/prepare-am3352-ddr33-manual-fanouts.mjs','scripts/freeze-am3352-command-manual-fanouts.mjs','scripts/route-am3352-ddr33-manual-fanout-native.mjs','scripts/summarize-am3352-command-replan.mjs']
for(const path of helpers){const r=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});assert.equal(r.status,0,r.stderr)}
const upgradePath='checks/integrated/tscircuit-update-2744/final-summary.json',upgrade=read(upgradePath)
for(const a of [...upgrade.packages,upgrade.nativeCoreBundle,upgrade.defaultSource])assert.equal(hash(a.path),a.sha256)
for(const c of upgrade.unchangedCheckedCandidates)for(const a of [c.summary,c.source,c.board])assert.equal(hash(a.path),a.sha256)
const guard=read('checks/integrated/am3352-command-replan-fabrication-guard.json');assert.equal(guard.historicalFabricationFilesUnchanged,205);assert.equal(guard.exitCode,1)
const typecheck=read('checks/integrated/am3352-command-replan-typecheck-status.json');assert.equal(typecheck.exitCode,0);assert.equal(hash(typecheck.log.path),typecheck.log.sha256)
const report={
 status:'ALL_52_COMMAND_MANUAL_FANOUTS_INDEPENDENTLY_CONNECTED_AND_CLEARANCE_CHECKED_CARRIERS_INCOMPLETE',
 latestToolchainEvidence:artifact(upgradePath),registryReverification:artifact('checks/integrated/am3352-command-replan-registry-verification.json'),versions:upgrade.versions,
 nativePhaseEntry:artifact('experiments/am3352-ddr23-command-replan.circuit.tsx'),nativePhaseExecution:phase.execution,nativePhasePreservation:artifact('checks/integrated/am3352-command-replan-native-phase-758-preservation.json'),bootstrapInputPreservation:artifact('checks/integrated/am3352-command-replan-input-preservation.json'),
 source,board,manualFanoutPlan:plan.plan,manualFanoutAssignment:artifact('dist/am3352-ddr23-command-replan-manual-fanouts-attempt-763/result.json'),freeze:artifact('dist/diagnostics/am3352-command-manual-fanouts-763-refilled-candidate/manifest.json'),
 fanoutConnectivity:artifact(`${prefix}-native-fanouts.json`),ddrConnectivity:artifact(`${prefix}-native-ddr.json`),ramReferences:artifact(`${prefix}-native-references.json`),usbConnectivity:artifact(`${prefix}-native-usb.json`),nativeDrc:artifact(`${prefix}-final-drc.json`),gerberShorts:artifact(`${prefix}-refilled-shorts.log`),library:artifact(`${prefix}-library.log`),
 topSnapshot:artifact('dist/am3352-command-manual-fanouts-763-diagnostic/top.png'),bottomSnapshot:artifact('dist/am3352-command-manual-fanouts-763-diagnostic/bottom.png'),bothSurfaceSnapshotsInspected:true,
 components:212,physicalPads:912,copperLayers:4,fixedTracePiecesRetained:125,fixedViasRetained:141,newManualEscapePieces:52,newThroughVias:52,tracePieces:177,physicalThroughVias:193,cpuManualFanoutsConnected:26,ramManualFanoutsConnected:26,
 connectedDdrSignals:23,openDdrSignals:26,completeCommandClockCarriers:0,qualifiedNewDdrSignals:0,gerberShortsAllLayers:0,independentClearanceViolationsAllSeverities:0,diagnosticDanglingViaWarnings:52,presentationWarnings:418,reportedAndCappedHostOpens:499,ignoredChecks,
 ramSupplyBallsConnectedToDdrPlane:18,ramGroundBallsConnectedToGroundPlane:21,ramBypassTerminalsConnectedToPlanes:28,usbNumericPadAssignmentsVerified:38,usbContinuityRecordsVerified:40,
 trials,helperSyntaxRepair760:artifact('checks/integrated/am3352-ddr23-command-replan-manual-fanouts-760.log'),rejectedStalePlaneFill:artifact('dist/diagnostics/am3352-command-manual-fanouts-763-candidate/manifest.json'),rejectedStalePlaneShorts:artifact(`${prefix}-shorts.log`),
 sourceHelpers:helpers.map(artifact),nativeFanoutCheckHelper:artifact('scripts/check-am3352-kicad-manual-command-fanouts.py'),typecheck:artifact('checks/integrated/am3352-command-replan-typecheck-status.json'),fabricationGuard:artifact('checks/integrated/am3352-command-replan-fabrication-guard.json'),
 activeSolverHandles:[],defaultCopperChanged:false,bestSeparateCheckedDdrSignals:33,fullDdrRouting:false,fullDdrElectricalQualification:false,fullHostRouting:false,originalShellFitVerified:false,fabricationReady:false,githubPushed:false,tscircuitPushed:false,
 nextAction:'Route command carriers from the verified physical fanout exits, retaining all checked byte/reset/reference/USB copper. Restore every native differential-pair declaration in the editable complete replay, then recheck all 49 connections, timing, spacing and return paths. Apply measured original-shell geometry and finish the powered host and Linux provisioning before fabrication.',
 scope:'Separate command-replan bootstrap on the existing oversized fixture. Byte/reset paths and fixed host copper are retained; 26 old/open command connections remain incomplete. Dangling-via warnings are reported, not suppressed. No new complete DDR channel is qualified or promoted to the default.'
}
writeFileSync('checks/integrated/am3352-command-replan-check-summary.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,fanouts:52,shorts:0,clearanceViolations:0,danglingVias:52,connectedDdrSignals:23,qualifiedNewDdrSignals:0,activeSolverHandles:[],fabricationReady:false}))
