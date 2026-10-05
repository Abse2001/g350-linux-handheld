import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-ram-rotated-180-byte0-swizzled-connections.json"
import paths from "../routing/am3352-ram-rotated-180-byte0-pair-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-rotated-180.json"

// Separate editable native byte0 channel replay. DQS planar matching passed
// with independent continuity/physical checks; whole-byte skew still fails.
export default ()=><Host schematicDisabled ramRotation={180} guidedPathsRamRotation={180}
  guidedDdrPaths={paths as GuidedDdrPathMap} memoryConnections={memory} ramReferenceEscapes={escapes}
  byte1Layer="top" commandLayer="both"/>
