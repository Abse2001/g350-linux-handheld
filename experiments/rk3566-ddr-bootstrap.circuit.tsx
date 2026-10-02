import type {FanoutTracePath} from "@tscircuit/props"
import {RK3566} from "../imports/RK3566"
import {H9HCNNN8KUMLHR_NME} from "../imports/H9HCNNN8KUMLHR_NME"
import connections from "../lib/integrated/memory-connections.json"
import {ddrBootstrapGroups as groups,ddrBootstrapPairs as pairs} from "../lib/integrated/DdrRoutingGroups"
import {thinMemoryEscapes} from "./rk3566-memory-thin-hdi.circuit"

// https://docs.tscircuit.com/guides/routing-ddr
// Start with the public DDR bus-lanes solver. Manual escapes preserve the
// actual Top-L2 microvias and add explicit filled/capped L2-L7 core stacks
// so corresponding lane endpoints share a physical routing layer. The
// interconnect solver must not invent a layer change or a drilled span.
// Trial skew/gap values are geometry experiments; impedance and complete
// RK3566 timing remain unqualified. No powered host or order bundle exists.
const escapes=(chip:"U_SOC"|"U_RAM"):FanoutTracePath[]=>thinMemoryEscapes(chip).map((path,index)=>{
  const layer=groups.find(g=>g.signals.includes(connections[index].name))!.layer
  if(layer==="inner1")return path
  const end=path.route[path.route.length-1]
  if(end.route_type!=="wire")throw new Error("Expected a physical L2 escape endpoint")
  return {...path,route:[...path.route,
    {route_type:"via",x:end.x,y:end.y,from_layer:"inner1",to_layer:layer,
      layers:["inner1","inner2","inner3","inner4","inner5","inner6"],via_diameter:.25,via_hole_diameter:.1},
    {...end,layer},
  ]}
})

export default ()=> <board title="RK3566 — DDR bus-lanes bootstrap, unqualified"
  width={36} height={44} layers={8} thickness={1}
  minTraceWidth={.09} nominalTraceWidth={.1} minTraceToPadEdgeClearance={.09}
  minPadEdgeToPadEdgeClearance={.15} minViaHoleDiameter={.1} minViaPadDiameter={.25}
  minTraceToHoleEdgeClearance={.2} minViaHoleEdgeToViaHoleEdgeClearance={.24}
  minViaEdgeToPadEdgeClearance={.09} isViaInPadAllowed allowBlindAndBuriedVias
  autorouter="auto_local" autorouterEffortLevel="5x" routeRemaining={false}>
  {groups.map((g,index)=><autoroutingphase key={g.name} name={g.name} phaseIndex={index} autorouter="bus_lanes"/>)}
  {groups.filter(g=>g.signals.length>1).map(g=><bus name={g.name}
    connections={g.signals} pcbAllowedLayers={[g.layer]} pcbTraceWidth={.1}
    maxLengthSkew={g.trialMaxLengthSkew}/>)}
  {pairs.map(p=><differentialpair {...p} maxLengthSkew={.1} pcbTraceGap={.09}/>)}
  <breakout name="SOC_ESCAPE" pcbX={0} pcbY={0} width={19} height={19} pcbTracePaths={escapes("U_SOC")}>
    <RK3566 name="U_SOC" pcbX={0} pcbY={0} layer="top" schX={-15} schY={0} schWidth={8} schHeight={50}/>
  </breakout>
  <breakout name="RAM_ESCAPE" pcbX={-4} pcbY={15} width={16} height={11} pcbTracePaths={escapes("U_RAM")}>
    <H9HCNNN8KUMLHR_NME name="U_RAM" pcbX={0} pcbY={0} pcbRotation={90} layer="top" schX={15} schY={0} schWidth={8} schHeight={30}/>
  </breakout>
  {connections.map(c=><trace key={c.name} name={c.name} from={`U_SOC.${c.socBall}`} to={`U_RAM.${c.ramBall}`}
    thickness={.1} routingPhaseIndex={groups.findIndex(g=>g.signals.includes(c.name))}/>)}
  <silkscreentext text="DDR BOOTSTRAP — DO NOT FAB" pcbX={0} pcbY={-20} fontSize={.9}/>
</board>
