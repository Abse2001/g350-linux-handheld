import Host from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import escapes from "../lib/am3352/ram-reference-escapes-rotated-180.json"

// Independent placement trial. Every RAM supply escape is transformed about
// the actual RAM center; CPU and capacitor copper remain explicitly authored.
// No old DDR channel is reused at a different package placement.
export default ()=><Host schematicDisabled ramRotation={180}
  guidedDdrPaths={{}} memoryConnections={memory} ramReferenceEscapes={escapes}
  byte1Layer="top" commandLayer="both"/>
