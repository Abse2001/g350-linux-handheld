import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenCommandPrefixes} from './lib/am3352-open-command-prefixes.mjs'

const [reportPath,last='625']=process.argv.slice(2),lastAttempt=Number(last)
assert(reportPath&&Number.isInteger(lastAttempt)&&lastAttempt>=624)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const checked=artifact('checks/integrated/am3352-ddr-usbc-a6-bootstrap-check-summary.json'),{summary,registration}=readCheckedCommandSummary(checked)
assert.equal(registration.signals,32);assert.equal(registration.traces,134);assert.equal(registration.holes,163)
const source=read(summary.source.path),active=read('design-status.json').nextDdrPhase
assert.equal(active.acceptedDefaultDdrSignals,30);assert.equal(active.defaultRemainingDdrSignals,19)
const trials=[],byAttempt=new Map()
for(const directory of readdirSync('dist').filter(d=>/^am3352-ddr32-.*-attempt-\d+$/.test(d))){
 const attempt=Number(directory.match(/attempt-(\d+)$/)[1]);if(attempt<614||attempt>lastAttempt)continue
 const path=`dist/${directory}/result.json`;assert(existsSync(path),`Missing terminal result: ${directory}`)
 const r=read(path);assert.deepEqual(r.source,summary.source);verify(r.source);assert.deepEqual(r.checkedSourceSummary,checked)
 assert.equal(r.fabricationReady,false);assert.equal(r.exportable,false);assert.equal(r.pendingCommandPrefixRepairs,1)
 for(const a of [r.input,r.channel?.input,r.nativeInput,r.priorPreparation,r.priorLocalRun,r.priorNativeFailure,r.manualLocalRun,r.manualLocalCopper,...r.executionHelpers??[]].filter(Boolean))verify(a)
 const failedLocalPreparation=r.nativeBootstrap&&!r.channel&&!r.input&&!r.nativeInput
  ?read(r.nativeBootstrap.path.replace(/signal-escapes.native.json$/,'result.json')):undefined
 if(failedLocalPreparation){assert.deepEqual(failedLocalPreparation.source,r.source);verify(failedLocalPreparation.input);verify(r.nativeBootstrap)}
 const inputArtifact=r.channel?.input??r.nativeInput??r.input??failedLocalPreparation?.input;assert(inputArtifact)
 const input=read(inputArtifact.path),prefixes=assertOpenCommandPrefixes(r,{...input,traces:input.traces.slice(0,registration.traces)},source)
 assert.equal(prefixes.length,1);assert.equal(prefixes[0].name,'DDR_CSn0');assert.equal(prefixes[0].cutIndex,26)
 assert(Math.hypot(prefixes[0].retainedTail[0].x+4.22,prefixes[0].retainedTail[0].y+7.18)<1e-8)
 assert.equal(input.layerCount,4)
 const preparation=read('dist/am3352-ddr32-casn-csn-prefix-open-attempt-614/input.simple-route.json')
 const physicalObstacles=obstacles=>obstacles.map(({componentId,...o})=>o)
 assert.equal(JSON.stringify(physicalObstacles(input.obstacles)),JSON.stringify(physicalObstacles(preparation.obstacles)),'The actual pad/hole/keepout obstacle set must remain intact')
 assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,912)
 assert.equal(input.connections.length,1);assert.equal(input.connections[0].name,'source_trace_19')
 const trial={...artifact(path),attempt,status:r.status,input:inputArtifact,sourceSignals:32,stagedPreviouslyConnectedSignals:31,pendingCommandPrefixRepairs:1,
  ...(r.channel?.stats?{nativeInput:r.channel.input,nativeElapsedSeconds:r.channel.elapsedSeconds,nativeFailureCode:r.channel.stats.failureCode,totalDdrSignalsAfterPhase:r.totalDdrSignalsAfterPhase}:{}),
  ...(r.localEscapes?{packageFanouts:r.localEscapes.map(e=>({package:e.package,end:e.end,lengthMm:e.length,newVias:e.newVias,error:e.error}))}:{}),
  ...(r.result?{searchBounds:r.searchBounds,manualSearchResult:r.result,maximumNewVias:r.maximumNewVias}:{}),
  ...(attempt===623?{superseded:true,supersededBy:624,reason:'Own terminal pad clearance band incorrectly blocked escape; not routing failure evidence'}:{}),
  exportable:false,acceptedIntoActiveDefault:false,qualifiedNewDdrSignals:0}
 trials.push(trial);byAttempt.set(attempt,{r,input,directory})
}
trials.sort((a,b)=>a.attempt-b.attempt)
for(let n=614;n<=lastAttempt;n++)assert(byAttempt.has(n),`Missing issued trial ${n}`)
const actualHandoffProofs=[615,621].map(attempt=>{
 const {r,input,directory}=byAttempt.get(attempt),localPath=`dist/${directory}/local-escapes.json`,local=read(localPath),c=input.connections[0]
 assert.equal(local.length,2);assert.equal(input.traces.length,registration.traces+2)
 const actualEndpoints=[true,false].map(cpu=>{
  const t=local.find(t=>(t.route[0].y>-15)===cpu);assert(t);assert.equal(t.source_trace_id,c.name)
  const st=source.find(e=>e.type==='source_trace'&&e.source_trace_id===c.name),id=st.connected_source_port_ids[cpu?0:1],pad=source.find(e=>e.type==='pcb_port'&&e.source_port_id===id)
  assert(Math.hypot(t.route[0].x-pad.x,t.route[0].y-pad.y)<1e-8);assert.equal(t.route[0].layer,'top')
  for(const p of t.route.filter(p=>p.route_type==='via')){assert.equal(p.via_diameter,.4572);assert.equal(p.via_hole_diameter,.254);assert.deepEqual(p.layers,['top','inner1','inner2','bottom'])}
  const end=t.route.at(-1);return{x:end.x,y:end.y,layer:end.layer}
 })
 assert.deepEqual(c.pointsToConnect,actualEndpoints)
 assert.equal(r.status,'LOCAL_FANOUTS_READY_FOR_NATIVE_CHANNEL_ROUTING')
 return{attempt,fanouts:artifact(localPath),input:artifact(`dist/${directory}/channel.input.simple-route.json`),actualEndpoints,actualPadStartsMatch:true,actualHandoffsMatch:true}
})
const nativeTerminalProofs=[616,622].map(attempt=>{
 const {r,input}=byAttempt.get(attempt),local=read(r.priorLocalRun.path),localInput=read(local.channel.input.path)
 assert.deepEqual(input.connections,localInput.connections);assert.deepEqual(input.traces,localInput.traces)
 assert.equal(r.channel.stats.failureCode,'no_planar_route');assert.equal(r.channel.solved,false);assert.equal(r.newCandidateChannelCount,0);assert.equal(r.totalDdrSignalsAfterPhase,31)
 return{attempt,nativeInput:r.channel.input,localRun:r.priorLocalRun,actualHandoffsMatch:true,completeNewSignalCount:0}
})
assert.equal(byAttempt.get(617).r.localEscapes.find(e=>e.package==='U_SOC').error,'all handoffs obstructed')
for(const n of [618,619]){const r=byAttempt.get(n).r;assert.equal(r.result.error,'no clearance-preserving bridge');assert(!r.carrierHandoffPlan&&!r.manualCarrierOutput)}
for(const n of [624,...lastAttempt>=625?[625]:[]]){
 const {r}=byAttempt.get(n);assert.equal(r.executionHelpers.length,3)
 assert.deepEqual(r.actualEndpoints,[{x:-2.8,y:-6.8,layer:'top'},{x:-1.6,y:-28.2,layer:'top'}])
 // A found plan needs a separate native-leg/neighbor-restoration workflow;
 // this reporter cannot mistake such an intermediate artifact for DDR33.
 assert(!r.actualPadHandoffPlan,'Review the new plan with native legs before extending this failed-trial reporter')
}
const guardValidation=artifact('checks/integrated/am3352-ddr32-command-prefix-guard-validation.json'),guards=read(guardValidation.path)
assert.equal(guards.status,'PASS');assert(Object.values(guards.tests).every(Boolean));assert.deepEqual(guards.source,summary.source);guards.helpers.forEach(verify)
const report={status:'DDR32_CASN_CPU_ACCESS_RECOVERED_STAGED_CSN0_PREFIX_OPEN_NO_NEW_COMPLETE_SIGNAL',checkedCopperCheckpoint:checked,activeDefaultSignals:30,activeDefaultOpenSignals:19,
 copperCheckpointSignals:32,copperCheckpointOpenSignals:17,pendingNominalRepairSignals:summary.pendingNominalRepairSignals,trials,actualHandoffProofs,nativeTerminalProofs,
 openedPrefix:{signal:'DDR_CSn0',cutIndex:26,retainedTailStart:{x:-4.22,y:-7.18},physicalHolesRemoved:0,pendingRepairs:1,exportable:false},guardValidation,
 stagedPreviouslyConnectedSignals:31,qualifiedNewDdrSignals:0,manualSearchFailuresAreNotGlobalImpossibilityProofs:true,
 helpers:['scripts/prepare-am3352-open-command-prefixes.mjs','scripts/lib/am3352-open-command-prefixes.mjs','scripts/route-am3352-guided-local-fanouts.mjs','scripts/route-am3352-guided-channel.mjs','scripts/lib/am3352-guarded-outer-bridge.mjs','scripts/repair-am3352-single-command-carrier.mjs','scripts/repair-am3352-command-pad-path.mjs'].map(artifact),
 referenceLayersReserved:['inner1','inner2'],copperLayers:4,activeSolverHandles:[],defaultChanged:false,originalShellFitVerified:false,fullElectricalTimingQualified:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,trials:trials.length,checkpoint:32,remaining:17,stagedPreviouslyConnected:31,activeDefault:30,fabricationReady:false}))
