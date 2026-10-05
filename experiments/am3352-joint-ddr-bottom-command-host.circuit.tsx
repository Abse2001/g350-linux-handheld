import Host from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"

// Alternative four-layer source for routing command/clock directly from
// the joint native bottom escapes. No completed channel is claimed here.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={{}} ramReferenceEscapes={escapes} byte1Layer="top" commandLayer="bottom"/>
