import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { createHash } from "node:crypto"
import {
  convertCircuitJsonToPickAndPlaceCsv,
  populatePartOrientationMetadata,
} from "circuit-json-to-pnp-csv"
import { getPlatformConfig } from "@tscircuit/eval/platform-config"

const sourcePath = "dist/index/circuit.json"
const original = readFileSync(sourcePath)
const circuit = JSON.parse(original)
const errors = circuit.filter(e => e.type.endsWith("_error"))
if (errors.length) throw new Error(`Fabrication export blocked by ${errors.length} circuit errors`)
const source = new Map(circuit.filter(e => e.type === "source_component").map(e => [e.source_component_id,e]))
const pcb = circuit.filter(e => e.type === "pcb_component")
const quote = v => `"${String(v ?? "").replaceAll('"','""')}"`
const csv = rows => rows.map(row => row.map(quote).join(",")).join("\n") + "\n"
mkdirSync("fabrication", { recursive: true })
const groups = new Map()
const packages = {U_CHARGE:"QFN-16-EP(3x3)",U_AUDIO:"TQFN-16-EP(3x3)",
  U_GAUGE:"DFN-8-EP(2x2)",U_BOOST:"SOT-563",U_KEYS:"SOIC-28",
  J_USB:"TYPE-C-31-M-12",L_BOOST:"1008"}
for (const p of pcb) {
  const s = source.get(p.source_component_id)
  const part = s?.supplier_part_numbers?.jlcpcb?.[0]
  if (!part) continue
  const g = groups.get(part) ?? {refs:[],part,comment:s.manufacturer_part_number ?? s.display_capacitance ?? s.display_resistance ?? s.display_inductance ?? s.name,
    footprint:packages[s.name] ?? (s.name.startsWith("SW_")?"SMD-4P":s.ftype === "simple_capacitor" && ["C_BOOST_OUT1","C_BOOST_OUT2"].includes(s.name)?"1206":s.name.includes("BULK")||["C_BAT","C_SYS","C_BOOST_IN"].includes(s.name)?"0805":"0603")}
  g.refs.push(s.name)
  groups.set(part,g)
}
const bom = csv([["Comment","Designator","Footprint","LCSC Part #"],
  ...[...groups.values()].map(g=>[g.comment,g.refs.join(","),g.footprint,g.part])])

// This copy only marks hand-fitted headers/testpoints DNP for the assembly CSV.
// The PCB and Gerbers retain their pads and all routing.
const assembly = circuit.map(e => e.type === "pcb_component" && !source.get(e.source_component_id)?.supplier_part_numbers?.jlcpcb?.length
  ? {...e,do_not_place:true} : e)
const config = getPlatformConfig()
const prepared = await populatePartOrientationMetadata(assembly, {...config,supplier:"jlcpcb"})
const pnp = convertCircuitJsonToPickAndPlaceCsv(prepared, {supplier:"jlcpcb",requireSupplierRotation:true})
writeFileSync("fabrication/bom-jlcpcb.csv",bom)
writeFileSync("fabrication/pnp-jlcpcb.csv",pnp)
writeFileSync("fabrication/circuit.json",original)
writeFileSync("fabrication/circuit.sha256",createHash("sha256").update(original).digest("hex")+"  circuit.json\n")
console.log(`Exported ${groups.size} supplier BOM entries and verified assembly rotations.`)
