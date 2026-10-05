import Host from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte0-guided-swizzled-connections.json"

// Actual numeric-pin source uses a DQ permutation derived from both package
// fanouts. DQS/DM and address/clock are unchanged. Not fabrication ready.
export default ()=><Host schematicDisabled memoryConnections={memory}/>
