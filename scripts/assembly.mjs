import { populatePartOrientationMetadata } from "circuit-json-to-pnp-csv"
import { getPlatformConfig } from "@tscircuit/eval/platform-config"

export const isJlcpcbAssembledComponent = source =>
  source?.supplier_part_numbers?.jlcpcb?.length > 0 &&
  !["simple_pin_header","simple_test_point"].includes(source.ftype)

export async function prepareJlcpcbAssembly(circuit) {
  const source = new Map(circuit.filter(e => e.type === "source_component")
    .map(e => [e.source_component_id,e]))
  // Headers and testpoints are fitted by hand; this only excludes assembly rows.
  const assembly = circuit.map(e => e.type === "pcb_component" &&
    !isJlcpcbAssembledComponent(source.get(e.source_component_id))
    ? {...e,do_not_place:true} : e)
  return populatePartOrientationMetadata(assembly, {...getPlatformConfig(),supplier:"jlcpcb"})
}
