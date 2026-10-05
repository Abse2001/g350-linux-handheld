import Host from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte0-centered-swizzled-connections.json"

// Individual-source host with DQ-only permutation for centered exits.
// Package/reference geometry and the native DDR phases remain unchanged.
export default ()=><Host schematicDisabled memoryConnections={memory}/>
