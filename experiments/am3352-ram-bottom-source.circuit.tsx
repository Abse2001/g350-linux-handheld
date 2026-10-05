import Host from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import escapes from "../lib/am3352/ram-reference-escapes-bottom-mirrored.json"
import usb from "../routing/am3352-ddr-usbc-final-routes.json"
import type {UsbRouteLayout} from "../lib/am3352/UsbCDevice"

// New two-sided placement study. All 49 DDR channels require fresh routing.
// Mirrored RAM reference geometry and shell clearances require new checks.
export default ()=><Host schematicDisabled ramLayer="bottom" memoryConnections={memory}
  ramReferenceEscapes={escapes} byte1Layer="top" commandLayer="both"
  usbCDevice usbRouteLayout={usb as UsbRouteLayout} ddrPowerPourClearance={.12}/>
