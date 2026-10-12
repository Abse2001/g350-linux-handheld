import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import TiPlacement from './am3352-g350-ti-top-bottom-ddr-v2-layout.circuit'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}

// One real capacitor-to-reference loop, independently planned against all1161
// fresh pads. This anchors both pours; it does not connect all package supplies.
// No DDR or peripheral signal copper is replayed or autorouted here.
function addReferenceBypass(node:ReactNode):ReactNode{
 if(!isValidElement<Props>(node))return node
 const props={...node.props}
 const children=Children.toArray(node.props.children).map(addReferenceBypass)
 if(node.type==='board'){
  props.title='G350 TI Top/Bottom DDR V4 — first reference bypass; routing and qualification pending'
  props.layers=4;props.thickness=1.6;props.routeRemaining=false
  children.push(
   <via name="V_TI_RAM7_POWER" pcbX={6.65} pcbY={8.55}
    fromLayer="top" toLayer="bottom" outerDiameter={.4572} holeDiameter={.254}
    connectsTo="net.DDR_1V5" tented="top_and_bottom_tented"/>,
   <via name="V_TI_RAM7_GROUND" pcbX={6.45} pcbY={7.95}
    fromLayer="top" toLayer="bottom" outerDiameter={.4572} holeDiameter={.254}
    connectsTo="net.GND" tented="top_and_bottom_tented"/>,
   <trace name="TI_RAM7_POWER_BYPASS" from=".V_TI_RAM7_POWER > port.bottom"
    to="C_DDR_RAM_7.pin1" thickness={.2} pcbPath={[]}/>,
   <trace name="TI_RAM7_GROUND_BYPASS" from=".V_TI_RAM7_GROUND > port.bottom"
    to="C_DDR_RAM_7.pin2" thickness={.2} pcbPath={[{x:-.670116,y:0}]}/>,
  )
 }
 return cloneElement(node as ReactElement<Props>,props,...children)
}

// Use --routing-disabled: only the two declared manual bypass stubs may render.
// All49 DDR connections, full supply/ground connectivity, filled references,
// impedance, timing and manufacturing qualification remain separate checks.
export default()=>addReferenceBypass(TiPlacement())
