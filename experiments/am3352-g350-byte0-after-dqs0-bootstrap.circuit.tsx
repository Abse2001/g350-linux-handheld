import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import StrobeReplay from './am3352-g350-dqs0-shaped-replay.circuit'
import {routeG350Byte0WithThroughViaReservations} from '../lib/am3352/placement/G350ThroughViaBusLanes'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
const names=[...Array.from({length:8},(_,i)=>`DDR_D${i}`),'DDR_DQM0']
function bootstrap(node:ReactNode):ReactNode {
 if(!isValidElement<Props>(node))return node
 const p={...node.props},children=Children.toArray(node.props.children).map(bootstrap)
 if(node.type==='trace'&&names.includes(p.name??''))p.routingPhaseIndex=2
 if(node.type==='bus'&&p.name==='DDR_BYTE0')p.connections=names
 if(node.type==='board'){
  // Computational domain only: replay accepted new output on the actual
  // shaped outline and repeat physical and connectivity checks afterward.
  p.outline=undefined
  p.title='G350 byte0 native bootstrap — actual-outline replay required'
  children.push(<autoroutingphase name="G350_BYTE0_AFTER_DQS0_BUS_LANES" phaseIndex={2}
   autorouter="bus_lanes" connections={names}
   algorithmFn={routeG350Byte0WithThroughViaReservations}/>)
 }
 return cloneElement(node as ReactElement<Props>,p,...children)
}

export default ()=>bootstrap(StrobeReplay())
