import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import PowerReplay from './am3352-g350-ddr-power-replay.circuit'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode;connections?:string[]}
const strobeNames=['DDR_DQS0','DDR_DQSn0']
function strobeBootstrap(node:ReactNode):ReactNode {
 if(!isValidElement<Props>(node))return node
 const p={...node.props},children=Children.toArray(node.props.children).map(strobeBootstrap)
 if(node.type==='trace'&&strobeNames.includes(p.name??''))p.routingPhaseIndex=1
 if(node.type==='bus'&&p.name==='DDR_BYTE0')p.connections=strobeNames
 if(node.type==='board'){
  // Current native bus_lanes rejects a custom polygon outline. Use the
  // unchanged board bounding rectangle only as its computational domain.
  // Accepted output must be replayed and rechecked on the actual outline.
  p.outline=undefined
  p.title='G350 DQS0 native solver domain — shaped replay required'
  children.push(<autoroutingphase name="G350_DQS0_BUS_LANES" phaseIndex={1}
   autorouter="bus_lanes" connections={strobeNames}/>)
 }
 return cloneElement(node as ReactElement<Props>,p,...children)
}

// The first strobe pair is one critical routing phase in the complete
// 49-signal DDR channel, with all 280 parts and 101 plane escapes reserved.
export default ()=>strobeBootstrap(PowerReplay())
