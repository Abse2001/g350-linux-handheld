import Host from "./am3352-powered-host.circuit"
import "../lib/am3352/ReferenceViaInnerPorts"
import memory from "../lib/am3352/memory-ram-rotated-180-byte0-swizzled-connections.json"
import escapes from "../lib/am3352/ram-reference-escapes-rotated-180.json"

// Diagnostic variant: an explicit inner2 power trace between existing
// reference vias, with no extra holes. Needs independent physical checks.
export default ()=><Host schematicDisabled ramRotation={180} guidedPathsRamRotation={180}
  guidedDdrPaths={{}} memoryConnections={memory} ramReferenceEscapes={escapes}
  rotatedD2PowerBridge byte1Layer="top" commandLayer="both"/>
