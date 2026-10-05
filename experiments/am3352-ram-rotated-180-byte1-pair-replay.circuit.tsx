import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import "../lib/am3352/ReferenceViaInnerPorts"
import memory from "../lib/am3352/memory-ram-rotated-180-byte0-swizzled-connections.json"
import paths from "../routing/am3352-ram-rotated-180-byte1-pair-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-rotated-180.json"

// Editable native byte1 channel replay, separate from other candidates.
// Whole-byte matching and independent physical checks are still required.
export default ()=><Host schematicDisabled ramRotation={180} guidedPathsRamRotation={180}
  guidedDdrPaths={paths as GuidedDdrPathMap} memoryConnections={memory} ramReferenceEscapes={escapes}
  rotatedD2PowerBridge byte1Layer="top" commandLayer="both"/>
