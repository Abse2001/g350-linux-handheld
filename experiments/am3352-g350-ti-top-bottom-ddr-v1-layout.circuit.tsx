import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import ClearCorridor from './am3352-g350-outer-ddr-clear-corridor-layout.circuit'
import placements from '../lib/am3352/placement/g350-ti-top-bottom-ddr-v1.json'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}

// NEW placement/reference source only. No frozen DDR/rest copper is replayed.
// Coordinates are PCB world millimetres, identical to native SRJ: no transform.
// CPU remains (0,20), RAM (0,6)/270 degrees. CAD uses x=100+x,y=100-y.
// This region covers both packages, the cleared gap and the proposed bypasses;
// final routed DDR/reference coverage still requires fresh source/CAD checks.
export const tiDdrReferenceRegion={minX:-18,maxX:18,minY:-10,maxY:33} as const

function tiLayout(node:ReactNode):ReactNode{
 if(!isValidElement<Props>(node))return node
 const p={...node.props}
 const move=(placements as Record<string,{pcbX:number;pcbY:number;layer:string;pcbRotation:number}>)[p.name??'']
 if(move)Object.assign(p,move)
 if(node.type==='board'){
  p.title='G350 TI Top/Bottom DDR placement/reference proposal — routing and qualification pending'
  p.layers=4;p.thickness=1.6;p.routeRemaining=false
 }
 const children=Children.toArray(node.props.children).map(tiLayout)
 if(node.type==='board'){
  const r=tiDdrReferenceRegion
  // Append AFTER ClearCorridor has removed historical copperpour/via/phases.
  // Normal refillable zones preserve holes/antipads; unbroken fixed copper
  // must not masquerade as a legal via obstacle or a continuity proof.
  children.push(<copperpour name="G350_TI_V1_INNER1_GND" layer="inner1" connectsTo="net.GND"
    clearance={.12} boardEdgeMargin={.35} cutoutMargin={.2} useThermalReliefs={false}/>)
  children.push(<copperpour name="G350_TI_V1_INNER2_DDR_1V5" layer="inner2" connectsTo="net.DDR_1V5"
    clearance={.12} cutoutMargin={.2} useThermalReliefs={false} outline={[
      {x:r.minX,y:r.minY},{x:r.maxX,y:r.minY},{x:r.maxX,y:r.maxY},{x:r.minX,y:r.maxY},
    ]}/>)
 }
 return cloneElement(node as ReactElement<Props>,p,...children)
}

// Build with --routing-disabled only after review of the static proposal.
// Declaration is not evidence of fills, connectivity, impedance or timing.
export default()=>tiLayout(ClearCorridor())
