import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import FourMil from './am3352-g350-full-board-four-mil-replay.circuit'
type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
const positions:Record<string,{y:number;x?:number}>={C_XTAL_IN:{y:23},R_XTAL_BIAS_DNP:{y:16.4},R_XTAL_DAMP:{x:16,y:18}}
function cluster(node:ReactNode):ReactNode{
 if(!isValidElement<Props>(node))return node
 const p={...node.props}
 if(p.name&&p.name in positions){p.pcbY=positions[p.name].y;if(positions[p.name].x!==undefined)p.pcbX=positions[p.name].x}
 if(node.type==='board')p.title='G350 full-board routing trial — clock passives clustered, electrical qualification pending'
 return cloneElement(node as ReactElement<Props>,p,...Children.toArray(node.props.children).map(cluster))
}
export default()=>cluster(FourMil())
