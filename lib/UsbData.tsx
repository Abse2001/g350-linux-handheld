import { Fragment } from "react"
import { USBLC6_2SC6 } from "../imports/USBLC6_2SC6/USBLC6_2SC6"
import { Connections } from "./Connections"
import "./ThroughSignalVia"

// One external USB-C socket supplies the charger and the Pi's USB-device data.
// The internal micro-B pigtail carries D+, D- and GND only: never bridge USB
// VBUS to the Pi's boosted 5 V supply. The Pi is powered through J8.
export function UsbData() {
  return <Fragment>
    <net name="USB_DP" routingPhaseIndex={2}/>
    <net name="USB_DN" routingPhaseIndex={2}/>
    <net name="USB_EN1" routingPhaseIndex={0}/>
    <net name="USB_EN2" routingPhaseIndex={0}/>
    <USBLC6_2SC6 name="U_USB_ESD" pcbX={33} pcbY={50.5} pcbRotation={90}
      schX={94} schY={28} schSectionName="power"
      pinAttributes={{pin1:{},pin2:{requiresGround:true},pin3:{},pin4:{},
        pin5:{requiresPower:true,requiresVoltage:"5V"},pin6:{}}}/>
    <Connections name="U_USB_ESD" connections={{pin1:"net.USB_DN",pin6:"net.USB_DN",
      pin3:"net.USB_DP",pin4:"net.USB_DP",pin2:"net.GND",pin5:"net.USB_5V"}}/>
    <Connections name="J_USB" connections={{DP1:"net.USB_DP",DP2:"net.USB_DP",
      DN1:"net.USB_DN",DN2:"net.USB_DN"}}/>
    <capacitor name="C_USB_ESD" capacitance="100nF" footprint="0603"
      pcbX={29} pcbY={48} schX={104} schY={2} schRotation={-90}
      schSectionName="power" maxDecouplingTraceLength={6}
      supplierPartNumbers={{jlcpcb:["C14663"]}}/>
    <Connections name="C_USB_ESD" connections={{pin1:"net.USB_5V",pin2:"net.GND"}}/>
    <pinheader name="J_USB_LINK" pinCount={3} pitch={2.54} gender="male"
      pcbX={44.5} pcbY={51.5} layer="top"
      schX={105} schY={28} schSectionName="power"
      manufacturerPartNumber="1x3 2.54mm Pi micro-B data-only pigtail"
      pcbPinLabels={{pin1:"D-",pin2:"D+",pin3:"GND"}}
      pinAttributes={{pin1:{},pin2:{},pin3:{requiresGround:true}}}
      cadModel={{stepUrl:"https://modelcdn.tscircuit.com/jscad_models/pinrow3_p2.54_nopinlabels.step",
        pcbRotationOffset:90}}
      footprint={<footprint insertionDirection="from_above">
        {[1,2,3].map(pin=><Fragment key={pin}>
          <platedhole shape="circle" pcbX={0} pcbY={(pin-2)*2.54}
            holeDiameter={1} outerDiameter={1.8} portHints={[`pin${pin}`]}/>
        </Fragment>)}
        <silkscreenrect width={2.5} height={7.5} strokeWidth={0.15}/>
      </footprint>}/>
    <Connections name="J_USB_LINK" connections={{pin1:"net.USB_DN",pin2:"net.USB_DP",pin3:"net.GND"}}/>
    {[
      {name:"SIGNAL_USB_DP_A",x:25.249936,y:55.75},
      {name:"SIGNAL_USB_DP_B",x:24.249938,y:55.75},
      {name:"SIGNAL_USB_DP_ESD",x:30.5,y:51.44996},
    ].map(v=><Fragment key={v.name}><via name={v.name} pcbX={v.x} pcbY={v.y}
      fromLayer="top" toLayer="bottom" holeDiameter={0.3} outerDiameter={0.65}
      connectsTo="net.USB_DP"/></Fragment>)}
    <trace from="J_USB.DP1" to="SIGNAL_USB_DP_A.top" thickness={0.15} routingPhaseIndex={2}
      pcbPath={["J_USB.DP1","SIGNAL_USB_DP_A.top"]}/>
    <trace from="J_USB.DP2" to="SIGNAL_USB_DP_B.top" thickness={0.15} routingPhaseIndex={2}
      pcbPath={["J_USB.DP2","SIGNAL_USB_DP_B.top"]}/>
    <trace from="SIGNAL_USB_DP_A.inner1" to="SIGNAL_USB_DP_B.inner1" thickness={0.2} routingPhaseIndex={2}
      pcbPath={["SIGNAL_USB_DP_A.inner1","SIGNAL_USB_DP_B.inner1"]}/>
    <trace from="SIGNAL_USB_DP_A.inner1" to="SIGNAL_USB_DP_ESD.inner1" thickness={0.2} routingPhaseIndex={2}
      pcbPath={["SIGNAL_USB_DP_A.inner1","SIGNAL_USB_DP_ESD.inner1"]}/>
    <trace from="SIGNAL_USB_DP_ESD.top" to="U_USB_ESD.pin4" thickness={0.2} routingPhaseIndex={2}
      pcbPath={["SIGNAL_USB_DP_ESD.top","U_USB_ESD.pin4"]}/>
    <trace from="U_USB_ESD.pin6" to="U_USB_ESD.pin1" thickness={0.2} routingPhaseIndex={2}
      pcbPath={["U_USB_ESD.pin6","U_USB_ESD.pin1"]}/>
    <trace from="U_USB_ESD.pin4" to="U_USB_ESD.pin3" thickness={0.2} routingPhaseIndex={2}
      pcbPath={["U_USB_ESD.pin4","U_USB_ESD.pin3"]}/>
    {[
      {name:"SIGNAL_USB_DN_A",x:24.750064,y:52.6},
      {name:"SIGNAL_USB_DN_B",x:25.750062,y:52.6},
      {name:"SIGNAL_USB_DN_ESD",x:30.5,y:49.55004},
    ].map(v=><Fragment key={v.name}><via name={v.name} pcbX={v.x} pcbY={v.y}
      fromLayer="top" toLayer="bottom" holeDiameter={0.3} outerDiameter={0.65}
      connectsTo="net.USB_DN"/></Fragment>)}
    <trace from="J_USB.DN1" to="SIGNAL_USB_DN_A.top" thickness={0.15} routingPhaseIndex={2}
      pcbPath={["J_USB.DN1","SIGNAL_USB_DN_A.top"]}/>
    <trace from="J_USB.DN2" to="SIGNAL_USB_DN_B.top" thickness={0.15} routingPhaseIndex={2}
      pcbPath={["J_USB.DN2","SIGNAL_USB_DN_B.top"]}/>
    <trace from="SIGNAL_USB_DN_A.inner1" to="SIGNAL_USB_DN_B.inner1" thickness={0.2} routingPhaseIndex={2}
      pcbPath={["SIGNAL_USB_DN_A.inner1","SIGNAL_USB_DN_B.inner1"]}/>
    <trace from="SIGNAL_USB_DN_B.inner1" to="SIGNAL_USB_DN_ESD.inner1" thickness={0.2} routingPhaseIndex={2}
      pcbPath={["SIGNAL_USB_DN_B.inner1","SIGNAL_USB_DN_ESD.inner1"]}/>
    <trace from="SIGNAL_USB_DN_ESD.top" to="U_USB_ESD.pin6" thickness={0.2} routingPhaseIndex={2}
      pcbPath={["SIGNAL_USB_DN_ESD.top","U_USB_ESD.pin6"]}/>
    {[
      {name:"SIGNAL_USB_DN_OUTPUT",y:49.55004,esd:1,link:1,net:"USB_DN"},
      {name:"SIGNAL_USB_DP_OUTPUT",y:51.44996,esd:3,link:2,net:"USB_DP"},
    ].map(v=><Fragment key={v.name}>
      <via name={v.name} pcbX={35.2} pcbY={v.y} fromLayer="top" toLayer="bottom"
        holeDiameter={0.3} outerDiameter={0.65} connectsTo={`net.${v.net}`}/>
      <trace from={`U_USB_ESD.pin${v.esd}`} to={`${v.name}.top`} thickness={0.2} routingPhaseIndex={2}
        pcbPath={[`U_USB_ESD.pin${v.esd}`,`${v.name}.top`]}/>
      <trace from={`${v.name}.inner1`} to={`J_USB_LINK.pin${v.link}`} thickness={0.2} routingPhaseIndex={2}
        pcbPath={[`${v.name}.inner1`,`J_USB_LINK.pin${v.link}`]}/>
    </Fragment>)}
    {[
      {name:"SIGNAL_USB_VBUS_LEFT",x:22.5998397,y:52.3,pin:"VBUS1"},
      {name:"SIGNAL_USB_VBUS_RIGHT",x:27.3999571,y:52.3,pin:"VBUS2"},
    ].map(v=><Fragment key={v.name}><via name={v.name} pcbX={v.x} pcbY={v.y}
      fromLayer="top" toLayer="bottom" holeDiameter={0.3} outerDiameter={0.65}
      connectsTo="net.USB_5V"/>
      <trace from={`J_USB.${v.pin}`} to={`${v.name}.top`} thickness={0.5} routingPhaseIndex={1}
        pcbPath={[`J_USB.${v.pin}`,`${v.name}.top`]}/>
    </Fragment>)}
    <trace from="SIGNAL_USB_VBUS_LEFT.inner2" to="SIGNAL_USB_VBUS_RIGHT.inner2" thickness={0.5} routingPhaseIndex={1}
      pcbPathRelativeTo="SIGNAL_USB_VBUS_LEFT.inner2"
      pcbPath={["SIGNAL_USB_VBUS_LEFT.inner2",{x:0,y:-.7},{x:4.8001174,y:-.7},"SIGNAL_USB_VBUS_RIGHT.inner2"]}/>
    <via name="USB_ESD_VBUS" pcbX={30.55} pcbY={50.5} fromLayer="top" toLayer="bottom"
      holeDiameter={0.3} outerDiameter={0.65} connectsTo="net.USB_5V"/>
    <via name="USB_ESD_CAP" pcbX={28.175} pcbY={49} fromLayer="top" toLayer="bottom"
      holeDiameter={0.3} outerDiameter={0.65} connectsTo="net.USB_5V"/>
    <trace from="SIGNAL_USB_VBUS_RIGHT.bottom" to="USB_ESD_VBUS.bottom" thickness={0.2} routingPhaseIndex={1}
      pcbPath={["SIGNAL_USB_VBUS_RIGHT.bottom","USB_ESD_VBUS.bottom"]}/>
    <trace from="U_USB_ESD.pin5" to="USB_ESD_VBUS.top" thickness={0.2} routingPhaseIndex={1}
      pcbPath={["U_USB_ESD.pin5","USB_ESD_VBUS.top"]}/>
    <trace from="USB_ESD_VBUS.bottom" to="USB_ESD_CAP.bottom" thickness={0.2} routingPhaseIndex={1}
      pcbPath={["USB_ESD_VBUS.bottom","USB_ESD_CAP.bottom"]}/>
    <trace from="C_USB_ESD.pin1" to="USB_ESD_CAP.top" thickness={0.2} routingPhaseIndex={1}
      pcbPath={["C_USB_ESD.pin1","USB_ESD_CAP.top"]}/>
    <via name="USB_ESD_GND" pcbX={31.3} pcbY={47.3} fromLayer="top" toLayer="bottom"
      holeDiameter={0.3} outerDiameter={0.65} connectsTo="net.GND"/>
    <trace from="C_USB_ESD.pin2" to="USB_ESD_GND.top" thickness={0.2} routingPhaseIndex={1}
      pcbPath={["C_USB_ESD.pin2","USB_ESD_GND.top"]}/>
    {/* External pull-downs establish USB100 before Linux takes control. */}
    {[{name:"R_USB_EN1",x:8,y:19,net:"USB_EN1"},
      {name:"R_USB_EN2",x:8,y:16,net:"USB_EN2"}].map(r=><Fragment key={r.name}>
      <resistor name={r.name} resistance="100k" footprint="0603"
        pcbX={r.x} pcbY={r.y} schX={103} schY={r.net==="USB_EN1"?-20:-25}
        schRotation={-90} schSectionName="power" supplierPartNumbers={{jlcpcb:["C25803"]}}/>
      <Connections name={r.name} connections={{pin1:`net.${r.net}`,pin2:"net.GND"}}/>
    </Fragment>)}
    <silkscreentext pcbSx={{"& silkscreentext":{visibility:"visible"}}}
      text="USB-C" pcbX={25} pcbY={60} fontSize={1}/>
    <silkscreentext pcbSx={{"& silkscreentext":{visibility:"visible"}}}
      text="USB LINK" pcbX={43} pcbY={43.7} fontSize={1}/>
  </Fragment>
}
