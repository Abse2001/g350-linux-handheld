import Host from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-ram-rotated-180-byte0-swizzled-connections.json"
import escapes from "../lib/am3352/ram-reference-escapes-rotated-180.json"

// Actual numeric RAM endpoints are rebuilt after the permitted byte0 DQ
// permutation. DQS/DM, byte1 and command functions are unchanged.
export default ()=><Host schematicDisabled ramRotation={180} guidedPathsRamRotation={180}
  guidedDdrPaths={{}} memoryConnections={memory} ramReferenceEscapes={escapes}
  byte1Layer="top" commandLayer="both"/>
