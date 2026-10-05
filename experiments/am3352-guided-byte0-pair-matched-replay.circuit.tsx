import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import paths from "../routing/am3352-guided-byte0-pair-matched-paths.json"

// Native bus-lanes channel with manually balanced DQS fanout. The full-byte
// skew still fails and this experiment is not a fabrication-ready board.
export default ()=><Host schematicDisabled guidedDdrPaths={paths as GuidedDdrPathMap}/>
