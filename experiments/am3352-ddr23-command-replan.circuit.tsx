import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-ddr23-command-replan-fixed-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"
import usb from "../routing/am3352-ddr-usbc-final-routes.json"
import type {UsbRouteLayout} from "../lib/am3352/UsbCDevice"

// Keep the checked data bytes and RESET exactly; replan all 26 synchronous
// command/clock connections together. This frees old command fanout sites.
// Only the already fully guided DQS pairs are omitted in this diagnostic;
// the unrouted CK pair keeps its native coupling/skew constraints.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes}
  byte1Layer="top" commandLayer="both" usbCDevice usbRouteLayout={usb as UsbRouteLayout}
  nativePhaseFixedPairNames={["DDR_DQS0_PAIR","DDR_DQS1_PAIR"]}
  ddrPowerPourClearance={.12}/>
