import {Fragment} from "react"
import loops from "./ram-bypass-loop-layout.json"
import {ddrVia} from "./FourLayerDdrConstraints"

// Short manual capacitor-to-plane traces complement the native package
// escapes. Both terminals get separate through-vias to the reviewed planes.
// The right-side -28mm row exits 0.4mm upward to clear the ZQ resistor
// while keeping at least 0.508mm between adjacent 0.254mm drill centres.
export const RamBypassLoops=({ramLayer="top"}:{ramLayer?:"top"|"bottom"}={})=> <>
  {loops.map(loop=><Fragment key={loop.capacitor}>
    {(["power","ground"] as const).map((terminal,index)=>{
      const p=loop[terminal],name=`V_${loop.capacitor}_${terminal.toUpperCase()}`
      return <Fragment key={name}>
        <via name={name} pcbX={p.x} pcbY={p.y}
          fromLayer="top" toLayer="bottom" outerDiameter={ddrVia.land} holeDiameter={ddrVia.drill}
          connectsTo={`net.${terminal==="power"?"DDR_1V5":"GND"}`} tented="top_and_bottom_tented"/>
        <trace name={`RAM_BYPASS_${loop.capacitor}_${terminal.toUpperCase()}`}
          from={`${loop.capacitor}.pin${index+1}`} to={`.${name} > port.${ramLayer==="bottom"&&loop.side==="bottom"?"top":loop.side}`}
          pcbPath={[]} thickness={.2} routingPhaseIndex={5}/>
      </Fragment>
    })}
  </Fragment>)}
</>
