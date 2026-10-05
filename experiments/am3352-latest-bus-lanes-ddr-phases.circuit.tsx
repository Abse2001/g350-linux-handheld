import Host from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import escapes from "../lib/am3352/ram-reference-escapes-bottom-mirrored.json"
import usb from "../routing/am3352-ddr-usbc-final-routes.json"
import type {UsbRouteLayout} from "../lib/am3352/UsbCDevice"

// Native DDR phases under core 0.0.2080. No saved DDR guides are overlaid.
// The checked bottom-RAM placement keeps all fixed reference/USB copper.
// Host declares bus_lanes phases 1–4; inner1/inner2 remain reference planes.
export default ()=><Host schematicDisabled ramLayer="bottom" memoryConnections={memory}
  ramReferenceEscapes={escapes} byte0Layer="top" byte1Layer="bottom" commandLayer="top"
  usbCDevice usbRouteLayout={usb as UsbRouteLayout} ddrPowerPourClearance={.12}/>
