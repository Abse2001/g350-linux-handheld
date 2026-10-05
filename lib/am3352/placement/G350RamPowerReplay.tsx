import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import {ramPowerConnections} from '../PowerNetworks'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
const ports=new Set(ramPowerConnections.filter(p=>['GND','DDR_1V5'].includes(p.net)).map(p=>`U_RAM.${p.pin}`))

// Commit the completed native RAM fanout without allowing a later failed
// experimental phase to discard its copper. This preserves every part and
// net; only RAM supply/ground escapes receive an executable routing phase.
export function g350RamPowerReplay(node:ReactNode):ReactNode {
 if(!isValidElement<Props>(node))return node
 const p={...node.props}
 if(node.type==='autoroutingphase'&&p.name!=='G350_RAM_POWER_ESCAPES')return null
 // cloneElement merges original props: undefined must explicitly clear a
 // routing phase; deleting the copied key would retain the old assignment.
 if(node.type==='net')p.routingPhaseIndex=undefined
 if(node.type==='trace'){
  p.routingPhaseIndex=undefined
  if(ports.has(String(p.from))){
   p.routingPhaseIndex=-1
   // Only these <0.707 mm BGA-to-plane stubs use 4 mil copper. The
   // upstream power distribution still needs separate current review.
   p.thickness=.1016
  }
 }
 if(node.type==='board')p.title='G350 shaped board — native RAM power fanout under review'
 return cloneElement(node as ReactElement<Props>,p,...Children.toArray(node.props.children).map(g350RamPowerReplay))
}
