import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import "../lib/am3352/ReferenceViaInnerPorts"
import memory from "../lib/am3352/memory-byte-swapped-connections.json"
import paths from "../routing/am3352-ram-rotated-180-byte-swapped-byte0-pair-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-rotated-180.json"

// Complete native byte0 channels with edited local fanouts. Whole-byte
// matching, combined physical checks and the rest of the host are pending.
export default ()=><Host schematicDisabled ramRotation={180} guidedPathsRamRotation={180}
  guidedDdrPaths={paths as GuidedDdrPathMap} memoryConnections={memory} ramReferenceEscapes={escapes}
  rotatedD2PowerBridge byte1Layer="top" commandLayer="both"/>
