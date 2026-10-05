import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import {fanoutTracePath} from '@tscircuit/props'
import Escapes from './am3352-g350-byte1-escapes-replay.circuit'
import accessCache from '../lib/am3352/placement/ddr-byte0-byte1-strobe-access-paths.json'
import seededCache from '../lib/am3352/placement/ddr-byte1-strobe-seeded-paths.json'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
const access=accessCache.map(p=>fanoutTracePath.parse(p)),seeded=seededCache.map(p=>fanoutTracePath.parse(p))
function replay(node:ReactNode):ReactNode{
 if(!isValidElement<Props>(node))return node
 const p={...node.props}
 if(node.type==='autoroutingphase'&&p.name==='G350_BYTE0_MATCHED')p.pcbTracePaths=access
 if(node.type==='autoroutingphase'&&p.name==='G350_BYTE1_MANUAL_ESCAPES'){
  p.name='G350_BYTE1_SEEDED_STROBES'
  p.pcbTracePaths=seeded
 }
 if(node.type==='board')p.title='G350 byte1 strobe seed - remaining carriers and electrical timing unfinished'
 return cloneElement(node as ReactElement<Props>,p,...Children.toArray(node.props.children).map(replay))
}
export default()=>replay(Escapes())
