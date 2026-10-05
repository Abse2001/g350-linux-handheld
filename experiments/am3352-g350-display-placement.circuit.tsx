import {cloneElement,type ReactElement} from "react"
import Host from "./am3352-powered-host.circuit"
import memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"
import {layoutOnly} from "../lib/am3352/placement/LayoutOnly"
import {rgb888Power} from "../lib/am3352/placement/Rgb888Power"
import {ControlsAndAudio} from "../lib/am3352/placement/ControlsAndAudio"
import {Display} from "../lib/am3352/placement/Display"

// Same provisional 76x118mm engineering outline. Measured original shell
// geometry, final harnesses and display qualification are still pending.
// All placement is explicit and all routing remains disabled for review.
export default () => {
  const host=rgb888Power(layoutOnly(Host({schematicDisabled:true,usbCDevice:true,memoryConnections:memory}))) as ReactElement<{children:unknown}>
  return cloneElement(host,{},<>{host.props.children as ReactElement}<ControlsAndAudio/><Display/>
    <silkscreentext text="UNVERIFIED" pcbX={0} pcbY={-56} fontSize={.8}/>
  </>)
}
