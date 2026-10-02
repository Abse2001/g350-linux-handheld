import {Fragment} from "react"
import {TPS65217CRSLR,pinLabels as pmicLabels} from "../../imports/TPS65217CRSLR"
import {TPS61023DRLR} from "../../imports/TPS61023DRLR"
import {XFL4020_222MEC} from "../../imports/XFL4020_222MEC"
import {CL05B104KO5NNNC} from "../../imports/CL05B104KO5NNNC"
import {CL05B103KB5NNNC} from "../../imports/CL05B103KB5NNNC"
import {CL05A105KA5NQNC} from "../../imports/CL05A105KA5NQNC"
import {CL10A225KP8NNNC} from "../../imports/CL10A225KP8NNNC"
import {CL10A475KO8NNNC} from "../../imports/CL10A475KO8NNNC"
import {CL31A226KAHNNNE} from "../../imports/CL31A226KAHNNNE"
import {CL10B221KB8NNNC} from "../../imports/CL10B221KB8NNNC"
import {A_0402WGF4701TCE} from "../../imports/A_0402WGF4701TCE"
import {A_0402WGF1002TCE} from "../../imports/A_0402WGF1002TCE"
import {A_0402WGF1003TCE} from "../../imports/A_0402WGF1003TCE"
import {A_0603WAF7323T5E} from "../../imports/A_0603WAF7323T5E"
import {RC0402FR_0749R9L} from "../../imports/RC0402FR_0749R9L"
import {RC0402FR_07240RL} from "../../imports/RC0402FR_07240RL"
import {TS_1187A_B_A_B} from "../../imports/TS_1187A_B_A_B"
import {decouplers,pmicConnections,allPinAttributes} from "./PowerNetworks"

const Wire=({from,net}:{from:string,net:string})=>
  <trace from={from} to={`net.${net}`} thickness={.2} routingPhaseIndex={5}/>
const Pins=({name,pins}:{name:string,pins:Record<string,string>})=>
  <>{Object.entries(pins).map(([pin,net])=><Wire key={pin} from={`${name}.${pin}`} net={net}/>)}</>
const partByValue={"100nF":CL05B104KO5NNNC,"10nF":CL05B103KB5NNNC,"1uF":CL05A105KA5NQNC,"22uF":CL31A226KAHNNNE}

