import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import {fanoutTracePath} from '@tscircuit/props'
import StrobeReplay from './am3352-g350-dqs0-center-approach.circuit'
import nativePaths from '../lib/am3352/placement/ddr-byte0-seven-native-paths.json'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
const names=['DDR_D2','DDR_DQM0','DDR_D6','DDR_D4','DDR_D0','DDR_D5','DDR_D1']
const paths=nativePaths.map(p=>fanoutTracePath.parse(p))
function replay(node:ReactNode):ReactNode {
 if(!isValidElement<Props>(node))return node
 const p={...node.props},children=Children.toArray(node.props.children).map(replay)
 if(node.type==='trace'&&names.includes(p.name??''))p.routingPhaseIndex=2
 if(node.type==='board'){
  p.title='G350 byte0 native lanes — remaining channels under review'
  children.push(<autoroutingphase name="G350_BYTE0_SEVEN_NATIVE_LANES" phaseIndex={2}
   autorouter="bus_lanes" connections={names} pcbTracePaths={paths}/>)
 }
 return cloneElement(node as ReactElement<Props>,p,...children)
}
export default ()=>replay(StrobeReplay())
