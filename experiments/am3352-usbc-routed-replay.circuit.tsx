import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import "../lib/am3352/ReferenceViaInnerPorts"
import memory from "../lib/am3352/memory-byte-swapped-connections.json"
import paths from "../routing/am3352-ram-rotated-180-byte-swapped-byte0-pair-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-rotated-180.json"
import usb from "../routing/am3352-usbc-routes.json"
import type {UsbRouteLayout} from "../lib/am3352/UsbCDevice"

// Native bus_lanes USB pair and CC bootstrap with authored local repairs.
// PMIC feed, VBUS sensing, USB impedance/boot and full DDR remain pending.
export default ()=><Host schematicDisabled ramRotation={180} guidedPathsRamRotation={180}
  guidedDdrPaths={paths as GuidedDdrPathMap} memoryConnections={memory} ramReferenceEscapes={escapes}
  rotatedD2PowerBridge byte1Layer="top" commandLayer="both" usbCDevice usbRouteLayout={usb as UsbRouteLayout}/>
