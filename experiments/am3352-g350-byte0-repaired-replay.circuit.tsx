import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import {fanoutTracePath} from '@tscircuit/props'
import StrobeReplay from './am3352-g350-dqs0-center-approach.circuit'
import dataPaths from '../lib/am3352/placement/ddr-byte0-repaired-paths.json'
import strobePaths from '../lib/am3352/placement/ddr-dqs0-byte0-tuning-paths.json'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
const names=['DDR_D0','DDR_D1','DDR_D2','DDR_D3','DDR_D4','DDR_D5','DDR_D6','DDR_D7','DDR_DQM0']
const paths=dataPaths.map(p=>fanoutTracePath.parse(p)),strobes=strobePaths.map(p=>fanoutTracePath.parse(p))
function replay(node:ReactNode):ReactNode {
 if(!isValidElement<Props>(node))return node
 const p={...node.props},children=Children.toArray(node.props.children).map(replay)
 if(node.type==='trace'&&names.includes(p.name??''))p.routingPhaseIndex=2
 if(node.type==='autoroutingphase'&&p.name==='G350_DQS0_CENTER_APPROACH')p.pcbTracePaths=strobes
 if(node.type==='board'){
  p.title='G350 complete byte0 candidate — native bootstrap and manual repairs'
  children.push(<autoroutingphase name="G350_BYTE0_REPAIRED_LANES" phaseIndex={2}
   autorouter="bus_lanes" connections={names} pcbTracePaths={paths}/>)
 }
 return cloneElement(node as ReactElement<Props>,p,...children)
}
export default ()=>replay(StrobeReplay())
