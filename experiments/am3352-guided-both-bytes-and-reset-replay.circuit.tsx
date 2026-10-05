import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-guided-both-bytes-and-reset-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"

// Native bus_lanes byte channels and reset, with documented manual
// fanouts/tuning. Command/clock and the powered handheld remain incomplete.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes} byte1Layer="top"/>
