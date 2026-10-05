import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readStagedCasnD3Restored} from './am3352-staged-casn-d3-restored.mjs'
import {assertOpenCommandPrefixes} from './am3352-open-command-prefixes.mjs'

export function readStagedCasnD3Csn0(directory){
 const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),verify=a=>assert.equal(hash(a.path),a.sha256)
 const run=read(`${directory}/result.json`);assert.equal(run.status,'STAGED_CSN0_NATIVE_PREFIX_RESTORED_RESET_PREFIX_AND_TIMING_REQUIRED')
 for(const a of [run.source,run.nativeD3Run,run.manualPrefixRun,run.input,run.output,run.fullCsn0,run.executionHelper,run.temporaryOpenCommandPrefixes])verify(a)
 const state=readStagedCasnD3Restored(run.nativeD3Run.path.replace(/\/result.json$/,'')),prefixes=read(run.temporaryOpenCommandPrefixes.path)
 assert.deepEqual(run.source,state.run.source);assert.deepEqual(prefixes.map(p=>p.name),['DDR_CSn0','DDR_RESETn'])
 const input=read(run.input.path),output=read(run.output.path);assert.equal(input.traces.length,135);assert.equal(output.traces.length,136)
 assert.deepEqual(output.traces.slice(0,135),input.traces);assert.deepEqual(input.obstacles,state.input.obstacles);assert.deepEqual(output.obstacles,input.obstacles)
 const expected=structuredClone(state.input.traces);for(const p of prefixes)expected.find(t=>t.source_trace_id===p.sourceTraceId).route=p.retainedTail;assert.deepEqual(input.traces,expected)
 assertOpenCommandPrefixes({...state.run,temporaryOpenCommandPrefixes:run.temporaryOpenCommandPrefixes},{...input,traces:input.traces.slice(0,134).map(t=>t.source_trace_id===state.opened.sourceTraceId?state.opened.originalTrace:t)},state.source)
 const native=output.traces.at(-1);assert.equal(native.source_trace_id,'source_trace_5');assert(native.route.every(p=>p.route_type==='wire'&&p.width===.1016&&p.layer==='top'))
 const full=[...native.route,...prefixes[0].retainedTail.slice(1)];assert.deepEqual(read(run.fullCsn0.path),full)
 state.input.traces.find(t=>t.source_trace_id==='source_trace_5').route=full
 state.input.traces.find(t=>t.source_trace_id==='source_trace_10').route=prefixes[1].retainedTail
 return{...state,priorD3Run:state.run,run,prefixes}
}
