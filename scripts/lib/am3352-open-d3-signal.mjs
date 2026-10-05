import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertOpenCommandPrefixes} from './am3352-open-command-prefixes.mjs'

// This stage explicitly replans D3's wires AND its two signal holes. The
// original checked circuit stays immutable; every other hole remains fixed.
export function assertOpenD3Signal(report,input,source){
 const a=report.temporaryOpenD3Signal;assert(a&&a.stagedRepairOnly&&a.exportable===false)
 const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),read=p=>JSON.parse(readFileSync(p))
 assert.equal(hash(a.path),a.sha256);assert.equal(hash(a.priorInput.path),a.priorInput.sha256);assert.deepEqual(a.originalSource,report.source)
 const d=read(a.path),prior=read(a.priorInput.path),st=source.find(e=>e.type==='source_trace'&&e.name==='DDR_D3')
 assert(st);assert.equal(d.name,'DDR_D3');assert.equal(d.sourceTraceId,st.source_trace_id)
 const original=prior.traces.find(t=>t.source_trace_id===st.source_trace_id),current=input.traces.find(t=>t.source_trace_id===st.source_trace_id)
 assert(original&&current);assert.deepEqual(d.originalTrace,original);assert.deepEqual(current,{...original,route:original.route.slice(0,1)})
 const physical=source.filter(v=>v.type==='pcb_via'&&v.pcb_trace_id===original.pcb_trace_id)
 assert.equal(physical.length,2);assert.deepEqual(d.omittedSignalHoles,physical)
 assert.deepEqual(new Set(physical.map(v=>v.pcb_via_id)),new Set(['pcb_via_145','pcb_via_146']))
 assert(physical.every(v=>v.hole_diameter===.254&&v.outer_diameter===.4572&&!v.source_net_id&&v.layers.length===4))
 assert.equal(original.route.filter(p=>p.route_type==='via').length,2)
 for(const v of physical)assert(original.route.some(p=>p.route_type==='via'&&Math.hypot(p.x-v.x,p.y-v.y)<1e-8))
 assert.deepEqual(input.obstacles,prior.obstacles)
 // Neither signal hole is duplicated in the immutable obstacle collection.
 assert(!input.obstacles.some(o=>physical.some(v=>Math.hypot(o.center.x-v.x,o.center.y-v.y)<1e-8)))
 const restored=structuredClone(input);restored.traces[restored.traces.findIndex(t=>t.source_trace_id===st.source_trace_id)]=original
 assert.deepEqual(restored.traces,prior.traces,'Only declared D3 copper and the registered command prefix may be absent')
 const prefixes=assertOpenCommandPrefixes(report,restored,source)
 assert.equal(source.filter(e=>e.type==='pcb_via').length,163)
 assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false);assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254)
 return{opened:d,prefixes,omittedHoleIds:new Set(physical.map(v=>v.pcb_via_id))}
}
