import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-ram-bottom-flexible-fanout-747-replay-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-bottom-mirrored.json"
import usb from "../routing/am3352-ddr-usbc-final-routes.json"
import type {UsbRouteLayout} from "../lib/am3352/UsbCDevice"

// Actual bus_lanes partial bootstrap plus declared manual paths.
// Independent shorts, connectivity, physical and complete DDR checks required.
export default ()=><Host schematicDisabled ramLayer="bottom" guidedPathsRamLayer="bottom"
  memoryConnections={memory} guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes}
  byte0Layer="both" byte1Layer="both" commandLayer="both" resetLayer="both"
  usbCDevice usbRouteLayout={usb as UsbRouteLayout} ddrPowerPourClearance={.12}/>
