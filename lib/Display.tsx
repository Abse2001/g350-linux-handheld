import { Fragment } from "react"
import { FPC_05F_18PH20 } from "../imports/FPC_05F_18PH20"
import { AP2112K_3_3TRG1 } from "../imports/AP2112K_3_3TRG1"
import { Connections } from "./Connections"

// Waveshare 3.5inch Capacitive Touch LCD, host connector L2, manufacturer schematic.
// Supply VCC at 3.3V so all host-side logic and I2C pull-ups remain Pi-compatible.
// Pin 10 holds the unused display-module microSD chip-select inactive.
export function Display() {
  return <Fragment>
    <net name="V_LCD3V3" isPowerNet routingPhaseIndex={2}/>
    <FPC_05F_18PH20 name="J_LCD" pcbX={-37} pcbY={20} pcbRotation={-90} layer="bottom"
      schX={-15} schY={14} schSectionName="display"
      pinAttributes={{pin1:{requiresPower:true,requiresVoltage:"3.3V"},pin2:{},pin3:{requiresGround:true},
        pin4:{},pin5:{},pin6:{},pin7:{},pin8:{},pin9:{},pin10:{},pin11:{doNotConnect:true},
        pin12:{},pin13:{},pin14:{},pin15:{},pin16:{doNotConnect:true},pin17:{doNotConnect:true},
        pin18:{doNotConnect:true},pin19:{requiresGround:true},pin20:{requiresGround:true}}}/>
    <Connections name="J_LCD" connections={{
      pin1:"net.V_LCD3V3",pin2:"net.LCD_BL",pin3:"net.GND",pin4:"net.SPI_SCLK",
      pin5:"net.SPI_MOSI",pin6:"net.SPI_MISO",pin7:"net.LCD_DC",pin8:"net.LCD_RESET",
      pin9:"net.LCD_CS",pin10:"net.V_LCD3V3",pin12:"net.TOUCH_RESET",pin13:"net.SCL",
      pin14:"net.SDA",pin15:"net.TOUCH_IRQ",pin19:"net.GND",pin20:"net.GND",
    }}/>
    <AP2112K_3_3TRG1 name="U_LCD_PWR" pcbX={-35} pcbY={0} layer="bottom"
      schX={-6} schY={14} schSectionName="display"
      pinAttributes={{pin1:{requiresPower:true,requiresVoltage:"5V"},pin2:{requiresGround:true},pin3:{},
        pin4:{doNotConnect:true},pin5:{providesPower:true,providesVoltage:"3.3V"},
        VIN:{},GND:{},EN:{},NC:{},VOUT:{}}}/>
    <Connections name="U_LCD_PWR" connections={{pin1:"net.V5V",pin2:"net.GND",
      pin3:"net.V5V",pin5:"net.V_LCD3V3"}}/>
    <capacitor name="C_LCD_IN" capacitance="1uF" footprint="0603" layer="bottom"
      pcbX={-39} pcbY={-3} schX={-10} schY={18} schSectionName="display"
      supplierPartNumbers={{jlcpcb:["C15849"]}}/>
    <Connections name="C_LCD_IN" connections={{pin1:"net.V5V",pin2:"net.GND"}}/>
    <capacitor name="C_LCD_OUT" capacitance="1uF" footprint="0603" layer="bottom"
      pcbX={-39} pcbY={3} schX={-2} schY={18} schSectionName="display"
      supplierPartNumbers={{jlcpcb:["C15849"]}}/>
    <Connections name="C_LCD_OUT" connections={{pin1:"net.V_LCD3V3",pin2:"net.GND"}}/>
  </Fragment>
}
