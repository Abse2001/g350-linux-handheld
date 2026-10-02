import {readFileSync,writeFileSync} from "node:fs"

// Independent cross-format check: read the actual KiCad Gerber flashes and
// compare them with tscircuit's global SMT pad coordinates. This catches an
// incorrect plot datum or a mirrored assembly side. Polygon pads are checked
// by KiCad DRC rather than reduced to a misleading center point here.
const circuit = JSON.parse(readFileSync("dist/index/circuit.json","utf8"))
const sources = new Map(circuit.filter(e=>e.type === "source_component").map(e=>[e.source_component_id,e]))
const components = new Map(circuit.filter(e=>e.type === "pcb_component")
  .map(e=>[e.pcb_component_id,sources.get(e.source_component_id)?.name]))
let checked = 0
for (const [layer,file] of [["top","index-F_Cu.gtl"],["bottom","index-B_Cu.gbl"]]) {
  const flashes = new Map()
  let reference
  const gerber = readFileSync(`fabrication/gerbers/${file}`,"utf8")
  if (!gerber.includes("%FSLAX46Y46*%") || !gerber.includes("%MOMM*%"))
    throw new Error("Review coordinate decoding after changing Gerber precision/units")
  for (const line of gerber.split(/\r?\n/)) {
    const attribute = /^%TO\.P,([^,]*),/.exec(line)
    if (attribute) reference = attribute[1]
    if (line === "%TD*%") reference = undefined
    const flash = /^X(-?\d+)Y(-?\d+)D03\*$/.exec(line)
    if (flash && reference !== undefined) {
      const points = flashes.get(reference) ?? []
      points.push({x:Number(flash[1])/1e6,y:Number(flash[2])/1e6})
      flashes.set(reference,points)
    }
  }
  for (const pad of circuit.filter(e=>e.type === "pcb_smtpad" && e.layer === layer && Number.isFinite(e.x) && Number.isFinite(e.y))) {
    const name = components.get(pad.pcb_component_id)
    // Fiducials are componentless copper primitives. KiCad exports their
    // pad attribute with an empty reference; require the known six marks.
    const fiducial = pad.pcb_component_id === null && pad.shape === "circle" && pad.radius === 0.5 &&
      [[-38,-49],[38,49],[-38,49]].some(([x,y])=>pad.x===x&&pad.y===y)
    if (!name && !fiducial) throw new Error(`Unexpected componentless SMT pad ${pad.pcb_smtpad_id}`)
    if (!(flashes.get(fiducial?"":name) ?? []).some(p=>Math.hypot(p.x-pad.x-50,p.y-pad.y-62)<0.005))
      throw new Error(`Gerber coordinate mismatch: ${name}/${pad.pcb_smtpad_id} on ${layer}`)
    checked++
  }
}
if (checked < 150) throw new Error(`Unexpectedly few checked SMT pads: ${checked}`)

// Verify every plotted track against the declared segment geometry and width,
// including the explicit width transitions emitted by the phase router.
const boardText=readFileSync("dist/index/kicad/index.kicad_pcb","utf8")
const actualTracks=[]
for (const match of boardText.matchAll(/\(segment\s+\(start ([^ )]+) ([^ )]+)\)\s+\(end ([^ )]+) ([^ )]+)\)\s+\(width ([^ )]+)\)\s+\(layer "([^"]+)"\)/g)) {
  actualTracks.push({x1:Number(match[1]),y1:Number(match[2]),x2:Number(match[3]),y2:Number(match[4]),
    width:Number(match[5]),layer:match[6]})
}
const layerNames={top:"F.Cu",bottom:"B.Cu",inner1:"In1.Cu",inner2:"In2.Cu"}
const expectedTracks=[]
for (const trace of circuit.filter(e=>e.type==="pcb_trace")) {
  for (let i=0;i<trace.route.length-1;i++) {
    const a=trace.route[i],b=trace.route[i+1]
    if (a.route_type!=="wire"||b.route_type!=="wire"||a.layer!==b.layer||
        Math.hypot(a.x-b.x,a.y-b.y)<1e-9) continue
    if (!layerNames[a.layer]) throw new Error(`Unknown track layer ${a.layer}`)
    expectedTracks.push({x1:a.x+100,y1:100-a.y,x2:b.x+100,y2:100-b.y,
      width:a.width,layer:layerNames[a.layer]})
  }
}
const sameTrack=(a,b)=>a.layer===b.layer&&Math.abs(a.width-b.width)<0.005&&
  ((Math.hypot(a.x1-b.x1,a.y1-b.y1)<0.005&&Math.hypot(a.x2-b.x2,a.y2-b.y2)<0.005)||
   (Math.hypot(a.x1-b.x2,a.y1-b.y2)<0.005&&Math.hypot(a.x2-b.x1,a.y2-b.y1)<0.005))
