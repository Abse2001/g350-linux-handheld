import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
// Fresh coordinates: CPU (0,20), RAM (0,0). Never reuse the earlier
// processor-at-origin experiment's inner-plane bounds or frozen copper.
export const g350DdrReferenceRegion={minX:-18,maxX:18,minY:-10,maxY:33} as const
export function g350DdrBootstrap(node:ReactNode):ReactNode {
 if(!isValidElement<Props>(node))return node
 const p={...node.props}
 // Core2085 resolves every differential pair before selecting a phase.
 // The branched USB connector/ESD nets cannot be represented as a single
 // two-terminal global pair. Defer only that unrelated bus/pair during
 // the DDR bootstrap; retain every USB port, net and electrical trace.
 if(['bus','differentialpair'].includes(String(node.type))&&['USB0_DATA','USB0_PAIR'].includes(p.name??''))return null
 // Net and trace names must be unique among immediate children when the
 // routing renderer is active. Rename only the two CPU/ESD trace labels.
 if(node.type==='trace'&&['USB0_DP','USB0_DM'].includes(p.name??''))p.name=p.name==='USB0_DP'?'USB0_CPU_DP':'USB0_CPU_DM'
 const children=Children.toArray(node.props.children).map(g350DdrBootstrap)
 if(node.type==='board'){
  p.title='G350 AM3352 — full component layout, DDR routing bootstrap'
  p.routeRemaining=false
  // Via lands use the same 4 mil copper clearance as tracks; keep the
  // separate 0.15 mm SMT-to-SMT pad rule inherited from the placed board.
  // The native checker must honor this field as well as the autorouter.
  p.minViaEdgeToPadEdgeClearance=.1016
  const r=g350DdrReferenceRegion
  children.push(
   // Fixed "unbroken" pours become routing obstacles and block through-via
   // dogbones. Refill normal dedicated plane pours around vias instead;
   // review actual continuity and return paths after the copper is known.
   // .12 clearance with 18/10 mil vias gives .2216 copper-to-drill and
   // .1028 plane necks at .8 mm pitch; the final fill needs independent DRC.
   <copperpour name="G350_GND_REFERENCE" layer="inner1" connectsTo="net.GND" clearance={.12} boardEdgeMargin={.35}/>,
   <copperpour name="G350_DDR_POWER_REFERENCE" layer="inner2" connectsTo="net.DDR_1V5" clearance={.12} outline={[
    {x:r.minX,y:r.minY},{x:r.maxX,y:r.minY},{x:r.maxX,y:r.maxY},{x:r.minX,y:r.maxY},
   ]}/>
  )
 }
 return cloneElement(node as ReactElement<Props>,p,...children)
}
