import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import paths from "../routing/am3352-guided-byte0-paths.json"

// Editable native bus_lanes channels plus manual local modifications.
// This replay is untuned: 38 DDR channels and full host routing are pending.
// The ordinary host retains all four native DDR phases and timing checks.
export default ()=> <Host schematicDisabled guidedDdrPaths={paths as GuidedDdrPathMap}/>
