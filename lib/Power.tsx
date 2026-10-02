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
  {name:"R_ILIM",value:"3.3k",part:"C22978",x:26.5,y:43,sx:31,sy:-9,a:"U_CHARGE.ILIM",b:"net.GND"},
  {name:"R_TIMER",value:"68k",part:"C23231",x:19,y:47,sx:37,sy:-9,a:"U_CHARGE.TMR",b:"net.GND"},
  {name:"R_EN",value:"100k",part:"C25803",x:12.5,y:53,sx:8,sy:-9,a:"net.VSYS",b:"U_BOOST.EN"},
  {name:"R_FB_HI",value:"732k",part:"C23239",x:15.5,y:47,sx:10,sy:-18,a:"net.V5V",b:"U_BOOST.FB"},
  {name:"R_FB_LO",value:"100k",part:"C25803",x:15.5,y:45,sx:10,sy:-23,a:"U_BOOST.FB",b:"net.GND"},
  {name:"R_CHG_PULL",value:"100k",part:"C25803",x:25,y:30,sx:43,sy:8,a:"net.V3V3",b:"net.CHARGING_N"},
  {name:"R_GOOD_PULL",value:"100k",part:"C25803",x:25,y:27,sx:49,sy:8,a:"net.V3V3",b:"net.USB_GOOD_N"},
  {name:"R_ALERT_PULL",value:"100k",part:"C25803",x:33,y:15,sx:49,sy:-18,a:"net.V3V3",b:"net.BAT_ALERT_N"},
] as const
const caps = [
  {name:"C_USB",value:"1uF",part:"C15849",fp:"0603",x:22,y:45.1,sx:31,sy:2,a:"USB_5V",b:"GND"},
  {name:"C_BAT",value:"10uF",part:"C15850",fp:"0805",x:14.5,y:42,sx:19,sy:-2,a:"VBAT",b:"GND"},
  {name:"C_SYS",value:"10uF",part:"C15850",fp:"0805",x:23,y:41.9,sx:37,sy:2,a:"VSYS",b:"GND"},
  {name:"C_BOOST_IN",value:"10uF",part:"C15850",fp:"0805",x:13.2,y:49.5,sx:0,sy:-17,a:"VSYS",b:"GND"},
  {name:"C_BOOST_OUT1",value:"22uF",part:"C12891",fp:"1206",x:6.5,y:46.25,sx:4,sy:-17,a:"V5V",b:"GND"},
  {name:"C_BOOST_OUT2",value:"22uF",part:"C12891",fp:"1206",x:6.5,y:43,sx:4,sy:-23,a:"V5V",b:"GND"},
  {name:"C_FEEDFORWARD",value:"220pF",part:"C1603",fp:"0603",x:17,y:50,sx:14,sy:-18,a:"V5V",b:"FB"},
  {name:"C_GAUGE",value:"100nF",part:"C14663",fp:"0603",x:30,y:14.5,sx:43,sy:-23,a:"VBAT",b:"GND"},
] as const
const localBypass:Record<string,{x:number,y:number,max:number}> = {
  C_USB:{x:24.1,y:45.1,max:2.5}, C_BAT:{x:12.7,y:42,max:2.5},
  C_SYS:{x:25.1,y:41.9,max:2.5}, C_BOOST_IN:{x:14.8,y:51.3,max:2},
  C_BOOST_OUT1:{x:3.4,y:46.25,max:3},
  C_GAUGE:{x:28,y:14.5,max:3.5},
}

