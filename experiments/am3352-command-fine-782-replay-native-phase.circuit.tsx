import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-command-fine-782-replay-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"
import usb from "../routing/am3352-ddr-usbc-final-routes.json"
import type {UsbRouteLayout} from "../lib/am3352/UsbCDevice"

// Native continuation only: omit declarations for already fixed pairs.
// Replay entry above restores every pair before independent qualification.
export default ()=><Host schematicDisabled memoryConnections={memory} guidedDdrPaths={paths as GuidedDdrPathMap}
  ramReferenceEscapes={escapes} byte1Layer="top" commandLayer="both"
  usbCDevice usbRouteLayout={usb as UsbRouteLayout} ddrPowerPourClearance={.12}
  nativePhaseFixedPairNames={["DDR_DQS0_PAIR","DDR_DQS1_PAIR","DDR_CK_PAIR"]}/>
