import { Connections } from "./Connections"
import { Fragment } from "react"
import { MAX98357AETE_T } from "../imports/MAX98357AETE_T"

export function Audio() {
  return <Fragment>
    <trace from="U_AUDIO.LRCLK" to="J_PI.pin35" thickness={0.2} routingPhaseIndex={2}
      pcbPathRelativeTo="U_AUDIO.LRCLK" pcbPath={["U_AUDIO.LRCLK",{x:-3,y:0.252095},
        {x:-42,y:1.5},{x:-48.5,y:8},{x:-48.5,y:26.4},
        {x:-36.05,y:26.4},"J_PI.pin35"]}/>
    <trace from="U_AUDIO.BCLK" to="J_PI.pin12" thickness={0.2} routingPhaseIndex={2}
      pcbPathRelativeTo="U_AUDIO.BCLK" pcbPath={["U_AUDIO.BCLK",{x:-3.5,y:-1.7},
        {x:-3.5,y:-1.7,via:true,toLayer:"bottom"},{x:-3.5,y:-1.7},
        {x:-4.5,y:-0.7},{x:-4.5,y:16},{x:-4.5,y:16,via:true,toLayer:"top"},
        {x:-4.5,y:16},{x:-4.5,y:20.5},"J_PI.pin12"]}/>
    <trace from="U_AUDIO.DIN" to="J_PI.pin40" thickness={0.2} routingPhaseIndex={2}
      pcbPathRelativeTo="U_AUDIO.DIN" pcbPath={["U_AUDIO.DIN",{x:-0.748411,y:-2.8},
        {x:-6.7,y:-2.8},{x:-6.7,y:-2.8,via:true,toLayer:"bottom"},{x:-6.7,y:-2.8},
        {x:-6.7,y:17.25},{x:-6.7,y:17.25,via:true,toLayer:"top"},
        {x:-6.7,y:17.25},{x:-6.7,y:18},{x:-41.13,y:18},"J_PI.pin40"]}/>
    <Fragment><MAX98357AETE_T name="U_AUDIO" pcbX={17} pcbY={12}
      schX={2} schY={15} schSectionName="audio"
      
    /><Connections name="U_AUDIO" connections={{DIN:"net.I2S_DIN",BCLK:"net.I2S_BCLK",LRCLK:"net.I2S_LRCLK",
        GND1:"net.GND",GND2:"net.GND",GND3:"net.GND",EP:"net.GND"}}/></Fragment>
    <Fragment><capacitor name="C_AUDIO_HF" capacitance="100nF" footprint="0603"
      supplierPartNumbers={{jlcpcb:["C14663"]}} pcbX={20.65} pcbY={12.5}
      maxDecouplingTraceLength={1.5}
      schX={-36} schY={-28} schRotation={-90} schSectionName="decoupling"
       /></Fragment>
    <Fragment><capacitor name="C_AUDIO_BULK" capacitance="10uF" footprint="0805"
      supplierPartNumbers={{jlcpcb:["C15850"]}} pcbX={21} pcbY={9}
      maxDecouplingTraceLength={6}
      schX={-32.5} schY={-28} schRotation={-90} schSectionName="decoupling"
       /><Connections name="C_AUDIO_BULK" connections={{pin1:"net.V5V"}}/></Fragment>
    {/* Short local supply escapes; the autorouter joins the capacitor pads to 5V. */}
    <trace from="U_AUDIO.VDD1" to="C_AUDIO_HF.pin1" thickness={0.15} routingPhaseIndex={1}
      pcbPath={["U_AUDIO.VDD1","C_AUDIO_HF.pin1"]}/>
    <trace from="U_AUDIO.VDD2" to="C_AUDIO_HF.pin1" thickness={0.15} routingPhaseIndex={1}
      pcbPath={["U_AUDIO.VDD2","C_AUDIO_HF.pin1"]}/>
    <trace from="C_AUDIO_HF.pin1" to="C_AUDIO_BULK.pin1" thickness={0.6} routingPhaseIndex={1}
      maxLength={4} pcbPath={["C_AUDIO_HF.pin1","C_AUDIO_BULK.pin1"]}/>
    <trace from="U_AUDIO.GAIN_SLOT" to="C_AUDIO_BULK.pin1" thickness={0.15} routingPhaseIndex={1}
      pcbPathRelativeTo="U_AUDIO" pcbPath={["U_AUDIO.GAIN_SLOT",{x:-0.248539,y:-2.9},
        {x:2.1,y:-2.9},"C_AUDIO_BULK.pin1"]}/>
    {/* Return the HF bypass directly to the ground planes without a long surface loop. */}
    <trace from="C_AUDIO_HF.pin2" to="AUDIO_BYPASS_GND.top" thickness={0.2}
      routingPhaseIndex={1} pcbPath={["C_AUDIO_HF.pin2","AUDIO_BYPASS_GND.top"]}/>
    <via name="AUDIO_BYPASS_GND" pcbX={22.35} pcbY={12.5} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="top" toLayer="bottom" connectsTo="net.GND"/>
    <trace from="C_AUDIO_BULK.pin2" to="AUDIO_BULK_GND.top" thickness={0.3}
      routingPhaseIndex={1} pcbPath={["C_AUDIO_BULK.pin2","AUDIO_BULK_GND.top"]}/>
    <via name="AUDIO_BULK_GND" pcbX={23.1} pcbY={9} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="top" toLayer="bottom" connectsTo="net.GND"/>
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
