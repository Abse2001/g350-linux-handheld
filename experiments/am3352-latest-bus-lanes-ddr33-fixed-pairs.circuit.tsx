import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import paths from "../routing/am3352-ddr-usbc-d12-spacing-repaired-paths.json"
import escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"
import usb from "../routing/am3352-ddr-usbc-final-routes.json"
import type {UsbRouteLayout} from "../lib/am3352/UsbCDevice"

// Native address/control phase around the checked 33-channel copper.
// Core 0.0.2080 rejects pair definitions when both routes are already fixed.
// Omit only those three fully guided pairs for this diagnostic routing input.
// Replay any completed phase output with all pair definitions restored before
// fresh shorts, physical clearance, end-to-end timing or release checks.
export default ()=><Host schematicDisabled memoryConnections={memory}
  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes}
  byte1Layer="top" commandLayer="both" usbCDevice usbRouteLayout={usb as UsbRouteLayout}
  nativePhaseFixedPairNames={["DDR_DQS0_PAIR","DDR_DQS1_PAIR","DDR_CK_PAIR"]}
  ddrPowerPourClearance={.12}/>
