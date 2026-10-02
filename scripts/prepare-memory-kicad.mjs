import {readFileSync,writeFileSync} from "node:fs"
import {dirname,basename,join} from "node:path"

// Deduplicate physical vias emitted from both pcb_via and trace transitions.
// Verify every copy against Circuit JSON; mismatched geometry is an error.
const boardPath=process.argv[2]??"dist/experiments/rk3566-memory-vip/kicad/rk3566-memory-vip.kicad_pcb"
const circuitPath=process.argv[3]??"dist/experiments/rk3566-memory-vip/circuit.json"
const circuit=JSON.parse(readFileSync(circuitPath))
const declared=circuit.filter(e=>e.type==="pcb_via")
const expectedLayers=["top","inner1","inner2","inner3","inner4","bottom"]
if(declared.length<134||declared.some(v=>v.layers.length!==6||!expectedLayers.every(l=>v.layers.includes(l))))
  throw new Error("Memory fixture must contain its 134 declared full-depth escapes")
let board=readFileSync(boardPath,"utf8")
const unique=new Map()
board=board.replace(/^([ \t]+)\(via\b[\s\S]*?^\1\)/gm,block=>{
  const at=/\(at ([^ )]+) ([^ )]+)\)/.exec(block)
  const diameter=Number(/\(size ([^ )]+)\)/.exec(block)?.[1])
  const drill=Number(/\(drill ([^ )]+)\)/.exec(block)?.[1])
  const matches=declared.filter(v=>at&&Math.hypot(Number(at[1])-100-v.x,100-Number(at[2])-v.y)<1e-5&&
    Math.abs(v.outer_diameter-diameter)<1e-6&&Math.abs(v.hole_diameter-drill)<1e-6)
  if(matches.length!==1) throw new Error(`KiCad via does not uniquely match declared copper/drill geometry: ${at?.slice(1)}, ${diameter}/${drill}`)
  block=block.replace(/\(layers [^)]+\)/,'(layers "F.Cu" "B.Cu")')
  const uuid=/\(uuid ([^)]+)\)/.exec(block)?.[1]
  if(!uuid) throw new Error("Exported via has no UUID")
  const key=matches[0].pcb_via_id
  const physical=block.replace(/\(uuid [^)]+\)/,'(uuid VERIFIED_PHYSICAL_VIA)')
  if(!unique.has(key)) {unique.set(key,physical);return block}
  if(unique.get(key)!==physical) throw new Error(`Inconsistent duplicate via ${key}`)
  return ""
})
if(unique.size!==declared.length) throw new Error("KiCad export omitted physical vias")
writeFileSync(boardPath,board)
// JLCPCB multilayer 1oz limits, verified 2026-10-02:
// https://jlcpcb.com/capabilities/pcb-capabilities/
// Filled/capped via-in-pad and ENIG are required for this proposed process.
writeFileSync(join(dirname(boardPath),basename(boardPath,".kicad_pcb")+".kicad_dru"),`(version 1)
(rule "Memory minimum copper spacing"
  (constraint clearance (min 0.09mm)))
(rule "Memory SMT pad spacing"
  (condition "A.Type == 'Pad' && B.Type == 'Pad'")
  (constraint clearance (min 0.15mm)))
(rule "Memory minimum trace width"
  (constraint track_width (min 0.09mm)))
(rule "Memory through-via diameter"
  (constraint via_diameter (min 0.25mm)))
(rule "Memory via annular ring"
  (constraint annular_width (min 0.05mm)))
(rule "Memory drilled hole minimum"
  (constraint hole_size (min 0.15mm)))
(rule "Memory via-hole separation"
  (constraint hole_to_hole (min 0.2mm)))
(rule "Memory copper to drill"
  (constraint hole_clearance (min 0.2mm)))
(rule "Memory routed edge clearance"
  (constraint edge_clearance (min 0.2mm)))
`)
console.log(`Verified ${unique.size} exported through-vias and installed explicit memory-fixture manufacturing rules.`)
