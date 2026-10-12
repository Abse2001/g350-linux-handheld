import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import FirstReferenceBypass from './am3352-g350-ti-top-bottom-ddr-v4-reference-bypass.circuit'
import placements from '../lib/am3352/placement/g350-ti-top-bottom-ddr-v5.json'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}

// V2 native initialization left A3/A5/BA1/A4/A6 without Bottom escapes.
// Move RAM9/RAM11 out of those RAM ball escape sites, retaining the same nine
// moved parts and the reviewed first power/ground capacitor reference loop.
// Both revised capacitor centers remain within3.81mm of assigned supply/GND.
function correctEscapeClearance(node:ReactNode):ReactNode{
 if(!isValidElement<Props>(node))return node
 const props={...node.props}
 const move=(placements as Record<string,{pcbX:number;pcbY:number;layer:string;pcbRotation:number}>)[props.name??'']
 if(move)Object.assign(props,move)
 if(node.type==='board'){
  props.title='G350 TI Top/Bottom DDR V5 — cleared native escape sites; routing and qualification pending'
  props.layers=4;props.thickness=1.6;props.routeRemaining=false
 }
 return cloneElement(node as ReactElement<Props>,props,...Children.toArray(node.props.children).map(correctEscapeClearance))
}

export default()=>correctEscapeClearance(FirstReferenceBypass())
