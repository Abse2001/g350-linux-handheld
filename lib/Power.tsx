import { Connections } from "./Connections"
import { Fragment } from "react"
import { BQ24074RGTR } from "../imports/BQ24074RGTR"
import { TPS61023DRLR } from "../imports/TPS61023DRLR"
import { WPN252012E1R0MT } from "../imports/WPN252012E1R0MT"
import { MAX17048G_T10 } from "../imports/MAX17048G_T10"
import { TYPE_C_31_M_12 } from "../imports/TYPE_C_31_M_12"

const resistors = [
  {name:"R_CC1",value:"5.1k",part:"C23186",x:23,y:51,sx:18,sy:8,a:"J_USB.CC1",b:"net.GND"},
  {name:"R_CC2",value:"5.1k",part:"C23186",x:27,y:51,sx:24,sy:8,a:"J_USB.CC2",b:"net.GND"},
  {name:"R_ISET",value:"3.3k",part:"C22978",x:14,y:40,sx:25,sy:-9,a:"U_CHARGE.ISET",b:"net.GND"},
  {name:"R_ILIM",value:"3.3k",part:"C22978",x:24,y:42,sx:31,sy:-9,a:"U_CHARGE.ILIM",b:"net.GND"},
  {name:"R_TIMER",value:"68k",part:"C23231",x:19,y:47,sx:37,sy:-9,a:"U_CHARGE.TMR",b:"net.GND"},
  {name:"R_EN",value:"100k",part:"C25803",x:12.5,y:53,sx:8,sy:-9,a:"net.VSYS",b:"U_BOOST.EN"},
  {name:"R_FB_HI",value:"732k",part:"C23239",x:13,y:48,sx:10,sy:-18,a:"net.V5V",b:"U_BOOST.FB"},
  {name:"R_FB_LO",value:"100k",part:"C25803",x:13,y:45,sx:10,sy:-23,a:"U_BOOST.FB",b:"net.GND"},
  {name:"R_CHG_PULL",value:"100k",part:"C25803",x:25,y:30,sx:43,sy:8,a:"net.V3V3",b:"net.CHARGING_N"},
  {name:"R_GOOD_PULL",value:"100k",part:"C25803",x:25,y:27,sx:49,sy:8,a:"net.V3V3",b:"net.USB_GOOD_N"},
  {name:"R_ALERT_PULL",value:"100k",part:"C25803",x:33,y:15,sx:49,sy:-18,a:"net.V3V3",b:"net.BAT_ALERT_N"},
] as const
const caps = [
  {name:"C_USB",value:"1uF",part:"C15849",fp:"0603",x:27,y:47,sx:31,sy:2,a:"USB_5V",b:"GND"},
  {name:"C_BAT",value:"10uF",part:"C15850",fp:"0805",x:13,y:42.5,sx:19,sy:-2,a:"VBAT",b:"GND"},
  {name:"C_SYS",value:"10uF",part:"C15850",fp:"0805",x:23,y:40,sx:37,sy:2,a:"VSYS",b:"GND"},
  {name:"C_BOOST_IN",value:"10uF",part:"C15850",fp:"0805",x:9,y:53,sx:0,sy:-17,a:"VSYS",b:"GND"},
  {name:"C_BOOST_OUT1",value:"22uF",part:"C12891",fp:"1206",x:6,y:46,sx:4,sy:-17,a:"V5V",b:"GND"},
  {name:"C_BOOST_OUT2",value:"22uF",part:"C12891",fp:"1206",x:6,y:43,sx:4,sy:-23,a:"V5V",b:"GND"},
  {name:"C_FEEDFORWARD",value:"220pF",part:"C1603",fp:"0603",x:13,y:50,sx:14,sy:-18,a:"V5V",b:"FB"},
  {name:"C_GAUGE",value:"100nF",part:"C14663",fp:"0603",x:32,y:22,sx:43,sy:-23,a:"VBAT",b:"GND"},
] as const

