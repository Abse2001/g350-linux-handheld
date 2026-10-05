import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte0-centered-swizzled-connections.json"
import paths from "../routing/am3352-guided-byte0-matched-paths.json"

// Native bus-lanes channel, centered fanouts and permitted DQ-only mapping.
// Planar matching is independently checked; full DDR and host are unfinished.
export default ()=><Host schematicDisabled memoryConnections={memory} guidedDdrPaths={paths as GuidedDdrPathMap}/>
