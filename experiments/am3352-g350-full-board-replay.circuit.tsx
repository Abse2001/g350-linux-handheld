import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import ZeroSkew from './am3352-g350-ram90-zero-skew-replay.circuit'
import {replayG350RestRouting} from '../lib/am3352/placement/G350RestRoutingReplay'
type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
function fullBoard(node:ReactNode):ReactNode{
 if(!isValidElement<Props>(node))return node
 const p={...node.props}
 if(node.type==='net')p.routingPhaseIndex=1
 if(node.type==='trace')p.routingPhaseIndex=String(p.name).startsWith('DDR_')?0:1
 // Replay DDR paths without asking the fanout stage to infer ground escapes.
 if(node.type==='autoroutingphase')p.fanoutPourNetMap={}
 const children=Children.toArray(node.props.children).map(fullBoard)
 if(node.type==='board'){
  p.autorouter={local:true,algorithmFn:replayG350RestRouting};p.routeRemaining=true
  p.title='G350 full-board routing candidate — independent and electrical qualification required'
  // Bootstrap deferred the branched USB bus. These selectors restore the
  // actual two-terminal CPU-to-ESD pair without treating connector branches
  // as a two-terminal differential connection.
  // The pinned core rejects a differentialpair on branched global USB nets.
  // Retain native bus width/layer/skew constraints and independently check
  // the requested 0.15 mm pair gap on the actual CPU-to-ESD paths.
  children.push(<bus name="USB0_DATA" connections={['USB0_CPU_DP','USB0_CPU_DM']} pcbAllowedLayers={['top','bottom']} pcbTraceWidth={.15} maxLengthSkew={.127}/>)
  children.push(<copperpour name="G350_FULL_TOP_GND" layer="top" connectsTo="net.GND" clearance={.12} boardEdgeMargin={.35} cutoutMargin={.2} useThermalReliefs={false}/>)
  children.push(<copperpour name="G350_FULL_BOTTOM_GND" layer="bottom" connectsTo="net.GND" clearance={.12} boardEdgeMargin={.35} cutoutMargin={.2} useThermalReliefs={false}/>)
  children.push(<autoroutingphase name="G350_REST_SAVED_REPLAY" phaseIndex={1} autorouter="auto_local" algorithmFn={replayG350RestRouting}/>)
 }
 return cloneElement(node as ReactElement<Props>,p,...children)
}
export default()=>fullBoard(ZeroSkew())
