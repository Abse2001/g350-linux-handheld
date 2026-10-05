import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import "../lib/am3352/ReferenceViaInnerPorts"
import memory from "../lib/am3352/memory-byte-swapped-connections.json"
import paths from "../routing/am3352-ram-rotated-180-byte-swapped-byte0-pair-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-rotated-180.json"

// USB charging/data netlist draft preserves the checked byte0 geometry.
// Full host routing, original-shell placement and USB installer are pending.
export default ()=><Host schematicDisabled ramRotation={180} guidedPathsRamRotation={180}
  guidedDdrPaths={paths as GuidedDdrPathMap} memoryConnections={memory} ramReferenceEscapes={escapes}
  rotatedD2PowerBridge byte1Layer="top" commandLayer="both" usbCDevice/>
