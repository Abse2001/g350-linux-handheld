// Incremental proposals only. Final complete checks and fresh source/independent
// qualification remain mandatory. Pads, vias, source definitions and foreign
// geometry are not mutated by this validator.
import assert from 'node:assert/strict'
import * as checks from '@tscircuit/checks'
import {getFullConnectivityMapFromCircuitJson} from 'circuit-json-to-connectivity-map'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './g350-ddr-physical-checks.mjs'

export function createG350PlanarPlanningValidator(baseline){
 const immutableTypes=new Set(['pcb_via','pcb_smtpad','pcb_plated_hole','pcb_hole','pcb_copper_pour','pcb_board','pcb_component','pcb_port','source_trace','source_bus','source_port','source_net','source_component'])
 const immutable=JSON.stringify(baseline.filter(e=>immutableTypes.has(e.type)))
 const connMap=getFullConnectivityMapFromCircuitJson(baseline)
 const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
 for(const s of baseline.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
 const normalized=c=>c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)
 const complete=c=>{
  assert.equal(JSON.stringify(c.filter(e=>immutableTypes.has(e.type))),immutable,'Planar planning must preserve all non-trace records')
  const counts=Object.fromEntries(g350DdrPhysicalChecks.map(n=>[n,checks[n](c).length]))
  counts.checkPcbTracesOutOfBoard=checks.checkPcbTracesOutOfBoard(c).length
  counts.manufacturing=checkG350ViaTrackManufacturingClearance(normalized(c)).length
  return counts
 }
 assert(Object.values(complete(baseline)).every(n=>n===0),'Baseline must pass complete physical checks')
 const validate=(c,t)=>{
  // The native overlap/self-short checks still inspect all actual geometry.
  if(checks.checkPcbTraceSelfShorts(c).length||checks.checkEachPcbTraceNonOverlapping(c).length)return false
  // Retain every foreign trace's ID/ownership but omit its unchanged segments.
  // Pass the complete immutable connectivity map to the native clearance APIs.
  const changed=c.map(e=>e.type==='pcb_trace'&&e!==t?{...e,route:[]}:e)
  if(checks.checkViaTraceClearance(changed,{connMap}).length||checks.checkPadTraceClearance(changed,{connMap}).length||checks.checkHoleTraceClearance(changed).length)return false
  if(checks.checkPcbTracesOutOfBoard(changed).length||checkG350ViaTrackManufacturingClearance(normalized(changed)).length)return false
  return true
 }
 return {validate,complete,assertImmutable:c=>assert.equal(JSON.stringify(c.filter(e=>immutableTypes.has(e.type))),immutable)}
}
