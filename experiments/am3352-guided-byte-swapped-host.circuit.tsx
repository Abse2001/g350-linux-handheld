import Host from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte-swapped-connections.json"

// Complete byte-lane swap, including each DQS pair and DM. Individual parts,
// physical power copper and the four native DDR phases remain in Host.
// This isolated routing trial does not replace the checked default source.
export default ()=><Host schematicDisabled memoryConnections={memory}/>
