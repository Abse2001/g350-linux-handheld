import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-guided-both-bytes-and-reset-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"
import usb from "../routing/am3352-ddr-usbc-final-routes.json"
import type {UsbRouteLayout} from "../lib/am3352/UsbCDevice"

// Checked combined RAM0 bytes/reset and editable shared USB-C copper.
// Remaining DDR command/clock, powered host and shell fit are unfinished.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes} byte1Layer="top"
  usbCDevice usbRouteLayout={usb as UsbRouteLayout}/>
