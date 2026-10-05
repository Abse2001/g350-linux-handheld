import {cloneElement,type ReactElement} from "react"
import DisplayPlacement from "./am3352-g350-display-placement.circuit"
import {harnessPlacement,Harnesses} from "../lib/am3352/placement/HarnessPlacement"

// Unrouted 277-part engineering placement on the 76x118mm provisional
// G350-shaped outline. Actual enclosure fit and manufacturing are unverified.
export default () => {
  const host=DisplayPlacement() as ReactElement<{children:unknown}>
  return harnessPlacement(cloneElement(host,{},<>{host.props.children as ReactElement}<Harnesses/></>))
}
