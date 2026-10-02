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
if(![.3,.35].includes(land)||drill!==.15||sourceBoard.min_trace_to_hole_edge_clearance!==.2)
  throw new Error("Unexpected AM3352 diagnostic process rules")
const layers=["top","inner1","inner2","inner3","inner4","inner5","inner6","bottom"]
if(!declared.length||declared.some(v=>v.layers?.length!==8||!layers.every(l=>v.layers.includes(l))))throw new Error("Expected physical eight-layer through-vias")
let board=readFileSync(boardPath,"utf8")
for(const layer of ["F.Cu","In1.Cu","In2.Cu","In3.Cu","In4.Cu","In5.Cu","In6.Cu","B.Cu"])
  if(!board.includes(`"${layer}" signal`))throw new Error(`Missing physical copper layer ${layer}`)
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
`)
console.log(`Verified ${unique.size} physical through-vias and all eight copper layers; installed trial manufacturing rules.`)
