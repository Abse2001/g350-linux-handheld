import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import FullBoard from './am3352-g350-full-board-replay.circuit'
type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
function fourMil(node:ReactNode):ReactNode{
 if(!isValidElement<Props>(node))return node
 const p={...node.props}
 if(node.type==='trace'){
  const endpoints=[String(p.from??''),String(p.to??'')]
  const special=String(p.name).startsWith('DDR_')||['USB0_CPU_DP','USB0_CPU_DM'].includes(String(p.name))||endpoints.some(x=>/net\.(XTAL_IN|XTAL_OUT|XTAL_DRIVE|USB0_DP|USB0_DM)$/.test(x))
  if(!special&&((typeof p.thickness==='number'&&p.thickness<=.15)||(/(?:^|\.)U_(SOC|RAM)\./.test(String(p.from))&&String(p.to).startsWith('net.'))))p.thickness=.1016
 }
 if(node.type==='board')p.title='G350 full-board routing trial — 4 mil digital traces, electrical qualification pending'
 return cloneElement(node as ReactElement<Props>,p,...Children.toArray(node.props.children).map(fourMil))
}
export default()=>fourMil(FullBoard())
