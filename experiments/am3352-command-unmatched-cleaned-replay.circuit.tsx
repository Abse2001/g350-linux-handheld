import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-command-unmatched-cleaned-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"

// Native bus_lanes bootstrap and manual 26-signal command repair, with
// the independently identified A2 backtrack removed. Length matching,
// byte/reset integration and original-shell mechanics remain unfinished.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes}
  byte1Layer="top" commandLayer="both"/>
