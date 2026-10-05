import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import Byte0 from './am3352-g350-byte0-complete-bus.circuit'
import {routeG350Byte1WithThroughViaReservations} from '../lib/am3352/placement/G350Byte1ThroughViaBusLanes'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
const names=[...Array.from({length:8},(_,i)=>`DDR_D${i+8}`),'DDR_DQM1','DDR_DQS1','DDR_DQSn1']
function bootstrap(node:ReactNode):ReactNode {
 if(!isValidElement<Props>(node))return node
 const p={...node.props},children=Children.toArray(node.props.children).map(bootstrap)
 if(node.type==='trace'&&names.includes(p.name??''))p.routingPhaseIndex=3
 if(node.type==='bus'&&p.name==='DDR_BYTE1')p.pcbAllowedLayers=['top','bottom']
 if(node.type==='board'){
  p.outline=undefined
  p.title='G350 byte1 native bootstrap - actual shaped outline replay required'
  children.push(<autoroutingphase name="G350_BYTE1_BUS_LANES" phaseIndex={3}
   autorouter="bus_lanes" connections={names}
   algorithmFn={routeG350Byte1WithThroughViaReservations}/>)
 }
 return cloneElement(node as ReactElement<Props>,p,...children)
}
export default ()=>bootstrap(Byte0())
