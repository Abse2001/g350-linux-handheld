import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import FourLayers from './am3352-g350-ram90-four-layer.circuit'
import cache from '../lib/am3352/placement/g350-ram90-pair-tuned-paths.json'
import {fanoutTracePath} from '@tscircuit/props'
import memory from '../lib/am3352/memory-byte1-top-centered-swizzled-connections.json'
type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
const paths=cache.map(p=>fanoutTracePath.parse(p))
const requireSavedPaths=async()=>{throw new Error('Rotated DDR replay requires the saved checked manual paths')}
function replay(node:ReactNode):ReactNode{
 if(!isValidElement<Props>(node))return node
 const p={...node.props}
 if(node.type==='copperpour')return null
 if(node.type==='autoroutingphase')return null
 if(node.type==='net')p.routingPhaseIndex=undefined
 if(node.type==='trace')p.routingPhaseIndex=undefined
 if(node.type==='trace'&&String(p.name).startsWith('DDR_'))p.routingPhaseIndex=0
 const children=Children.toArray(node.props.children).map(replay)
 if(node.type==='board'){
  p.autorouter='bus_lanes'
  p.title='G350 rotated RAM manual DDR candidate — 49 DDR signals — power, length matching and electrical timing unfinished'
  children.push(<autoroutingphase name="G350_RAM90_PAIR_TUNED_REPLAY" phaseIndex={0} autorouter="fanout" connections={memory.map(c=>c.name)} fanoutPourNetMap={{top:'GND'}} pcbTracePaths={paths} algorithmFn={requireSavedPaths}/>)
 }
 return cloneElement(node as ReactElement<Props>,p,...children)
}
export default()=>replay(FourLayers())
