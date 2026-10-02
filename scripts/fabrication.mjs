import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs"
import { createHash } from "node:crypto"
import {
  convertCircuitJsonToPickAndPlaceCsv,
} from "circuit-json-to-pnp-csv"
import { prepareJlcpcbAssembly, isJlcpcbAssembledComponent } from "./assembly.mjs"

const sourcePath = "dist/index/circuit.json"
const original = readFileSync(sourcePath)
const circuit = JSON.parse(original)
const errors = circuit.filter(e => e.type.endsWith("_error"))
if (errors.length) throw new Error(`Fabrication export blocked by ${errors.length} circuit errors`)
const throughLayers = ["top","inner1","inner2","bottom"]
const invalidVias = circuit.filter(e=>e.type==="pcb_via" &&
  (e.layers.length!==throughLayers.length || throughLayers.some(layer=>!e.layers.includes(layer)) ||
   e.hole_diameter!==0.3 || e.outer_diameter!==0.65))
if (invalidVias.length)
  throw new Error(`Fabrication export requires standard full-depth 0.3/0.65mm vias; ${invalidVias.length} invalid spans or dimensions`)
if (!circuit.some(e=>e.type==="source_net"&&e.source_net_id==="source_net_0"&&e.name==="GND"))
  throw new Error("Ground-plane net identifier changed; update the phase router before exporting")
if (!circuit.some(e=>e.type==="source_net"&&e.source_net_id==="source_net_1"&&e.name==="V3V3"))
  throw new Error("Status pull-up net identifier changed; update the phase router before exporting")
const buildLog = readFileSync("checks/build.log","utf8")
if (!/^\s*Circuits\s+1 passed\s*$/m.test(buildLog) || !buildLog.includes("Build exiting with code 0") ||
  (buildLog.match(/phase [123]\/3 .* done:.*errors=0/g) ?? []).length !== 3)
  throw new Error("Fabrication export requires a successful full three-phase build")
if (!readFileSync("checks/shorts.log","utf8").includes("No shorts detected"))
  throw new Error("Fabrication export requires the final all-layer shorts check")
if (statSync("checks/shorts.log").mtimeMs < statSync(sourcePath).mtimeMs)
  throw new Error("The final circuit changed after the shorts check")
const drc = JSON.parse(readFileSync("checks/kicad-drc.json","utf8"))
// Embedded supplier footprints are self-contained in this export; KiCad's
// absent external 'tscircuit' library warning is recorded but cannot compare
// those footprints against a local library. All geometry warnings still block.
const drcIssues = [...(drc.violations ?? []),...(drc.unconnected_items ?? [])].filter(e=>
  !(e.type==="lib_footprint_issues" && e.severity==="warning" &&
    e.description==="The current configuration does not include the footprint library 'tscircuit'"))
if (drcIssues.length)
  throw new Error(`Fabrication export blocked by ${drcIssues.length} independent KiCad DRC/connectivity issues`)
if (statSync("checks/kicad-drc.json").mtimeMs < statSync(sourcePath).mtimeMs)
  throw new Error("The final circuit changed after independent DRC")
const checkedBoard = readFileSync("dist/index/kicad/index.kicad_pcb")
if (readFileSync("checks/kicad-board.sha256","utf8").trim().split(/\s+/)[0] !==
    createHash("sha256").update(checkedBoard).digest("hex"))
  throw new Error("The KiCad board changed after independent DRC")
// Independently require the converted board to retain standard through-vias,
// including transitions whose signal wires terminate on an inner layer.
const exportedVias=[...checkedBoard.toString().matchAll(/^([ \t]+)\(via\b[\s\S]*?^\1\)/gm)].map(m=>m[0])
const expectedVias=circuit.filter(e=>e.type==="pcb_via")
if(exportedVias.length!==expectedVias.length) throw new Error("KiCad through-via count differs from the circuit")
for(const via of exportedVias){
  const at=/\(at ([^ )]+) ([^ )]+)\)/.exec(via)
  if(!/\(layers\s+"F\.Cu"\s+"B\.Cu"\)/.test(via) || /\(via\s+(?:blind|micro)\b/.test(via) ||
     Number(/\(size ([^ )]+)\)/.exec(via)?.[1])!==0.65 ||
     Number(/\(drill ([^ )]+)\)/.exec(via)?.[1])!==0.3 || !at ||
     !expectedVias.some(e=>Math.hypot(Number(at[1])-100-e.x,100-Number(at[2])-e.y)<0.005))
    throw new Error("KiCad via span, dimensions or position differs from a standard circuit through-via")
}
const sourceFiles = ["index.circuit.tsx",...['lib','imports'].flatMap(dir =>
  readdirSync(dir).filter(f=>f.endsWith('.tsx')||f.endsWith('.ts')).map(f=>`${dir}/${f}`))]
if (sourceFiles.some(path => statSync(path).mtimeMs > statSync(sourcePath).mtimeMs))
  throw new Error("Hardware source changed after the qualified circuit build")
