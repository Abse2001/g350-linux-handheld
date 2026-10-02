import { Fragment } from "react"
import { RK3566 } from "../imports/RK3566"
import { H9HCNNN8KUMLHR_NME } from "../imports/H9HCNNN8KUMLHR_NME"
import connections from "../lib/integrated/memory-connections.json"

// Routing feasibility experiment only. This is not a complete powered computer.
// All 765 physical chip pads remain obstacles, including unused/power balls.
// No ready-made computer, SOM, or PCB has been imported.
export default () => (
  <board title="G350 integrated RK3566 — memory routing experiment"
    width={64} height={46} layers={6} thickness={1.6}
    minTraceWidth={0.09} nominalTraceWidth={0.1}
    minTraceToPadEdgeClearance={0.09} minPadEdgeToPadEdgeClearance={0.15}
    minViaHoleDiameter={0.2} minViaPadDiameter={0.4}
    isViaInPadAllowed={false} allowBlindAndBuriedVias={false}
    pcbStyle={{viaHoleDiameter:0.2,viaPadDiameter:0.4}}
    autorouter="auto_local" autorouterEffortLevel="2x" routeRemaining={false}>
    <autoroutingphase name="MEMORY_CLOCK_STROBES" phaseIndex={0}/>
    <autoroutingphase name="MEMORY_DATA" phaseIndex={1}/>
    <autoroutingphase name="MEMORY_ADDRESS_CONTROL" phaseIndex={2}/>
    <RK3566 name="U_SOC" pcbX={0} pcbY={0} layer="top"
      schX={-15} schY={0} schWidth={8} schHeight={50}/>
    <H9HCNNN8KUMLHR_NME name="U_RAM" pcbX={-17} pcbY={11} pcbRotation={90}
      layer="top" schX={15} schY={0} schWidth={8} schHeight={30}/>
    {connections.map(c=><trace key={c.name} name={c.name}
      from={`U_SOC.${c.socBall}`} to={`U_RAM.${c.ramBall}`}
      thickness={0.1} routingPhaseIndex={c.phase}/>)}
    {["A","B"].flatMap(channel=>[
      {name:`LPDDR4_CLK_${channel}`,p:`LPDDR4_CLKP_${channel}`,n:`LPDDR4_CLKN_${channel}`},
      ...[0,1].map(byte=>({name:`LPDDR4_DQS${byte}_${channel}`,
        p:`LPDDR4_DQS${byte}P_${channel}`,n:`LPDDR4_DQS${byte}N_${channel}`}))
    ]).map(pair=><Fragment key={pair.name}>
      <differentialpair name={pair.name}
        positiveConnection={pair.p} negativeConnection={pair.n}/>
    </Fragment>)}
    <silkscreentext text="ROUTING EXPERIMENT — NOT FOR FABRICATION"
      pcbX={0} pcbY={-19} fontSize={1}/>
  </board>
)
