import {Fragment} from "react"
import "./ThroughSignalVia"

// Give the I2C clock a continuous manual path away from the button IC's
// fine-pitch data escape. The gauge-to-host branch is drawn in index.circuit.tsx.
export function ControlEscapes(){
  return <Fragment>
    {[
      {name:"SIGNAL_SCL_KEYS",x:-6.15,y:-14.5},
      {name:"SIGNAL_SCL_LCD",x:-29.3,y:22.5},
    ].map(v=><Fragment key={v.name}><via name={v.name} pcbX={v.x} pcbY={v.y} fromLayer="bottom" toLayer="top"
      holeDiameter={0.3} outerDiameter={0.65} connectsTo="net.SCL"/></Fragment>)}
    <trace from="SIGNAL_SCL_KEYS.bottom" to="U_KEYS.SCL" thickness={0.15} routingPhaseIndex={0}
      pcbPathRelativeTo="SIGNAL_SCL_KEYS.bottom"
      pcbPath={["SIGNAL_SCL_KEYS.bottom",{x:.435,y:.85},"U_KEYS.SCL"]}/>
    <trace from="SIGNAL_SCL_LCD.bottom" to="J_LCD.pin13" thickness={0.15} routingPhaseIndex={0}
      pcbPathRelativeTo="SIGNAL_SCL_LCD.bottom"
      pcbPath={["SIGNAL_SCL_LCD.bottom",{x:-4.5,y:0},{x:-4.5,y:-.75},"J_LCD.pin13"]}/>
    <trace from="SIGNAL_SCL_KEYS.inner2" to="J_PI.pin5" thickness={0.15} routingPhaseIndex={0}
      pcbPathRelativeTo="SIGNAL_SCL_KEYS.inner2"
      pcbPath={["SIGNAL_SCL_KEYS.inner2",{x:-3.85,y:0},{x:-3.85,y:40.7},
        {x:23.93,y:40.7},{x:23.93,y:49.5},"J_PI.pin5"]}/>
    <trace from="SIGNAL_SCL_LCD.inner2" to="SIGNAL_SCL_KEYS.inner2" thickness={0.15} routingPhaseIndex={0}
      pcbPathRelativeTo="SIGNAL_SCL_LCD.inner2"
      pcbPath={["SIGNAL_SCL_LCD.inner2",{x:0,y:3.7},{x:19.3,y:3.7},
        {x:19.3,y:-37},"SIGNAL_SCL_KEYS.inner2"]}/>
    {[
      {net:"BUTTON_MENU",button:"SW_MENU",port:"GPB2",entry:[-4,-23],exit:[-11,-10],input:[5.715,-10.6],
        front:[[-3,-25]],rear:[]},
      {net:"BUTTON_SELECT",button:"SW_SELECT",port:"GPB0",entry:[-9,-22],exit:[-9,-9],input:[8.255,-10.6],
        front:[[-6,-23],[-6,-49.3],[-16,-49.3],[-16,-50.150118]],rear:[[8.255,-9]]},
      {net:"BUTTON_UP",button:"SW_UP",port:"GPA0",entry:[-18,-13],exit:[-18,-4],input:[-.635,-4.7],
        front:[],rear:[[-5,-4]]},
    ].map(c=>{
      const entry=`SIGNAL_${c.net}_ENTRY`,exit=`SIGNAL_${c.net}_EXIT`,input=`SIGNAL_${c.net}_INPUT`
      const isMenu=c.net==="BUTTON_MENU"
      return <Fragment key={c.net}>
        <net name={c.net} routingPhaseIndex={0}/>
        {[[entry,c.entry],...isMenu?[]:[[exit,c.exit]],[input,c.input]].map(([name,pos])=><Fragment key={name as string}><via
          name={name as string} pcbX={(pos as number[])[0]} pcbY={(pos as number[])[1]}
          fromLayer="bottom" toLayer="top" holeDiameter={0.3} outerDiameter={0.65} connectsTo={`net.${c.net}`}/></Fragment>)}
        <trace from={`${entry}.top`} to={`${c.button}.pin1`} thickness={0.15} routingPhaseIndex={0}
          pcbPathRelativeTo={`${entry}.top`}
          pcbPath={[`${entry}.top`,...c.front.map(([x,y])=>({x:x-c.entry[0],y:y-c.entry[1]})),`${c.button}.pin1`]}/>
        {isMenu?<trace from={`${entry}.inner1`} to={`${input}.inner1`} thickness={0.15} routingPhaseIndex={0}
          pcbPathRelativeTo={`${entry}.inner1`}
          pcbPath={[`${entry}.inner1`,{x:c.exit[0]-c.entry[0],y:c.exit[1]-c.entry[1]},`${input}.inner1`]}/>:
        <Fragment><trace from={`${entry}.bottom`} to={`${exit}.bottom`} thickness={0.15} routingPhaseIndex={0}
          pcbPath={[`${entry}.bottom`,`${exit}.bottom`]}/>
        <trace from={`${exit}.inner1`} to={`${input}.inner1`} thickness={0.15} routingPhaseIndex={0}
          pcbPathRelativeTo={`${exit}.inner1`}
          pcbPath={[`${exit}.inner1`,...c.rear.map(([x,y])=>({x:x-c.exit[0],y:y-c.exit[1]})),`${input}.inner1`]}/></Fragment>}
        <trace from={`${input}.bottom`} to={`U_KEYS.${c.port}`} thickness={0.15} routingPhaseIndex={0}
          pcbPath={[`${input}.bottom`,`U_KEYS.${c.port}`]}/>
      </Fragment>
    })}
    {/* Fix the LEFT input escape; autoroute its remaining run to the switch. */}
    <net name="BUTTON_LEFT" routingPhaseIndex={0}/>
    <via name="SIGNAL_BUTTON_LEFT_INPUT" pcbX={1.23} pcbY={-4.62} fromLayer="bottom" toLayer="top"
      holeDiameter={0.3} outerDiameter={0.65} connectsTo="net.BUTTON_LEFT"/>
    <trace from="SIGNAL_BUTTON_LEFT_INPUT.bottom" to="U_KEYS.GPA2" thickness={0.15} routingPhaseIndex={0}
      pcbPath={["SIGNAL_BUTTON_LEFT_INPUT.bottom","U_KEYS.GPA2"]}/>
    <trace from="SIGNAL_BUTTON_LEFT_INPUT.inner2" to="SW_LEFT.pin1" thickness={0.2} routingPhaseIndex={0}/>
    {/* Keep the charger's current-setting connection clear of ground vias. */}
    <net name="CHARGE_ISET" routingPhaseIndex={2}/>
    <via name="SIGNAL_ISET_CHARGER" pcbX={18.25} pcbY={44.4} fromLayer="bottom" toLayer="top"
      holeDiameter={0.3} outerDiameter={0.65} connectsTo="net.CHARGE_ISET"/>
    <via name="SIGNAL_ISET_SETTING" pcbX={14.825} pcbY={38.9} fromLayer="bottom" toLayer="top"
      holeDiameter={0.3} outerDiameter={0.65} connectsTo="net.CHARGE_ISET"/>
    <trace from="SIGNAL_ISET_CHARGER.top" to="U_CHARGE.ISET" thickness={0.15} routingPhaseIndex={2}
      pcbPath={["SIGNAL_ISET_CHARGER.top","U_CHARGE.ISET"]}/>
    <trace from="SIGNAL_ISET_SETTING.top" to="R_ISET.pin1" thickness={0.15} routingPhaseIndex={2}
      pcbPath={["SIGNAL_ISET_SETTING.top","R_ISET.pin1"]}/>
    <trace from="SIGNAL_ISET_CHARGER.inner1" to="SIGNAL_ISET_SETTING.inner1" thickness={0.15} routingPhaseIndex={2}
      pcbPathRelativeTo="SIGNAL_ISET_CHARGER.inner1"
      pcbPath={["SIGNAL_ISET_CHARGER.inner1",{x:0,y:-1.8},{x:-3.425,y:-1.8},"SIGNAL_ISET_SETTING.inner1"]}/>
    {/* Route the open-drain charging indication away from the wide VSYS path. */}
    <via name="SIGNAL_CHG_CHARGER" pcbX={20.2} pcbY={39.5} fromLayer="bottom" toLayer="top"
      holeDiameter={0.3} outerDiameter={0.65} connectsTo="net.CHARGING_N"/>
    <via name="SIGNAL_CHG_PULL" pcbX={25.65} pcbY={30.7} fromLayer="bottom" toLayer="top"
      holeDiameter={0.3} outerDiameter={0.65} connectsTo="net.CHARGING_N"/>
    <trace from="SIGNAL_CHG_CHARGER.top" to="U_CHARGE.N_CHG" thickness={0.15} routingPhaseIndex={0}
      pcbPathRelativeTo="SIGNAL_CHG_CHARGER.top"
      pcbPath={["SIGNAL_CHG_CHARGER.top",{x:0,y:-.2},{x:1.45,y:-.2},{x:1.45,y:1.3},{x:1,y:1.3},{x:1,y:1.750065},"U_CHARGE.N_CHG"]}/>
    <trace from="SIGNAL_CHG_PULL.top" to="R_CHG_PULL.pin2" thickness={0.15} routingPhaseIndex={0}
      pcbPath={["SIGNAL_CHG_PULL.top","R_CHG_PULL.pin2"]}/>
    <trace from="SIGNAL_CHG_PULL.inner2" to="SIGNAL_CHG_CHARGER.inner2" thickness={0.15} routingPhaseIndex={0}
      pcbPathRelativeTo="SIGNAL_CHG_PULL.inner2"
      pcbPath={["SIGNAL_CHG_PULL.inner2",{x:1.35,y:0},{x:1.35,y:10.3},{x:-5.45,y:10.3},"SIGNAL_CHG_CHARGER.inner2"]}/>
    <trace from="SIGNAL_CHG_CHARGER.inner2" to="J_PI.pin29" thickness={0.15} routingPhaseIndex={0}
      pcbPathRelativeTo="SIGNAL_CHG_CHARGER.inner2"
      pcbPath={["SIGNAL_CHG_CHARGER.inner2",{x:0,y:1.5},{x:-30.36,y:1.5},{x:-30.36,y:-2},"J_PI.pin29"]}/>
  </Fragment>
}
