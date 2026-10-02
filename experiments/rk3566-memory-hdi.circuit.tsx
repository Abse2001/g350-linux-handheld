import type {FanoutTracePath} from "@tscircuit/props"
import {RK3566} from "../imports/RK3566"
import {H9HCNNN8KUMLHR_NME} from "../imports/H9HCNNN8KUMLHR_NME"
import connections from "../lib/integrated/memory-connections.json"
import socPads from "../lib/integrated/RK3566-pad-centres.json"
import ramPads from "../lib/integrated/H9HCNNN8KUMLHR_NME-pad-centres.json"
import {routeHdiMemory} from "../lib/integrated/hdi/HdiMemoryAutorouter"

// Proposed 1+6+1 HDI process, not a fabrication release. Components are on
// Top. Manual filled/capped microvias connect Top-L2 (0.25/0.10mm); every
// new autorouted buried via explicitly spans the L2-L7 core (0.30/0.15mm).
// Reference planes, complete host power and DDR timing are not present yet.
const escapes=(chip:"U_SOC"|"U_RAM"):FanoutTracePath[]=>connections.map(c=>{
  const pad=chip==="U_SOC"?socPads[c.socBall as keyof typeof socPads]:ramPads[c.ramBall as keyof typeof ramPads]
  const x=chip==="U_SOC"?pad.x:-pad.y,y=chip==="U_SOC"?pad.y:pad.x
  let vx=x,vy=y
  if(chip==="U_SOC"&&/^A\d+$/.test(c.socBall))vy=Number(c.socBall.slice(1))%2?7.85:8.5
  else if(chip==="U_SOC"&&Math.abs(x+7.370191)<.005)vx=Math.round((y-.015)/.4)%2?-8.45:-9.1
  else if(chip==="U_SOC"&&!c.socBall.startsWith("1")) {
    vx=.23+Math.round((x-.23)/.4)*.4;vy=.015+Math.round((y-.015)/.4)*.4
  }
  return {connection:`${chip}.${chip==="U_SOC"?c.socBall:c.ramBall}`,route:[
    {route_type:"wire",x,y,layer:"top",width:.1},{route_type:"wire",x:vx,y:vy,layer:"top",width:.1},
    {route_type:"via",x:vx,y:vy,from_layer:"top",to_layer:"inner1",via_diameter:.25,via_hole_diameter:.1,layers:["top","inner1"]},
    {route_type:"wire",x:vx,y:vy,layer:"inner1",width:.1},
  ]}
})
const outerSignals=connections.filter(c=>c.name!=="LPDDR4_RESETn"&&c.phase!==0&&!c.socBall.startsWith("1"))
const signalPhase=(c:typeof connections[number])=>{
  if(c.name==="LPDDR4_RESETn")return 4
  const channel=c.name.endsWith("_B")?1:0
  if(c.socBall.startsWith("1"))return c.phase===1?channel:2+channel
  if(c.phase===0)return 5
  return 6+outerSignals.indexOf(c)
}
const phaseNames=["HDI_INNER_A_DATA","HDI_INNER_B_DATA","HDI_INNER_A_CONTROL","HDI_INNER_B_CONTROL","HDI_RESET",
  "HDI_CLOCK_STROBES",...outerSignals.map(c=>`HDI_OUTER_${c.name}`)]
export default ()=> <board title="G350 RK3566 — HDI memory feasibility fixture"
  width={36} height={44} layers={8} thickness={1.6}
  minTraceWidth={.09} nominalTraceWidth={.1} minTraceToPadEdgeClearance={.09}
  minPadEdgeToPadEdgeClearance={.15} minViaHoleDiameter={.1} minViaPadDiameter={.25}
  minTraceToHoleEdgeClearance={.2} minViaHoleEdgeToViaHoleEdgeClearance={.24}
  minViaEdgeToPadEdgeClearance={.09} isViaInPadAllowed={true} allowBlindAndBuriedVias={true}
  pcbStyle={{viaHoleDiameter:.1,viaPadDiameter:.25}}
  autorouter="auto_local" autorouterEffortLevel="5x" routeRemaining={false}>
  {phaseNames.map((name,index)=><autoroutingphase key={name} name={name} phaseIndex={index} algorithmFn={routeHdiMemory}/>)}
  <bus name="HDI_MEMORY_SIGNAL_LAYERS" connections={connections.map(c=>c.name)} pcbAllowedLayers={["inner1","inner3","inner5","inner6"]}/>
  <breakout name="SOC_ESCAPE" pcbX={0} pcbY={0} width={19} height={19} pcbTracePaths={escapes("U_SOC")}>
    <RK3566 name="U_SOC" pcbX={0} pcbY={0} layer="top" schX={-15} schY={0} schWidth={8} schHeight={50}/>
  </breakout>
  <breakout name="RAM_ESCAPE" pcbX={-4} pcbY={15} width={16} height={11} pcbTracePaths={escapes("U_RAM")}>
    <H9HCNNN8KUMLHR_NME name="U_RAM" pcbX={0} pcbY={0} pcbRotation={90} layer="top" schX={15} schY={0} schWidth={8} schHeight={30}/>
  </breakout>
  {connections.map(c=><trace key={c.name} name={c.name} from={`U_SOC.${c.socBall}`} to={`U_RAM.${c.ramBall}`}
    thickness={.1} routingPhaseIndex={signalPhase(c)}/>)}
  <silkscreentext text="HDI MEMORY TEST — DO NOT FAB" pcbX={0} pcbY={-20} fontSize={1}/>
</board>