const source = new Map(circuit.filter(e => e.type === "source_component").map(e => [e.source_component_id,e]))
const pcb = circuit.filter(e => e.type === "pcb_component")
const quote = v => `"${String(v ?? "").replaceAll('"','""')}"`
const csv = rows => rows.map(row => row.map(quote).join(",")).join("\n") + "\n"
mkdirSync("fabrication", { recursive: true })
const groups = new Map()
const packages = {U_CHARGE:"QFN-16-EP(3x3)",U_AUDIO:"TQFN-16-EP(3x3)",
  U_GAUGE:"DFN-8-EP(2x2)",U_BOOST:"SOT-563",U_KEYS:"SOIC-28",
  J_USB:"TYPE-C-31-M-12",L_BOOST:"1008",J_LCD:"FPC-0.5-18P",U_LCD_PWR:"SOT-25-5"}
for (const p of pcb) {
  const s = source.get(p.source_component_id)
  if (!isJlcpcbAssembledComponent(s)) continue
  const part = s?.supplier_part_numbers?.jlcpcb?.[0]
  if (!part) continue
  const g = groups.get(part) ?? {refs:[],part,comment:s.manufacturer_part_number ?? s.display_capacitance ?? s.display_resistance ?? s.display_inductance ?? s.name,
    footprint:packages[s.name] ?? (s.name.startsWith("SW_")?"SMD-4P":s.ftype === "simple_capacitor" && ["C_BOOST_OUT1","C_BOOST_OUT2"].includes(s.name)?"1206":s.name.includes("BULK")||["C_BAT","C_SYS","C_BOOST_IN"].includes(s.name)?"0805":"0603")}
  g.refs.push(s.name)
  groups.set(part,g)
}
const bom = csv([["Comment","Designator","Footprint","LCSC Part #"],
  ...[...groups.values()].map(g=>[g.comment,g.refs.join(","),g.footprint,g.part])])

const prepared = await prepareJlcpcbAssembly(circuit)
const board = circuit.find(e=>e.type === "pcb_board")
if (board.width !== 100 || board.height !== 124 || board.center.x !== 0 || board.center.y !== 0)
  throw new Error("Review the manufacturing datum after changing board dimensions")
// Supplier rotations are resolved against the original part geometry above.
// Translate only exported placement centers to the Gerber/drill plot origin.
const assemblyAtPlotOrigin = prepared.map(e=>e.type === "pcb_component"
  ? {...e,center:{x:e.center.x+50,y:e.center.y+62}} : e)
const pnp = convertCircuitJsonToPickAndPlaceCsv(assemblyAtPlotOrigin, {supplier:"jlcpcb",requireSupplierRotation:true})
writeFileSync("fabrication/bom-jlcpcb.csv",bom)
writeFileSync("fabrication/pnp-jlcpcb.csv",pnp)
writeFileSync("fabrication/bom-manual.csv",csv([
  ["Item","Quantity","Specification","Assembly notes"],
  ["J_PI",1,"Unshrouded 2x20 male header, 2.54 mm pitch","Fit on bottom; match silkscreen pin 1"],
  ["J_BAT",1,"1x3 male header, 2.54 mm pitch; battery harness rated at least 3 A","Bottom; pin 1 battery positive, 2 negative, 3 NTC"],
  ["J_OFF, J_SPEAKER",2,"1x2 male header, 2.54 mm pitch","Fit on bottom; speaker outputs are both driven"],
  ["Linux host",1,"Raspberry Pi Zero 2 W with populated GPIO header","Complete external module; insulating M2.5 standoffs"],
  ["GPIO cable",1,"Straight-through 40-wire female-to-female GPIO ribbon","Pin 1 to pin 1; preserve both pin rows"],
  ["Display",1,"Waveshare 3.5inch Capacitive Touch LCD, ST7796S + FT6336U","18-pin 0.5 mm FPC host port; use custom GPIO assignments"],
  ["Display cable",1,"18-conductor 0.5 mm pitch, 0.3 mm thick FFC","Choose contact sides for both connectors; verify pin-1 continuity"],
  ["Battery",1,"Protected 1S 4.2 V Li-ion/LiPo with attached 10 kOhm 103AT-2-compatible NTC","NTC returns to battery negative; harness rated at least 3 A"],
  ["Speaker",1,"8 Ohm, at least 2 W","Connect between J_SPEAKER pins 1 and 2"],
  ["Off switch",1,"External SPST slide switch","Closing J_OFF disables the boost; shut Linux down first"],
  ["Pi mounting hardware",4,"Insulating M2.5 nylon screws and standoffs","Choose height to clear the Pi connectors and carrier components"],
]))
writeFileSync("fabrication/circuit.json",original)
writeFileSync("fabrication/circuit.sha256",createHash("sha256").update(original).digest("hex")+"  circuit.json\n")
console.log(`Exported ${groups.size} supplier BOM entries and verified assembly rotations.`)
