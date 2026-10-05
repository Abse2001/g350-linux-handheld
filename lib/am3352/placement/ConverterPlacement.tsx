import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import placements from './converter-placements.json'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
export function converterPlacement(node:ReactNode):ReactNode {
 if(!isValidElement<Props>(node))return node
 const p={...node.props}
 const move=(placements as Record<string,{x:number;y:number;rotation:number;layer:string}>)[p.name??'']
 if(move){p.pcbX=move.x;p.pcbY=move.y;p.pcbRotation=move.rotation;p.layer=move.layer}
 if(p.footprint)p.footprint=converterPlacement(p.footprint as ReactNode)
 return cloneElement(node as ReactElement<Props>,p,...Children.toArray(node.props.children).map(converterPlacement))
}
