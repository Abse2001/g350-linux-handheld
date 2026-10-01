import { Fragment } from "react"

// Assign every automatically generated connection to a phase explicitly.
// Signals first, broad power/ground connections last.
const rails = new Set(["GND","V5V","V3V3","USB_5V","VBAT","VSYS","BOOST_SW"])
const controls = new Set(["SDA","SCL","CHARGING_N","BAT_ALERT_N","USB_GOOD_N"])
export function Connections({name,connections}: {name:string,connections:Record<string,string>}) {
  return <Fragment>{Object.entries(connections).map(([pin,target])=> {
    const net = target.startsWith("net.")?target.slice(4):""
    const phase = rails.has(net)?2:controls.has(net)?0:1
    return <Fragment key={pin}><trace from={`${name}.${pin}`} to={target}
      thickness={0.2} routingPhaseIndex={phase}/></Fragment>
  })}</Fragment>
}
