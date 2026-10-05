import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-command-local-access-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"

// Isolated access trial. WEn, RASn and ODT retain their logical endpoints,
// but their channel copper is open so compatible byte fanouts can be planned.
// All three command channels must be rerouted and timing checked afterward.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes}
  byte1Layer="top" commandLayer="both"/>