export function Power() {
  return <Fragment>
    <net name="VBAT" isPowerNet nominalTraceWidth={1} routingPhaseIndex={1}/><net name="VSYS" isPowerNet nominalTraceWidth={1} routingPhaseIndex={1}/><net name="FB" routingPhaseIndex={2}/><net name="BOOST_SW" nominalTraceWidth={0.8} routingPhaseIndex={1}/>
    <TYPE_C_31_M_12 name="J_USB" pcbX={25} pcbY={56.6} pcbRotation={180}
      layer="bottom" schX={94} schY={17} schSectionName="power"
      schPinArrangement={{leftSide:["VBUS1","VBUS2","CC1","CC2","DP1","DN1","DP2","DN2"],
        rightSide:["GND1","GND2","EH1","EH2","EH3","EH4","SBU1","SBU2"]}} />
    {["VBUS1","VBUS2"].map(p=><trace key={p} from={`J_USB.${p}`} to="net.USB_5V" thickness={0.5} routingPhaseIndex={1}/>)}
    {["GND1","GND2","EH1","EH2","EH3","EH4"].map(p=><trace key={p} from={`J_USB.${p}`} to="net.GND" thickness={0.4} routingPhaseIndex={1}/>)}
    <trace from="J_USB.VBUS1" to="J_USB.VBUS2" thickness={0.5} routingPhaseIndex={1}
      pcbPathRelativeTo="J_USB.VBUS1" pcbPath={["J_USB.VBUS1",{x:-2.4001603,y:3.4},
        {x:2.3999571,y:3.4},"J_USB.VBUS2"]}/>
    <trace from="C_USB.pin1" to="J_USB.VBUS2" thickness={0.5} routingPhaseIndex={1} maxLength={15}
      pcbPathRelativeTo="C_USB.pin1" pcbPath={["C_USB.pin1",{x:-0.8,y:2.4},
        {x:-0.8,y:6.7},{x:-0.8,y:6.7,via:true,toLayer:"bottom"},{x:-0.8,y:6.7},
        {x:0.6000429,y:8.1},"J_USB.VBUS2"]}/>
    <Fragment><BQ24074RGTR name="U_CHARGE" pcbX={19} pcbY={42}
      schX={98} schY={-1} schSectionName="power"
       /><Connections name="U_CHARGE" connections={{N_CE:"net.GND",
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
       /><Connections name="U_BOOST" connections={{GND:"net.GND",FB:"net.FB"}}/></Fragment>
    <Fragment><WPN252012E1R0MT name="L_BOOST" pcbX={6} pcbY={49}
      schX={66} schY={-9} schSectionName="power"
       /><Connections name="L_BOOST" connections={{pin1:"net.VSYS"}}/></Fragment>
    {/* Critical switching node is manually routed; remaining connections autoroute. */}
    <trace from="L_BOOST.pin2" to="U_BOOST.SW" thickness={0.2}
      pcbPathRelativeTo="L_BOOST"
      pcbPath={["L_BOOST.pin2",{x:2.6,y:0},"U_BOOST.SW"]} routingPhaseIndex={1} />
    <trace from="U_BOOST.SW" to="net.BOOST_SW" thickness={0.2} routingPhaseIndex={1}/>
    {/* Supplier pin pitch requires narrow local escapes; the rail trunks autoroute. */}
    {["OUT1","OUT2"].map(pin=><Fragment key={pin}>
      <trace from={`U_CHARGE.${pin}`} to="C_SYS.pin1" thickness={0.3} routingPhaseIndex={1}
        pcbPathRelativeTo={`U_CHARGE.${pin}`}
        pcbPath={[`U_CHARGE.${pin}`,{x:2.2,y:pin==="OUT1"?-0.249809:0.250063},"C_SYS.pin1"]}/>
    </Fragment>)}
    {["BAT1","BAT2"].map(pin=><Fragment key={pin}>
      <trace from={`U_CHARGE.${pin}`} to="C_BAT.pin1" thickness={0.3} routingPhaseIndex={1}
        pcbPath={[`U_CHARGE.${pin}`,"C_BAT.pin1"]}/>
    </Fragment>)}
    <trace from="C_BAT.pin1" to="J_BAT.pin1" thickness={0.8} routingPhaseIndex={1} maxLength={55}
      pcbPathRelativeTo="C_BAT.pin1" pcbPath={["C_BAT.pin1",{x:-1.4,y:0.5},
        {x:-1.4,y:2.8},{x:-1.4,y:2.8,via:true,toLayer:"bottom"},{x:-1.4,y:2.8},
        {x:-1.4,y:0.9},{x:-8,y:0.9},{x:-8,y:1.1},{x:-17,y:1.1},
        {x:-17,y:14},"J_BAT.pin1"]}/>
    <trace from="U_CHARGE.IN" to="C_USB.pin1" thickness={0.3} routingPhaseIndex={1}
      pcbPathRelativeTo="U_CHARGE.IN" pcbPath={["U_CHARGE.IN",{x:0.750189,y:2.1},"C_USB.pin1"]}/>
    <trace from="U_CHARGE.EN1" to="C_SYS.pin1" thickness={0.15} routingPhaseIndex={1} maxLength={12}
      pcbPathRelativeTo="U_CHARGE.EN1" pcbPath={["U_CHARGE.EN1",{x:-0.249809,y:-2.35},
        {x:-0.5,y:-2.7},{x:-0.5,y:-2.7,via:true,toLayer:"bottom"},{x:-0.5,y:-2.7},
        {x:3,y:-3.4},{x:3,y:-3.4,via:true,toLayer:"top"},{x:3,y:-3.4},"C_SYS.pin1"]}/>
    <trace from="U_BOOST.VIN" to="C_BOOST_IN.pin1" thickness={0.3} routingPhaseIndex={1}
      pcbPath={["U_BOOST.VIN","C_BOOST_IN.pin1"]}/>
    <trace from="U_BOOST.VOUT" to="C_BOOST_OUT1.pin1" thickness={0.3} routingPhaseIndex={1}
      pcbPathRelativeTo="U_BOOST.VOUT" pcbPath={["U_BOOST.VOUT",{x:-1.4,y:-1.1},
        "C_BOOST_OUT1.pin1"]}/>
    {/* Keep the sensitive feedback divider away from the switching node. */}
    <trace from="U_BOOST.FB" to="R_FB_HI.pin2" thickness={0.2} routingPhaseIndex={2}
      pcbPath={["U_BOOST.FB","R_FB_HI.pin2"]}/>
    <trace from="R_FB_LO.pin1" to="R_FB_HI.pin2" thickness={0.2} routingPhaseIndex={2}
      pcbPath={["R_FB_LO.pin1","R_FB_HI.pin2"]}/>
    <trace from="C_FEEDFORWARD.pin2" to="R_FB_HI.pin2" thickness={0.2} routingPhaseIndex={2}
      pcbPath={["C_FEEDFORWARD.pin2","R_FB_HI.pin2"]}/>
    <trace from="U_CHARGE.TMR" to="R_TIMER.pin1" thickness={0.15} routingPhaseIndex={2}
      pcbPathRelativeTo="U_CHARGE.TMR" pcbPath={["U_CHARGE.TMR",{x:0.250063,y:4.3},"R_TIMER.pin1"]}/>
    <via name="TIMER_GND" pcbX={19.825} pcbY={48.3} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="top" toLayer="bottom" connectsTo="net.GND"/>
    <trace from="R_TIMER.pin2" to="TIMER_GND.top" thickness={0.2} routingPhaseIndex={1}
      pcbPath={["R_TIMER.pin2","TIMER_GND.top"]}/>
    <via name="FEEDBACK_GND" pcbX={17.25} pcbY={44.3} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="top" toLayer="bottom" connectsTo="net.GND"/>
    <trace from="R_FB_LO.pin2" to="FEEDBACK_GND.top" thickness={0.2} routingPhaseIndex={1}
      pcbPath={["R_FB_LO.pin2","FEEDBACK_GND.top"]}/>
    {/* Escape EN through the copper gap between the SOT-563 pads. */}
    <trace from="U_BOOST.EN" to="R_EN.pin2" thickness={0.2} routingPhaseIndex={2}
      pcbPathRelativeTo="U_BOOST.EN" pcbPath={["U_BOOST.EN",{x:0.1,y:-0.000127},
        {x:0.1,y:-1.8},{x:0.1,y:-1.8,via:true,toLayer:"bottom"},{x:0.1,y:-1.8},
        {x:3.325,y:5.5},{x:3.325,y:5.5,via:true,toLayer:"top"},{x:3.325,y:5.5},"R_EN.pin2"]}/>
    <copperpour name="SW_COPPER" layer="top" connectsTo="net.BOOST_SW" clearance={0.2}
      outline={[{x:6.7,y:48.4},{x:8.5,y:48.4},{x:9.25,y:48.9},
        {x:9.25,y:49.1},{x:8.5,y:49.6},{x:6.7,y:49.6}]} />
    <trace from="U_CHARGE.EP" to="U_CHARGE.VSS" thickness={0.2}
      pcbPathRelativeTo="U_CHARGE"
      pcbPath={["U_CHARGE.EP",{x:0.75,y:-1},"U_CHARGE.VSS"]} routingPhaseIndex={1}/>
    {/* Escape PGOOD below the charger, around the GPIO holes and Pi mount. */}
    <trace from="U_CHARGE.N_PGOOD" to="R_GOOD_PULL.pin2" thickness={0.15}
      pcbPathRelativeTo="U_CHARGE" routingPhaseIndex={0}
      pcbPath={["U_CHARGE.N_PGOOD",{x:0.25,y:-4.3},{x:12.5,y:-4.3},
        {x:12.5,y:-15},"R_GOOD_PULL.pin2"]}/>
    <via name="GOOD_SIGNAL" pcbX={26.3} pcbY={25.5} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="top" toLayer="bottom" connectsTo="net.USB_GOOD_N"/>
    <trace from="R_GOOD_PULL.pin2" to="GOOD_SIGNAL.top" thickness={0.15} routingPhaseIndex={0}
      pcbPath={["R_GOOD_PULL.pin2","GOOD_SIGNAL.top"]}/>
    <trace from="GOOD_SIGNAL.bottom" to="J_PI.pin32" thickness={0.15} routingPhaseIndex={0}
      pcbPathRelativeTo="GOOD_SIGNAL.bottom" pcbPath={["GOOD_SIGNAL.bottom",{x:0,y:6},
        {x:-40.27,y:6},"J_PI.pin32"]}/>
    {/* Low-current status pull-up feed crosses the I2C clock on the other outer layer. */}
    <trace from="R_GOOD_PULL.pin1" to="R_ALERT_PULL.pin1" thickness={0.15} routingPhaseIndex={1}
      pcbPathRelativeTo="R_GOOD_PULL.pin1" pcbPath={["R_GOOD_PULL.pin1",{x:-1.2,y:1.5},
        {x:-1.2,y:1.5,via:true,toLayer:"bottom"},{x:-1.2,y:1.5},{x:6.5,y:-13.5},
        {x:6.5,y:-13.5,via:true,toLayer:"top"},{x:6.5,y:-13.5},"R_ALERT_PULL.pin1"]}/>
    {[[21,40],[17,40],[17,43.5],[18.5,45.5]].map(([x,y],i)=><Fragment key={i}>
      <via name={`CHARGE_GND_${i}`} pcbX={x} pcbY={y} holeDiameter={0.3} outerDiameter={0.65}
        fromLayer="top" toLayer="bottom" connectsTo="net.GND" />
    </Fragment>)}
    <Fragment><pinheader name="J_OFF" pinCount={2} pitch={2.54} gender="male"
      pcbX={34} pcbY={45} layer="bottom" schX={66} schY={-2} schSectionName="power"
      manufacturerPartNumber="1x2 2.54mm slide-switch harness"
       /><Connections name="J_OFF" connections={{pin1:"R_EN.pin2",pin2:"net.GND"}}/></Fragment>
    {resistors.map(r=><Fragment key={r.name}><resistor key={r.name} name={r.name} resistance={r.value}
      footprint="0603" supplierPartNumbers={{jlcpcb:[r.part]}}
      pcbX={r.x} pcbY={r.y} pcbRotation={r.name==="R_ISET"||r.name==="R_FB_HI"?180:0} schX={r.sx+(r.name==="R_ALERT_PULL"?6:70)} schY={r.sy} schRotation={-90}
      schSectionName={r.name==="R_ALERT_PULL"?"battery":"power"}
       />{r.name === "R_ILIM" ? <Fragment>
        <Connections name={r.name} connections={{pin2:r.b}}/>
        <trace from="U_CHARGE.ILIM" to="R_ILIM.pin1" thickness={0.15}
          pcbPathRelativeTo="U_CHARGE.ILIM" routingPhaseIndex={2}
          pcbPath={["U_CHARGE.ILIM",{x:2.2,y:0.750189},{x:2.2,y:1.5},
            {x:6.675,y:1.5},"R_ILIM.pin1"]}/>
      </Fragment> : <Connections name={r.name} connections={r.name==="R_FB_HI"||r.name==="R_EN"?{pin1:r.a}:
        r.name==="R_FB_LO"||r.name==="R_TIMER"||r.name==="R_ALERT_PULL"?{pin2:r.b}:{pin1:r.a,pin2:r.b}}/>}</Fragment>)}
    {caps.map(c=><Fragment key={c.name}><capacitor key={c.name} name={c.name} capacitance={c.value}
      footprint={c.fp} supplierPartNumbers={{jlcpcb:[c.part]}}
      pcbX={c.x} pcbY={c.y}
      pcbRotation={c.name==="C_BAT"||c.name==="C_FEEDFORWARD"||c.name==="C_GAUGE"||c.name.startsWith("C_BOOST_OUT")?180:0}
      maxDecouplingTraceLength={localBypass[c.name]?.max}
      schX={c.name==="C_BOOST_OUT1"||c.name==="C_BAT"||c.name==="C_SYS"?-36:c.name==="C_BOOST_OUT2"||c.name==="C_GAUGE"||c.name==="C_BOOST_IN"?-32.5:c.sx+70}
      schY={c.name.startsWith("C_BOOST_OUT")?-31:c.name==="C_BAT"||c.name==="C_GAUGE"?-37:c.name==="C_SYS"||c.name==="C_BOOST_IN"?-43:c.sy}
      schRotation={-90}
      schSectionName={["C_GAUGE","C_BAT","C_SYS","C_BOOST_IN","C_BOOST_OUT1","C_BOOST_OUT2"].includes(c.name)?"decoupling":"power"}
       /><Connections name={c.name} connections={{pin1:`net.${c.a}`,
         ...(localBypass[c.name]||c.name==="C_FEEDFORWARD"?{}:{pin2:`net.${c.b}`})}}/>
       {localBypass[c.name] && <Fragment>
         <via name={`${c.name}_GND`} pcbX={localBypass[c.name].x} pcbY={localBypass[c.name].y}
           holeDiameter={0.3} outerDiameter={0.65} fromLayer="top" toLayer="bottom" connectsTo="net.GND"/>
         <trace from={`${c.name}.pin2`} to={`${c.name}_GND.top`} thickness={0.2}
           routingPhaseIndex={1} pcbPath={[`${c.name}.pin2`,`${c.name}_GND.top`]}/>
       </Fragment>}
    </Fragment>)}
    <Fragment><MAX17048G_T10 name="U_GAUGE" pcbX={32} pcbY={18}
      schX={50} schY={-17} schSectionName="battery"
       /><Connections name="U_GAUGE" connections={{CELL:"net.VBAT",VDD:"net.VBAT",CTG:"net.GND",GND:"net.GND",
        EP:"net.GND",QSTRT:"net.GND",SCL:"net.SCL",SDA:"net.SDA",N_ALRT:"net.BAT_ALERT_N"}}/></Fragment>
    <trace from="U_GAUGE.CELL" to="C_GAUGE.pin1" thickness={0.15} routingPhaseIndex={1}
      pcbPathRelativeTo="U_GAUGE.CELL" pcbPath={["U_GAUGE.CELL",{x:-0.249936,y:-1.9},"C_GAUGE.pin1"]}/>
    <trace from="U_GAUGE.VDD" to="C_GAUGE.pin1" thickness={0.15} routingPhaseIndex={1}
      pcbPathRelativeTo="U_GAUGE.VDD" pcbPath={["U_GAUGE.VDD",{x:0.249936,y:-1.8},
        {x:-0.249936,y:-1.9},"C_GAUGE.pin1"]}/>
    {/* Low-current monitor feed is independent of the wide charging/load path. */}
    <trace from="C_GAUGE.pin1" to="J_BAT.pin1" thickness={0.2} routingPhaseIndex={1} maxLength={25}
      pcbPathRelativeTo="C_GAUGE.pin1" pcbPath={["C_GAUGE.pin1",{x:-0.825,y:1.9},
        {x:-4.2,y:1.9},{x:-6,y:0.1},{x:-6,y:-9},"J_BAT.pin1"]}/>
    <via name="GAUGE_GND" pcbX={34.5} pcbY={17.062486} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="top" toLayer="bottom" connectsTo="net.GND"/>
    <via name="GAUGE_CTG_GND" pcbX={29.2} pcbY={16.1} holeDiameter={0.3} outerDiameter={0.65}
      fromLayer="top" toLayer="bottom" connectsTo="net.GND"/>
    <trace from="U_GAUGE.GND" to="GAUGE_GND.top" thickness={0.15} routingPhaseIndex={1}
      pcbPath={["U_GAUGE.GND","GAUGE_GND.top"]}/>
    <trace from="U_GAUGE.EP" to="GAUGE_GND.top" thickness={0.15} routingPhaseIndex={1}
      pcbPathRelativeTo="U_GAUGE.EP" pcbPath={["U_GAUGE.EP",{x:1.2,y:0},
        {x:1.2,y:-0.937514},"GAUGE_GND.top"]}/>
    <trace from="U_GAUGE.QSTRT" to="U_GAUGE.EP" thickness={0.15} routingPhaseIndex={1}
      pcbPath={["U_GAUGE.QSTRT","U_GAUGE.EP"]}/>
    <trace from="U_GAUGE.CTG" to="GAUGE_CTG_GND.top" thickness={0.15} routingPhaseIndex={1}
      pcbPath={["U_GAUGE.CTG","GAUGE_CTG_GND.top"]}/>
    <silkscreentext text="BAT + / - / NTC" pcbX={37} pcbY={29} pcbRotation={90} layer="bottom" fontSize={0.8}/>
    <silkscreentext text="OFF WHEN CLOSED" pcbX={32} pcbY={48} layer="bottom" fontSize={0.8}/>
    <silkscreentext text="USB-C CHARGE 5V" pcbX={25} pcbY={51} layer="bottom" fontSize={0.8}/>
  </Fragment>
}
