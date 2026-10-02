import { Fragment } from "react"
import "./ThroughSignalVia"
import { FPC_05F_18PH20 } from "../imports/FPC_05F_18PH20"
import { AP2112K_3_3TRG1 } from "../imports/AP2112K_3_3TRG1"
import { Connections } from "./Connections"

// Waveshare 3.5inch Capacitive Touch LCD, host connector L2, manufacturer schematic.
// Supply VCC at 3.3V so all host-side logic and I2C pull-ups remain Pi-compatible.
// Pin 10 holds the unused display-module microSD chip-select inactive.
export function Display() {
  return <Fragment>
    <net name="V_LCD3V3" isPowerNet routingPhaseIndex={1}/>
    <FPC_05F_18PH20 name="J_LCD" pcbX={-37} pcbY={20} pcbRotation={-90} layer="bottom"
      schX={-15} schY={14} schSectionName="display"
      pinAttributes={{pin1:{requiresPower:true,requiresVoltage:"3.3V"},pin2:{},pin3:{requiresGround:true},
        pin4:{},pin5:{},pin6:{},pin7:{},pin8:{},pin9:{},pin10:{},pin11:{doNotConnect:true},
        pin12:{doNotConnect:true},pin13:{},pin14:{},pin15:{},pin16:{doNotConnect:true},pin17:{doNotConnect:true},
        pin18:{doNotConnect:true},pin19:{requiresGround:true},pin20:{requiresGround:true}}}/>
    <Connections name="J_LCD" connections={{
      pin1:"net.V_LCD3V3",pin2:"net.LCD_BL",pin3:"net.GND",pin4:"net.SPI_SCLK",
      pin5:"net.SPI_MOSI",pin6:"net.SPI_MISO",pin7:"net.LCD_DC",pin8:"net.LCD_RESET",
      pin9:"net.LCD_CS",pin10:"net.V_LCD3V3",pin13:"net.SCL",
      pin14:"net.SDA",pin15:"net.TOUCH_IRQ",pin19:"net.GND",pin20:"net.GND",
    }}/>
    {/* Short bottom-side FPC escapes feed inner-layer SPI/control paths. All
        four named vias are full-depth; this group puts MISO on inner2. */}
    {[
      {pin:4,host:23,net:"SPI_SCLK",layer:"inner1",path:[[-34.7,17.25],[-34,16.6],[-32.3,16.6],[-32.3,18.1],[-33.8,19.3],[-33.8,29.5],[-5.1,29.5],[-5.1,35]]},
      {pin:5,host:19,net:"SPI_MOSI",layer:"inner1",path:[[-34.3,17.7500426],[-33.9,17.35],[-31.4,17.25],[-31.4,29],[0,29],[0,35]]},
      {pin:6,host:21,net:"SPI_MISO",layer:"inner2",path:[[-34.3,18.2499146],[-33.9,18.2499146],[-33.65,17.95],[-33.65,30.5],[-2.5,30.5],[-2.5,35]]},
      {pin:7,host:15,net:"LCD_DC",layer:"inner1",path:[[-34.3,18.7500406],[-33.9,18.7500406],[-30.4,17.7],[-30.4,28.5],[5.1,28.5],[5.1,35]]},
    ].map(signal=>{
      const name=`SIGNAL_${signal.net}`
      const [vx,vy]=signal.path[2]
      const points=signal.path.map(([x,y])=>({x:x-vx,y:y-vy}))
      return <Fragment key={signal.pin}>
        <via name={name} pcbX={vx} pcbY={vy} fromLayer="bottom" toLayer="top"
          holeDiameter={0.3} outerDiameter={0.65} connectsTo={`net.${signal.net}`}/>
        <trace from={`${name}.bottom`} to={`J_LCD.pin${signal.pin}`} thickness={0.15}
          routingPhaseIndex={2} pcbPathRelativeTo={`${name}.bottom`}
          pcbPath={[`${name}.bottom`,...points.slice(0,2).reverse(),`J_LCD.pin${signal.pin}`]}/>
        <trace from={`${name}.${signal.layer}`} to={`J_PI.pin${signal.host}`} thickness={0.15}
          routingPhaseIndex={2} pcbPathRelativeTo={`${name}.${signal.layer}`}
          pcbPath={[`${name}.${signal.layer}`,...points.slice(3),`J_PI.pin${signal.host}`]}/>
      </Fragment>
    })}
    {[
      {pin:2,host:16,net:"LCD_BL",x:-34,y:16,escape:[[-34.7,16.2499186]],
        path:[[-35,16],[-35,41.6],[5.08,41.6],[5.08,34.99]]},
      {pin:15,host:22,net:"TOUCH_IRQ",x:-33,y:23.7,escape:[[-34.4,22.7499386]],
        path:[[-34.2,24.85],[-34.2,41],[0,41],[0,34.99]]},
    ].map(c=>{
      const name=`SIGNAL_${c.net}`
      return <Fragment key={c.net}>
        <via name={name} pcbX={c.x} pcbY={c.y} fromLayer="bottom" toLayer="top"
          holeDiameter={0.3} outerDiameter={0.65} connectsTo={`net.${c.net}`}/>
        <trace from={`${name}.bottom`} to={`J_LCD.pin${c.pin}`} thickness={0.15} routingPhaseIndex={2}
          pcbPathRelativeTo={`${name}.bottom`}
          pcbPath={[`${name}.bottom`,...c.escape.map(([x,y])=>({x:x-c.x,y:y-c.y})),`J_LCD.pin${c.pin}`]}/>
        <trace from={`${name}.top`} to={`J_PI.pin${c.host}`} thickness={0.15} routingPhaseIndex={2}
          pcbPathRelativeTo={`${name}.top`}
          pcbPath={[`${name}.top`,...c.path.map(([x,y])=>({x:x-c.x,y:y-c.y})),`J_PI.pin${c.host}`]}/>
      </Fragment>
    })}
    <via name="LCD_CS_ESCAPE" pcbX={-32.15} pcbY={19.95} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="bottom" toLayer="top" connectsTo="net.LCD_CS"/>
    <trace from="LCD_CS_ESCAPE.bottom" to="J_LCD.pin9" thickness={0.15} routingPhaseIndex={2}
      pcbPathRelativeTo="LCD_CS_ESCAPE.bottom"
      pcbPath={["LCD_CS_ESCAPE.bottom",{x:-0.35,y:-0.2000881},"J_LCD.pin9"]}/>
    <trace from="LCD_CS_ESCAPE.top" to="J_PI.pin24" thickness={0.15} routingPhaseIndex={2}
      pcbPathRelativeTo="LCD_CS_ESCAPE.top"
      pcbPath={["LCD_CS_ESCAPE.top",{x:-0.2,y:1.05},{x:-0.2,y:19.55},
        {x:27.07,y:19.55},{x:27.07,y:13.78},"J_PI.pin24"]}/>
    {/* Cross the charger-status trace between the I2S route and GPIO rows. */}
    <via name="LCD_RESET_BRIDGE0" pcbX={7.62} pcbY={30.85} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="bottom" toLayer="top" connectsTo="net.LCD_RESET"/>
    <via name="LCD_RESET_BRIDGE1" pcbX={7.62} pcbY={32.3} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="top" toLayer="bottom" connectsTo="net.LCD_RESET"/>
    <trace from="LCD_RESET_BRIDGE0.bottom" to="J_LCD.pin8" thickness={0.15} routingPhaseIndex={2}
      pcbPathRelativeTo="LCD_RESET_BRIDGE0.bottom"
      pcbPath={["LCD_RESET_BRIDGE0.bottom",{x:0,y:-4.85},{x:-34.62,y:-6.85},
        {x:-39.12,y:-11.6000874},"J_LCD.pin8"]}/>
    <trace from="LCD_RESET_BRIDGE0.top" to="LCD_RESET_BRIDGE1.top" thickness={0.15} routingPhaseIndex={2}
      pcbPath={["LCD_RESET_BRIDGE0.top","LCD_RESET_BRIDGE1.top"]}/>
    <trace from="LCD_RESET_BRIDGE1.bottom" to="J_PI.pin13" thickness={0.15} routingPhaseIndex={2}
      pcbPathRelativeTo="LCD_RESET_BRIDGE1.bottom"
      pcbPath={["LCD_RESET_BRIDGE1.bottom",{x:0,y:3.97},"J_PI.pin13"]}/>
    <via name="LCD_GND" pcbX={-38} pcbY={16.75} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="bottom" toLayer="top" connectsTo="net.GND"/>
    <trace from="J_LCD.pin3" to="LCD_GND.bottom" thickness={0.15} routingPhaseIndex={1}
      pcbPath={["J_LCD.pin3","LCD_GND.bottom"]}/>
    <AP2112K_3_3TRG1 name="U_LCD_PWR" pcbX={-35} pcbY={0} layer="bottom"
      schX={-6} schY={14} schSectionName="display"
      pinAttributes={{pin1:{requiresPower:true,requiresVoltage:"5V"},pin2:{requiresGround:true},pin3:{},
        pin4:{doNotConnect:true},pin5:{providesPower:true,providesVoltage:"3.3V"},
        VIN:{},GND:{},EN:{},NC:{},VOUT:{}}}/>
    <Connections name="U_LCD_PWR" connections={{pin1:"net.V5V",pin2:"net.GND",
      pin3:"net.V5V",pin5:"net.V_LCD3V3"}}/>
    <capacitor name="C_LCD_IN" capacitance="1uF" footprint="0603" layer="bottom"
      pcbX={-39} pcbY={-3} schX={-34.25} schY={-29.5} schRotation={-90} schSectionName="decoupling"
      maxDecouplingTraceLength={6}
      supplierPartNumbers={{jlcpcb:["C15849"]}}/>
    <trace from="C_LCD_IN.pin1" to="TP_5V.pin1" thickness={0.4} routingPhaseIndex={1} maxLength={200}
      pcbPathRelativeTo="C_LCD_IN.pin1" pcbPath={["C_LCD_IN.pin1",{x:0.825,y:-2.1},
        {x:-4,y:-2.1},{x:-4,y:47},{x:25,y:47},"TP_5V.pin1"]}/>
    <trace from="U_LCD_PWR.VIN" to="C_LCD_IN.pin1" thickness={0.3} routingPhaseIndex={1}
      pcbPathRelativeTo="U_LCD_PWR.VIN" pcbPath={["U_LCD_PWR.VIN",{x:0.949706,y:-3},"C_LCD_IN.pin1"]}/>
    <trace from="U_LCD_PWR.EN" to="C_LCD_IN.pin1" thickness={0.2} routingPhaseIndex={1}
      pcbPathRelativeTo="U_LCD_PWR.EN" pcbPath={["U_LCD_PWR.EN",{x:-0.949706,y:-3},"C_LCD_IN.pin1"]}/>
    <capacitor name="C_LCD_OUT" capacitance="1uF" footprint="0603" layer="bottom"
      pcbX={-39} pcbY={3} schX={-2} schY={18} schRotation={-90} schSectionName="display"
      maxDecouplingTraceLength={6}
      supplierPartNumbers={{jlcpcb:["C15849"]}}/>
    <Connections name="C_LCD_OUT" connections={{pin1:"net.V_LCD3V3",pin2:"net.GND"}}/>
    <trace from="U_LCD_PWR.VOUT" to="C_LCD_OUT.pin1" thickness={0.3} routingPhaseIndex={1}
      pcbPathRelativeTo="U_LCD_PWR.VOUT" pcbPath={["U_LCD_PWR.VOUT",{x:0.949706,y:3},"C_LCD_OUT.pin1"]}/>
    {/* Two manual FPC supply escapes avoid routing a rail across adjacent SPI pads. */}
    <via name="LCD_FEED" pcbX={-36.7} pcbY={4.5} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="bottom" toLayer="top" connectsTo="net.V_LCD3V3"/>
    <via name="LCD_VCC" pcbX={-35.7} pcbY={14.7} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="bottom" toLayer="top" connectsTo="net.V_LCD3V3"/>
    <via name="LCD_SD_CS" pcbX={-33} pcbY={21.2} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="bottom" toLayer="top" connectsTo="net.V_LCD3V3"/>
    <trace from="C_LCD_OUT.pin1" to="LCD_FEED.bottom" thickness={0.3} routingPhaseIndex={1}
      maxLength={25} pcbPath={["C_LCD_OUT.pin1","LCD_FEED.bottom"]}/>
    <trace from="LCD_FEED.top" to="LCD_VCC.top" thickness={0.3} routingPhaseIndex={1}
      pcbPathRelativeTo="LCD_FEED.top" pcbPath={["LCD_FEED.top",{x:3.7,y:3.7},"LCD_VCC.top"]}/>
    <trace from="LCD_VCC.bottom" to="J_LCD.pin1" thickness={0.2} routingPhaseIndex={1}
      pcbPath={["LCD_VCC.bottom","J_LCD.pin1"]}/>
    <trace from="LCD_VCC.top" to="LCD_SD_CS.top" thickness={0.2} routingPhaseIndex={1}
      pcbPathRelativeTo="LCD_VCC.top" pcbPath={["LCD_VCC.top",{x:2.7,y:0},"LCD_SD_CS.top"]}/>
    <trace from="LCD_SD_CS.bottom" to="J_LCD.pin10" thickness={0.15} routingPhaseIndex={1}
      pcbPathRelativeTo="LCD_SD_CS.bottom"
      pcbPath={["LCD_SD_CS.bottom",{x:-1.2,y:-0.9500894},"J_LCD.pin10"]}/>
    {[{name:"LCD_IN_GND",x:-41,y:-3,pin:"C_LCD_IN.pin2"},
      {name:"LCD_OUT_GND",x:-41,y:3,pin:"C_LCD_OUT.pin2"},
      {name:"LCD_LDO_GND",x:-35,y:-0.1,pin:"U_LCD_PWR.GND"}].map(p=><Fragment key={p.name}>
      <via name={p.name} pcbX={p.x} pcbY={p.y} holeDiameter={0.3} outerDiameter={0.65}
        fromLayer="bottom" toLayer="top" connectsTo="net.GND"/>
      <trace from={p.pin} to={`${p.name}.bottom`} thickness={0.2} routingPhaseIndex={1}
        pcbPath={[p.pin,`${p.name}.bottom`]}/>
    </Fragment>)}
  </Fragment>
}
