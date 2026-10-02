import { Fragment } from "react"
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
    <via name="LCD_VCC" pcbX={-33} pcbY={15.7500466} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="bottom" toLayer="top" connectsTo="net.V_LCD3V3"/>
    <via name="LCD_SD_CS" pcbX={-33} pcbY={20.2499106} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="bottom" toLayer="top" connectsTo="net.V_LCD3V3"/>
    <trace from="C_LCD_OUT.pin1" to="LCD_FEED.bottom" thickness={0.3} routingPhaseIndex={1}
      maxLength={25} pcbPath={["C_LCD_OUT.pin1","LCD_FEED.bottom"]}/>
    <trace from="LCD_FEED.top" to="LCD_VCC.top" thickness={0.3} routingPhaseIndex={1}
      pcbPathRelativeTo="LCD_FEED.top" pcbPath={["LCD_FEED.top",{x:3.7,y:3.7},"LCD_VCC.top"]}/>
    <trace from="LCD_VCC.bottom" to="J_LCD.pin1" thickness={0.2} routingPhaseIndex={1}
      pcbPath={["LCD_VCC.bottom","J_LCD.pin1"]}/>
    <trace from="LCD_VCC.top" to="LCD_SD_CS.top" thickness={0.2} routingPhaseIndex={1}
      pcbPath={["LCD_VCC.top","LCD_SD_CS.top"]}/>
    <trace from="LCD_SD_CS.bottom" to="J_LCD.pin10" thickness={0.15} routingPhaseIndex={1}
      pcbPath={["LCD_SD_CS.bottom","J_LCD.pin10"]}/>
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