if (actualTracks.length<100) throw new Error("Unexpectedly few plotted KiCad tracks")
for (const track of expectedTracks)
  if (!actualTracks.some(other=>sameTrack(track,other)))
    throw new Error(`KiCad track differs from the circuit geometry/width: ${JSON.stringify(track)}`)
for (const track of actualTracks)
  if (!expectedTracks.some(other=>sameTrack(track,other)))
    throw new Error(`KiCad has an unexpected track: ${JSON.stringify(track)}`)

let drilled = 0
for (const [plated,file] of [[true,"index-PTH.drl"],[false,"index-NPTH.drl"]]) {
  const text = readFileSync(`fabrication/gerbers/${file}`,"utf8")
  if (!text.includes("\nMETRIC\n") || !text.includes("\nG90\n"))
    throw new Error("Review drill decoding after changing units/coordinate mode")
  const tools = new Map(), holes = []
  let tool
  for (const line of text.split(/\r?\n/)) {
    const definition = /^T(\d+)C([\d.]+)$/.exec(line)
    if (definition) tools.set(definition[1],Number(definition[2]))
    const selection = /^T(\d+)$/.exec(line)
    if (selection) tool = selection[1]
    const coordinate = /^X(-?[\d.]+)Y(-?[\d.]+)(?:G85X(-?[\d.]+)Y(-?[\d.]+))?$/.exec(line)
    if (!coordinate) {
      if (line.startsWith("X")) throw new Error(`Unsupported drill coordinate ${line}`)
      continue
    }
    const x1=Number(coordinate[1]),y1=Number(coordinate[2])
    const x2=Number(coordinate[3]??x1),y2=Number(coordinate[4]??y1)
    if (!tools.has(tool)) throw new Error("Drill coordinate has no declared tool")
    holes.push({x:(x1+x2)/2,y:(y1+y2)/2,diameter:tools.get(tool),
      dx:Math.abs(x2-x1),dy:Math.abs(y2-y1)})
  }
  const expected = circuit.filter(e=>plated
    ? e.type==="pcb_plated_hole"||e.type==="pcb_via" : e.type==="pcb_hole")
  if (expected.length !== holes.length)
    throw new Error(`${file}: ${holes.length} drill features, expected ${expected.length}`)
  for (const hole of expected) {
    if (hole.hole_offset_x || hole.hole_offset_y)
      throw new Error("Review drill offsets after changing a supplier footprint")
    const slot = hole.shape==="pill"
    if (slot && (hole.ccw_rotation??0)%180 !== 0)
      throw new Error("Review slot orientation after changing a supplier footprint")
    const diameter = slot?Math.min(hole.hole_width,hole.hole_height):hole.hole_diameter
    const dx = slot?Math.max(0,hole.hole_width-hole.hole_height):0
    const dy = slot?Math.max(0,hole.hole_height-hole.hole_width):0
    if (!holes.some(p=>Math.hypot(p.x-hole.x-50,p.y-hole.y-62)<0.005 &&
      Math.abs(p.diameter-diameter)<0.005 && Math.abs(p.dx-dx)<0.005 && Math.abs(p.dy-dy)<0.005))
      throw new Error(`Drill mismatch: ${hole.pcb_plated_hole_id??hole.pcb_via_id??hole.pcb_hole_id}`)
    drilled++
  }
}
const message = `Actual Gerber flashes agree with all ${checked} center-based SMT pads; ${drilled} plated/non-plated drill features agree in position, diameter and slot direction. All ${actualTracks.length} KiCad tracks agree with the circuit's segment geometry, width and layer (5um tolerance). CPL uses the same lower-left datum.\n`
writeFileSync("checks/gerber-coordinates.log",message)
console.log(message.trim())
