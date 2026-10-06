import {readFileSync,writeFileSync} from "node:fs"
import {dirname,basename,join} from "node:path"

// Correct the converter's logical layer pairs to the declared full-depth
// through-via spans. Verify every diameter, drill and centre, and remove
// exact duplicate physical vias emitted from route+pcb_via records.
const [boardPath,circuitPath]=process.argv.slice(2)
if(!boardPath||!circuitPath)throw new Error("Supply KiCad board and matching Circuit JSON")
const circuit=JSON.parse(readFileSync(circuitPath)),declared=circuit.filter(e=>e.type==="pcb_via")
const sourceBoard=circuit.find(e=>e.type==="pcb_board")
const land=sourceBoard?.min_via_pad_diameter,drill=sourceBoard?.min_via_hole_diameter
if(!([[.3,.15],[.35,.15],[.4572,.254]].some(([d,h])=>d===land&&h===drill))||sourceBoard.min_trace_to_hole_edge_clearance!==.2)
  throw new Error("Unexpected AM3352 diagnostic process rules")
const layers=["top","inner1","inner2","bottom"]
if(sourceBoard.num_layers!==4||!declared.length||declared.some(v=>v.layers?.length!==4||!layers.every(l=>v.layers.includes(l))))throw new Error("Expected physical four-layer through-vias")
let board=readFileSync(boardPath,"utf8")
for(const layer of ["F.Cu","In1.Cu","In2.Cu","B.Cu"])
  if(!board.includes(`"${layer}" signal`))throw new Error(`Missing physical copper layer ${layer}`)
for(const layer of ["In3.Cu","In4.Cu","In5.Cu","In6.Cu"])
  if(board.includes(`"${layer}" signal`))throw new Error(`Unexpected copper above four-layer maximum: ${layer}`)
const unique=new Map()
board=board.replace(/^([ \t]+)\(via\b[\s\S]*?^\1\)/gm,block=>{
  const at=/\(at ([^ )]+) ([^ )]+)\)/.exec(block)
  const diameter=Number(/\(size ([^ )]+)\)/.exec(block)?.[1]),drill=Number(/\(drill ([^ )]+)\)/.exec(block)?.[1])
  const matches=declared.filter(v=>at&&Math.hypot(Number(at[1])-100-v.x,100-Number(at[2])-v.y)<1e-5&&
    Math.abs(v.outer_diameter-diameter)<1e-6&&Math.abs(v.hole_diameter-drill)<1e-6)
  if(matches.length!==1)throw new Error("Exported via does not uniquely match declared centre/diameters")
  const v=matches[0]
  block=block.replace(/\(via(?:\s+(?:micro|blind))?/,"(via").replace(/\(layers [^)]+\)/,'(layers "F.Cu" "B.Cu")')
  if(!/\(uuid [^)]+\)/.test(block))throw new Error("Missing native via UUID")
  const physical=block.replace(/\(uuid [^)]+\)/,"(uuid VERIFIED_PHYSICAL_VIA)")
  if(!unique.has(v.pcb_via_id)){unique.set(v.pcb_via_id,physical);return block}
  if(unique.get(v.pcb_via_id)!==physical)throw new Error("Inconsistent duplicate via")
  return ""
})
if(unique.size!==declared.length)throw new Error("Exported copper omitted physical vias")
// The converter loses excludeRefs and bans the socket housing itself in
// its no-copper areas. Preserve every copper prohibition, then express the
// housing-only exception as an explicit KiCad footprint rule. No pad, track,
// via or pour gets an exception. Verify the exported polygon against JSON.
const sourceKeepouts=circuit.filter(e=>e.type==="pcb_keepout"),keepoutRules=[],matchedKeepouts=new Set()
board=board.replace(/^([ \t]+)\(zone\b[\s\S]*?^\1\)/gm,block=>{
  if(!block.includes("(keepout"))return block
  const points=[...block.matchAll(/\(xy ([^ )]+) ([^ )]+)\)/g)].map(m=>({x:Number(m[1])-100,y:100-Number(m[2])}))
  const k=sourceKeepouts.find(k=>k.shape==="rect"&&points.length===4&&points.every(p=>
    Math.abs(Math.abs(p.x-k.center.x)-k.width/2)<1e-5&&Math.abs(Math.abs(p.y-k.center.y)-k.height/2)<1e-5))
  if(!k)throw new Error("Exported keepout polygon does not match source")
  if(matchedKeepouts.has(k.pcb_keepout_id))throw new Error("Duplicated keepout area")
  matchedKeepouts.add(k.pcb_keepout_id)
  if(!k.excluded_pcb_component_ids?.length)return block
  const excluded=k.excluded_pcb_component_ids.map(id=>{
    const p=circuit.find(e=>e.type==="pcb_component"&&e.pcb_component_id===id)
    return circuit.find(e=>e.type==="source_component"&&e.source_component_id===p?.source_component_id)?.name
  })
  if(excluded.length!==1||excluded[0]!=="J_SD"||k.layers?.length!==1||k.layers[0]!=="top"||k.allow_traces||k.allow_footprints||k.warning_only)
    throw new Error("Unsupported keepout exception")
  for(const type of ["tracks","vias","pads","copperpour"])
    if(!block.includes(`(${type} not_allowed)`))throw new Error("Keepout copper enforcement was weakened")
  const name=`SD_NO_COPPER_${keepoutRules.length}`
  block=block.replace(/\(name "SD_NO_COPPER_\d+"\)\s*/,"")
    .replace(/\(footprints not_allowed\)/,"(footprints allowed)")
    .replace(/\(zone\b/,`(zone\n${' '.repeat(4)}(name "${name}")`)
  keepoutRules.push(`(rule "${name} housing exception"
  (condition "A.Type == 'Footprint' && A.Reference != 'J_SD' && A.Layer == 'F.Cu' && A.intersectsArea('${name}')")
  (constraint disallow footprint))`)
  return block
})
if(matchedKeepouts.size!==sourceKeepouts.length)throw new Error("Export omitted source keepouts")
writeFileSync(boardPath,board)
const stem=join(dirname(boardPath),basename(boardPath,".kicad_pcb"))
writeFileSync(`${stem}.kicad_dru`,`(version 1)
(rule "AM3352 trial copper spacing" (constraint clearance (min 0.1016mm)))
(rule "AM3352 SMT spacing" (condition "A.Type == 'Pad' && B.Type == 'Pad'") (constraint clearance (min 0.15mm)))
(rule "AM3352 trace width" (constraint track_width (min 0.1016mm)))
(rule "AM3352 via land" (constraint via_diameter (min ${land}mm)))
(rule "AM3352 via drill" (constraint hole_size (min ${drill}mm)))
(rule "AM3352 via annular ring" (constraint annular_width (min ${(land-drill)/2}mm)))
(rule "AM3352 drill separation" (constraint hole_to_hole (min 0.254mm)))
(rule "AM3352 copper to drill" (constraint hole_clearance (min 0.20mm)))
(rule "AM3352 edge clearance" (constraint edge_clearance (min 0.30mm)))
${keepoutRules.join('\n')}
`)
console.log(`Verified ${unique.size} physical through-vias and exactly four copper layers; installed trial manufacturing rules.`)
