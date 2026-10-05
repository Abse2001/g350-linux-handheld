import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-command-unmatched-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"

// Separate 26-signal command/clock candidate from a native bus_lanes
// bootstrap plus manual repairs. Original timing limits remain enabled;
// both bytes and reset are open here. This does not replace the default.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes}
  byte1Layer="top" commandLayer="both"/>
