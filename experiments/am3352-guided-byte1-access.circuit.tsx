import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte0-centered-swizzled-connections.json"
import paths from "../routing/am3352-guided-byte0-matched-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"

// Preserve the matched native byte0 channel. Relocate only RAM C1's
// full-depth reference via to permit the adjacent byte1 signal escape.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes}/>
