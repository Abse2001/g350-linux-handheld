import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import Replay from './am3352-g350-ram90-manual-replay.circuit'
type Props=Record<string,unknown>&{children?:ReactNode}
// Signal routing diagnostic only. Refill/qualify outer ground and all supplies
// separately; unconnected reference copper is not evidence of powered DDR.
function signals(node:ReactNode):ReactNode{
 if(!isValidElement<Props>(node))return node
 if(node.type==='copperpour')return null
 return cloneElement(node as ReactElement<Props>,node.props,...Children.toArray(node.props.children).map(signals))
}
export default()=>signals(Replay())
