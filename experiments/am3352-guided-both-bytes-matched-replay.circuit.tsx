import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-guided-both-bytes-matched-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"

// Both native bus_lanes byte channels, with recorded manual fanout edits
// and local tuning. Actual source replay still needs full independent checks.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes} byte1Layer="top"/>
