import {cloneElement,type ReactElement} from 'react'
import CriticalPlacement from './am3352-g350-critical-placement.circuit'
import {backlightPinAllocation,BufferedBacklight} from '../lib/am3352/placement/BacklightPinAllocation'

// 280-part unrouted placement. Preserve the checked earlier studies while
// separating microSD card detect from the new buffered hardware PWM output.
export default ()=>{
 const host=CriticalPlacement() as ReactElement<{children:unknown}>
 return backlightPinAllocation(cloneElement(host,{},<>{host.props.children as ReactElement}<BufferedBacklight/></>))
}
