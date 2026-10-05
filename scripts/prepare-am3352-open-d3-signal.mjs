import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenCommandPrefixes} from './lib/am3352-open-command-prefixes.mjs'
import {assertOpenD3Signal} from './lib/am3352-open-d3-signal.mjs'

const [preparation,directory]=process.argv.slice(2);assert(preparation&&directory&&!existsSync(`${directory}/result.json`))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const prior=read(`${preparation}/result.json`),{summary,registration}=readCheckedCommandSummary(prior.checkedSourceSummary)
assert.equal(prior.status,'STAGED_COMMAND_CPU_PREFIXES_OPEN_NOT_EXPORTABLE');assert.equal(hash(prior.input.path),prior.input.sha256);assert.equal(hash(prior.source.path),prior.source.sha256);assert.deepEqual(summary.source,prior.source)
const input=read(prior.input.path),source=read(prior.source.path);assertOpenCommandPrefixes(prior,input,source)
const st=source.find(e=>e.type==='source_trace'&&e.name==='DDR_D3'),t=input.traces.find(t=>t.source_trace_id===st.source_trace_id),originalTrace=structuredClone(t)
const omittedSignalHoles=source.filter(v=>v.type==='pcb_via'&&v.pcb_trace_id===t.pcb_trace_id);assert.equal(omittedSignalHoles.length,2)
t.route=t.route.slice(0,1);mkdirSync(directory,{recursive:true})
const write=(name,value)=>{const path=`${directory}/${name}`;writeFileSync(path,JSON.stringify(value,null,2)+'\n');return artifact(path)}
const descriptor=write('temporarily-open-d3-signal.json',{name:'DDR_D3',sourceTraceId:st.source_trace_id,originalTrace,omittedSignalHoles})
const report={...prior,status:'STAGED_CASN_D3_WIRES_AND_SIGNAL_HOLES_OPEN_NOT_EXPORTABLE',priorPreparation:artifact(`${preparation}/result.json`),input:write('input.simple-route.json',input),
 temporaryOpenD3Signal:{...descriptor,originalSource:prior.source,priorInput:prior.input,stagedRepairOnly:true,exportable:false},
 checkedSourceDdrSignals:registration.signals,stagedPreviouslyConnectedSignals:30,pendingD3SignalRepair:1,pendingCommandPrefixRepairs:1,
 frozenSourceThroughVias:163,retainedStageThroughVias:161,stagedSignalHolesOmitted:2,physicalSourceModified:false,newCompleteReplaySignals:0,copperLayers:4,referenceLayersReserved:['inner1','inner2'],exportable:false,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false}
assertOpenD3Signal(report,input,source);write('result.json',report);console.log(JSON.stringify({status:report.status,retainedPhysicalHoles:161,explicitlyReplannedSignalHoles:2,pendingRepairs:2,exportable:false,fabricationReady:false}))
