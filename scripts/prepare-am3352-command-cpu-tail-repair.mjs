import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenCpuTails} from './lib/am3352-open-cpu-tails.mjs'

const [preparation,directory]=process.argv.slice(2);assert(preparation&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),write=(name,value)=>{const path=`${directory}/${name}`;writeFileSync(path,JSON.stringify(value,null,2)+'\n');return artifact(path)}
const priorPath=`${preparation}/result.json`,prior=read(priorPath)
const {summary,registration}=readCheckedCommandSummary(prior.checkedSourceSummary)
assert.equal(registration.signals,27);assert.deepEqual(prior.source,summary.source)
for(const a of [prior.source,prior.input])assert.equal(hash(a.path),a.sha256)
assert.deepEqual(prior.manualPartialCommandSelection.signalNames,['DDR_CSn0'])
assert.equal(prior.preparedLocalEscapes,0)
const input=read(prior.input.path),source=read(prior.source.path)
assert.equal(input.traces.length,129);assert.equal(source.filter(e=>e.type==='pcb_via').length,147)
const tails=['DDR_D10','DDR_D14'].map(name=>{
  const st=source.find(e=>e.type==='source_trace'&&e.name===name),t=input.traces.find(t=>t.source_trace_id===st.source_trace_id)
  const cutIndex=t.route.findIndex(p=>p.route_type==='wire'&&Math.abs(p.y+9.68)<1e-8)
  assert(cutIndex>1);assert(t.route.slice(0,cutIndex).every(p=>p.route_type==='wire'&&p.layer==='top'))
  const originalRoute=structuredClone(t.route),retainedTail=originalRoute.slice(cutIndex)
  t.route=structuredClone(retainedTail)
  return {name,sourceTraceId:st.source_trace_id,pcbTraceId:t.pcb_trace_id,cutIndex,originalRoute,retainedTail}
})
mkdirSync(directory,{recursive:true})
const tailArtifact=write('temporarily-open-cpu-tails.json',tails)
const report={...prior,status:'STAGED_CSN_CPU_ACCESS_TWO_DATA_PREFIXES_OPEN_NOT_EXPORTABLE',input:write('input.simple-route.json',input),
  priorPreparation:artifact(priorPath),temporaryOpenCpuTails:{...tailArtifact,originalSource:summary.source,stagedRepairOnly:true,exportable:false,names:['DDR_D10','DDR_D14'],physicalHolesRemoved:0},
  acceptedDefaultDdrSignals:27,stagedPreviouslyConnectedSignals:25,pendingCpuTailRepairs:2,exportable:false,defaultChanged:false,fabricationReady:false}
assertOpenCpuTails(report,input,source)
write('signal-escapes.native.json',[]);write('result.json',report)
console.log(JSON.stringify({status:report.status,retainedTracePieces:129,retainedThroughVias:147,pendingCpuPrefixes:2,fabricationReady:false}))
