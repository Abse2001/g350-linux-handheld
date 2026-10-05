import {Fragment} from "react"
import {SX32Y024000BC1T001} from "../../imports/SX32Y024000BC1T001"
import {A_0402CG180J500NT} from "../../imports/A_0402CG180J500NT"
import {A_0402WGF0000TCE} from "../../imports/A_0402WGF0000TCE"
import {A_0402WGF1004TCE} from "../../imports/A_0402WGF1004TCE"
import {A_0402WGF1002TCE} from "../../imports/A_0402WGF1002TCE"
import {A_0402WGF4701TCE} from "../../imports/A_0402WGF4701TCE"
import {TS_1187A_B_A_B} from "../../imports/TS_1187A_B_A_B"
import {cpuSignalPin,bootStraps} from "./HostSignals"

export const HostWire=({from,net,width=.15}:{from:string,net:string,width?:number})=>
  <trace from={from} to={`net.${net}`} thickness={width} routingPhaseIndex={5}/>
export const HostPins=({name,pins,width}:{name:string,pins:Record<string,string>,width?:number})=>
  <>{Object.entries(pins).map(([pin,net])=><HostWire key={pin} from={`${name}.${pin}`} net={net} width={width}/>)}</>
export const CpuSignal=({fn,net}:{fn:string,net:string})=>
  <HostWire from={`U_SOC.${cpuSignalPin(fn)}`} net={net}/>

// SPRS717L 6.2.1: fundamental 24 MHz, ESR <=48 ohm, C0 <=7 pF.
// TKD's exact C7420736 specification: ESR40, C0<=3pF, CL12pF,
// +/-10ppm initial, +/-10ppm temperature, +/-3ppm/year aging.
// 18pF C0G is the prototype starting value, not a parasitic/startup signoff.
// Rd is populated 0 ohm; Rbias has real pads but is not populated.
// RTC-only mode is unused: both RTC crystal terminals explicitly NC.
export const Boot=()=> <>
  <SX32Y024000BC1T001 name="X_MAIN" loadCapacitance="12pF" pcbX={12} pcbY={0} schX={55} schY={-35}/>
  <HostPins name="X_MAIN" pins={{pin1:"XTAL_IN",pin2:"GND",pin3:"XTAL_DRIVE",pin4:"GND"}}/>
  <CpuSignal fn="XTALIN" net="XTAL_IN"/>
  <CpuSignal fn="XTALOUT" net="XTAL_OUT"/>
  <A_0402WGF0000TCE name="R_XTAL_DAMP" pcbX={8.9} pcbY={-3.8} pcbRotation={90} schX={50} schY={-30}/>
  <HostPins name="R_XTAL_DAMP" pins={{pin1:"XTAL_OUT",pin2:"XTAL_DRIVE"}}/>
  <A_0402WGF1004TCE name="R_XTAL_BIAS_DNP" doNotPlace pcbX={12} pcbY={-3.6} schX={55} schY={-30}/>
  <HostPins name="R_XTAL_BIAS_DNP" pins={{pin1:"XTAL_IN",pin2:"XTAL_OUT"}}/>
  {[["C_XTAL_IN","XTAL_IN",9.5,3.9],["C_XTAL_OUT","XTAL_DRIVE",16.3,1.1]].map(([name,net,x,y])=>
    <Fragment key={name}><A_0402CG180J500NT name={name as string} pcbX={x as number} pcbY={y as number} schX={60} schY={-35}/>
      <HostPins name={name as string} pins={{pin1:net as string,pin2:"GND"}}/></Fragment>)}
  {bootStraps.map((s,i)=><Fragment key={s.bit}>
    <CpuSignal fn={`LCD_DATA${s.bit}`} net={s.net}/>
    <A_0402WGF1002TCE name={`R_SYSBOOT${s.bit}`} layer="bottom"
      pcbX={17+(i%4)*3} pcbY={-2-Math.floor(i/4)*2.5} schX={40+(i%4)*5} schY={-50-Math.floor(i/4)*5}/>
    <HostPins name={`R_SYSBOOT${s.bit}`} pins={{pin1:s.high?"IO_3V3":"GND",pin2:s.net}}/>
  </Fragment>)}
  {[
    {fn:"EMU0",net:"JTAG_EMU0",rail:"IO_3V3"},{fn:"EMU1",net:"JTAG_EMU1",rail:"IO_3V3"},
    {fn:"TMS",net:"JTAG_TMS",rail:"IO_3V3"},{fn:"TDI",net:"JTAG_TDI",rail:"IO_3V3"},
    {fn:"TCK",net:"JTAG_TCK",rail:"GND"},{fn:"TRSTn",net:"JTAG_TRSTn",rail:"GND"},
    {fn:"WARMRSTn",net:"WARM_RESETn",rail:"IO_3V3"},
  ].map((p,i)=><Fragment key={p.fn}>
    <CpuSignal fn={p.fn} net={p.net}/>
    <A_0402WGF4701TCE name={`R_${p.fn}`} pcbX={-19} pcbY={-15-i*2} layer="bottom" schX={-45} schY={40-i*4}/>
    <HostPins name={`R_${p.fn}`} pins={{pin1:p.rail,pin2:p.net}}/>
  </Fragment>)}
  <CpuSignal fn="TDO" net="JTAG_TDO"/>
  <CpuSignal fn="UART0_RXD" net="UART0_RX"/>
  <CpuSignal fn="UART0_TXD" net="UART0_TX"/>
  {['JTAG_TMS','JTAG_TDI','JTAG_TDO','JTAG_TCK','JTAG_TRSTn','JTAG_EMU0','JTAG_EMU1','WARM_RESETn','GND','IO_3V3'].map((net,i)=>
    <Fragment key={net}><testpoint name={`TP_${net}`} pcbX={-44+(i%2)*4} pcbY={35+Math.floor(i/2)*4} layer="bottom" footprintVariant="pad" padDiameter={1.5}/>
      <HostPins name={`TP_${net}`} pins={{pin1:net}}/></Fragment>)}
  {['GND','UART0_RX','UART0_TX','IO_3V3'].map((net,i)=>
    <Fragment key={net}><testpoint name={`TP_UART_${net}`} pcbX={30} pcbY={12+i*4} footprintVariant="pad" padDiameter={1.5}/>
      <HostPins name={`TP_UART_${net}`} pins={{pin1:net}}/></Fragment>)}
  <TS_1187A_B_A_B name="SW_RESET" pcbX={-39} pcbY={-40} internallyConnectedPins={[["pin1","pin2"],["pin3","pin4"]]}/>
  <HostPins name="SW_RESET" pins={{pin1:"WARM_RESETn",pin3:"GND"}}/>
</>
