import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from "react"
import {cpuPowerConnections} from "../PowerNetworks"

// Applied only to the already evaluated placement tree. Preserve every old
// routing entry and all other supplies. SPRS717L Table4-2 ZCZ VDDSHV2 powers
// GPMC_AD8..15 (LCD_DATA23..16); its existing bank bypasses follow the rail.
export const rgb888RailOverridePorts=[
  ...cpuPowerConnections.filter(p=>p.function==="VDDSHV2").map(p=>`U_SOC.${p.pin}`),
  "C_HV2_BULK.pin1","C_HV2_1.pin1","C_HV2_2.pin1",
]
export function rgb888Power(node:ReactNode):ReactNode {
  if(!isValidElement<Record<string,unknown>&{children?:ReactNode}>(node))return node
  const p={...node.props}
  if(node.type==="trace"&&rgb888RailOverridePorts.includes(String(p.from))) {
    if(p.to!=="net.ANALOG_1V8")throw new Error(`Unexpected VDDSHV2 supply trace ${p.from} -> ${p.to}`)
    p.to="net.IO_3V3"
  }
  return cloneElement(node as ReactElement<typeof p>,p,...Children.toArray(node.props.children).map(rgb888Power))
}
