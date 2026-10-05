import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenCommandPrefixes} from './lib/am3352-open-command-prefixes.mjs'

const [preparation,directory,selection]=process.argv.slice(2);assert(preparation&&directory&&selection)
assert(!existsSync(`${directory}/result.json`),'Do not overwrite staged evidence')
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const prior=read(`${preparation}/result.json`),{summary,registration}=readCheckedCommandSummary(prior.checkedSourceSummary)
assert.deepEqual(prior.source,summary.source);assert.equal(prior.preparedLocalEscapes,0)
assert.equal(prior.manualPartialCommandSelection.selectedChannels,1)
assert.equal(hash(prior.input.path),prior.input.sha256)
const source=read(prior.source.path),input=read(prior.input.path),original=structuredClone(input)
const declarations=selection.split(',').map(x=>{const [name,index]=x.split(':');return{name,cutIndex:Number(index)}})
const prefixes=declarations.map(({name,cutIndex})=>{
  const st=source.find(e=>e.type==='source_trace'&&e.name===name);assert(st)
  assert(!prior.manualPartialCommandSelection.signalNames.includes(name))
  const t=input.traces.find(t=>t.source_trace_id===st.source_trace_id);assert(t)
  const originalRoute=structuredClone(t.route),retainedTail=originalRoute.slice(cutIndex)
  t.route=structuredClone(retainedTail)
  return{name,sourceTraceId:st.source_trace_id,pcbTraceId:t.pcb_trace_id,cutIndex,originalRoute,retainedTail}
})
assert.deepEqual({...input,traces:original.traces},original,'Only the declared wire prefixes may change')
mkdirSync(directory,{recursive:true})
const write=(name,value)=>{const p=`${directory}/${name}`;writeFileSync(p,JSON.stringify(value,null,2)+'\n');return artifact(p)}
const opened={...write('temporarily-open-command-prefixes.json',prefixes),originalSource:summary.source,stagedRepairOnly:true,exportable:false,names:prefixes.map(p=>p.name),physicalHolesRemoved:0}
const report={...prior,status:'STAGED_COMMAND_CPU_PREFIXES_OPEN_NOT_EXPORTABLE',priorPreparation:artifact(`${preparation}/result.json`),input:write('input.simple-route.json',input),temporaryOpenCommandPrefixes:opened,
 checkedSourceDdrSignals:registration.signals,stagedPreviouslyConnectedSignals:registration.signals-prefixes.length,pendingCommandPrefixRepairs:prefixes.length,exportable:false,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false}
assertOpenCommandPrefixes(report,input,source)
write('signal-escapes.native.json',[]);write('result.json',report)
console.log(JSON.stringify({status:report.status,opened:opened.names,retainedTracePieces:registration.traces,retainedThroughVias:registration.holes,pendingCommandPrefixRepairs:prefixes.length,fabricationReady:false}))
