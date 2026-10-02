import {readFileSync,writeFileSync} from "node:fs"
import {dirname,basename,join} from "node:path"

// Strict conversion adapter for the proposed eight-layer 1+6+1 fixture.
// Match every exporter via to declared physical geometry, preserve its
// drilled span, select KiCad's micro/blind type, and remove identical copies.
// A logical wire transition never determines the manufactured drill span.
const [boardPath,circuitPath,mode]=process.argv.slice(2)
const thin=mode==="--thin-hdi",coreDiameter=thin?.25:.3,coreHole=thin?.1:.15
if(!boardPath||!circuitPath)throw new Error("Supply the KiCad board and exact diagnostic Circuit JSON")
const circuit=JSON.parse(readFileSync(circuitPath)),declared=circuit.filter(e=>e.type==="pcb_via")
const boardElement=circuit.find(e=>e.type==="pcb_board")
const sameLayers=(a,b)=>a?.length===b.length&&b.every(l=>a.includes(l))
const microLayers=["top","inner1"],coreLayers=["inner1","inner2","inner3","inner4","inner5","inner6"]
if(boardElement?.num_layers!==8||boardElement.allow_blind_and_buried_vias!==true)throw new Error("Expected eight-layer HDI board")
const micro=v=>sameLayers(v.layers,microLayers)&&v.outer_diameter===.25&&v.hole_diameter===.1
const buried=v=>sameLayers(v.layers,coreLayers)&&v.outer_diameter===coreDiameter&&v.hole_diameter===coreHole
if(declared.filter(micro).length!==134||declared.some(v=>!micro(v)&&!buried(v)))throw new Error("Unexpected HDI spans or drill/land sizes")
let board=readFileSync(boardPath,"utf8")
for(const layer of ["F.Cu","In1.Cu","In2.Cu","In3.Cu","In4.Cu","In5.Cu","In6.Cu","B.Cu"])
  if(!board.includes(`\"${layer}\" signal`))throw new Error(`Exporter omitted ${layer}`)
const unique=new Map()
board=board.replace(/^([ \t]+)\(via\b[\s\S]*?^\1\)/gm,block=>{
  const at=/\(at ([^ )]+) ([^ )]+)\)/.exec(block)
  const diameter=Number(/\(size ([^ )]+)\)/.exec(block)?.[1]),drill=Number(/\(drill ([^ )]+)\)/.exec(block)?.[1])
  const rawLayers=/\(layers ([^)]+)\)/.exec(block)?.[1]
  const convertedLayers=rawLayers?.trim().split(/\s+/).map(l=>l.replace(/^"|"$/g,""))
  if(!convertedLayers)throw new Error("Exported via has no logical layer pair")
  const physicalName=l=>l==="top"?"F.Cu":l==="bottom"?"B.Cu":`In${l.slice(5)}.Cu`
  const matches=declared.filter(v=>at&&Math.hypot(Number(at[1])-100-v.x,100-Number(at[2])-v.y)<1e-5&&
    Math.abs(v.outer_diameter-diameter)<1e-6&&Math.abs(v.hole_diameter-drill)<1e-6&&convertedLayers.every(l=>v.layers.map(physicalName).includes(l)))
  if(matches.length!==1)throw new Error(`KiCad via does not uniquely match declared geometry: ${at?.slice(1)}, ${diameter}/${drill}`)
  const v=matches[0]
  block=block.replace(/\(via(?:\s+(?:micro|blind))?/,micro(v)?"(via micro":"(via blind")
    .replace(/\(layers [^)]+\)/,micro(v)?'(layers "F.Cu" "In1.Cu")':'(layers "In1.Cu" "In6.Cu")')
  if(!/\(uuid [^)]+\)/.test(block))throw new Error("Exporter via has no UUID")
  const physical=block.replace(/\(uuid [^)]+\)/,"(uuid VERIFIED_HDI_PHYSICAL_VIA)")
  if(!unique.has(v.pcb_via_id)){unique.set(v.pcb_via_id,physical);return block}
  if(unique.get(v.pcb_via_id)!==physical)throw new Error("Inconsistent duplicate physical HDI via")
  return ""
})
if(unique.size!==declared.length)throw new Error("KiCad export omitted declared HDI vias")
writeFileSync(boardPath,board)
const stem=join(dirname(boardPath),basename(boardPath,".kicad_pcb"))
writeFileSync(`${stem}.kicad_dru`,`(version 1)
(rule "HDI copper spacing" (constraint clearance (min 0.09mm)))
(rule "HDI SMT pad spacing" (condition "A.Type == 'Pad' && B.Type == 'Pad'") (constraint clearance (min 0.15mm)))
(rule "HDI trace width" (constraint track_width (min 0.09mm)))
(rule "HDI via annular ring" (constraint annular_width (min 0.075mm)))
(rule "HDI drilled hole separation" (constraint hole_to_hole (min 0.24mm)))
(rule "HDI copper to drill" (constraint hole_clearance (min 0.20mm)))
(rule "HDI edge clearance" (constraint edge_clearance (min 0.20mm)))
(rule "HDI microvia land" (condition "A.Type == 'Via' && A.Via_Type == 'Micro'") (constraint via_diameter (min 0.25mm)))
(rule "HDI microvia drill" (condition "A.Type == 'Via' && A.Via_Type == 'Micro'") (constraint hole_size (min 0.10mm)))
(rule "HDI buried via land" (condition "A.Type == 'Via' && A.Via_Type == 'Blind/buried'") (constraint via_diameter (min ${coreDiameter}mm)))
(rule "HDI buried via drill" (condition "A.Type == 'Via' && A.Via_Type == 'Blind/buried'") (constraint hole_size (min ${coreHole}mm)))
`)
const proPath=`${stem}.kicad_pro`,project=JSON.parse(readFileSync(proPath))
const settings=project.board.design_settings
settings.rules.min_microvia_diameter=.25;settings.rules.min_microvia_drill=.1
settings.rules.min_via_diameter=coreDiameter;settings.rules.min_through_hole_diameter=coreHole
settings.rules.min_via_annular_width=.075;settings.rules.min_hole_to_hole=.24
writeFileSync(proPath,JSON.stringify(project,null,2)+"\n")
console.log(`Verified ${unique.size} HDI vias: ${declared.filter(micro).length} Top-L2 microvias and ${declared.filter(buried).length} L2-L7 buried vias.`)
