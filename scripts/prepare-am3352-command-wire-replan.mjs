import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenCommandPrefixes} from './lib/am3352-open-command-prefixes.mjs'
import {assertOpenDataWires} from './lib/am3352-open-data-wires.mjs'

const [preparation,directory,namesArg,retainedMode='cpu-pad']=process.argv.slice(2);assert(preparation&&directory&&namesArg&&!existsSync(`${directory}/result.json`));assert(['cpu-pad','ram-tail'].includes(retainedMode))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const prior=read(`${preparation}/result.json`),{summary,registration}=readCheckedCommandSummary(prior.checkedSourceSummary)
assert.equal(prior.status,'STAGED_COMMAND_CPU_PREFIXES_OPEN_NOT_EXPORTABLE');assert.equal(prior.preparedLocalEscapes,0)
assert.equal(hash(prior.input.path),prior.input.sha256);assert.equal(hash(prior.source.path),prior.source.sha256);assert.deepEqual(summary.source,prior.source)
const source=read(prior.source.path),input=read(prior.input.path),prefixes=assertOpenCommandPrefixes(prior,input,source),opened=namesArg.split(',').map(name=>{
 const st=source.find(e=>e.type==='source_trace'&&e.name===name);assert(st)
 const t=input.traces.find(t=>t.source_trace_id===st.source_trace_id);assert(t)
 const originalTrace=structuredClone(t)
 if(retainedMode==='ram-tail'){
  const cutIndex=t.route.findLastIndex(p=>p.route_type==='wire'&&p.layer==='top'&&Math.abs(p.y+18)<1e-8);assert(cutIndex>1)
  t.route=t.route.slice(cutIndex)
  return{name,sourceTraceId:st.source_trace_id,originalTrace,retainedRouteMode:'RAM_TAIL',cutIndex}
 }
 t.route=t.route.slice(0,1)
 return{name,sourceTraceId:st.source_trace_id,originalTrace,retainedRouteMode:'CPU_PAD_MARKER'}
})
assert.equal(input.connections.length,1);assert.equal(input.connections[0].name,'source_trace_19')
input.buses[0].allowedLayers=['top']
mkdirSync(directory,{recursive:true});const write=(name,value)=>{const p=`${directory}/${name}`;writeFileSync(p,JSON.stringify(value,null,2)+'\n');return artifact(p)}
const a={...write('temporarily-open-data-wires.json',opened),originalSource:summary.source,priorInput:prior.input,stagedRepairOnly:true,exportable:false,names:opened.map(o=>o.name),physicalHolesRemoved:0}
const report={...prior,status:'STAGED_CASN_NEIGHBOR_DATA_WIRES_OPEN_NOT_EXPORTABLE',priorPreparation:artifact(`${preparation}/result.json`),input:write('input.simple-route.json',input),temporaryOpenDataWires:a,
 pendingDataWireRepairs:opened.length,pendingCommandPrefixRepairs:prefixes.length,stagedPreviouslyConnectedSignals:registration.signals-prefixes.length-opened.length,checkedSourceDdrSignals:registration.signals,
 manualChannelLayerAllocation:{...prior.manualChannelLayerAllocation,channelSignalLayer:'top'},exportable:false,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false}
assertOpenDataWires(report,input,source);write('signal-escapes.native.json',[]);write('result.json',report)
console.log(JSON.stringify({status:report.status,opened:a.names,stagedPreviouslyConnectedSignals:report.stagedPreviouslyConnectedSignals,retainedThroughVias:registration.holes,pendingCommandPrefixRepairs:prefixes.length,exportable:false,fabricationReady:false}))
