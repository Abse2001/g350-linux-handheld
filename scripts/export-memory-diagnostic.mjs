import {readFileSync,writeFileSync,mkdirSync} from "node:fs"
import {createHash} from "node:crypto"
import {any_circuit_element} from "circuit-json"

// An aborted native build discards ALL copper, including completed phases.
// Reconstruct a separately labelled diagnostic from its exact saved routes
// so shorts/DRC inspect real copper. This NEVER creates an ordering bundle,
// removes native errors, invents routes, or asserts full-host completion.
const root=process.argv[2]??"dist/rk3566-memory-inner-first"
const phase=process.argv[3]??"5"
const basePath="dist/experiments/rk3566-memory-vip/circuit.json"
const artifact=".tscircuit/autorouting-artifacts/rk3566-memory-vip-circuit-tsx-74aceb5fc6/subcircuit_source_group_2"
const out=process.argv[4]??"dist/diagnostics/rk3566-memory-partial"
const reportPath=process.argv[5]??"checks/integrated/partial-diagnostic-export.json"
const read=p=>JSON.parse(readFileSync(p))
const hash=p=>createHash("sha256").update(readFileSync(p)).digest("hex")
const base=read(basePath)
const srjPath=`${root}/phase-${phase}.input.simple-route.json`
const srj=read(srjPath)
const routes=srj.traces??[]
const board=base.find(e=>e.type==="pcb_board")
if(board?.num_layers!==6||board.allow_blind_and_buried_vias!==false)
  throw new Error("Diagnostic requires the declared six-layer, full-through-via fixture")
if(base.some(e=>e.type==="pcb_trace")||!base.some(e=>e.type==="pcb_autorouting_error"))
  throw new Error("Use native copper exports when available; diagnostic requires an aborted render")
