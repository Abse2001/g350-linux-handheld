import Host from "./am3352-powered-host.circuit"
import "../lib/am3352/ReferenceViaInnerPorts"
import memory from "../lib/am3352/memory-byte-swapped-connections.json"
import escapes from "../lib/am3352/ram-reference-escapes-rotated-180.json"

// Swap complete DDR byte groups, including associated DQS/DQSn/DM.
// TI permits this for AM335x DDR3/3L. No address/control swaps occur.
// This new placement/map combination requires fresh physical checks.
export default ()=><Host schematicDisabled ramRotation={180} guidedPathsRamRotation={180}
  guidedDdrPaths={{}} memoryConnections={memory} ramReferenceEscapes={escapes}
  rotatedD2PowerBridge byte1Layer="top" commandLayer="both"/>
