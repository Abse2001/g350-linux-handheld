import {Fragment} from "react"
import escapes from "./ram-reference-escapes.json"
import {copperLayers,ddrVia} from "./FourLayerDdrConstraints"

// Native bus_lanes bootstrap, attempt 34: reserve all 44 signal dogbones
// before assigning the RAM's 18 supply and 21 ground escapes. Explicit
// authored copper connects actual package ports to real full-depth vias.
// The source remains incomplete until the DDR channel and CPU power route.
export type RamReferenceEscapeLayout=typeof escapes
export const RamReferenceEscapes=({layout=escapes,rotatedD2PowerBridge=false,portLayer="top"}:{layout?:RamReferenceEscapeLayout,rotatedD2PowerBridge?:boolean,portLayer?:"top"|"bottom"}={})=> <>
  {layout.map(t=>{
    const m=t.localEscapeMetadata,via=t.route.find(p=>p.route_type==="via")!
    const name=`V_RAM_${m.ball}_REFERENCE`
    return <Fragment key={name}>
      <via name={name} pcbX={via.x} pcbY={via.y}
        fromLayer="top" toLayer="bottom" layers={[...copperLayers]}
        outerDiameter={ddrVia.land} holeDiameter={ddrVia.drill}
        tented="top_and_bottom_tented" connectsTo={`net.${m.net}`}/>
      <trace name={`RAM_REFERENCE_${m.ball}`} from={`U_RAM.${m.pin}`}
        to={`.${name} > port.${portLayer}`} pcbPath={[]} thickness={.1016} routingPhaseIndex={5}/>
    </Fragment>
  })}
  {rotatedD2PowerBridge&&<trace name="RAM_D2_B2_INNER2_POWER_BRIDGE"
    from=".V_RAM_D2_REFERENCE > port.inner2" to=".V_RAM_B2_REFERENCE > port.inner2"
    pcbPath={[{x:.4,y:-.4},{x:.4,y:-1.2}]} thickness={.1016} routingPhaseIndex={5}/>}
</>
