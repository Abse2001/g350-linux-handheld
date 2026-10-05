import {cloneElement, type ReactElement} from "react"
import Host from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import {layoutOnly} from "../lib/am3352/placement/LayoutOnly"
import {ControlsAndAudio} from "../lib/am3352/placement/ControlsAndAudio"

// Provisional development outline ONLY. It is smaller than the outside
// G350 case, but is not its measured PCB outline or a shell-fit proof.
// All previously checked routing remains in its original immutable entries.
// Display FPC/panel/backlight and exact battery/speaker connector selection
// must be completed before routing this integrated placement study.
export default () => {
  const host = layoutOnly(Host({schematicDisabled:true,usbCDevice:true,memoryConnections:memory})) as ReactElement<{children:unknown}>
  return cloneElement(host, {}, <>{host.props.children as ReactElement}<ControlsAndAudio/>
    <pcbnoterect pcbX={0} pcbY={27} width={74} height={61}/>
    <silkscreentext text="DISPLAY / FPC SELECTION PENDING" pcbX={0} pcbY={47} fontSize={1}/>
    <silkscreentext text="UNVERIFIED" pcbX={0} pcbY={-56} fontSize={.8}/>
  </>)
}
