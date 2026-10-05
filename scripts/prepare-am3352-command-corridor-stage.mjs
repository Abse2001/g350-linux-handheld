import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const [directory,selection,diagnosisPath]=process.argv.slice(2)
assert(directory&&selection&&diagnosisPath&&!existsSync(`${directory}/manifest.json`))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const checkpointPath='checks/integrated/am3352-command-fine-782-replay-check-summary.json',checkpoint=read(checkpointPath)
assert.equal(checkpoint.connectedDdrSignals,42);assert.equal(hash(checkpoint.source.path),checkpoint.source.sha256)
const source=read(checkpoint.source.path),priorPath='dist/am3352-command-ddr40-fine-carriers-attempt-782/best-carriers.nonexportable.json',prior=read(priorPath)
const names=new Map(source.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e.name]))
const opened=selection.split(',');assert.equal(new Set(opened).size,opened.length)
assert(opened.every(n=>/^DDR_(A[0-9]+|BA[0-9]+|CASn|RASn|WEn|CSn0|CKE|ODT)$/.test(n)))
assert(opened.every(n=>prior.carriers.some(t=>names.get(t.source_trace_id)===n)))
const geometry=p=>({route_type:p.route_type,x:p.x,y:p.y,layer:p.layer,width:p.width,from_layer:p.from_layer,to_layer:p.to_layer})
const normalizations=[]
for(const t of prior.carriers){
 const actual=source.find(e=>e.type==='pcb_trace'&&e.source_trace_id===t.source_trace_id);assert(actual)
 assert.equal(actual.route.length,t.route.length)
 for(let i=0;i<t.route.length;i++){
  const p=t.route[i],q=actual.route[i]
  if(i===0||i===t.route.length-1){const delta=Math.hypot(p.x-q.x,p.y-q.y);assert(delta<1e-8);if(delta)normalizations.push({sourceTraceId:t.source_trace_id,index:i,deltaMm:delta});p.x=q.x;p.y=q.y}
  assert.deepEqual(geometry(p),geometry(q))
 }
}
const removed=prior.carriers.filter(t=>opened.includes(names.get(t.source_trace_id)))
const carriers=prior.carriers.filter(t=>!opened.includes(names.get(t.source_trace_id)))
assert.equal(removed.length,opened.length)
const hardCarrierIds=['source_trace_33','source_trace_34'];assert(hardCarrierIds.every(id=>carriers.some(t=>t.source_trace_id===id)))
const base=read('checks/integrated/am3352-command-replan-check-summary.json').source
// The checked fanout bootstrap has extra prefixes. Replay uses its original
// 23-guide source, already bound by the prior manual carrier state.
const replayBase=prior.source;assert.equal(hash(replayBase.path),replayBase.sha256)
assert.equal(read(replayBase.path).filter(e=>e.type==='pcb_trace').length,125)
mkdirSync(directory,{recursive:true})
const state={...prior,carriers,hardCarrierIds,mode:'negotiate',openedForReplanning:opened,prior:artifact(priorPath),checkedPrior:artifact(checkpointPath),diagnosis:artifact(diagnosisPath),qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false}
const statePath=`${directory}/carriers.nonexportable.json`;writeFileSync(statePath,JSON.stringify(state)+'\n')
const manifest={status:'UNQUALIFIED_COMMAND_CORRIDORS_OPENED_FOR_SIMULTANEOUS_PACKAGE_REPLANNING',checkedPrior:artifact(checkpointPath),checkedPriorSource:checkpoint.source,prior:artifact(priorPath),diagnosis:artifact(diagnosisPath),state:artifact(statePath),openedPaths:opened,retainedCommandClockGuides:carriers.length,retainedOriginalDataResetGuides:23,temporaryTotalSignalGuides:23+carriers.length,remainingCommands:26-carriers.length,fullDdrGoal:49,retainedOriginalTracePieces:125,retainedOriginalVias:141,retainedClockGuides:2,endpointFloatingPointNormalizations:normalizations,executionHelper:artifact('scripts/prepare-am3352-command-corridor-stage.mjs'),qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false}
writeFileSync(`${directory}/manifest.json`,JSON.stringify(manifest,null,2)+'\n')
writeFileSync(`${directory}/replay-input.json`,JSON.stringify({status:manifest.status,mode:'negotiate',source:replayBase,state:manifest.state,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({temporaryGuides:manifest.temporaryTotalSignalGuides,open:manifest.remainingCommands,fullDdrGoal:49,opened,fabricationReady:false}))
