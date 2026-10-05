import Host from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"

// Explicit outer-layer command allocation. Both inner planes are reserved;
// the full command and clock skew limits remain unchanged.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={{}} ramReferenceEscapes={escapes} byte1Layer="top" commandLayer="both"/>
