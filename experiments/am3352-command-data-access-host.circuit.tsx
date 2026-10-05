import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-command-data-access-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"

// Separate diagnostic opens six identified command barriers for data access.
// Every opened logical net remains and needs complete rerouting and matching.
// The independently checked command and byte/reset sources stay unchanged.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes}
  byte1Layer="top" commandLayer="both"/>
