import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import "../lib/am3352/ReferenceViaInnerPorts"
import memory from "../lib/am3352/memory-ram-rotated-180-byte0-swizzled-connections.json"
import paths from "../routing/am3352-ram-rotated-180-byte1-matched-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-rotated-180.json"

// Native bus_lanes channels with manually lengthened local fanouts.
// Full DDR, host, impedance and original-shell qualification remain required.
export default ()=><Host schematicDisabled ramRotation={180} guidedPathsRamRotation={180}
  guidedDdrPaths={paths as GuidedDdrPathMap} memoryConnections={memory} ramReferenceEscapes={escapes}
  rotatedD2PowerBridge byte1Layer="top" commandLayer="both"/>
