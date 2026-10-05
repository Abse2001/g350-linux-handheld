import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import placements from './ddr-corridor-placements.json'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}

// Translate the RAM circuit together and clear the LCD termination bank from
// the DDR channel. Apply to editable JSX, never to previously routed copper.
export function ddrCorridorPlacement(node:ReactNode):ReactNode {
 if(!isValidElement<Props>(node))return node
 const p={...node.props}
 const move=(placements as Record<string,{x:number;y:number;rotation:number;layer:string}>)[p.name??'']
 if(move){p.pcbX=move.x;p.pcbY=move.y;p.pcbRotation=move.rotation;p.layer=move.layer}
 return cloneElement(node as ReactElement<Props>,p,...Children.toArray(node.props.children).map(ddrCorridorPlacement))
}
