import { populatePartOrientationMetadata } from "circuit-json-to-pnp-csv"
import { getPlatformConfig } from "@tscircuit/eval/platform-config"

export async function prepareJlcpcbAssembly(circuit) {
  const source = new Map(circuit.filter(e => e.type === "source_component")
    .map(e => [e.source_component_id,e]))
  // Headers and testpoints are fitted by hand; this only excludes assembly rows.
  const assembly = circuit.map(e => e.type === "pcb_component" &&
    !source.get(e.source_component_id)?.supplier_part_numbers?.jlcpcb?.length
    ? {...e,do_not_place:true} : e)
  return populatePartOrientationMetadata(assembly, {...getPlatformConfig(),supplier:"jlcpcb"})
}
