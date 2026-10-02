import {readFileSync, writeFileSync} from "node:fs"

// The current KiCad exporter drops keepout.allow_placements. Restore that
// property only for the three declared fiducial clearance circles. Tracks,
// vias and copper pours remain excluded from their solder-mask openings.
const circuit = JSON.parse(readFileSync("dist/index/circuit.json", "utf8"))
const keepouts = circuit.filter(e => e.type === "pcb_keepout")
const expected = [[-38,-49],[43,40],[-38,49]]
if (keepouts.length !== 3 || !expected.every(([x,y]) => keepouts.some(e =>
  e.shape === "circle" && e.radius === 1.2 && e.allow_placements === true &&
  e.center.x === x && e.center.y === y && e.layers.join(",") === "top,bottom")))
  throw new Error("Review KiCad keepout translation after changing the source keepouts")
const boardPath = "dist/index/kicad/index.kicad_pcb"
let translated = 0
let board = readFileSync(boardPath,"utf8").replace(
  /\(keepout\s+\(tracks not_allowed\)\s+\(vias not_allowed\)\s+\(pads (?:not_allowed|allowed)\)\s+\(copperpour not_allowed\)\s+\(footprints (?:not_allowed|allowed)\)\s*\)/g,
  block => { translated++; return block.replace(/\(pads not_allowed\)/,"(pads allowed)").replace(/\(footprints not_allowed\)/,"(footprints allowed)") })
if (translated !== 3) throw new Error(`Expected three exported fiducial keepouts, found ${translated}`)
// The converter's datum is (100,100), with KiCad's Y axis pointing down.
// Put the plot/drill origin at the board's lower-left bounding corner. CPL
// coordinates use the same positive-X/positive-Y origin in fabrication.mjs.
const pcbBoard = circuit.find(e=>e.type === "pcb_board")
if (pcbBoard.width !== 100 || pcbBoard.height !== 124 || pcbBoard.center.x !== 0 || pcbBoard.center.y !== 0)
  throw new Error("Review the manufacturing datum after changing board dimensions")
board = /\(aux_axis_origin [^)]+\)/.test(board)
  ? board.replace(/\(aux_axis_origin [^)]+\)/,"(aux_axis_origin 50 162)")
  : board.replace(/\(setup\s*/,"(setup\n    (aux_axis_origin 50 162)\n    ")
// Remove only disconnected zone islands when KiCad refills the copper. They
// have no return-path purpose and would otherwise be reported as open GND.
board = board.replace(/\(island_removal_mode [12]\)/g,"(island_removal_mode 0)")
// The converter emits disconnected parts of a pour as separate zone outlines.
// KiCad requires distinct priorities when those outlines touch or overlap,
// even for the same net. Refill their union using the same clearance rules;
// preserve the explicit switching-node pour above the surrounding ground.
let groundPriority=0
board=board.replace(/^([ \t]+)\(zone\b[\s\S]*?^\1\)/gm,(block,indent)=>{
  if(block.includes("(keepout")) return block
  const net=/\(net_name\s+"?([^"\s)]+)"?\)/.exec(block)?.[1] ??
    /\(net\s+"([^"]+)"\)/.exec(block)?.[1]
  if(!["GND","BOOST_SW"].includes(net)) throw new Error(`Review exported copper zone ${net}`)
  const priority=net==="GND"?++groundPriority:10000
  return /\(priority \d+\)/.test(block)?block.replace(/\(priority \d+\)/,`(priority ${priority})`):
    block.replace("(zone",`(zone\n${indent}${indent}(priority ${priority})`)
})
if(groundPriority<4) throw new Error("Expected ground zones on all four copper layers")
// The converter emits both the physical via and its route transition, using
// the same UUID. An inner signal endpoint incorrectly narrows the second
// copy's span. Restore the full span declared in Circuit JSON, then preserve
// one physical through-via and reject any other inconsistent attributes.
const vias = new Map()
board = board.replace(/^([ \t]+)\(via\b[\s\S]*?^\1\)/gm,block=>{
  const at=/\(at ([^ )]+) ([^ )]+)\)/.exec(block)
  const diameter=Number(/\(size ([^ )]+)\)/.exec(block)?.[1])
  const drill=Number(/\(drill ([^ )]+)\)/.exec(block)?.[1])
  const declared=at && circuit.filter(e=>e.type==="pcb_via").find(e=>
    Math.hypot(Number(at[1])-100-e.x,100-Number(at[2])-e.y)<1e-5 &&
    Math.abs(e.outer_diameter-diameter)<1e-6 && Math.abs(e.hole_diameter-drill)<1e-6)
  if(!declared || declared.layers.length!==4 ||
     !["top","inner1","inner2","bottom"].every(layer=>declared.layers.includes(layer)))
    throw new Error("KiCad via does not match a declared standard full-depth via")
  block=block.replace(/\(layers [^)]+\)/,'(layers "F.Cu" "B.Cu")')
  const uuid = /\(uuid ([^)]+)\)/.exec(block)?.[1]
  if (!uuid) throw new Error("Exported via has no UUID")
  if (!vias.has(uuid)) { vias.set(uuid,block); return block }
  if (vias.get(uuid) !== block) throw new Error(`Inconsistent duplicate via ${uuid}`)
  return ""
})
writeFileSync(boardPath,board)

// Manufacturing limits for this 1oz, four-layer board. Routing targets 0.2mm
// clearance; exact supplier pads can have slightly smaller gaps. These limits
// remain above JLCPCB's published multilayer copper capabilities.
writeFileSync("dist/index/kicad/index.kicad_dru",`(version 1)
(rule "G350 minimum copper spacing"
  (constraint clearance (min 0.15mm)))
(rule "G350 minimum trace width"
  (constraint track_width (min 0.15mm)))
(rule "G350 through-via diameter"
  (constraint via_diameter (min 0.65mm)))
(rule "G350 annular ring"
  (constraint annular_width (min 0.15mm)))
(rule "G350 drilled hole minimum"
  (constraint hole_size (min 0.3mm)))
(rule "G350 hole separation"
  (constraint hole_to_hole (min 0.45mm)))
(rule "G350 copper to drill"
  (constraint hole_clearance (min 0.2mm)))
(rule "G350 routed edge clearance"
  (constraint edge_clearance (min 0.5mm)))
`)
console.log("Prepared explicit KiCad manufacturing rules and restored fiducial placement allowances.")
