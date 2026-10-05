import {Fragment} from "react"
import {TYPE_C_31_M_12} from "../../imports/TYPE_C_31_M_12"
import {USBLC6_2SC6} from "../../imports/USBLC6_2SC6/USBLC6_2SC6"
import {A_0603WAF5101T5E} from "../../imports/A_0603WAF5101T5E"
import {A_0603WAF1201T5E} from "../../imports/A_0603WAF1201T5E"
import {BZT52B5V1} from "../../imports/BZT52B5V1"
import {CL05B104KO5NNNC} from "../../imports/CL05B104KO5NNNC"
import {HostPins} from "./Boot"
import {cpuSignalPin} from "./HostSignals"
import {ddrVia} from "./FourLayerDdrConstraints"

type UsbPathPoint={x:number,y:number,via?:boolean,fromLayer?:"top"|"bottom",toLayer?:"top"|"bottom"}
export type UsbRouteLayout={paths:Record<string,UsbPathPoint[]>,traces:Array<{name:string,from:string,to:string,width:number,points:UsbPathPoint[]}>,
  groundVias:Array<{name:string,x:number,y:number,from:string}>,powerVias:Array<{name:string,x:number,y:number}>}

// Device-only USB0. SPRABN2A section2.12: ID open, no data-series
// resistors/capacitors/test points. The same receptacle feeds TPS65217 USB.
// Placement is temporary on the routing fixture, not a measured shell port.
// VBUS RC/clamp follows TI Starter Kit R134/C18/D6 topology, with a
// narrower 5.0..5.2V @5mA zener. Temperature/transient limits, USB inrush,
// attach/suspend current policy and controlled 90-ohm geometry are pending.
export const usbDeviceNoConnect=["USB0_ID","USB0_CE","USB0_DRVVBUS",
  "USB1_ID","USB1_CE","USB1_DRVVBUS","USB1_VBUS","USB1_DP","USB1_DM"].map(cpuSignalPin)

export const UsbCDevice=({layout}:{layout?:UsbRouteLayout}={})=> <>
  <autoroutingphase name="USB0_DEVICE_DATA" phaseIndex={6} autorouter="auto_local"/>
  <net name="USB0_DP" routingPhaseIndex={6}/>
  <net name="USB0_DM" routingPhaseIndex={6}/>
  <TYPE_C_31_M_12 name="J_USB" pcbX={0} pcbY={55} pcbRotation={180}
    noConnect={["pin5","pin11"]} schX={75} schY={-10}/>
  <HostPins name="J_USB" pins={{pin1:"GND",pin2:"GND",pin3:"GND",pin4:"GND",
    pin13:"GND",pin14:"GND",pin15:"USB_5V",pin16:"USB_5V",pin6:"USB_CC1",pin12:"USB_CC2"}}/>
  {[{name:"R_USB_CC1",x:6,net:"USB_CC1"},{name:"R_USB_CC2",x:-6,net:"USB_CC2"}].map(r=>
    <Fragment key={r.name}><A_0603WAF5101T5E name={r.name} pcbX={r.x} pcbY={52} pcbRotation={90}/>
      <HostPins name={r.name} pins={{pin1:r.net,pin2:"GND"}}/></Fragment>)}
  <USBLC6_2SC6 name="U_USB_ESD" pcbX={0} pcbY={48} schX={85} schY={-10}
    pinAttributes={{pin1:{isPassive:true},pin2:{requiresGround:true,mustBeConnected:true},pin3:{isPassive:true},
      pin4:{isPassive:true},pin5:{isPassive:true,requiresPower:true,mustBeConnected:true,shouldHaveDecouplingCapacitor:true,
        recommendedDecouplingCapacitorCapacitance:"100nF"},pin6:{isPassive:true}}}/>
  <HostPins name="U_USB_ESD" pins={{pin2:"GND",pin5:"USB_5V"}}/>
  <CL05B104KO5NNNC name="C_USB_ESD" pcbX={3} pcbY={49.2}/>
  <HostPins name="C_USB_ESD" pins={{pin1:"USB_5V",pin2:"GND"}}/>
  <trace name="USB0_DP" from={`U_SOC.${cpuSignalPin("USB0_DP")}`} to="U_USB_ESD.pin3"
    thickness={.15} routingPhaseIndex={6} pcbPath={layout?.paths.USB0_DP}/>
  <trace name="USB0_DM" from={`U_SOC.${cpuSignalPin("USB0_DM")}`} to="U_USB_ESD.pin1"
    thickness={.15} routingPhaseIndex={6} pcbPath={layout?.paths.USB0_DM}/>
  {[["J_USB.pin8","USB0_DP"],["J_USB.pin10","USB0_DP"],["U_USB_ESD.pin3","USB0_DP"],["U_USB_ESD.pin4","USB0_DP"],
    ["J_USB.pin7","USB0_DM"],["J_USB.pin9","USB0_DM"],["U_USB_ESD.pin1","USB0_DM"],["U_USB_ESD.pin6","USB0_DM"]].map(([from,net])=>
    <trace key={from} from={from} to={`net.${net}`} thickness={.15} routingPhaseIndex={6}/>)}
  <bus name="USB0_DATA" connections={["USB0_DP","USB0_DM"]} pcbAllowedLayers={["top","bottom"]} pcbTraceWidth={.15}/>
  <differentialpair name="USB0_PAIR" positiveConnection="USB0_DP" negativeConnection="USB0_DM" pcbTraceGap={.15} maxLengthSkew={.127}/>
  <A_0603WAF1201T5E name="R_USB_VBUS_SENSE" pcbX={11} pcbY={11}/>
  <HostPins name="R_USB_VBUS_SENSE" pins={{pin1:"USB_5V",pin2:"USB0_VBUS_SENSE"}}/>
  <CL05B104KO5NNNC name="C_USB_VBUS_SENSE" pcbX={9} pcbY={6}/>
  <HostPins name="C_USB_VBUS_SENSE" pins={{pin1:"USB0_VBUS_SENSE",pin2:"GND"}}/>
  <BZT52B5V1 name="D_USB_VBUS_SENSE" pcbX={12} pcbY={8}/>
  <HostPins name="D_USB_VBUS_SENSE" pins={{pin1:"USB0_VBUS_SENSE",pin2:"GND"}}/>
  <trace from={`U_SOC.${cpuSignalPin("USB0_VBUS")}`} to="net.USB0_VBUS_SENSE" thickness={.15} routingPhaseIndex={5}/>
  {layout?.groundVias.map(v=><Fragment key={v.name}><via name={v.name} pcbX={v.x} pcbY={v.y} fromLayer="top" toLayer="bottom"
    outerDiameter={ddrVia.land} holeDiameter={ddrVia.drill} tented="top_and_bottom_tented" connectsTo="net.GND"/></Fragment>)}
  {layout?.powerVias.map(v=><Fragment key={v.name}><via name={v.name} pcbX={v.x} pcbY={v.y} fromLayer="top" toLayer="bottom"
    outerDiameter={ddrVia.land} holeDiameter={ddrVia.drill} tented="top_and_bottom_tented" connectsTo="net.USB_5V"/></Fragment>)}
  {layout?.traces.map(t=><trace key={t.name} name={t.name} from={t.from} to={t.to} thickness={t.width}
    routingPhaseIndex={t.name.includes("CC")?5:6} pcbPath={t.points}/>)}
</>
