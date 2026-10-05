import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import placements from './pmic-placements.json'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
export function pmicPlacement(node:ReactNode,owner?:string):ReactNode {
 if(!isValidElement<Props>(node))return node
 const p={...node.props}
 const component=p.name??owner
 const move=(placements as Record<string,{x:number;y:number;rotation:number;layer:string}>)[p.name??'']
 if(move){p.pcbX=move.x;p.pcbY=move.y;p.pcbRotation=move.rotation;p.layer=move.layer}
 // Core0.0.2085 adds native polygon paste. Suppress the two inductor
 // primaries already served by four explicit inscribed apertures and the
 // four unqualified USB anchor polygons. A negative margin fully erodes
 // only their paste contours; exposed mask and copper remain unchanged.
 if(node.type==='smtpad'&&p.shape==='polygon'&&['L_LCD_BL','J_USB'].includes(component??''))p.solderPasteMargin=-10
 if(p.footprint)p.footprint=pmicPlacement(p.footprint as ReactNode,component)
 return cloneElement(node as ReactElement<Props>,p,...Children.toArray(node.props.children).map(n=>pmicPlacement(n,component)))
}
