import {ddrRouteLength} from './g350-ddr-trace-tuning.mjs'

// Incremental planning guard only. Pending pad-to-via prefixes do not qualify
// a bus. The final native qualifier requires all 49 complete endpoint paths.
export function g350PlanningTimingFits(circuit,trace,solved,goal){
 const length=ddrRouteLength(trace.route)
 const ids=new Map(circuit.filter(r=>r.type==='source_trace').map(r=>[r.name,r.source_trace_id]))
 const completed=new Set(solved.map(r=>ids.get(r.name)))
 const buses=circuit.filter(r=>r.type==='source_bus'&&r.source_trace_ids.includes(trace.source_trace_id)&&Number.isFinite(r.max_length_skew))
 // RESET has a single-member source bus with no matching limit. Do not
 // introduce an artificial match requirement that its editable source lacks.
 if(buses.length&&Math.abs(length-goal)>.635)return false
 return buses.every(bus=>{
  const lengths=[length,...circuit.filter(r=>r.type==='pcb_trace'&&r!==trace&&completed.has(r.source_trace_id)&&bus.source_trace_ids.includes(r.source_trace_id)).map(r=>ddrRouteLength(r.route))]
  return Math.max(...lengths)-Math.min(...lengths)<=bus.max_length_skew-1e-6
 })
}
