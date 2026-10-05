import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-ddr-usbc-wen-nominal-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"
import usb from "../routing/am3352-ddr-usbc-final-routes.json"
import type {UsbRouteLayout} from "../lib/am3352/UsbCDevice"

// WEn uses the native bus_lanes carrier inside the DDR reference bounds,
// with guarded package fanouts. Every checked DDR29 trace/hole is retained.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes}
  byte1Layer="top" commandLayer="both" usbCDevice usbRouteLayout={usb as UsbRouteLayout}
  ddrPowerPourClearance={.12}/>
