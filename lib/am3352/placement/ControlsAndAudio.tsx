import {Fragment} from "react"
import {MCP23017_E_SO} from "../../../imports/MCP23017_E_SO"
import {MAX98357AETE_T} from "../../../imports/MAX98357AETE_T"
import {CL05B104KO5NNNC} from "../../../imports/CL05B104KO5NNNC"
import {CL05A105KA5NQNC} from "../../../imports/CL05A105KA5NQNC"
import {CL31A226KAHNNNE} from "../../../imports/CL31A226KAHNNNE"
import {A_0402WGF1002TCE} from "../../../imports/A_0402WGF1002TCE"
import {A_0402WGF1003TCE} from "../../../imports/A_0402WGF1003TCE"
import {HostPins, CpuSignal} from "../Boot"

// Arrangement study from original front-side photographs. These positions
// and the two-electrode contact geometry are engineering placeholders, not
// measurements of the G350 membrane. No tall front tactile switches fitted.
export const frontButtons = [
  {name:"KEY_UP", x:-24, y:-16, port:"GPA0"},
  {name:"KEY_DOWN", x:-24, y:-32, port:"GPA1"},
  {name:"KEY_LEFT", x:-32, y:-24, port:"GPA2"},
  {name:"KEY_RIGHT", x:-16, y:-24, port:"GPA3"},
  {name:"KEY_A", x:32, y:-24, port:"GPA4"},
  {name:"KEY_B", x:24, y:-32, port:"GPA5"},
  {name:"KEY_X", x:24, y:-16, port:"GPA6"},
  {name:"KEY_Y", x:16, y:-24, port:"GPB3"},
  {name:"KEY_SELECT", x:-7, y:-38, port:"GPB0"},
  {name:"KEY_START", x:7, y:-38, port:"GPB1"},
  {name:"KEY_MENU", x:0, y:-16, port:"GPB2"},
] as const

export function ControlsAndAudio() {
  return <>
    <autoroutingphase name="HANDHELD_CONTROLS" phaseIndex={7} autorouter="auto_local"/>
    <autoroutingphase name="HANDHELD_AUDIO" phaseIndex={8} autorouter="auto_local"/>
    <MCP23017_E_SO name="U_KEYS" pcbX={0} pcbY={-25.5} layer="bottom"
      noConnect={["pin5","pin6","pin7","pin8","pin11","pin14","pin19","pin20","pin28"]}/>
    <HostPins name="U_KEYS" pins={{VDD:"IO_3V3",VSS:"GND",A0:"GND",A1:"GND",A2:"GND",
      SDA:"I2C0_SDA",SCL:"I2C0_SCL",N_RESET:"KEYS_RESETn"}}/>
    <A_0402WGF1002TCE name="R_KEYS_RESET" pcbX={11} pcbY={-29} layer="bottom"/>
    <HostPins name="R_KEYS_RESET" pins={{pin1:"IO_3V3",pin2:"KEYS_RESETn"}}/>
    <CL05B104KO5NNNC name="C_KEYS_HF" pcbX={-2.7} pcbY={-32.7} layer="bottom"/>
    <HostPins name="C_KEYS_HF" pins={{pin1:"IO_3V3",pin2:"GND"}}/>
    <CL05A105KA5NQNC name="C_KEYS_BULK" pcbX={0} pcbY={-34.2} layer="bottom"/>
    <HostPins name="C_KEYS_BULK" pins={{pin1:"IO_3V3",pin2:"GND"}}/>
    {frontButtons.map(b=><Fragment key={b.name}>
      <chip name={b.name} pcbX={b.x} pcbY={b.y} layer="bottom" doNotPlace
        pinLabels={{pin1:["KEY"],pin2:["RETURN"]}}
        pinAttributes={{pin1:{isPassive:true},KEY:{isPassive:true},pin2:{requiresGround:true},RETURN:{requiresGround:true}}}
        footprint={<footprint>
          <smtpad shape="rect" pcbX={-1.35} pcbY={0} width={2.3} height={5} portHints={["pin1"]}/>
          <smtpad shape="rect" pcbX={1.35} pcbY={0} width={2.3} height={5} portHints={["pin2"]}/>
          <courtyardrect pcbX={0} pcbY={0} width={6} height={6}/>
        </footprint>}/>
      <trace name={`${b.name}_INPUT`} from={`${b.name}.pin1`} to={`U_KEYS.${b.port}`} routingPhaseIndex={7}/>
      <HostPins name={b.name} pins={{pin2:"GND"}}/>
    </Fragment>)}
    {/* MCP23017 GPA7/GPB7 are output-only in DS20001952D. Both are
        unused. Linux gpio-keys-polled and MCP internal pulls are planned. */}
    <MAX98357AETE_T name="U_AUDIO" pcbX={0} pcbY={-44} layer="top"
      noConnect={["pin5","pin6","pin12","pin13"]}/>
    <HostPins name="U_AUDIO" pins={{DIN:"AUDIO_DIN",BCLK:"AUDIO_BCLK",LRCLK:"AUDIO_LRCLK",
      N_SD_MODE:"AUDIO_ENABLE",GAIN_SLOT:"PERIPH_3V3",VDD1:"PERIPH_3V3",VDD2:"PERIPH_3V3",
      GND1:"GND",GND2:"GND",GND3:"GND",EP:"GND",OUTP:"SPK_P",OUTN:"SPK_N"}}/>
    <CpuSignal fn="MCASP0_AXR0" net="AUDIO_DIN"/>
    <CpuSignal fn="MCASP0_ACLKX" net="AUDIO_BCLK"/>
    <CpuSignal fn="MCASP0_FSX" net="AUDIO_LRCLK"/>
    {/* A14 / GPIO3_21 in mode7. McASP master and pinmux software pending. */}
    <CpuSignal fn="MCASP0_AHCLKX" net="AUDIO_ENABLE"/>
    <A_0402WGF1003TCE name="R_AUDIO_PD" pcbX={-4} pcbY={-44} layer="top"/>
    <HostPins name="R_AUDIO_PD" pins={{pin1:"AUDIO_ENABLE",pin2:"GND"}}/>
    <CL05B104KO5NNNC name="C_AUDIO_HF" pcbX={4} pcbY={-43.5} layer="top"/>
    <HostPins name="C_AUDIO_HF" pins={{pin1:"PERIPH_3V3",pin2:"GND"}}/>
    <CL31A226KAHNNNE name="C_AUDIO_BULK" pcbX={6.5} pcbY={-46} layer="top"/>
    <HostPins name="C_AUDIO_BULK" pins={{pin1:"PERIPH_3V3",pin2:"GND"}}/>
    {/* Temporary low-profile harness landing pads. Exact original speaker
        connector, strain relief, contact paste and finish remain unselected. */}
    <testpoint name="TP_SPK_P" pcbX={-2} pcbY={-53} layer="top" footprintVariant="pad" padDiameter={1.5} doNotPlace/>
    <testpoint name="TP_SPK_N" pcbX={2} pcbY={-53} layer="top" footprintVariant="pad" padDiameter={1.5} doNotPlace/>
    <HostPins name="TP_SPK_P" pins={{pin1:"SPK_P"}}/>
    <HostPins name="TP_SPK_N" pins={{pin1:"SPK_N"}}/>
  </>
}