// SLVU551I AM335x reset/enable wiring, SLVA686C input/output capacitors.
// The supplementary 5V boost supplies VINLDO and LS2_IN so low battery
// voltage cannot directly remove the 3.3V LDO's input headroom. CPU bucks
// and the 1.8V analog LDO remain on SYS. This architecture still requires
// startup, inrush, battery, USB-current, thermal and layout qualification.
export const Power=()=> <>
  <TPS65217CRSLR name="U_PMIC" pcbX={-25} pcbY={0} layer="top"
    pinAttributes={allPinAttributes(pmicLabels,{pin2:{requiresPower:true},pin4:{requiresPower:true},pin5:{requiresPower:true},pin12:{requiresPower:true},pin18:{requiresPower:true},
      pin21:{requiresPower:true},pin22:{requiresPower:true},pin32:{requiresPower:true},pin39:{requiresPower:true},pin42:{requiresPower:true},
      pin30:{requiresGround:true},pin41:{requiresGround:true},pin49:{requiresGround:true},pin15:{doNotConnect:true},pin17:{doNotConnect:true}})}
    schX={-35} schY={0} schWidth={8} schHeight={28} noConnect={["pin10","pin14","pin15","pin16","pin17","pin35","pin36","pin37","pin38"]}/>
  <Pins name="U_PMIC" pins={{...pmicConnections,pin33:"GND",pin34:"GND"}}/>
  {/* Bare source-input pads, pending qualified USB/battery connectors.
      Battery input must be protected and include its actual 10k NTC. */}
  <testpoint name="TP_BAT_INPUT" pcbX={-37} pcbY={-18} padDiameter={2}/>
  <Pins name="TP_BAT_INPUT" pins={{pin1:"VBAT"}}/>
  <trace name="BATTERY_KELVIN_SENSE" from="U_PMIC.pin6" to="TP_BAT_INPUT.pin1" thickness={.2} routingPhaseIndex={5}/>
  <testpoint name="TP_BAT_NTC" pcbX={-34} pcbY={-18} padDiameter={2}/>
  <Pins name="TP_BAT_NTC" pins={{pin1:"BAT_NTC"}}/>
  <testpoint name="TP_BAT_GND" pcbX={-31} pcbY={-18} padDiameter={2}/>
  <Pins name="TP_BAT_GND" pins={{pin1:"GND"}}/>
  <testpoint name="TP_USB_INPUT" pcbX={-37} pcbY={-22} padDiameter={2}/>
  <Pins name="TP_USB_INPUT" pins={{pin1:"USB_5V"}}/>
  <TS_1187A_B_A_B name="SW_POWER" pcbX={-39} pcbY={-31} internallyConnectedPins={[["pin1","pin2"],["pin3","pin4"]]}/>
  <Pins name="SW_POWER" pins={{pin1:"PMIC_BUTTONn",pin3:"GND"}}/>
  <TPS61023DRLR name="U_IO_BOOST" pcbX={-26} pcbY={27} layer="top" schX={-60} schY={10}/>
  <Pins name="U_IO_BOOST" pins={{VIN:"VSYS",EN:"VSYS",GND:"GND",VOUT:"VIO_BOOST5V",FB:"IO_BOOST_FB",SW:"IO_BOOST_SW"}}/>
  {[
    {name:"L_DDR",sw:"SW_DDR",out:"DDR_1V5",x:-34,y:6},
    {name:"L_MPU",sw:"SW_MPU",out:"VDD_MPU",x:-34,y:-3},
    {name:"L_CORE",sw:"SW_CORE",out:"VDD_CORE",x:-25,y:10},
    {name:"L_IO_BOOST",sw:"VSYS",out:"IO_BOOST_SW",x:-31,y:27},
  ].map((l,i)=><Fragment key={l.name}>
    <XFL4020_222MEC name={l.name} pcbX={l.x} pcbY={l.y} schX={-50} schY={-20-i*6}/>
    <Pins name={l.name} pins={{pin1:l.sw,pin2:l.out}}/>
  </Fragment>)}
  {[
    {name:"C_PMIC_SYS",net:"VSYS",x:-38,y:-9},
    {name:"C_PMIC_DCDC1_IN",net:"VSYS",x:-32,y:2},
    {name:"C_PMIC_DCDC2_IN",net:"VSYS",x:-31,y:-7},
    {name:"C_PMIC_DCDC3_IN",net:"VSYS",x:-18,y:10},
    {name:"C_PMIC_DDR_OUT",net:"DDR_1V5",x:-41,y:6},
    {name:"C_PMIC_MPU_OUT",net:"VDD_MPU",x:-41,y:-3},
    {name:"C_PMIC_CORE_OUT",net:"VDD_CORE",x:-25,y:15.5},
    {name:"C_PMIC_ANALOG_OUT",net:"ANALOG_1V8",x:-18,y:3},
    {name:"C_PMIC_IO_OUT",net:"IO_3V3",x:-18,y:-3},
    {name:"C_PMIC_BYPASS",net:"PMIC_BYPASS",x:-25,y:0},
    {name:"C_BATTERY",net:"VBAT",x:-29,y:-13},
    {name:"C_IO_BOOST_OUT1",net:"VIO_BOOST5V",x:-23,y:23},
    {name:"C_IO_BOOST_OUT2",net:"VIO_BOOST5V",x:-23,y:19},
  ].map((c,i)=><Fragment key={c.name}>
    <CL31A226KAHNNNE name={c.name} pcbX={c.x} pcbY={c.y} layer={c.name==="C_PMIC_BYPASS"?"bottom":"top"} schX={-70} schY={-20-i*4}/>
    <Pins name={c.name} pins={{pin1:c.net,pin2:"GND"}}/>
  </Fragment>)}
  {[
    {name:"C_PMIC_VINLDO",net:"VIO_BOOST5V",x:-25,y:-3.5},
    {name:"C_PMIC_USB",net:"USB_5V",x:-25,y:-6},
    {name:"C_IO_BOOST_IN",net:"VSYS",x:-28,y:22},
  ].map((c,i)=><Fragment key={c.name}>
    <CL10A475KO8NNNC name={c.name} pcbX={c.x} pcbY={c.y} layer={c.name==="C_PMIC_VINLDO"?"bottom":"top"} schX={-75} schY={-i*5}/>
    <Pins name={c.name} pins={{pin1:c.net,pin2:"GND"}}/>
  </Fragment>)}
  {[
    {name:"C_PMIC_LDO1",net:"VDDS_1V8",x:-25,y:-10},
    {name:"C_PMIC_LDO2",net:"LDO2_3V3",x:-21,y:-10},
  ].map((c,i)=><Fragment key={c.name}>
    <CL10A225KP8NNNC name={c.name} pcbX={c.x} pcbY={c.y} schX={-65} schY={-i*5}/>
    <Pins name={c.name} pins={{pin1:c.net,pin2:"GND"}}/>
  </Fragment>)}
  <CL05B104KO5NNNC name="C_PMIC_INT_LDO" pcbX={-30} pcbY={-2.2} schX={-65} schY={5}/>
  <Pins name="C_PMIC_INT_LDO" pins={{pin1:"PMIC_INT_LDO",pin2:"GND"}}/>
  <A_0603WAF7323T5E name="R_IO_BOOST_HI" pcbX={-23} pcbY={27} schX={-60} schY={20}/>
  <Pins name="R_IO_BOOST_HI" pins={{pin1:"VIO_BOOST5V",pin2:"IO_BOOST_FB"}}/>
  <A_0402WGF1003TCE name="R_IO_BOOST_LO" pcbX={-23} pcbY={29} schX={-60} schY={24}/>
  <Pins name="R_IO_BOOST_LO" pins={{pin1:"IO_BOOST_FB",pin2:"GND"}}/>
  <CL10B221KB8NNNC name="C_IO_BOOST_FF" pcbX={-19} pcbY={27} schX={-56} schY={20}/>
  <Pins name="C_IO_BOOST_FF" pins={{pin1:"VIO_BOOST5V",pin2:"IO_BOOST_FB"}}/>
  {[
    {name:"R_PMIC_RESET",net:"PMIC_RESETn",rail:"VDDS_1V8",kind:"100k"},
    {name:"R_PMIC_WAKEUP",net:"PMIC_WAKEUPn",rail:"VDDS_1V8",kind:"100k"},
    {name:"R_PMIC_INT",net:"PMIC_INTn",rail:"IO_3V3",kind:"10k"},
    {name:"R_PMIC_SDA",net:"I2C0_SDA",rail:"IO_3V3",kind:"4k7"},
    {name:"R_PMIC_SCL",net:"I2C0_SCL",rail:"IO_3V3",kind:"4k7"},
    {name:"R_VREF_HI",net:"DDR_VREF",rail:"DDR_1V5",kind:"10k"},
    {name:"R_VREF_LO",net:"GND",rail:"DDR_VREF",kind:"10k"},
  ].map((r,i)=>{
    const Part=r.kind==="100k"?A_0402WGF1003TCE:r.kind==="10k"?A_0402WGF1002TCE:A_0402WGF4701TCE
    return <Fragment key={r.name}><Part name={r.name} pcbX={-16} pcbY={2-i*2} layer="bottom" schX={-25} schY={-25-i*4}/>
      <Pins name={r.name} pins={{pin1:r.rail,pin2:r.net}}/></Fragment>
  })}
  <RC0402FR_0749R9L name="R_DDR_VTP" pcbX={-2.3} pcbY={-7.7} layer="bottom" schX={18} schY={-15}/>
  <Pins name="R_DDR_VTP" pins={{pin1:"DDR_VTP",pin2:"GND"}}/>
  <RC0402FR_07240RL name="R_DDR_ZQ" pcbX={6.3} pcbY={-29} layer="top" schX={18} schY={-20}/>
  <Pins name="R_DDR_ZQ" pins={{pin1:"DDR_ZQ",pin2:"GND"}}/>
  {decouplers.map((c,i)=>{
    const Part=partByValue[c.value]
    return <Fragment key={c.name}><Part name={c.name} pcbX={c.x} pcbY={c.y} layer={c.side}
      schX={30+(i%8)*4} schY={45-Math.floor(i/8)*5}/>
      <Pins name={c.name} pins={{pin1:c.net,pin2:"GND"}}/></Fragment>
  })}
</>