export function Power() {
  return <Fragment>
    <net name="VBAT" isPowerNet nominalTraceWidth={1} routingPhaseIndex={2}/><net name="VSYS" isPowerNet nominalTraceWidth={1} routingPhaseIndex={2}/><net name="FB" routingPhaseIndex={1}/><net name="BOOST_SW" nominalTraceWidth={0.8} routingPhaseIndex={2}/>
    <TYPE_C_31_M_12 name="J_USB" pcbX={25} pcbY={56.6} pcbRotation={180}
      layer="bottom" schX={94} schY={17} schSectionName="power"
      schPinArrangement={{leftSide:["VBUS1","VBUS2","CC1","CC2","DP1","DN1","DP2","DN2"],
        rightSide:["GND1","GND2","EH1","EH2","EH3","EH4","SBU1","SBU2"]}} />
    {["VBUS1","VBUS2"].map(p=><trace key={p} from={`J_USB.${p}`} to="net.USB_5V" thickness={0.5} routingPhaseIndex={2}/>)}
    {["GND1","GND2","EH1","EH2","EH3","EH4"].map(p=><trace key={p} from={`J_USB.${p}`} to="net.GND" thickness={0.4} routingPhaseIndex={2}/>)}
    <Fragment><BQ24074RGTR name="U_CHARGE" pcbX={19} pcbY={42}
      schX={98} schY={-1} schSectionName="power"
       /><Connections name="U_CHARGE" connections={{IN:"net.USB_5V",OUT1:"net.VSYS",OUT2:"net.VSYS",
        BAT1:"net.VBAT",BAT2:"net.VBAT",N_CE:"net.GND",EN1:"net.VSYS",
        EN2:"net.GND",VSS:"net.GND",EP:"net.GND",TS:"J_BAT.pin3",
        N_CHG:"net.CHARGING_N",N_PGOOD:"net.USB_GOOD_N"}}/></Fragment>
    {/* ITERM open: 10% termination. TMR 68k: nominal 9.07 h safety timer. */}
    <Fragment><pinheader name="J_BAT" pinCount={3} pitch={2.54} gender="male"
      pcbX={35} pcbY={28} pcbOrientation="vertical" layer="bottom"
      schX={87} schY={-1} schSectionName="power"
      manufacturerPartNumber="1x3 2.54mm protected 1S battery + NTC harness"
       /><Connections name="J_BAT" connections={{pin1:"net.VBAT",pin2:"net.GND"}}/></Fragment>
    <Fragment><TPS61023DRLR name="U_BOOST" pcbX={10} pcbY={49}
      schX={74} schY={-9} schSectionName="power"
       /><Connections name="U_BOOST" connections={{VIN:"net.VSYS",VOUT:"net.V5V",GND:"net.GND",FB:"net.FB"}}/></Fragment>
    <Fragment><WPN252012E1R0MT name="L_BOOST" pcbX={6} pcbY={49}
      schX={66} schY={-9} schSectionName="power"
       /><Connections name="L_BOOST" connections={{pin1:"net.VSYS"}}/></Fragment>
    {/* Critical switching node is manually routed; remaining connections autoroute. */}
    <trace from="L_BOOST.pin2" to="U_BOOST.SW" thickness={0.2}
      pcbPathRelativeTo="L_BOOST"
      pcbPath={["L_BOOST.pin2",{x:2.6,y:0},"U_BOOST.SW"]} routingPhaseIndex={2} />
    <trace from="U_BOOST.SW" to="net.BOOST_SW" thickness={0.2} routingPhaseIndex={2}/>
    <copperpour name="SW_COPPER" layer="top" connectsTo="net.BOOST_SW" clearance={0.2}
      outline={[{x:6.7,y:48.4},{x:8.5,y:48.4},{x:9.25,y:48.9},
        {x:9.25,y:49.1},{x:8.5,y:49.6},{x:6.7,y:49.6}]} />
    <trace from="U_CHARGE.EP" to="U_CHARGE.VSS" thickness={0.2}
      pcbPathRelativeTo="U_CHARGE"
      pcbPath={["U_CHARGE.EP",{x:0.75,y:-1},"U_CHARGE.VSS"]} routingPhaseIndex={2}/>
    {[[20,38.5],[17,40],[17,43.5],[20,45]].map(([x,y],i)=><Fragment key={i}>
      <via name={`CHARGE_GND_${i}`} pcbX={x} pcbY={y} holeDiameter={0.3} outerDiameter={0.65}
        fromLayer="top" toLayer="bottom" connectsTo="net.GND" />
    </Fragment>)}
    <Fragment><pinheader name="J_OFF" pinCount={2} pitch={2.54} gender="male"
      pcbX={34} pcbY={45} layer="bottom" schX={66} schY={-2} schSectionName="power"
      manufacturerPartNumber="1x2 2.54mm slide-switch harness"
       /><Connections name="J_OFF" connections={{pin1:"U_BOOST.EN",pin2:"net.GND"}}/></Fragment>
    {resistors.map(r=><Fragment key={r.name}><resistor key={r.name} name={r.name} resistance={r.value}
      footprint="0603" supplierPartNumbers={{jlcpcb:[r.part]}}
      pcbX={r.x} pcbY={r.y} pcbRotation={r.name==="R_ISET"?180:0} schX={r.sx+(r.name==="R_ALERT_PULL"?6:70)} schY={r.sy} schRotation={-90}
      schSectionName={r.name==="R_ALERT_PULL"?"battery":"power"}
       /><Connections name={r.name} connections={{pin1:r.a,pin2:r.b}}/></Fragment>)}
    {caps.map(c=><Fragment key={c.name}><capacitor key={c.name} name={c.name} capacitance={c.value}
      footprint={c.fp} supplierPartNumbers={{jlcpcb:[c.part]}}
      pcbX={c.x} pcbY={c.y}
      schX={c.name==="C_BOOST_OUT1"||c.name==="C_BAT"||c.name==="C_SYS"?-36:c.name==="C_BOOST_OUT2"||c.name==="C_GAUGE"||c.name==="C_BOOST_IN"?-32.5:c.sx+70}
      schY={c.name.startsWith("C_BOOST_OUT")?-31:c.name==="C_BAT"||c.name==="C_GAUGE"?-37:c.name==="C_SYS"||c.name==="C_BOOST_IN"?-43:c.sy}
      schRotation={-90}
      schSectionName={["C_GAUGE","C_BAT","C_SYS","C_BOOST_IN","C_BOOST_OUT1","C_BOOST_OUT2"].includes(c.name)?"decoupling":"power"}
       /><Connections name={c.name} connections={{pin1:`net.${c.a}`,pin2:`net.${c.b}`}}/></Fragment>)}
    <Fragment><MAX17048G_T10 name="U_GAUGE" pcbX={32} pcbY={18}
      schX={50} schY={-17} schSectionName="battery"
       /><Connections name="U_GAUGE" connections={{CELL:"net.VBAT",VDD:"net.VBAT",CTG:"net.GND",GND:"net.GND",
        EP:"net.GND",QSTRT:"net.GND",SCL:"net.SCL",SDA:"net.SDA",N_ALRT:"net.BAT_ALERT_N"}}/></Fragment>
    <silkscreentext text="BAT + / - / NTC" pcbX={37} pcbY={29} pcbRotation={90} layer="bottom" fontSize={0.8}/>
    <silkscreentext text="OFF WHEN CLOSED" pcbX={32} pcbY={48} layer="bottom" fontSize={0.8}/>
    <silkscreentext text="USB-C CHARGE 5V" pcbX={25} pcbY={51} layer="bottom" fontSize={0.8}/>
  </Fragment>
}
