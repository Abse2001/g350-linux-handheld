import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import {cpuPowerConnections,ramPowerConnections} from '../PowerNetworks'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
const cpuPorts=new Set(cpuPowerConnections.filter(p=>['GND','DDR_1V5'].includes(p.net)).map(p=>`U_SOC.${p.pin}`))
const ramPorts=new Set(ramPowerConnections.filter(p=>['GND','DDR_1V5'].includes(p.net)).map(p=>`U_RAM.${p.pin}`))

// Preserve the complete placed source. Commit both native plane-fanout
// phases before attempting signal buses, so a later failed phase cannot
// discard these separately reviewed power and ground escapes.
export function g350DdrPowerReplay(node:ReactNode):ReactNode {
 if(!isValidElement<Props>(node))return node
 const p={...node.props}
 if(node.type==='autoroutingphase'&&!['G350_RAM_POWER_ESCAPES','G350_CPU_POWER_ESCAPES'].includes(p.name??''))return null
 if(node.type==='net')p.routingPhaseIndex=undefined
 if(node.type==='trace'){
  p.routingPhaseIndex=undefined
  if(cpuPorts.has(String(p.from))||ramPorts.has(String(p.from))){
   p.routingPhaseIndex=ramPorts.has(String(p.from))?-1:0
   // Only short package-to-plane stubs use 4 mil copper. Keep the upstream
   // supply distribution and regulator loops subject to current review.
   p.thickness=.1016
  }
 }
 if(node.type==='board')p.title='G350 shaped board — CPU/RAM plane fanout under review'
 return cloneElement(node as ReactElement<Props>,p,...Children.toArray(node.props.children).map(g350DdrPowerReplay))
}
