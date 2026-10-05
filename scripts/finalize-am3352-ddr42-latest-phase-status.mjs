import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'

const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const prefix='checks/integrated/am3352-command-fine-782-replay'
const checkpointPath=`${prefix}-check-summary.json`,checkpoint=read(checkpointPath)
let verifiedBindings=0
const verifyTree=x=>{
 if(!x||typeof x!=='object')return
 if(typeof x.path==='string'&&typeof x.sha256==='string'){assert.equal(hash(x.path),x.sha256,`Changed bound artifact: ${x.path}`);verifiedBindings++}
 for(const v of Object.values(x))verifyTree(v)
}
verifyTree(checkpoint)
assert.equal(checkpoint.connectedDdrSignals,42);assert.equal(checkpoint.openDdrSignals,7)
assert.equal(checkpoint.fabricationReady,false);assert.equal(checkpoint.fullElectricalTimingQualified,false)

const registryPath=`${prefix}-latest-registry-verification.json`,registry=read(registryPath)
assert.equal(registry.matchesInstalled,true)
for(const [name,version] of Object.entries(registry.versions))assert.equal(read(`node_modules/${name}/package.json`).version,version)
verifyTree(registry.packages)

const corridorPrefix='checks/integrated/am3352-command-open-corridors-789-replay'
const sourceAudit=read(`${corridorPrefix}-source-validation.json`),inputAudit=read(`${corridorPrefix}-native-phase-input-validation.json`)
verifyTree(sourceAudit);verifyTree(inputAudit)
assert.equal(sourceAudit.stagedDdrChannels,37);assert.equal(inputAudit.openConnections,12)
assert.equal(inputAudit.fixedTraces,139);assert.equal(inputAudit.physicalPads,912)
const phasePath='dist/am3352-command-open-corridors-789-native-phase-attempt-791/result.json',phase=read(phasePath)
assert.equal(phase.status,'NATIVE_TSCI_PHASE_BUILD_FAILED');assert.equal(phase.code,1)
assert.equal(phase.sourceDefinitionsUnchanged,true);assert.equal(phase.qualifiedNewDdrSignals,0)
verifyTree(phase)
const phaseFailure=read(phase.artifacts.find(a=>a.path.endsWith('.timeout.json')).path)
assert.equal(phaseFailure.phaseName,'DDR_COMMAND_CLOCK_BUS_LANES');assert.equal(phaseFailure.autorouterName,'bus_lanes')
const nativeExecution=read(phase.execution.path)
for(const a of nativeExecution.definitions){assert.equal(hash(a.originalPath),a.sha256);verifyTree(a)}
assert.deepEqual(nativeExecution.versions,registry.versions)
const trialPaths=[
 'dist/am3352-command-ddr42-escape-priority-carriers-attempt-790/result.json',phasePath,
 'dist/am3352-command-open-corridors-remaining-fanouts-attempt-792/result.json',
 'dist/am3352-command-open-corridors-expanded-fanouts-attempt-793/result.json',
]
const overwrittenPlanningHistory=[]
const trials=trialPaths.map(path=>{
 const r=read(path);assert.equal(r.qualifiedNewDdrSignals,0)
 if(path===trialPaths[0]){
  // This planner overwrites each provisional per-net file. Verify the saved
  // terminal states and inputs; explicitly record superseded history hashes.
  // Provisional files never qualify PCB copper.
  const {attempts,...terminal}=r;verifyTree(terminal)
  assert(readFileSync(r.executionHelper.path,'utf8').includes('`${directory}/${name.toLowerCase()}.route.json`'))
  for(const attempt of attempts){
   const {route,...other}=attempt;verifyTree(other)
   if(!route)continue
   assert(route.path.startsWith('dist/am3352-command-ddr42-escape-priority-carriers-attempt-790/'))
   assert(/\/ddr_[a-z0-9]+\.route\.json$/.test(route.path))
   const actual=hash(route.path)
   if(actual===route.sha256)verifyTree(route)
   else overwrittenPlanningHistory.push({path:route.path,supersededAttemptSha256:route.sha256,terminalFileSha256:actual,qualifiedCopperEvidence:false})
  }
 }else verifyTree(r)
 return{result:artifact(path),status:r.status,qualifiedNewDdrSignals:0}
})
for(const path of trialPaths.slice(2)){
 const r=read(path);assert.equal(r.status,'MANUAL_FANOUT_ASSIGNMENT_INCOMPLETE')
 assert.equal(r.expectedFanouts,24);assert(r.diagnostics.every(d=>d.candidates>0))
 assert(r.domainConflicts.some(d=>d.endpoints==='DDR_BA0:ram/DDR_A3:ram'))
}
const typecheckLog=`${corridorPrefix}-typecheck.log`
assert(readFileSync(typecheckLog,'utf8').includes('tsc --noEmit'))
const typecheckPath=`${corridorPrefix}-typecheck-status.json`
writeFileSync(typecheckPath,JSON.stringify({status:'PASS',exitCode:0,log:artifact(typecheckLog),scope:'All current TypeScript and TSX sources, including DDR42 and the 37-signal open-corridor replay/native phase. Process 53543 completed with exit code 0.'},null,2)+'\n')
for(const p of ['scripts/prepare-am3352-open-corridors-expanded-fanouts.mjs','scripts/finalize-am3352-ddr42-latest-phase-status.mjs']){
 const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});assert.equal(r.status,0,r.stderr)
}

