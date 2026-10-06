import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import Rotated from './am3352-g350-ram90-inner-ddr.circuit'
type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
const requireManualEscapes=async()=>{throw new Error('Prepare and validate rotated DDR manual escapes before carrier routing')}
function fourLayers(node:ReactNode):ReactNode{
 if(!isValidElement<Props>(node))return node
 const p={...node.props}
 if(/^C_DDR_RAM_\d+$/.test(p.name??''))p.pcbX=Number(p.pcbX)<0?-8:8
 if(node.type==='bus'&&String(p.name).startsWith('DDR_'))p.pcbAllowedLayers=['top','inner1','inner2','bottom']
 if(node.type==='autoroutingphase'&&String(p.name).includes('BUS_LANES'))p.algorithmFn=requireManualEscapes
 if(node.type==='board')p.title='G350 RAM 90 degrees, four-layer DDR manual escapes and bus lanes — work in progress'
 return cloneElement(node as ReactElement<Props>,p,...Children.toArray(node.props.children).map(fourLayers))
}
export default()=>fourLayers(Rotated())
