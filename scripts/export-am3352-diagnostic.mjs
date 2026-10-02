import {readFileSync,writeFileSync,mkdirSync} from "node:fs"
import {createHash} from "node:crypto"
import {any_circuit_element} from "circuit-json"

// Recover the exact native completed phases after a CLI timeout. No new
// routes, endpoint movements or clearing of native failure records.
const root=process.argv[2]??"dist/am3352-ddr-bootstrap-attempt-4"
const phase=process.argv[3]??"2"
const out=process.argv[4]??"dist/diagnostics/am3352-memory-11"
const reportPath=process.argv[5]??"checks/integrated/am3352-11-diagnostic-export.json"
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash("sha256").update(readFileSync(p)).digest("hex")
const basePath=`${root}/board.source-and-pcb.circuit.json`,inputPath=`${root}/phase-${phase}.input.simple-route.json`
const errorPath=`${root}/phase-${phase}.timeout.json`
const base=read(basePath),input=read(inputPath),failure=read(errorPath)
// Debug overlays contain thousands of presentation primitives. Keep the
// complete original file hash and timeout metadata without duplicating those
// overlays in circuit error messages or verification reports.
const failureRecord=structuredClone(failure)
if(failureRecord.lastProgress)delete failureRecord.lastProgress.debugGraphics
const board=base.find(e=>e.type==="pcb_board")
const diameter=board?.min_via_pad_diameter,drill=board?.min_via_hole_diameter
if(![.3,.35].includes(diameter)||drill!==.15||input.minViaPadDiameter!==diameter||input.minViaHoleDiameter!==drill)
  throw new Error("Native checkpoint and board disagree on the reviewed trial via construction")
const layers=["top","inner1","inner2","inner3","inner4","inner5","inner6","bottom"]
if(base.filter(e=>e.type==="pcb_smtpad").length!==420||base.find(e=>e.type==="pcb_board")?.num_layers!==8)
  throw new Error("Wrong AM3352 physical fixture")
if(base.some(e=>e.type==="pcb_trace"||e.type==="pcb_via"))throw new Error("Use native copper when available")
if(!input.traces?.length||input.traces.length>=49)throw new Error("Expected an actual partial checkpoint")
const sources=base.filter(e=>e.type==="source_trace"),ports=base.filter(e=>e.type==="pcb_port")
const copper=[],vias=[]
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-5
for(const saved of input.traces) {
  const source=sources.find(s=>s.source_trace_id===saved.source_trace_id||s.source_trace_id===saved.connection_name)
  if(!source)throw new Error("Saved copper has no source signal")
  const terminals=ports.filter(p=>source.connected_source_port_ids.includes(p.source_port_id))
  const ends=[saved.route[0],saved.route.at(-1)]
  if(terminals.length!==2||!ends.every(p=>p.route_type==="wire"&&p.layer==="top"&&terminals.some(t=>near(t,p)))||near(...ends))
    throw new Error(`Saved ${source.name} does not terminate on the actual two package pads`)
  const traceId=`diagnostic_${saved.pcb_trace_id}`
  const route=saved.route.map(p=>{
    if(p.route_type==="wire")return {...p}
    if(p.route_type!=="via"||p.layers?.length!==8||!layers.every(l=>p.layers.includes(l))||p.via_diameter!==diameter||p.via_hole_diameter!==drill)
      throw new Error("Unexpected native physical via construction")
    if(vias.some(v=>near(v,p)))throw new Error("Unexpected repeated physical drill site")
    vias.push(any_circuit_element.parse({type:"pcb_via",pcb_via_id:`diagnostic_pcb_via_${vias.length}`,
      x:p.x,y:p.y,hole_diameter:drill,outer_diameter:diameter,layers,from_layer:"top",to_layer:"bottom",
      pcb_trace_id:traceId,subcircuit_id:source.subcircuit_id,subcircuit_connectivity_map_key:source.subcircuit_connectivity_map_key}))
    return {...p,hole_diameter:drill,outer_diameter:diameter}
  })
  copper.push(any_circuit_element.parse({...saved,pcb_trace_id:traceId,source_trace_id:source.source_trace_id,
    subcircuit_id:source.subcircuit_id,subcircuit_connectivity_map_key:source.subcircuit_connectivity_map_key,route}))
}
const nativeFailure=any_circuit_element.parse({type:"pcb_autorouting_error",pcb_autorouting_error_id:"diagnostic_native_timeout",
  message:failure.error?.message??failure.message??JSON.stringify(failureRecord),subcircuit_id:failure.subcircuit_id})
const result=[...base,...copper,...vias,nativeFailure]
result.find(e=>e.type==="pcb_board").title=`AM3352 PARTIAL ${copper.length}/49 — DO NOT FABRICATE`
mkdirSync(out,{recursive:true})
writeFileSync(`${out}/circuit.json`,JSON.stringify(result,null,2)+"\n")
const report={status:"EXACT_NATIVE_BUS_LANES_PARTIAL_DIAGNOSTIC",fabricationReady:false,completedSignals:copper.length,requiredSignals:49,
  physicalVias:vias.length,viaGeometry:{landMm:diameter,drillMm:drill},source:{path:basePath,sha256:hash(basePath)},checkpoint:{path:inputPath,sha256:hash(inputPath)},
  failure:{path:errorPath,sha256:hash(errorPath),record:failureRecord,omittedPresentationData:"lastProgress.debugGraphics only; original file hash retained"},diagnosticSha256:hash(`${out}/circuit.json`),
  scope:"Unmodified native completed route coordinates from this timeout. All source pads and native timeout retained. Signal-only, unpowered and incomplete."}
writeFileSync(reportPath,JSON.stringify(report,null,2)+"\n")
console.log(`Exported exact native bus_lanes diagnostic: ${copper.length}/49 signals, ${vias.length} through-vias.`)
