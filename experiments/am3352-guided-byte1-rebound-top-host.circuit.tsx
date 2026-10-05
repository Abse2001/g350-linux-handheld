import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-guided-byte0-matched-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"

// Within-byte1 DQ permutation from completed physical package fanouts.
// The checked byte0 copper and the exact C1 reference-via move are retained.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes} byte1Layer="top"/>
