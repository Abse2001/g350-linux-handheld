import { Connections } from "./Connections"
import { Fragment } from "react"
import { MAX98357AETE_T } from "../imports/MAX98357AETE_T"

export function Audio() {
  return <Fragment>
    <Fragment><MAX98357AETE_T name="U_AUDIO" pcbX={17} pcbY={12}
      schX={2} schY={15} schSectionName="audio"
      
    /><Connections name="U_AUDIO" connections={{DIN:"net.I2S_DIN",BCLK:"net.I2S_BCLK",LRCLK:"net.I2S_LRCLK",
        VDD1:"net.V5V",VDD2:"net.V5V",GAIN_SLOT:"net.V5V",
        GND1:"net.GND",GND2:"net.GND",GND3:"net.GND",EP:"net.GND"}}/></Fragment>
    <Fragment><capacitor name="C_AUDIO_HF" capacitance="100nF" footprint="0603"
      supplierPartNumbers={{jlcpcb:["C14663"]}} pcbX={21} pcbY={12.5}
      schX={-36} schY={-28} schRotation={-90} schSectionName="decoupling"
       /><Connections name="C_AUDIO_HF" connections={{pin1:"net.V5V",pin2:"net.GND"}}/></Fragment>
    <Fragment><capacitor name="C_AUDIO_BULK" capacitance="10uF" footprint="0805"
      supplierPartNumbers={{jlcpcb:["C15850"]}} pcbX={21} pcbY={9}
      schX={-32.5} schY={-28} schRotation={-90} schSectionName="decoupling"
       /><Connections name="C_AUDIO_BULK" connections={{pin1:"net.V5V",pin2:"net.GND"}}/></Fragment>
    <Fragment><resistor name="R_AUDIO_EN" resistance="1k" footprint="0603"
      supplierPartNumbers={{jlcpcb:["C21190"]}} pcbX={19} pcbY={7}
      schX={2} schY={8} schSectionName="audio"
       /><Connections name="R_AUDIO_EN" connections={{pin1:"net.AMP_ENABLE",pin2:"U_AUDIO.N_SD_MODE"}}/></Fragment>
    <Fragment><resistor name="R_AUDIO_PD" resistance="100k" footprint="0603"
      supplierPartNumbers={{jlcpcb:["C25803"]}} pcbX={15} pcbY={7}
      schX={5} schY={4} schRotation={-90} schSectionName="audio"
       /><Connections name="R_AUDIO_PD" connections={{pin1:"U_AUDIO.N_SD_MODE",pin2:"net.GND"}}/></Fragment>
    <Fragment><pinheader name="J_SPEAKER" pinCount={2} pitch={2.54} gender="male"
      pcbX={18} pcbY={18} layer="bottom" schX={2} schY={23} schSectionName="audio"
      manufacturerPartNumber="1x2 2.54mm speaker harness"
       /><Connections name="J_SPEAKER" connections={{pin1:"U_AUDIO.OUTP",pin2:"U_AUDIO.OUTN"}}/></Fragment>
    <silkscreentext text="SPK +  - / 8 OHM" pcbX={18} pcbY={21}
      layer="bottom" fontSize={0.8} />
  </Fragment>
}
