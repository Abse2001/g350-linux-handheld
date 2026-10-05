import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import MatchedByte0 from './am3352-g350-byte0-matched-replay.circuit'
import {fanoutTracePath} from '@tscircuit/props'
import repairedPaths from '../lib/am3352/placement/ddr-byte0-complete-bus-paths.json'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
const byte0=[...Array.from({length:8},(_,i)=>`DDR_D${i}`),'DDR_DQM0','DDR_DQS0','DDR_DQSn0']
const paths=repairedPaths.map(p=>fanoutTracePath.parse(p))
function completeBus(node:ReactNode):ReactNode {
 if(!isValidElement<Props>(node))return node
 const p={...node.props},children=Children.toArray(node.props.children).map(completeBus)
 if(node.type==='bus'&&p.name==='DDR_BYTE0'){
  p.connections=byte0
  p.pcbAllowedLayers=['top','bottom']
 }
 if(node.type==='autoroutingphase'&&p.name==='G350_BYTE0_MATCHED')p.pcbTracePaths=paths
 return cloneElement(node as ReactElement<Props>,p,...children)
}

// Restore the complete byte constraint after the two-strobe bootstrap.
// The checked native carriers and manual length repairs are retained.
export default ()=>completeBus(MatchedByte0())
