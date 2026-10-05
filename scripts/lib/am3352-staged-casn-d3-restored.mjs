import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readStagedCasnD3Open} from './am3352-staged-casn-d3-open.mjs'

export function readStagedCasnD3Restored(directory){
 const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),verify=a=>assert.equal(hash(a.path),a.sha256)
 const run=read(`${directory}/result.json`);assert.equal(run.status,'STAGED_D3_NATIVE_CARRIER_RESTORED_CSN0_AND_WHOLE_BYTE_CHECKS_REQUIRED')
 for(const a of [run.source,run.nativeCasnRun,run.manualPlanRun,run.manualPlan,run.input,run.output,run.fullD3,run.executionHelper])verify(a)
 const state=readStagedCasnD3Open(run.nativeCasnRun.path.replace(/\/result.json$/,''));assert.deepEqual(state.run.source,run.source)
 const manual=read(run.manualPlanRun.path);verify(manual.fixedCopper);assert.deepEqual(read(manual.fixedCopper.path),state.input)
 const plan=read(run.manualPlan.path),indices=plan.flatMap((p,i)=>p.route_type==='via'?[i]:[]);assert.equal(indices.length,4)
 const starts=[0,...indices.map(i=>i+1)],legs=starts.map((start,i)=>plan.slice(start,indices[i]??plan.length)),nativeInput=read(run.input.path),output=read(run.output.path),carrier=output.traces.at(-1)
 assert.deepEqual(nativeInput.traces.slice(0,135),state.input.traces);assert.deepEqual(nativeInput.traces.slice(135).map(t=>t.route),legs.filter((r,i)=>i!==3));assert.equal(nativeInput.traces.length,139)
 assert.deepEqual(output.traces.slice(0,139),nativeInput.traces);assert.equal(output.traces.length,140);assert.equal(carrier.source_trace_id,'source_trace_42')
 assert(carrier.route.every(p=>p.route_type==='wire'&&p.width===.1016&&p.layer==='bottom'))
 const full=[];for(let i=0;i<legs.length;i++){full.push(...(i===3?carrier.route:legs[i]));if(i<indices.length)full.push(plan[indices[i]])}
 assert.deepEqual(read(run.fullD3.path),full)
 const old=state.input.traces.find(t=>t.source_trace_id==='source_trace_42');assert.equal(old.route.length,1);old.route=full
 const added=nativeInput.obstacles.slice(state.input.obstacles.length);assert.equal(added.length,4);assert(added.every(o=>o.circuitJsonMetadata?.staged_d3_guarded_via!==undefined))
 assert.deepEqual(nativeInput.obstacles.slice(0,state.input.obstacles.length),state.input.obstacles);assert.deepEqual(output.obstacles,nativeInput.obstacles);state.input.obstacles.push(...added)
 return{...state,casnRun:state.run,run}
}
