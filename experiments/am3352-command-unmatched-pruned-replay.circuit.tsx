import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-command-unmatched-pruned-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"

// Separate 26-signal command/clock connectivity candidate. Native bus_lanes
// provides the bootstrap; manual repairs and A2 loop pruning supplement it.
// Timing, byte/reset integration and original-shell fit remain unfinished.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes}
  byte1Layer="top" commandLayer="both"/>
