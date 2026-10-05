import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-ddr-usbc-odt-nominal-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"
import usb from "../routing/am3352-ddr-usbc-final-routes.json"
import type {UsbRouteLayout} from "../lib/am3352/UsbCDevice"

// Retain every checked DDR26 channel and add native bus_lanes ODT.
// Guarded manual ODT fanouts use four full-depth vias and real package pads.
// A guarded wire-only shortcut matches ODT to the placement nominal range.
// Full command/clock and electrical qualification still remain open.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes}
  byte1Layer="top" commandLayer="both" usbCDevice usbRouteLayout={usb as UsbRouteLayout}
  ddrPowerPourClearance={.12}/>
