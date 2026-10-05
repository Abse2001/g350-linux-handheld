import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './am3352-checked-command-sources.mjs'
import {assertOpenD3Signal} from './am3352-open-d3-signal.mjs'

export function readStagedCasnD3Open(directory){
 const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),verify=a=>assert.equal(hash(a.path),a.sha256)
 const run=read(`${directory}/result.json`),{summary,registration}=readCheckedCommandSummary(run.checkedSourceSummary)
 assert.equal(run.status,'STAGED_CASN_D3_OPEN_NATIVE_LEG_ROUTED_D3_AND_CSN0_REPAIRS_REQUIRED');assert.deepEqual(run.source,summary.source)
 for(const a of [run.source,run.manualPlanRun,run.manualPlan,run.input,run.output,run.fullCasn,run.executionHelper])verify(a)
 const manualRun=read(run.manualPlanRun.path);verify(manualRun.input);const source=read(run.source.path),input=read(manualRun.input.path),{opened,prefixes,omittedHoleIds}=assertOpenD3Signal(run,input,source)
 const plan=read(run.manualPlan.path),indices=plan.flatMap((p,i)=>p.route_type==='via'?[i]:[]);assert.equal(indices.length,2)
 const nativeInput=read(run.input.path),output=read(run.output.path),native=output.traces.at(-1)
 assert.deepEqual(nativeInput.traces.slice(0,134),input.traces);assert.deepEqual(output.traces.slice(0,136),nativeInput.traces);assert.equal(output.traces.length,137)
 assert.deepEqual(nativeInput.obstacles.slice(0,input.obstacles.length),input.obstacles);assert.deepEqual(output.obstacles,nativeInput.obstacles)
 const top=[plan.slice(0,indices[0]),plan.slice(indices[1]+1)]
 assert.deepEqual(nativeInput.traces.slice(134).map(t=>t.route),top)
 assert.equal(native.source_trace_id,'source_trace_19');assert(native.route.every(p=>p.route_type==='wire'&&p.layer==='bottom'&&p.width===.1016))
 const full=[...top[0],plan[indices[0]],...native.route,plan[indices[1]],...top[1]];assert.deepEqual(read(run.fullCasn.path),full)
 input.traces.push({pcb_trace_id:'staged_native_and_manual_casn_d3_open',source_trace_id:'source_trace_19',connection_name:'source_trace_19',route:full})
 const added=nativeInput.obstacles.slice(input.obstacles.length);assert.equal(added.length,2);assert(added.every(o=>o.circuitJsonMetadata?.staged_casn_d3_open_via!==undefined))
 input.obstacles.push(...added)
 return{source,input,run,opened,prefixes,omittedHoleIds,summary,registration}
}
