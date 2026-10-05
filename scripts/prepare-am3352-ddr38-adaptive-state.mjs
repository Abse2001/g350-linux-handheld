import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const directory='dist/am3352-command-ddr38-adaptive-preparation-attempt-777';assert(!existsSync(`${directory}/manifest.json`));mkdirSync(directory,{recursive:true})
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const summaryPath='checks/integrated/am3352-command-clock-seeded-775-replay-check-summary.json',summary=read(summaryPath),priorPath='dist/am3352-command-clock-seeded-longer-carriers-attempt-775/carriers.nonexportable.json',prior=read(priorPath),s=read(summary.source.path)
assert.equal(hash(summary.source.path),summary.source.sha256);assert.equal(summary.connectedDdrSignals,38)
const geometry=p=>{const {route_type,x,y,width,layer,from_layer,to_layer}=p;return{route_type,x,y,width,layer,from_layer,to_layer}},normalizations=[]
for(const t of prior.carriers){
 const actual=s.find(n=>n.type==='pcb_trace'&&n.source_trace_id===t.source_trace_id);assert(actual);assert.equal(t.route.length,actual.route.length)
 for(let i=0;i<t.route.length;i++){
  const p=t.route[i],n=actual.route[i]
  if(i===0||i===t.route.length-1){const delta=Math.hypot(p.x-n.x,p.y-n.y);assert(delta<1e-8);if(delta)normalizations.push({sourceTraceId:t.source_trace_id,index:i,deltaMm:delta});p.x=n.x;p.y=n.y}
  assert.deepEqual(geometry(p),geometry(n))
 }
}
const hardCarrierIds=['source_trace_33','source_trace_34'];assert(hardCarrierIds.every(id=>prior.carriers.some(t=>t.source_trace_id===id)))
const state={...prior,mode:'negotiate',hardCarrierIds,ripupCounts:[],prior:artifact(priorPath),checkedCurrentReplay:artifact(summaryPath),provenance:'Clock routes and all original data/reset/host copper remain hard. Other commands may be replanned to complete all 26 command/clock signals.'},path=`${directory}/carriers.nonexportable.json`
writeFileSync(path,JSON.stringify(state)+'\n');writeFileSync(`${directory}/manifest.json`,JSON.stringify({status:'DDR38_CHECKED_CARRIERS_REBOUND_FOR_ADAPTIVE_COMMAND_REPLANNING',prior:artifact(priorPath),summary:artifact(summaryPath),source:summary.source,state:artifact(path),executionHelper:artifact('scripts/prepare-am3352-ddr38-adaptive-state.mjs'),endpointFloatingPointNormalizations:normalizations,hardCarrierIds,plannedCommands:15,remainingCommands:11,fabricationReady:false},null,2)+'\n');console.log(JSON.stringify({preparedCommands:15,hardClockSignals:2,open:11,endpointRoundingMaximumMm:Math.max(...normalizations.map(n=>n.deltaMm))}))
