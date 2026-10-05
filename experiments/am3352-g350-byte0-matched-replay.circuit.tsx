import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import {fanoutTracePath} from '@tscircuit/props'
import Byte0Replay from './am3352-g350-byte0-top-corridor-replay.circuit'
import dataPaths from '../lib/am3352/placement/ddr-byte0-matched-paths.json'
import strobePaths from '../lib/am3352/placement/ddr-dqs0-byte0-matched-paths.json'
type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
const paths=dataPaths.map(p=>fanoutTracePath.parse(p)),strobes=strobePaths.map(p=>fanoutTracePath.parse(p))
function replay(node:ReactNode):ReactNode {
 if(!isValidElement<Props>(node))return node
 const p={...node.props},children=Children.toArray(node.props.children).map(replay)
 if(node.type==='autoroutingphase'&&p.name==='G350_DQS0_CENTER_APPROACH')p.pcbTracePaths=strobes
 if(node.type==='autoroutingphase'&&p.name==='G350_BYTE0_TOP_CORRIDOR'){
  p.name='G350_BYTE0_MATCHED';p.pcbTracePaths=paths
 }
 if(node.type==='board')p.title='G350 byte0 — native bootstrap with planar length repairs under review'
 return cloneElement(node as ReactElement<Props>,p,...children)
}
export default ()=>replay(Byte0Replay())