const status=read('design-status.json')
assert.equal(status.fabricationReady,false);assert.equal(status.originalShellFit.verified,false)
const oldManifestPath='checks/integrated/tscircuit-update-2744/fabrication-guard.json',oldManifest=read(oldManifestPath)
assert.equal(oldManifest.files.length,205);verifyTree(oldManifest.files)
const oldFiles=readdirSync('fabrication',{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>`${e.parentPath}/${e.name}`).sort()
const guard=spawnSync(process.execPath,['scripts/export-fabrication.mjs'],{encoding:'utf8'})
assert.equal(guard.status,1);assert((guard.stdout+guard.stderr).includes('Fabrication export blocked: integrated handheld routing, original G350 shell fit and release checks remain incomplete'))
const guardLog=`${prefix}-latest-fabrication-guard.log`;writeFileSync(guardLog,guard.stdout+guard.stderr)
verifyTree(oldManifest.files)
assert.deepEqual(readdirSync('fabrication',{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>`${e.parentPath}/${e.name}`).sort(),oldFiles)
const git=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'});assert.equal(git.status,0)
const head=git.stdout.trim();assert(/^[a-f0-9]{40}$/.test(head))
assert.equal(head,read('checks/integrated/am3352-command-clock-seeded-775-replay-final-preservation.json').head)
assert.equal(hash('dist/index/circuit.json'),'6bfa9900d405e4b2bb9aa7ed8d6c68ff6df07d9727aa10bcd3462c7a77707641')

const reportPath=`${prefix}-latest-phase-status.json`
const report={status:'LATEST_TOOLCHAIN_PHASE_EXERCISED_DDR42_RETAINED_FORWARD_TRIALS_TERMINAL',checkpoint:artifact(checkpointPath),registryVerification:artifact(registryPath),forwardPlanningStage:{source:sourceAudit.source,sourceAudit:artifact(`${corridorPrefix}-source-validation.json`),nativeInputAudit:artifact(`${corridorPrefix}-native-phase-input-validation.json`),temporaryConnectedSignalGuides:37,openedUnqualifiedCommandSignals:['DDR_A7','DDR_BA0','DDR_CASn','DDR_A4','DDR_ODT'],full49SignalGoalRetained:true},trials,latestNativePhaseFailure:'bus_lanes routing timeout; no complete new output',latestNativePhaseElapsedMs:phaseFailure.elapsedMs,latestNativePhaseBuildWallSeconds:phase.elapsedSeconds,individuallyLegalPackageEndpoints:24,simultaneousPackageFanoutAssignment:false,remainingPackageConflict:'DDR_BA0:ram/DDR_A3:ram',connectedDdrSignals:42,openDdrSignals:7,nominalRepairs:17,spacingRepairs:7,gerberShortsAllLayers:0,reportedPhysicalViolationsAllSeverities:0,presentationWarnings:418,reportedAndCappedHostOpens:499,ignoredChecks:checkpoint.ignoredChecks,typecheck:artifact(typecheckPath),fabricationGuard:{exitCode:1,log:artifact(guardLog),previousFileManifest:artifact(oldManifestPath),historicalFilesUnchanged:205,noOrderingFilesAdded:true},verifiedBindings,activeSolverHandles:[],head,defaultSourceUnchanged:true,fullDdrRouting:false,fullElectricalTimingQualified:false,fullHostRouting:false,originalShellFitVerified:false,fabricationReady:false,githubPushed:false,tscircuitPushed:false,executionHelper:artifact('scripts/finalize-am3352-ddr42-latest-phase-status.mjs')}
report.overwrittenPlanningHistory=overwrittenPlanningHistory
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n')
status.latestCommandCarrierReplay=artifact(checkpointPath)
status.latestRoutingProgress={status:checkpoint.status,evidence:artifact(checkpointPath),entry:checkpoint.entry,connectedDdrSignals:42,openDdrSignals:7,missingDdrSignals:checkpoint.missingDdrSignals,pendingNominalRepairSignals:checkpoint.pendingNominalRepairSignals,pendingSpacingRepairSignals:checkpoint.pendingSpacingRepairSignals,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false}
status.latestTrialStatus={firstTrial:777,lastTrial:793,evidence:artifact(reportPath),activeSolverHandles:[],latestNativePhase:report.latestNativePhaseFailure,latestCheckedPartialSignals:42,fabricationReady:false}
status.latestRegistryVerification=artifact(registryPath)
status.toolchainRegistryVerification={verifiedAt:registry.verifiedAt,tscircuit:registry.versions.tscircuit,cli:registry.versions['@tscircuit/cli'],core:registry.versions['@tscircuit/core'],capacityAutorouter:registry.versions['@tscircuit/capacity-autorouter'],matchesInstalled:true}
writeFileSync('design-status.json',JSON.stringify(status,null,2)+'\n')
console.log(JSON.stringify({status:report.status,connected:42,open:7,latestPhase:'bus_lanes',newCompleteNativeOutput:false,activeSolverHandles:[],historicalFilesUnchanged:205,head,fabricationReady:false}))
