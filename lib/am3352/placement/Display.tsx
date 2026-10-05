import {Fragment} from "react"
import {A_0_5_54PFGPZ} from "../../../imports/A_0_5_54PFGPZ"
import {TPS61165DBVR} from "../../../imports/TPS61165DBVR"
import {VLCF5020T_100M1R1_1} from "../../../imports/VLCF5020T_100M1R1_1"
import {MBR0540T1G} from "../../../imports/MBR0540T1G"
import {CL31B475KBHNNNE} from "../../../imports/CL31B475KBHNNNE"
import {CL10B224KA8NNNC} from "../../../imports/CL10B224KA8NNNC"
import {CL10A475KO8NNNC} from "../../../imports/CL10A475KO8NNNC"
import {CL05B104KO5NNNC} from "../../../imports/CL05B104KO5NNNC"
import {CL05A105KA5NQNC} from "../../../imports/CL05A105KA5NQNC"
import {A_0603WAF150JT5E} from "../../../imports/A_0603WAF150JT5E"
import {A_0402WGF1003TCE} from "../../../imports/A_0402WGF1003TCE"
import {A_0402WGF330JTCE} from "../../../imports/A_0402WGF330JTCE"
import {cpuSignalPin} from "../HostSignals"

const Pins=({name,pins,phase=9}:{name:string,pins:Record<string,string>,phase?:number})=>
  <>{Object.entries(pins).map(([pin,net])=><trace key={pin} name={`${name}_${pin}_${net}`} from={`${name}.${pin}`} to={`net.${net}`} thickness={.15} routingPhaseIndex={phase}/>)}</>

// Exact bare EastRising ER-TFT035-7, no touch. Panel datasheet pp5,10,11;
// no ready-made display PCB. This is an unrouted engineering placement.
// Connector land pattern/contact ordering, fold path, panel power budget,
// backlight biased capacitance and the Linux panel driver remain release gates.
export const lcdSignals=[
  ...Array.from({length:24},(_,i)=>({signal:`DATA${i}`,fn:i<16?`LCD_DATA${i}`:`GPMC_AD${31-i}`,
    panelPin:12+i,x:i<16?-1.4+(i%8)*1.7:11.5+((i-16)%2)*2.7,
    y:i<16?9.3-Math.floor(i/8)*2.7:20+Math.floor((i-16)/2)*2.7})),
  {signal:"HSYNC",fn:"LCD_HSYNC",panelPin:36,x:1,y:3.5},
  {signal:"VSYNC",fn:"LCD_VSYNC",panelPin:37,x:3,y:3.5},
  {signal:"PCLK",fn:"LCD_PCLK",panelPin:38,x:5,y:3.5},
  {signal:"DE",fn:"LCD_AC_BIAS_EN",panelPin:52,x:7,y:3.5},
]
export const displayUnusedPins=[5,6,7,39,40,43,44,45,46,47,48,49,50,51,55,56] as const

