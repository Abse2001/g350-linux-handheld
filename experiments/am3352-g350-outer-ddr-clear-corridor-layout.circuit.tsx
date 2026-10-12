import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import Connected from './am3352-g350-full-board-ground-preserving-clean-corners-replay.circuit'
import placements from '../lib/am3352/placement/g350-outer-ddr-clear-corridor.json'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
// Fresh editable placement source. Frozen routing phases and fills are removed
// before moving parts; actual checked DDR copper remains in the separate plan.
function clearCorridor(node:ReactNode):ReactNode{
 if(!isValidElement<Props>(node))return node
 if(['autoroutingphase','copperpour','via'].includes(String(node.type)))return null
 const p={...node.props}
 const move=(placements as Record<string,{pcbX:number;pcbY:number;layer:string;pcbRotation:number}>)[p.name??'']
 if(move)Object.assign(p,move)
 if(p.name==='U_RAM'){p.pcbX=0;p.pcbY=6;p.pcbRotation=270}
 if(node.type==='trace'){delete p.pcbPath;delete p.pcbPathRelativeTo;delete p.routingPhaseIndex}
 if(node.type==='net')delete p.routingPhaseIndex
 if(node.type==='bus'&&String(p.name).startsWith('DDR_'))p.pcbAllowedLayers=['top','bottom']
 if(node.type==='board'){
  p.title='G350 clear CPU/RAM routing corridor — placement study; connectivity and timing unfinished'
  p.autorouter='bus_lanes';p.routeRemaining=false
 }
 return cloneElement(node as ReactElement<Props>,p,...Children.toArray(node.props.children).map(clearCorridor))
}
export default()=>clearCorridor(Connected())
