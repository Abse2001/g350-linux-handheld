import Host from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"

// Fresh diagnostic for reserving every synchronous DDR breakout together.
// All source power/reference copper remains; the checked 23-signal board
// remains the active default while this alternative is evaluated.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={{}} ramReferenceEscapes={escapes} byte1Layer="top"/>
