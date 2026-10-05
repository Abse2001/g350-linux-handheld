import {AM3352BZCZ100} from "../imports/AM3352BZCZ100"
import {MT41K256M16TW_107_P} from "../imports/MT41K256M16TW_107_P"
import {FourLayerDdrConstraints,FourLayerReferencePlanes,ddrGroups,ddrVia,differentialPairs} from "../lib/am3352/FourLayerDdrConstraints"
import memory from "../lib/am3352/memory-byte1-swizzled-connections.json"
import {Power} from "../lib/am3352/Power"
import {Boot} from "../lib/am3352/Boot"
import {Storage} from "../lib/am3352/Storage"
import {RamReferenceEscapes,type RamReferenceEscapeLayout} from "../lib/am3352/RamReferenceEscapes"
import {RamBypassLoops} from "../lib/am3352/RamBypassLoops"
import {cpuPowerConnections,ramPowerConnections,cpuNoConnect,ramNoConnect,supplyRails,cpuPowerPinAttributes,ramPowerPinAttributes} from "../lib/am3352/PowerNetworks"
import {Fragment} from "react"
import {UsbCDevice,usbDeviceNoConnect,type UsbRouteLayout} from "../lib/am3352/UsbCDevice"

// Integrated power/DDR source draft, not a powered or released PCB.
// Individual imports, no SBC/SOM/ready-board import. Netlist verification
// uses --routing-disabled; final routing retains native DDR phases below.
// Optional USB source draft; display/control circuits remain to be integrated.
// The native lane solver currently rejects custom/rounded board outlines.
// Keep this routing trial rectangular until the channel is complete.
export type GuidedDdrPathMap=Record<string,Array<{x:number,y:number,via?:boolean,fromLayer?:"top"|"bottom",toLayer?:"top"|"bottom"}>>
// Diagnostic workaround for core's SRJ importer rejecting pairs whose guides
// are already fixed. Restore the full pair definitions when replaying output.
const validateFixedNativePairs=(paths:GuidedDdrPathMap|undefined,names:string[],guidesApplied:boolean)=>{
  if(names.length&&!guidesApplied)throw new Error("Fixed pair guides must match the actual RAM layer and rotation")
  for(const name of names){
    const pair=differentialPairs.find(p=>p.name===name)
    if(!pair||(paths?.[pair.positiveConnection]?.length??0)<2||(paths?.[pair.negativeConnection]?.length??0)<2)
      throw new Error(`Native phase may omit only a fully guided pair: ${name}`)
  }
  return names
}
export default ({schematicDisabled=false,ramRotation=0,ramLayer="top",guidedPathsRamLayer="top",guidedPathsRamRotation=0,guidedDdrPaths,memoryConnections=memory,ramReferenceEscapes,rotatedD2PowerBridge=false,byte0Layer="bottom",byte1Layer="bottom",commandLayer="top",resetLayer="top",usbCDevice=false,usbRouteLayout,ddrPowerPourClearance=.2,nativePhaseFixedPairNames=[]}:{schematicDisabled?:boolean,ramRotation?:number,ramLayer?:"top"|"bottom",guidedPathsRamLayer?:"top"|"bottom",guidedPathsRamRotation?:number,guidedDdrPaths?:GuidedDdrPathMap,memoryConnections?:typeof memory,ramReferenceEscapes?:RamReferenceEscapeLayout,rotatedD2PowerBridge?:boolean,byte0Layer?:"top"|"bottom"|"both",byte1Layer?:"top"|"bottom"|"both",commandLayer?:"top"|"bottom"|"both",resetLayer?:"top"|"bottom"|"both",usbCDevice?:boolean,usbRouteLayout?:UsbRouteLayout,ddrPowerPourClearance?:.12|.2,nativePhaseFixedPairNames?:string[]}={})=> <board title="G350 bare AM3352 — four-layer integration in progress"
  width={100} height={124} layers={4} thickness={1.6}
  minTraceWidth={.1016} nominalTraceWidth={.1016}
  minTraceToPadEdgeClearance={.1016} minPadEdgeToPadEdgeClearance={.15}
  minViaPadDiameter={ddrVia.land} minViaHoleDiameter={ddrVia.drill} minTraceToHoleEdgeClearance={.2}
  minViaHoleEdgeToViaHoleEdgeClearance={.254} minBoardEdgeClearance={.3}
  allowBlindAndBuriedVias={false} isViaInPadAllowed={false}
  pcbStyle={{viaPadDiameter:ddrVia.land,viaHoleDiameter:ddrVia.drill}}
  routeRemaining={false} schAutoLayoutEnabled={false} schematicDisabled={schematicDisabled}>
  <schematicsheet name="HOST_POWER_DRAFT" displayName="AM3352 / DDR / PMIC — integration draft" sheetWidth={190} sheetHeight={145}/>
  <net name="GND" isGroundNet routingPhaseIndex={5}/>
  {supplyRails.map(n=><Fragment key={n}><net name={n} isPowerNet routingPhaseIndex={5}/></Fragment>)}
  {ddrGroups.map((g,i)=><Fragment key={g.name}><autoroutingphase name={`${g.name}_BUS_LANES`} phaseIndex={i+1} autorouter="bus_lanes"/></Fragment>)}
  <autoroutingphase name="DDR_RESET_BUS_LANES" phaseIndex={4} autorouter="bus_lanes"/>
  <autoroutingphase name="POWER_AND_CONTROL" phaseIndex={5} autorouter="auto_local"/>
  <FourLayerDdrConstraints pairGap={.12} byte0Layer={byte0Layer} byte1Layer={byte1Layer} commandLayer={commandLayer} resetLayer={resetLayer} nativePhaseFixedPairNames={validateFixedNativePairs(guidedDdrPaths,nativePhaseFixedPairNames,ramLayer===guidedPathsRamLayer&&ramRotation===guidedPathsRamRotation)}/>
  <FourLayerReferencePlanes ddrPowerClearance={ddrPowerPourClearance}/>
  <AM3352BZCZ100 name="U_SOC" pcbX={0} pcbY={0} layer="top" noConnect={usbCDevice?[...cpuNoConnect,...usbDeviceNoConnect]:cpuNoConnect} pinAttributes={cpuPowerPinAttributes}
    schX={-8} schY={0} schWidth={8} schHeight={50}/>
  <MT41K256M16TW_107_P name="U_RAM" pcbX={0} pcbY={-27} pcbRotation={ramRotation} layer={ramLayer} noConnect={ramNoConnect} pinAttributes={ramPowerPinAttributes}
    schX={8} schY={0} schWidth={8} schHeight={28}/>
  {memoryConnections.map(c=><trace key={c.name} name={c.name} from={`U_SOC.${c.socPin}`} to={`U_RAM.${c.ramPin}`}
    pcbPath={ramLayer===guidedPathsRamLayer&&ramRotation===guidedPathsRamRotation?guidedDdrPaths?.[c.name]:undefined}
    thickness={.1016} routingPhaseIndex={c.name==="DDR_RESETn"?4:ddrGroups.findIndex(g=>g.signals.includes(c.name))+1}/>)}
  {[["U_SOC",cpuPowerConnections],["U_RAM",ramPowerConnections]].flatMap(([chip,connections])=>
    (connections as typeof cpuPowerConnections).map(c=><trace key={`${chip}_${c.pin}`} name={`${chip}_${c.function}_${c.ball}`}
      from={`${chip}.${c.pin}`} to={`net.${c.net}`} thickness={.2} routingPhaseIndex={5}/>))}
  <Power ramLayer={ramLayer}/>
  <Boot/>
  <Storage/>
  {(ramRotation===0||ramRotation===180&&ramReferenceEscapes!==undefined)&&<RamReferenceEscapes layout={ramReferenceEscapes} portLayer={ramLayer} rotatedD2PowerBridge={ramRotation===180&&rotatedD2PowerBridge}/>}
  <RamBypassLoops ramLayer={ramLayer}/>
  <silkscreentext text="POWER / DDR SOURCE DRAFT — DO NOT FABRICATE" pcbX={0} pcbY={-57} fontSize={1}/>
  {usbCDevice&&<UsbCDevice layout={usbRouteLayout}/>}
</board>
