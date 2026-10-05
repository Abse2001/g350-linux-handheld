import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-ddr-usbc-clock-access-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"
import usb from "../routing/am3352-ddr-usbc-final-routes.json"
import type {UsbRouteLayout} from "../lib/am3352/UsbCDevice"

// Diagnostic: reopen DQS1 to release the obstructed clock pad corridor.
// Reroute/rematch DQS1 and qualify all DDR/USB together before promotion.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes}
  byte1Layer="top" commandLayer="both" usbCDevice usbRouteLayout={usb as UsbRouteLayout}/>
