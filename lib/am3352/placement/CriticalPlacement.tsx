import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import placements from './cpu-bypass-placements.json'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}

// Editable placement variant. No frozen copper is moved or reused. The
// explicit table is independently checked against the rendered pad geometry.
export function criticalPlacement(node:ReactNode):ReactNode {
 if(!isValidElement<Props>(node))return node
 const p={...node.props}
 const move=(placements as Record<string,{x:number;y:number;rotation:number;layer:string}>)[p.name??'']
 if(move){p.pcbX=move.x;p.pcbY=move.y;p.pcbRotation=move.rotation;p.layer=move.layer}
 return cloneElement(node as ReactElement<Props>,p,...Children.toArray(node.props.children).map(criticalPlacement))
}
