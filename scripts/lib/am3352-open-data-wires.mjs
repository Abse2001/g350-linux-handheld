import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertOpenCommandPrefixes} from './am3352-open-command-prefixes.mjs'

// Temporarily open only declared, via-free D10/DQM1 wire routes. Keep their
// actual CPU pad markers, all physical obstacles and every old drilled hole.
export function assertOpenDataWires(report,input,source){
 const a=report.temporaryOpenDataWires;assert(a&&a.stagedRepairOnly&&a.exportable===false&&a.physicalHolesRemoved===0)
 const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),read=p=>JSON.parse(readFileSync(p))
 assert.deepEqual(a.originalSource,report.source);assert.equal(hash(a.path),a.sha256)
 const opened=read(a.path);assert(opened.length>=1&&opened.length<=2);assert.deepEqual(a.names,opened.map(o=>o.name));assert.equal(new Set(a.names).size,a.names.length)
 assert.equal(hash(a.priorInput.path),a.priorInput.sha256);const priorInput=read(a.priorInput.path)
 assert.equal(input.traces.length,priorInput.traces.length)
 const restored=structuredClone(input)
 for(const o of opened){
  assert(['DDR_D10','DDR_DQM1'].includes(o.name))
  const st=source.find(e=>e.type==='source_trace'&&e.name===o.name);assert(st);assert.equal(o.sourceTraceId,st.source_trace_id)
  const original=priorInput.traces.find(t=>t.source_trace_id===o.sourceTraceId),current=restored.traces.find(t=>t.source_trace_id===o.sourceTraceId)
  assert(original&&current);assert.deepEqual(o.originalTrace,original)
  assert(original.route.every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.1016))
  const cpu=source.find(e=>e.type==='pcb_port'&&e.source_port_id===st.connected_source_port_ids[0]);assert(cpu)
  assert(Math.hypot(cpu.x-original.route[0].x,cpu.y-original.route[0].y)<1e-8)
  let retained=original.route.slice(0,1)
  if(o.retainedRouteMode==='RAM_TAIL'){
   assert(Number.isInteger(o.cutIndex)&&o.cutIndex>1&&o.cutIndex<original.route.length-1)
   retained=original.route.slice(o.cutIndex)
   assert(Math.abs(retained[0].y+18)<1e-8&&retained[0].layer==='top')
   const ram=source.find(e=>e.type==='pcb_port'&&e.source_port_id===st.connected_source_port_ids[1]);assert(ram)
   assert(Math.hypot(retained.at(-1).x-ram.x,retained.at(-1).y-ram.y)<1e-8)
  }else assert(o.retainedRouteMode===undefined||o.retainedRouteMode==='CPU_PAD_MARKER')
  assert.deepEqual(current,{...original,route:retained})
  restored.traces[restored.traces.indexOf(current)]=original
 }
 assert.deepEqual(input.obstacles,priorInput.obstacles)
 assert.equal(JSON.stringify(restored.traces),JSON.stringify(priorInput.traces),'Only the declared via-free data routes may be opened')
 const prefixes=assertOpenCommandPrefixes(report,restored,source)
 return{opened,prefixes}
}
