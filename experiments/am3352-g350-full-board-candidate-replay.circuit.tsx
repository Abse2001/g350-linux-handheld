import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import {fanoutTracePath} from '@tscircuit/props'
import ClockCluster from './am3352-g350-full-board-clock-cluster.circuit'
import ddrCache from '../lib/am3352/placement/g350-full-board-ddr-candidate-paths.json'
import restCache from '../lib/am3352/placement/g350-full-board-rest-candidate-routing.json'
import {createG350RestReplay} from '../lib/am3352/placement/G350RestRoutingReplay'
type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
const paths=ddrCache.map(p=>fanoutTracePath.parse(p))
const restReplay=createG350RestReplay(restCache)
function replay(node:ReactNode):ReactNode{
 if(!isValidElement<Props>(node))return node
 const p={...node.props}
 if(node.type==='board'){
  p.autorouter={local:true,algorithmFn:restReplay}
  p.title='G350 whole-board routing candidate — ground, DDR matching and electrical qualification pending'
 }
 if(node.type==='autoroutingphase'&&p.name==='G350_RAM90_ZERO_SKEW_REPLAY'){
  p.name='G350_FULL_BOARD_DDR_CANDIDATE_REPLAY'
  p.pcbTracePaths=paths;p.fanoutPourNetMap={}
 }
 if(node.type==='autoroutingphase'&&p.name==='G350_REST_SAVED_REPLAY')p.algorithmFn=restReplay
 const children=Children.toArray(node.props.children).map(replay)
 if(node.type==='board'){
  children.push(<copperpour name="G350_FULL_INNER1_GND" layer="inner1" connectsTo="net.GND" clearance={.12} boardEdgeMargin={.35} cutoutMargin={.2} useThermalReliefs={false}/>)
  children.push(<copperpour name="G350_FULL_INNER2_GND" layer="inner2" connectsTo="net.GND" clearance={.12} boardEdgeMargin={.35} cutoutMargin={.2} useThermalReliefs={false}/>)
 }
 return cloneElement(node as ReactElement<Props>,p,...children)
}
export default()=>replay(ClockCluster())
