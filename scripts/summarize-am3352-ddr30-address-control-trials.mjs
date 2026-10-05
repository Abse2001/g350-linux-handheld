import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'

// Bind failed routing stages separately from the independently checked board.
// In particular, a solver success with the old wrong A3 endpoint is invalid.
const [reportPath,lastAttempt='567']=process.argv.slice(2)
assert(reportPath&&Number.isInteger(Number(lastAttempt))&&Number(lastAttempt)>=563)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)})
const checkedArtifact=artifact('checks/integrated/am3352-ddr-usbc-wen-nominal-check-summary.json')
const {summary:checked}=readCheckedCommandSummary(checkedArtifact)
assert.equal(checked.connectedDdrSignals,30);assert.equal(checked.remainingDdrSignalNames.length,19)
const source=read(checked.source.path)
assert(!source.some(t=>t.type==='pcb_trace'&&t.source_trace_id==='source_trace_7'))
const endpointProof=directory=>{
  const paths=read(`${directory}/local-escapes.json`),input=read(`${directory}/channel.input.simple-route.json`)
  assert.equal(input.connections.length,1)
  const c=input.connections[0]
  const expected=[true,false].map(cpu=>{
    const candidates=paths.filter(t=>t.source_trace_id===c.name&&(t.route[0].y>-15)===cpu)
    assert.equal(candidates.length,1)
    const p=candidates[0].route.at(-1)
    return {x:p.x,y:p.y,layer:p.layer}
  })
  return {fanouts:artifact(`${directory}/local-escapes.json`),input:artifact(`${directory}/channel.input.simple-route.json`),
    actualFanoutEndpoints:expected,authoredNativeTerminals:c.pointsToConnect,
    allTerminalsMatch:JSON.stringify(expected)===JSON.stringify(c.pointsToConnect)}
}
const invalid=endpointProof('dist/am3352-ddr30-a3-inner-cpu-local-attempt-558')
const corrected=endpointProof('dist/am3352-ddr30-a3-inner-cpu-local-attempt-561')
assert.equal(invalid.allTerminalsMatch,false);assert.equal(corrected.allTerminalsMatch,true)
const guardPath='checks/integrated/am3352-ddr30-a3-handoff-guard-attempt-562.log'
assert(readFileSync(guardPath,'utf8').includes('AssertionError: Every native carrier terminal must be an actual saved package fanout endpoint'))
assert(!existsSync('dist/am3352-ddr30-a3-handoff-guard-attempt-562/result.json'))
const trials=[]
for(const directory of readdirSync('dist').filter(p=>/^am3352-ddr30-.*-attempt-\d+$/.test(p))){
  const attempt=Number(directory.match(/attempt-(\d+)$/)[1])
  if(attempt<554||attempt>Number(lastAttempt))continue
  const path=`dist/${directory}/result.json`;if(!existsSync(path))continue
  const r=read(path)
  assert.deepEqual(r.source,checked.source)
  assert(!r.fabricationReady)
  trials.push({...artifact(path),attempt,reportedStageStatus:r.status,
    outcome:attempt===558?'LOCAL_FANOUTS_VALID_AUTHORED_NATIVE_TERMINAL_MISMATCH':attempt===560?'INVALID_NATIVE_CARRIER_TERMINAL_MISMATCH_NEVER_ACCEPTED':r.status,
    ...(r.channel?.elapsedSeconds===undefined?{}:{nativeElapsedSeconds:r.channel.elapsedSeconds}),
    ...(r.channel?.stats?.failureCode?{nativeFailureCode:r.channel.stats.failureCode}:{}),
    ...(r.channel?.input?{nativeInput:r.channel.input}:{}),
    accepted:false})
}
trials.sort((a,b)=>a.attempt-b.attempt)
for(let attempt=554;attempt<=Number(lastAttempt);attempt++)assert(attempt===562||trials.some(t=>t.attempt===attempt),`Missing terminal stage ${attempt}`)
const report={status:'DDR30_ADDRESS_CONTROL_TRIALS_BOUND_NO_NEW_ROUTE_ACCEPTED',checkedSource:checked.source,checkedEvidence:checkedArtifact,
  acceptedDdrSignals:30,remainingDdrSignals:19,trials,
  handoffAdapter:{invalidStage:invalid,correctedStage:corrected,regressionGuardLog:artifact(guardPath),
    rejectedBeforeSolver:true,invalidStageExcludedFromCheckedReplay:true,
    helpers:['scripts/route-am3352-guided-local-fanouts.mjs','scripts/route-am3352-guided-channel.mjs'].map(artifact)},
  referenceLayersReserved:['inner1','inner2'],copperLayers:4,activeSolverHandles:[],
  fullElectricalTimingQualified:false,originalShellFitVerified:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,trials:trials.length,acceptedDdrSignals:30,remainingDdrSignals:19,fabricationReady:false}))
