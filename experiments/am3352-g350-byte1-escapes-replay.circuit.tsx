import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import {fanoutTracePath} from '@tscircuit/props'
import Byte0 from './am3352-g350-byte0-complete-bus.circuit'
import byte0Access from '../lib/am3352/placement/ddr-byte0-byte1-access-paths.json'
import byte1Escapes from '../lib/am3352/placement/ddr-byte1-manual-escapes.json'
import {routeG350Byte1FromEscapes} from '../lib/am3352/placement/G350Byte1EscapedBusLanes'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
const names=[...Array.from({length:8},(_,i)=>`DDR_D${i+8}`),'DDR_DQM1','DDR_DQS1','DDR_DQSn1']
const access=byte0Access.map(p=>fanoutTracePath.parse(p)),escapes=byte1Escapes.map(p=>fanoutTracePath.parse(p))
// Core suppresses the fanout preset's implicit default-routing stage when a
// phase callback is present. Saved paths still take precedence. The following
// explicit bus_lanes phase supplies the carriers instead of a generic router.
const requireSavedEscapes=async()=>{throw new Error('Byte1 bootstrap requires its complete saved package escapes')}
function replay(node:ReactNode):ReactNode {
 if(!isValidElement<Props>(node))return node
 const p={...node.props},children=Children.toArray(node.props.children).map(replay)
 if(node.type==='autoroutingphase'&&p.name==='G350_BYTE0_MATCHED')p.pcbTracePaths=access
 if(node.type==='trace'&&names.includes(p.name??''))p.routingPhaseIndex=3
 if(node.type==='bus'&&p.name==='DDR_BYTE1')p.pcbAllowedLayers=['top','bottom']
 if(node.type==='board'){
  p.title='G350 coordinated byte1 escapes - complete bus and electrical timing unfinished'
  children.push(<autoroutingphase name="G350_BYTE1_MANUAL_ESCAPES" phaseIndex={3}
   autorouter="fanout" connections={names} pcbTracePaths={escapes} algorithmFn={requireSavedEscapes}/>)
  children.push(<autoroutingphase name="G350_BYTE1_ESCAPED_BUS_LANES" phaseIndex={4}
   autorouter="bus_lanes" connections={names} algorithmFn={routeG350Byte1FromEscapes}/>)
 }
 return cloneElement(node as ReactElement<Props>,p,...children)
}
export default ()=>replay(Byte0())
