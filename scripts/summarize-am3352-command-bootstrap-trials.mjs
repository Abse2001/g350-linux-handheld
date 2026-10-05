import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'

const [reportPath,last='591']=process.argv.slice(2),lastAttempt=Number(last)
assert(reportPath&&Number.isInteger(lastAttempt)&&lastAttempt>=591)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const a3=artifact('checks/integrated/am3352-ddr-usbc-a3-bootstrap-check-summary.json'),a6=artifact('checks/integrated/am3352-ddr-usbc-a6-bootstrap-check-summary.json')
const {summary:prior}=readCheckedCommandSummary(a3),{summary:checkpoint}=readCheckedCommandSummary(a6)
assert.equal(prior.connectedDdrSignals,31);assert.equal(checkpoint.connectedDdrSignals,32)
assert(prior.bootstrapOnly&&checkpoint.bootstrapOnly&&!checkpoint.addedSignalNominalLengthPass)
const active=read('design-status.json').nextDdrPhase
assert.equal(active.acceptedDefaultDdrSignals,30);assert.equal(active.defaultRemainingDdrSignals,19)
const trials=[]
for(const directory of readdirSync('dist').filter(d=>/^am3352-ddr(31|32)-.*-attempt-\d+$/.test(d))){
  const attempt=Number(directory.match(/attempt-(\d+)$/)[1])
  if(attempt<575||attempt>lastAttempt)continue
  const path=`dist/${directory}/result.json`;if(!existsSync(path))continue
  const r=read(path),checked=[prior,checkpoint].find(s=>s.source.path===r.source?.path&&s.source.sha256===r.source?.sha256)
  assert(checked,`Unknown source for ${directory}`);verify(r.source);assert.equal(r.fabricationReady,false)
  for(const a of [r.input,r.channel?.input,r.output,r.priorPaths,r.priorProvenance,r.priorSourceValidation].filter(Boolean))verify(a)
  const carriers=r.channel?.stats?.busLengths?.flatMap(b=>b.lengths)??[]
  trials.push({...artifact(path),attempt,sourceSignals:checked.connectedDdrSignals,status:r.status,
    ...(r.channel?{nativeElapsedSeconds:r.channel.elapsedSeconds,nativeFailureCode:r.channel.stats?.failureCode??null,nativeInput:r.channel.input,joinedCarrierLengths:carriers}:{}),
    ...(r.localEscapes?{packageFanouts:r.localEscapes.map(e=>({package:e.package,end:e.end,lengthMm:e.length,newVias:e.newVias,error:e.error,reachableBounds:e.reachableBounds,reachableLayers:e.reachableLayers,boundaryBlockers:e.boundaryBlockers?.slice(0,6)}))}:{}),
    ...(attempt===587?{independentlyCopperCheckedReplay:a6,nominalLengthPass:false}:{}),
    acceptedIntoActiveDefault:false,fullElectricalTimingQualified:false})
}
trials.sort((a,b)=>a.attempt-b.attempt)
const unusedAttemptNumbers=[601,602]
for(let n=575;n<=lastAttempt;n++)assert(unusedAttemptNumbers.includes(n)||trials.some(t=>t.attempt===n),`Missing terminal attempt ${n}`)
const endpointProof=directory=>{
  const local=read(`${directory}/local-escapes.json`),input=read(`${directory}/channel.input.simple-route.json`)
  assert.equal(local.length,2);assert.equal(input.connections.length,1)
  const c=input.connections[0]
  const ends=[true,false].map(cpu=>{
    const routes=local.filter(t=>t.source_trace_id===c.name&&(t.route[0].y>-15)===cpu);assert.equal(routes.length,1)
    const p=routes[0].route.at(-1);return {x:p.x,y:p.y,layer:p.layer}
  })
  assert.deepEqual(c.pointsToConnect,ends)
  return {fanouts:artifact(`${directory}/local-escapes.json`),input:artifact(`${directory}/channel.input.simple-route.json`),actualEndpoints:ends,allTerminalsMatch:true}
}
const proofs=[584,585,...lastAttempt>=611?[603,611]:[]].map(n=>{
  const trial=trials.find(t=>t.attempt===n);assert(trial)
  return endpointProof(trial.path.replace(/\/result.json$/,''))
})
const nativeTerminalProofs=trials.filter(t=>t.status.startsWith('GUIDED_NATIVE_CHANNEL_')).map(t=>{
  const run=read(t.path);verify(run.priorLocalRun)
  const proof=endpointProof(run.priorLocalRun.path.replace(/\/result.json$/,''))
  const nativeInput=read(run.channel.input.path),authored=read(proof.input.path)
  assert.deepEqual(nativeInput.connections,authored.connections)
  return {attempt:t.attempt,nativeInput:run.channel.input,localRun:run.priorLocalRun,...proof}
})
const native=read(trials.find(t=>t.attempt===587).path),top=read(trials.find(t=>t.attempt===591).path)
assert(native.channel.solved&&top.channel.solved)
assert.equal(native.totalDdrSignalsAfterPhase,32);assert.equal(top.totalDdrSignalsAfterPhase,32)
assert(Math.abs(native.channel.stats.busLengths[0].lengths[0].totalLengthMm-checkpoint.addedSignalPlanarMm)<1e-8)
assert(top.channel.stats.busLengths[0].lengths[0].totalLengthMm>checkpoint.addedSignalPlanarMm)
const bridge=read(trials.find(t=>t.attempt===590).path)
assert.equal(bridge.legalViaSamples,59);assert.equal(bridge.bridgeCandidatesTested,3116);assert.equal(bridge.rangeCandidateCount,0)
assert(bridge.minimumUncheckedBridgeLengthMm>checkpoint.placementNominalReview.rangeMm[1])
assert(!bridge.paths&&!existsSync(trials.find(t=>t.attempt===590).path.replace('result.json','paths.json')))
const report={status:'DDR31_32_COMMAND_BOOTSTRAP_TRIALS_BOUND_NOMINAL_FAILURES_RETAINED_ACTIVE_DDR30_UNCHANGED',
  priorCopperCheckpoint:a3,newCopperCheckpoint:a6,activeDefaultSignals:30,activeDefaultOpenSignals:19,
  copperCheckpointSignals:32,copperCheckpointOpenSignals:17,pendingNominalRepairSignals:checkpoint.pendingNominalRepairSignals,
  trials,unusedAttemptNumbers:unusedAttemptNumbers.filter(n=>n<=lastAttempt),actualHandoffProofs:proofs,nativeTerminalProofs,
  nativeBottomA6PlanarMm:checkpoint.addedSignalPlanarMm,nativeTopA6PlanarMm:top.channel.stats.busLengths[0].lengths[0].totalLengthMm,
  sampledCarrierBridgeMinimumUncheckedMm:bridge.minimumUncheckedBridgeLengthMm,sampledBridgeIsNotAGlobalRoutingImpossibilityProof:true,
  helpers:['scripts/route-am3352-guided-local-fanouts.mjs','scripts/route-am3352-guided-channel.mjs','scripts/repair-am3352-command-carrier-layer.mjs'].map(artifact),
  referenceLayersReserved:['inner1','inner2'],copperLayers:4,activeSolverHandles:[],defaultChanged:false,
  fullElectricalTimingQualified:false,originalShellFitVerified:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,trials:trials.length,checkpoint:32,remaining:17,activeDefault:30,fabricationReady:false}))