if(!routes.length||routes.length>=67) throw new Error("Expected a genuine partial routing checkpoint")
const sources=base.filter(e=>e.type==="source_trace")
const sourcePorts=base.filter(e=>e.type==="source_port")
const pcbPorts=base.filter(e=>e.type==="pcb_port")
const components=base.filter(e=>e.type==="source_component")
const breakouts=base.filter(e=>e.type==="pcb_breakout_point")
const layers=["top","inner1","inner2","inner3","inner4","bottom"]
const copper=[],physicalVias=[]
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-5
const sourceFor=name=>sources.find(s=>s.source_trace_id===name||s.name===name)
function append(raw,source,startPort) {
  if(!source)throw new Error("Saved route does not have a verified source signal")
  const traceId=`diagnostic_pcb_trace_${copper.length}`
  const route=raw.map(p=>{
    if(p.route_type==="wire")return {...p}
    if(p.route_type==="through_obstacle")return {route_type:"through_pad",start:p.start,end:p.end,
      width:p.width??0.09,start_layer:p.from_layer,end_layer:p.to_layer}
    if(p.route_type!=="via")throw new Error(`Unsupported saved route type ${p.route_type}`)
    if(![0.25,0.3].includes(p.via_diameter)||p.via_hole_diameter!==0.15)
      throw new Error("Unexpected saved drill/land geometry")
    const previous=physicalVias.find(v=>near(v,p))
    if(previous&&previous.subcircuit_connectivity_map_key!==source.subcircuit_connectivity_map_key)
      throw new Error("Different nets share a saved physical via")
    const v=previous??{type:"pcb_via",pcb_via_id:`diagnostic_pcb_via_${physicalVias.length}`,
      x:p.x,y:p.y,hole_diameter:p.via_hole_diameter,outer_diameter:p.via_diameter,
      layers,from_layer:"top",to_layer:"bottom",pcb_trace_id:traceId,
      subcircuit_id:source.subcircuit_id,subcircuit_connectivity_map_key:source.subcircuit_connectivity_map_key}
    if(!previous)physicalVias.push(any_circuit_element.parse(v))
    // Circuit JSON uses these physical diameter names. Raw SRJ's via_*
    // names are stripped by its schema and would trigger exporter defaults.
    return {...p,hole_diameter:v.hole_diameter,outer_diameter:v.outer_diameter}
  })
  if(startPort)route[0].start_pcb_port_id=startPort.pcb_port_id
  copper.push(any_circuit_element.parse({type:"pcb_trace",pcb_trace_id:traceId,source_trace_id:source.source_trace_id,
    subcircuit_id:source.subcircuit_id,subcircuit_connectivity_map_key:source.subcircuit_connectivity_map_key,route}))
}
const provenance=[]
for(const index of [0,1]) {
  const path=`${artifact}-phase-default-order-${index}.pcb-trace-paths.json`
  const saved=read(path)
  if(saved.length!==67)throw new Error("Expected 67 saved escapes for each chip")
  for(const t of saved) {
    const match=/^\.(U_SOC|U_RAM) > port\.([A-Z0-9]+)$/.exec(t.connection)
    if(!match)throw new Error(`Unexpected saved selector ${t.connection}`)
    const component=components.find(c=>c.name===match[1])
    const port=sourcePorts.find(p=>p.source_component_id===component?.source_component_id&&p.name===match[2])
    const pcb=pcbPorts.find(p=>p.source_port_id===port?.source_port_id)
    const source=sources.find(s=>s.connected_source_port_ids.includes(port?.source_port_id))
    const breakout=breakouts.find(p=>p.source_port_id===port?.source_port_id)
    const group=base.find(g=>g.type==="pcb_group"&&g.pcb_group_id===breakout?.pcb_group_id)
    if(!group||group.position_mode!=="relative_to_group_anchor")throw new Error("Review saved fanout coordinate frame")
    // Saved fanout paths are relative to the unrotated breakout anchor.
    // Assert both terminals against native absolute coordinates after the
    // same rigid translation; never adjust individual route points.
    const route=t.route.map(p=>({...p,x:p.x+group.anchor_position.x,y:p.y+group.anchor_position.y}))
    if(!pcb||!breakout||!near(route[0],pcb)||!near(route.at(-1),breakout))
      throw new Error(`Saved escape ${t.connection} disagrees with native geometry`)
    append(route,source,pcb)
  }
  provenance.push({path,sha256:hash(path)})
}
for(const t of routes) {
  const source=sourceFor(t.connection_name)
  const terminals=breakouts.filter(p=>p.source_trace_id===source?.source_trace_id)
  const ends=[t.route[0],t.route.at(-1)]
  // Solver endpoints can be rounded, and a finite-width wire may terminate
  // at a land edge. Verify actual copper overlap with the two declared
  // terminal vias; preserve the solver's exact coordinates without snapping.
  const matches=ends.map(p=>terminals.findIndex(terminal=>p.route_type==="wire"&&physicalVias.some(v=>
    v.subcircuit_connectivity_map_key===source?.subcircuit_connectivity_map_key&&near(v,terminal)&&
    v.layers.includes(p.layer)&&Math.hypot(v.x-p.x,v.y-p.y)<=v.outer_diameter/2+p.width/2+1e-5)))
  if(terminals.length!==2||matches.some(i=>i<0)||new Set(matches).size!==2)
    throw new Error(`Autorouted ${t.connection_name} disagrees with native breakout terminals: ${JSON.stringify({terminals,start:t.route[0],end:t.route.at(-1)})}`)
  append(t.route,source)
}
const result=[...base,...copper,...physicalVias]
result.find(e=>e.type==="pcb_board").title=`PARTIAL MEMORY DIAGNOSTIC — ${routes.length}/67 — NOT FOR FABRICATION`
mkdirSync(out,{recursive:true})
writeFileSync(`${out}/circuit.json`,JSON.stringify(result,null,2)+"\n")
const report={status:"PARTIAL_ROUTING_DIAGNOSTIC_ONLY",fabricationReady:false,
  scope:"Exact saved manual escapes plus completed autorouting phases from an aborted build. Native failure/error records retained. No routing is invented or repaired here.",
  completedSignals:routes.length,requiredSignals:67,manualEscapes:134,tracePieces:copper.length,physicalVias:physicalVias.length,
  source:{path:basePath,sha256:hash(basePath)},checkpoint:{path:srjPath,sha256:hash(srjPath)},savedEscapes:provenance,
  diagnosticSha256:hash(`${out}/circuit.json`)}
writeFileSync(reportPath,JSON.stringify(report,null,2)+"\n")
console.log(`Exported diagnostic copper: ${routes.length}/67 signals, ${copper.length} trace pieces and ${physicalVias.length} full-through vias. Not for fabrication.`)
