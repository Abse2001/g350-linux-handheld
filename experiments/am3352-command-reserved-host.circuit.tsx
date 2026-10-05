import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-command-reserved-open-pair-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"

// Isolated fanout repair: open only DQS1/DQSn1 to reserve the clock
// breakout first. This incomplete experiment is not the active board.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes} byte1Layer="top"/>
