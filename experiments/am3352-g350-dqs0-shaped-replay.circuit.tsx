import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import {fanoutTracePath} from '@tscircuit/props'
import PowerReplay from './am3352-g350-ddr-power-replay.circuit'
import nativePaths from '../lib/am3352/placement/ddr-dqs0-repaired-paths.json'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
const names=['DDR_DQS0','DDR_DQSn0']
const paths=nativePaths.map(p=>fanoutTracePath.parse(p))
function replay(node:ReactNode):ReactNode {
 if(!isValidElement<Props>(node))return node
 const p={...node.props},children=Children.toArray(node.props.children).map(replay)
 if(node.type==='trace'&&names.includes(p.name??''))p.routingPhaseIndex=1
 if(node.type==='bus'&&p.name==='DDR_BYTE0')p.connections=names
 if(node.type==='board'){
  p.title='G350 shaped board — native DQS0 pair under review'
  children.push(<autoroutingphase name="G350_DQS0_BUS_LANES" phaseIndex={1}
   autorouter="bus_lanes" connections={names} pcbTracePaths={paths}/>)
 }
 return cloneElement(node as ReactElement<Props>,p,...children)
}

// Replay the native bus_lanes bootstrap with the repaired RAM approach on
// the shared shaped outline. Keep all 280 components and 101 power escapes.
export default ()=>replay(PowerReplay())
