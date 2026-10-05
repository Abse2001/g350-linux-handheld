import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './am3352-checked-command-sources.mjs'
import {assertOpenDataWires} from './am3352-open-data-wires.mjs'

export function readStagedCasnAndRepairedCsn0(directory){
 const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),verify=a=>assert.equal(hash(a.path),a.sha256)
 const prefix=read(`${directory}/result.json`),{summary,registration}=readCheckedCommandSummary(prefix.checkedSourceSummary)
 assert.equal(prefix.status,'STAGED_CSN0_NATIVE_PREFIX_LEG_ROUTED_DATA_REPAIRS_AND_REPLAY_CHECKS_REQUIRED')
 for(const a of [prefix.source,prefix.priorNativeCasn,prefix.manualPrefixRun,prefix.manualPrefixPlan,prefix.input,prefix.output,prefix.repairedPrefix])verify(a)
 assert.deepEqual(prefix.source,summary.source)
 const source=read(prefix.source.path),casn=read(prefix.priorNativeCasn.path);verify(casn.input);verify(casn.output)
 const {opened,prefixes}=assertOpenDataWires(casn,read(casn.input.path),source),input=read(casn.output.path),rebuilt=read(prefix.repairedPrefix.path)
 assert.equal(opened.length,2);assert.equal(prefixes.length,1);assert.equal(prefixes[0].name,'DDR_CSn0');assert.equal(input.traces.length,registration.traces+1)
 const output=read(prefix.output.path),native=output.traces.at(-1);assert.equal(native.source_trace_id,'source_trace_5');assert(native.route.every(p=>p.route_type==='wire'&&p.layer==='bottom'&&p.width===.1016))
 const manualPlan=read(prefix.manualPrefixPlan.path),indices=manualPlan.flatMap((p,i)=>p.route_type==='via'?[i]:[]);assert.equal(indices.length,2)
 const exact=[...manualPlan.slice(0,indices[0]),manualPlan[indices[0]],...native.route,manualPlan[indices[1]],...manualPlan.slice(indices[1]+1)]
 assert.deepEqual(rebuilt,exact,'The joined CSn0 prefix must retain the actual native carrier')
 const csn=input.traces.find(t=>t.source_trace_id==='source_trace_5');assert(csn);assert.deepEqual(csn.route,prefixes[0].retainedTail)
 const first=rebuilt[0],last=rebuilt.at(-1),original=source.find(e=>e.type==='pcb_trace'&&e.source_trace_id==='source_trace_5')
 assert(Math.hypot(first.x-original.route[0].x,first.y-original.route[0].y)<1e-8);assert(Math.hypot(last.x-csn.route[0].x,last.y-csn.route[0].y)<1e-8)
 csn.route=[...rebuilt,...csn.route.slice(1)]
 const newVias=rebuilt.filter(p=>p.route_type==='via');assert.equal(newVias.length,2)
 for(const v of newVias){assert.equal(v.via_diameter,.4572);assert.equal(v.via_hole_diameter,.254);assert.deepEqual(v.layers,['top','inner1','inner2','bottom'])}
 const prefixInput=read(prefix.input.path),added=prefixInput.obstacles.filter(o=>o.circuitJsonMetadata?.staged_manual_prefix_via!==undefined)
 assert.equal(added.length,2);assert.equal(JSON.stringify(prefixInput.obstacles.slice(0,input.obstacles.length)),JSON.stringify(input.obstacles))
 assert(added.every((o,i)=>Math.hypot(o.center.x-newVias[i].x,o.center.y-newVias[i].y)<1e-8&&o.width===.4572&&o.height===.4572&&o.connectedTo.length===1&&o.connectedTo[0]==='source_trace_5'))
 input.obstacles.push(...added)
 return{source,input,prefix,casn,opened,summary,registration}
}
