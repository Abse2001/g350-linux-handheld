import {AM3352BZCZ100} from "../imports/AM3352BZCZ100"
import {MT41K256M16TW_107_P} from "../imports/MT41K256M16TW_107_P"
import {DdrConstraints,ddrGroups} from "../lib/am3352/DdrConstraints"
import memory from "../lib/am3352/memory-byte1-swizzled-connections.json"
import {Power} from "../lib/am3352/Power"
import {cpuPowerConnections,ramPowerConnections,cpuNoConnect,ramNoConnect,supplyRails,cpuPowerPinAttributes,ramPowerPinAttributes} from "../lib/am3352/PowerNetworks"
import {Fragment} from "react"

// Integrated power/DDR source draft, not a powered or released PCB.
// Individual imports, no SBC/SOM/ready-board import. Netlist verification
// uses --routing-disabled; final routing retains native DDR phases below.
// Oscillator/boot/USB/SD/display/control circuits remain to be integrated.
// The native lane solver currently rejects custom/rounded board outlines.
// Keep this routing trial rectangular until the channel is complete.
export default ()=> <board title="G350 bare AM3352 — power integration in progress"
  width={100} height={124} layers={8} thickness={1.6}
  minTraceWidth={.1016} nominalTraceWidth={.1016}
  minTraceToPadEdgeClearance={.1016} minPadEdgeToPadEdgeClearance={.15}
  minViaPadDiameter={.35} minViaHoleDiameter={.15} minTraceToHoleEdgeClearance={.2}
  minViaHoleEdgeToViaHoleEdgeClearance={.254} minBoardEdgeClearance={.3}
  allowBlindAndBuriedVias={false} isViaInPadAllowed={false}
  routeRemaining={false} schAutoLayoutEnabled={false}>
  <schematicsheet name="HOST_POWER_DRAFT" displayName="AM3352 / DDR / PMIC — integration draft" sheetWidth={190} sheetHeight={145}/>
  <net name="GND" isGroundNet routingPhaseIndex={5}/>
  {supplyRails.map(n=><Fragment key={n}><net name={n} isPowerNet routingPhaseIndex={5}/></Fragment>)}
  {ddrGroups.map((g,i)=><Fragment key={g.name}><autoroutingphase name={`${g.name}_BUS_LANES`} phaseIndex={i+1} autorouter="bus_lanes"/></Fragment>)}
  <autoroutingphase name="DDR_RESET_BUS_LANES" phaseIndex={4} autorouter="bus_lanes"/>
  <autoroutingphase name="POWER_AND_CONTROL" phaseIndex={5} autorouter="auto_local"/>
  <DdrConstraints pairGap={.12}/>
  <AM3352BZCZ100 name="U_SOC" pcbX={0} pcbY={0} layer="top" noConnect={cpuNoConnect} pinAttributes={cpuPowerPinAttributes}
    schX={-8} schY={0} schWidth={8} schHeight={50}/>
  <MT41K256M16TW_107_P name="U_RAM" pcbX={0} pcbY={-27} layer="top" noConnect={ramNoConnect} pinAttributes={ramPowerPinAttributes}
    schX={8} schY={0} schWidth={8} schHeight={28}/>
  {memory.map(c=><trace key={c.name} name={c.name} from={`U_SOC.${c.socPin}`} to={`U_RAM.${c.ramPin}`}
    thickness={.1016} routingPhaseIndex={c.name==="DDR_RESETn"?4:ddrGroups.findIndex(g=>g.signals.includes(c.name))+1}/>)}
  {[["U_SOC",cpuPowerConnections],["U_RAM",ramPowerConnections]].flatMap(([chip,connections])=>
    (connections as typeof cpuPowerConnections).map(c=><trace key={`${chip}_${c.pin}`} name={`${chip}_${c.function}_${c.ball}`}
      from={`${chip}.${c.pin}`} to={`net.${c.net}`} thickness={.2} routingPhaseIndex={5}/>))}
  <Power/>
  <silkscreentext text="POWER / DDR SOURCE DRAFT — DO NOT FABRICATE" pcbX={0} pcbY={-57} fontSize={1}/>
</board>