export function Display() {
  return <>
    <autoroutingphase name="HANDHELD_LCD_RGB888" phaseIndex={9} autorouter="auto_local"/>
    <autoroutingphase name="HANDHELD_BACKLIGHT" phaseIndex={10} autorouter="auto_local"/>
    <A_0_5_54PFGPZ name="J_LCD" pcbX={0} pcbY={44} layer="top"
      noConnect={displayUnusedPins.map(n=>`pin${n}` as `pin${typeof n}`)}/>
    <Pins name="J_LCD" pins={{pin1:"LCD_LED_K",pin2:"LCD_LED_K",pin3:"LCD_LED_A",pin4:"LCD_LED_A",
      pin8:"LCD_RESETn",pin9:"LCD_CS1n",pin10:"LCD_SPI_CLK",pin11:"LCD_SPI_MOSI",
      pin41:"IO_3V3",pin42:"IO_3V3",pin53:"GND",pin54:"GND"}}/>
    {/* Native 24-bit RGB: B0..7, G0..7, R0..7. The high eight outputs are
        GPMC_AD15..8 in mux mode1, powered by the variant's VDDSHV2=3.3V.
        33-ohm source termination is a prototype starting value, not SI signoff. */}
    {lcdSignals.map((s,i)=><Fragment key={s.signal}>
      <A_0402WGF330JTCE name={`R_LCD_${s.signal}`} pcbX={s.x} pcbY={s.y} layer="bottom" pcbRotation={90}/>
      <trace name={`LCD_${s.signal}_CPU`} from={`U_SOC.${cpuSignalPin(s.fn)}`} to={`R_LCD_${s.signal}.pin1`} thickness={.15} routingPhaseIndex={9}/>
      <trace name={`LCD_${s.signal}_PANEL`} from={`R_LCD_${s.signal}.pin2`} to={`J_LCD.pin${s.panelPin}`} thickness={.15} routingPhaseIndex={9}/>
    </Fragment>)}
    {/* McSPI0: 9-bit command/data words, D1 output, CS1 to avoid the
        ROM SPI0-CS0 boot probe. Vendor initialization and pinmux pending. */}
    <Pins name="U_SOC" pins={{[cpuSignalPin("SPI0_SCLK")]:"LCD_SPI_CLK",
      [cpuSignalPin("SPI0_D1")]:"LCD_SPI_MOSI",[cpuSignalPin("SPI0_CS1")]:"LCD_CS1n",
      [cpuSignalPin("MCASP0_AXR1")]:"LCD_RESETn",[cpuSignalPin("ECAP0_IN_PWM0_OUT")]:"LCD_BL_PWM"}}/>
    <A_0402WGF1003TCE name="R_LCD_CS_PU" pcbX={-10} pcbY={47.2} layer="top"/>
    <Pins name="R_LCD_CS_PU" pins={{pin1:"IO_3V3",pin2:"LCD_CS1n"}}/>
    <A_0402WGF1003TCE name="R_LCD_RESET_PD" pcbX={-7.5} pcbY={47.2} layer="top"/>
    <Pins name="R_LCD_RESET_PD" pins={{pin1:"LCD_RESETn",pin2:"GND"}}/>
    <CL05B104KO5NNNC name="C_LCD_IO_HF" pcbX={8} pcbY={47.2} layer="top"/>
    <Pins name="C_LCD_IO_HF" pins={{pin1:"IO_3V3",pin2:"GND"}}/>
    <CL05B104KO5NNNC name="C_LCD_VCI_HF" pcbX={10.5} pcbY={47.2} layer="top"/>
    <Pins name="C_LCD_VCI_HF" pins={{pin1:"IO_3V3",pin2:"GND"}}/>
    <CL05A105KA5NQNC name="C_LCD_BULK" pcbX={12.9} pcbY={47.2} layer="top"/>
    <Pins name="C_LCD_BULK" pins={{pin1:"IO_3V3",pin2:"GND"}}/>
    {/* LEDK is the feedback/current-sense node, never a direct GND wire.
        200mV / 15ohm = 13.33mA; nominal maximum incl2% FB/1% R =13.74mA.
        VIN from the existing 5V boost maintains the driver's >=3V input. */}
    <TPS61165DBVR name="U_LCD_BL" pcbX={27} pcbY={5} layer="top"/>
    <Pins name="U_LCD_BL" phase={10} pins={{VIN:"VIO_BOOST5V",CTRL:"LCD_BL_PWM",SW:"LCD_BL_SW",GND:"GND",COMP:"LCD_BL_COMP",FB:"LCD_LED_K"}}/>
    <VLCF5020T_100M1R1_1 name="L_LCD_BL" pcbX={21.5} pcbY={5} layer="top"/>
    <Pins name="L_LCD_BL" phase={10} pins={{pin1:"VIO_BOOST5V",pin2:"LCD_BL_SW"}}/>
    <MBR0540T1G name="D_LCD_BL" pcbX={27} pcbY={1.5} layer="top" pcbRotation={180}/>
    <Pins name="D_LCD_BL" phase={10} pins={{anode:"LCD_BL_SW",cathode:"LCD_LED_A"}}/>
    <CL31B475KBHNNNE name="C_LCD_BL_OUT" pcbX={33} pcbY={1.5} layer="top"/>
    <Pins name="C_LCD_BL_OUT" phase={10} pins={{pin1:"LCD_LED_A",pin2:"GND"}}/>
    <CL10A475KO8NNNC name="C_LCD_BL_IN" pcbX={21.5} pcbY={9.2} layer="top"/>
    <Pins name="C_LCD_BL_IN" phase={10} pins={{pin1:"VIO_BOOST5V",pin2:"GND"}}/>
    <CL10B224KA8NNNC name="C_LCD_BL_COMP" pcbX={32} pcbY={5} layer="top"/>
    <Pins name="C_LCD_BL_COMP" phase={10} pins={{pin1:"LCD_BL_COMP",pin2:"GND"}}/>
    <A_0603WAF150JT5E name="R_LCD_BL_SENSE" pcbX={27} pcbY={-2.2} layer="top"/>
    <Pins name="R_LCD_BL_SENSE" phase={10} pins={{pin1:"LCD_LED_K",pin2:"GND"}}/>
    <A_0402WGF1003TCE name="R_LCD_BL_PD" pcbX={27} pcbY={8.5} layer="top"/>
    <Pins name="R_LCD_BL_PD" phase={10} pins={{pin1:"LCD_BL_PWM",pin2:"GND"}}/>
    <pcbnoterect pcbX={0} pcbY={26} width={76.84} height={63.84}/>
    <silkscreentext text="ER-TFT035-7 / FIT UNVERIFIED" pcbX={0} pcbY={56.5} fontSize={.8}/>
  </>
}
