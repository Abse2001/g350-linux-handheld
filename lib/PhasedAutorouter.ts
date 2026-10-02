import { AutoroutingPipelineSolver9_PreloadedTraceGraph,
  type SimpleRouteJson, type Obstacle } from "@tscircuit/capacity-autorouter"
import {conservativeTraceObstacles} from "./ConservativeTraceObstacles"
import {savedRouting} from "./SavedRouting"

// Later phases may not relocate completed earlier copper. Pipeline 9's
// preloaded-graph repair can move those traces, so represent them as fixed
// copper obstacles and preserve their original routes in the phase output.
function fixedCopper(traces:NonNullable<SimpleRouteJson["traces"]>):Obstacle[] {
  return traces.flatMap((trace,ti)=>{
    const obstacles:Obstacle[]=[]
    const connectedTo=[trace.connection_name,trace.pcb_trace_id,...(trace.connectsTo??[])]
      .filter((id):id is string=>typeof id==="string")
    for (let i=0;i<trace.route.length;i++) {
      const a=trace.route[i],b=trace.route[i+1]
      if (a.route_type==="via") {
        const diameter=a.via_diameter??0.65
        obstacles.push({obstacleId:`fixed_${ti}_via_${i}`,type:"rect",shape:"circle",
          layers:["top","inner1","inner2","bottom"],center:{x:a.x,y:a.y},width:diameter,height:diameter,connectedTo})
      }
      if (a.route_type!=="wire"||b?.route_type!=="wire"||a.layer!==b.layer) continue
      const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)
      if (length<1e-9) continue
      obstacles.push({obstacleId:`fixed_${ti}_segment_${i}`,type:"rect",layers:[a.layer],
        center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},width:length+a.width,height:a.width,
        ccwRotationDegrees:Math.atan2(dy,dx)*180/Math.PI,connectedTo})
    }
    return obstacles
  })
}

// KiCad plots a segment using its starting wire point's width. Explicit
// duplicate-position transitions make the native maximum-endpoint-width DRC
// evaluate the same copper. Unused widths at terminal/via endpoints inherit
// the arriving segment width. This preserves every nonzero plotted segment.
function explicitSegmentWidths(traces: NonNullable<SimpleRouteJson["traces"]>) {
  return traces.map(trace=>{
    const route:typeof trace.route=[]
    for (let i=0;i<trace.route.length;i++) {
      const point=trace.route[i],previous=route[route.length-1],next=trace.route[i+1]
      if (point.route_type==="wire" && previous?.route_type==="wire" &&
          point.layer===previous.layer && point.width!==previous.width) {
        route.push({...point,width:previous.width})
        if (!(next?.route_type==="wire" && next.layer===point.layer &&
            (next.x!==point.x || next.y!==point.y))) continue
      }
      route.push(point)
    }
    return {...trace,route}
  })
}

// Use the four-layer physical stack with blind/buried vias disabled. Core
// materializes each autorouted transition as a standard full-depth via.
// Through-hole terminals are accessible on every layer; the generated
// input otherwise fixes them to the port's display layer unnecessarily.
async function routePhase(input: SimpleRouteJson, groundAsPlane: boolean) {
  const previous = input.traces ?? []
  // GND is the first declared source net on this project. Its pads connect by
  // filled zones and stitching vias; fabrication.mjs verifies this identifier.
  // Final KiCad connectivity and Gerber shorts checks still qualify the copper.
  const layers = ["top","inner1","inner2","bottom"]
  if(input.layerCount!==4) throw new Error("Review the autorouter after changing the four-layer stack")
  const platedPortIds = new Set(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_plated_hole_id)
    .map(o=>o.circuitJsonMetadata?.pcb_port_id))
  const audioId = input.obstacles.find(o=>o.circuitJsonMetadata?.source_port_name === "GAIN_SLOT")?.componentId
  const lrclkPortId = input.obstacles.find(o=>o.componentId === audioId &&
    o.circuitJsonMetadata?.source_port_name === "LRCLK")?.circuitJsonMetadata?.pcb_port_id
  const bclkPortId = input.obstacles.find(o=>o.componentId===audioId &&
    o.circuitJsonMetadata?.source_port_name==="BCLK")?.circuitJsonMetadata?.pcb_port_id
  const dinPortId = input.obstacles.find(o=>o.componentId===audioId &&
    o.circuitJsonMetadata?.source_port_name==="DIN")?.circuitJsonMetadata?.pcb_port_id
  const audioModePortId = input.obstacles.find(o=>o.componentId===audioId &&
    o.circuitJsonMetadata?.source_port_name==="N_SD_MODE")?.circuitJsonMetadata?.pcb_port_id
  if (!audioModePortId) throw new Error("Review the manual amplifier enable connection")
  const ampEnablePortId=input.obstacles.find(o=>o.circuitJsonMetadata?.source_port_name==="J8_37")
    ?.circuitJsonMetadata?.pcb_port_id
  if (!ampEnablePortId) throw new Error("Review the manual amplifier GPIO enable feed")
  const lcdManualSignalPortIds=new Set(input.obstacles.filter(o=>["J8_15","J8_16","J8_19","J8_21","J8_22","J8_23"].includes(o.circuitJsonMetadata?.source_port_name??""))
    .map(o=>o.circuitJsonMetadata?.pcb_port_id))
  if(lcdManualSignalPortIds.size!==6) throw new Error("Review the manual display signals")
  const lcdSelectPortId=input.obstacles.find(o=>o.circuitJsonMetadata?.source_port_name==="J8_24")
    ?.circuitJsonMetadata?.pcb_port_id
  if (!lcdSelectPortId) throw new Error("Review the manual LCD chip-select escape")
  if (!bclkPortId || !dinPortId) throw new Error("Review the amplifier's manual I2S clock/data connections")
  if (!lrclkPortId) throw new Error("Review the amplifier's manual frame-clock connection after changing its footprint")
  const audioManualPortIds = new Set(input.obstacles.filter(o=>o.componentId === audioId &&
    ["VDD1","VDD2","GAIN_SLOT"].includes(o.circuitJsonMetadata?.source_port_name ?? ""))
    .map(o=>o.circuitJsonMetadata?.pcb_port_id))
  if (groundAsPlane && audioManualPortIds.size !== 3)
    throw new Error("Review the amplifier's manual supply escapes after changing its footprint")
  const audioVddPortIds = new Set(input.obstacles.filter(o=>o.componentId === audioId &&
    ["VDD1","VDD2"].includes(o.circuitJsonMetadata?.source_port_name ?? ""))
    .map(o=>o.circuitJsonMetadata?.pcb_port_id))
  const audioHfPortIds = new Set(input.connections.flatMap(c=>(c.externallyConnectedPointIds??[])
    .filter(pair=>pair.some(id=>audioVddPortIds.has(id)))
    .flatMap(pair=>pair.filter(id=>!audioVddPortIds.has(id)))))
  const audioBulkPortIds = new Set(input.connections.flatMap(c=>(c.externallyConnectedPointIds??[])
    .filter(pair=>pair.some(id=>audioHfPortIds.has(id)))
    .flatMap(pair=>pair.filter(id=>!audioHfPortIds.has(id)&&!audioVddPortIds.has(id)))))
  if (groundAsPlane && audioBulkPortIds.size!==1)
    throw new Error("Review the manual amplifier bulk-supply feed")
  if (groundAsPlane && audioHfPortIds.size !== 1)
    throw new Error("Review the amplifier bypass feed after changing its manual connections")
  const keysId = input.obstacles.find(o=>o.circuitJsonMetadata?.source_port_name === "GPA0")?.componentId
  const manualControlPortIds=new Set(input.obstacles.filter(o=>o.componentId===keysId &&
    ["GPA0","GPB0","GPB2","SCL"].includes(o.circuitJsonMetadata?.source_port_name??""))
    .map(o=>o.circuitJsonMetadata?.pcb_port_id))
  if(manualControlPortIds.size!==4) throw new Error("Review the manual clock and front-control escapes")
  const keysLeftPortId=input.obstacles.find(o=>o.componentId===keysId &&
    o.circuitJsonMetadata?.source_port_name==="GPA2")?.circuitJsonMetadata?.pcb_port_id
  if(!keysLeftPortId) throw new Error("Review the LEFT input fanout")
  const keysLeftManualPeerIds=new Set(input.connections.flatMap(c=>(c.externallyConnectedPointIds??[])
    .filter(pair=>pair.includes(keysLeftPortId)).flatMap(pair=>pair.filter(id=>id!==keysLeftPortId))))
  if(input.connections.some(c=>c.pointsToConnect.some(p=>p.pcb_port_id===keysLeftPortId)) && keysLeftManualPeerIds.size!==1)
    throw new Error("Expected one manual bottom-layer LEFT input escape")
  const keysVddPortId = input.obstacles.find(o=>o.componentId === keysId &&
    o.circuitJsonMetadata?.source_port_name === "VDD")?.circuitJsonMetadata?.pcb_port_id
  const keysResetPortId=input.obstacles.find(o=>o.componentId===keysId &&
    o.circuitJsonMetadata?.source_port_name==="N_RESET")?.circuitJsonMetadata?.pcb_port_id
  if (!keysResetPortId) throw new Error("Review the manual button-controller reset feed")
  const keysCapPortIds = new Set(input.connections.flatMap(c=>(c.externallyConnectedPointIds??[])
    .filter(pair=>pair.includes(keysVddPortId??""))
    .flatMap(pair=>pair.filter(id=>id!==keysVddPortId))))
  if (groundAsPlane && keysCapPortIds.size!==1)
    throw new Error("Review the button controller's manual bypass feed")
  const gaugeId = input.obstacles.find(o=>o.circuitJsonMetadata?.source_port_name === "QSTRT")?.componentId
  const gaugeSdaPortId = input.obstacles.find(o=>o.componentId === gaugeId &&
    o.circuitJsonMetadata?.source_port_name === "SDA")?.circuitJsonMetadata?.pcb_port_id
  const gaugePowerPortIds = new Set(input.obstacles.filter(o=>o.componentId===gaugeId &&
    ["CELL","VDD"].includes(o.circuitJsonMetadata?.source_port_name??""))
    .map(o=>o.circuitJsonMetadata?.pcb_port_id))
  const gaugeCapPortIds = new Set(input.connections.flatMap(c=>(c.externallyConnectedPointIds??[])
    .filter(pair=>pair.some(id=>gaugePowerPortIds.has(id)))
    .flatMap(pair=>pair.filter(id=>!gaugePowerPortIds.has(id)))))
  if (groundAsPlane && gaugeCapPortIds.size!==1)
    throw new Error("Review the manual fuel-gauge supply and bypass connections")
  if (!gaugeSdaPortId) throw new Error("Review the fuel-gauge SDA escape after changing its footprint")
  const chargerId = input.obstacles.find(o=>o.circuitJsonMetadata?.source_port_name === "N_PGOOD")?.componentId
  const pgoodPortId = input.obstacles.find(o=>o.componentId===chargerId &&
    o.circuitJsonMetadata?.source_port_name === "N_PGOOD")?.circuitJsonMetadata?.pcb_port_id
  if (!pgoodPortId) throw new Error("Review the manual charger PGOOD connection")
  const chargingPortId=input.obstacles.find(o=>o.componentId===chargerId &&
    o.circuitJsonMetadata?.source_port_name==="N_CHG")?.circuitJsonMetadata?.pcb_port_id
  if(!chargingPortId) throw new Error("Review the manual charger indication path")
  const currentSettingPortId=input.obstacles.find(o=>o.componentId===chargerId &&
    o.circuitJsonMetadata?.source_port_name==="ISET")?.circuitJsonMetadata?.pcb_port_id
  if(!currentSettingPortId) throw new Error("Review the manual charge-current setting path")
  const thermistorPortId = input.obstacles.find(o=>o.componentId===chargerId &&
    o.circuitJsonMetadata?.source_port_name==="TS")?.circuitJsonMetadata?.pcb_port_id
  if (!thermistorPortId) throw new Error("Review the manual battery thermistor connection")
  const lcdResetPortId=input.obstacles.find(o=>o.circuitJsonMetadata?.source_port_name==="J8_13")
    ?.circuitJsonMetadata?.pcb_port_id
  if (!lcdResetPortId) throw new Error("Review the manual LCD reset connection")
  const boostId = input.obstacles.find(o=>o.circuitJsonMetadata?.source_port_name === "SW")?.componentId
  const usbId = input.obstacles.find(o=>o.circuitJsonMetadata?.source_port_name === "B4A9")?.componentId
  const usbDataPortIds=new Set(input.obstacles.filter(o=>o.componentId===usbId &&
    ["A6","B6","A7","B7"].includes(o.circuitJsonMetadata?.source_port_name??""))
    .map(o=>o.circuitJsonMetadata?.pcb_port_id))
  if(usbDataPortIds.size!==4) throw new Error("Review the four manually routed USB-C data contacts")
  const cc2PortId=input.obstacles.find(o=>o.componentId===usbId &&
    o.circuitJsonMetadata?.source_port_name==="B5")?.circuitJsonMetadata?.pcb_port_id
  if(!cc2PortId) throw new Error("Review the manual second USB-C CC escape")
  const feedbackPortId = input.obstacles.find(o=>o.componentId === boostId &&
    o.circuitJsonMetadata?.source_port_name === "FB")?.circuitJsonMetadata?.pcb_port_id
  const boostVoutPortId = input.obstacles.find(o=>o.componentId===boostId &&
    o.circuitJsonMetadata?.source_port_name==="VOUT")?.circuitJsonMetadata?.pcb_port_id
  const boostVinPortId = input.obstacles.find(o=>o.componentId===boostId &&
    o.circuitJsonMetadata?.source_port_name==="VIN")?.circuitJsonMetadata?.pcb_port_id
  const surfacePadPortIds=new Set(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id)
    .map(o=>o.circuitJsonMetadata?.pcb_port_id))
  const manualPeers=(ids:Set<string>)=>new Set(input.connections.flatMap(c=>(c.externallyConnectedPointIds??[])
    .filter(pair=>pair.some(id=>ids.has(id))).flatMap(pair=>pair.filter(id=>!ids.has(id)&&surfacePadPortIds.has(id)))))
  const boostOutCapIds=manualPeers(new Set([boostVoutPortId??""]))
  const feedbackFeedIds=manualPeers(boostOutCapIds)
  feedbackFeedIds.delete(boostVoutPortId??"")
  const feedforwardFeedIds=manualPeers(feedbackFeedIds)
  for (const id of boostOutCapIds) feedforwardFeedIds.delete(id)
  const boostInCapIds=manualPeers(new Set([boostVinPortId??""]))
  const enableFeedIds=manualPeers(boostInCapIds)
  enableFeedIds.delete(boostVinPortId??"")
  if (groundAsPlane && [boostOutCapIds,feedbackFeedIds,feedforwardFeedIds,boostInCapIds,enableFeedIds]
      .some(ids=>ids.size!==1))
    throw new Error("Review the boost's manual feedback and enable supply feeds")
  const lcdRegulatorId = input.obstacles.find(o=>o.circuitJsonMetadata?.source_port_name === "NC")?.componentId
  const lcdOutPortId = input.obstacles.find(o=>o.componentId === lcdRegulatorId &&
    o.circuitJsonMetadata?.source_port_name === "VOUT")?.circuitJsonMetadata?.pcb_port_id
  if (!lcdOutPortId) throw new Error("Review the manual LCD supply after changing its regulator footprint")
  const lcdInputPortIds = new Set(input.obstacles.filter(o=>o.componentId===lcdRegulatorId &&
    ["VIN","EN"].includes(o.circuitJsonMetadata?.source_port_name??""))
    .map(o=>o.circuitJsonMetadata?.pcb_port_id))
  const lcdInputCapPortIds = new Set(input.connections.flatMap(c=>(c.externallyConnectedPointIds??[])
    .filter(pair=>pair.some(id=>lcdInputPortIds.has(id)))
    .flatMap(pair=>pair.filter(id=>!lcdInputPortIds.has(id)))))
  if (groundAsPlane && lcdInputCapPortIds.size!==1)
    throw new Error("Review the LCD regulator's manual 5V branch")
  const powerManualPortIds = new Set(input.obstacles.filter(o=>
    (o.componentId === chargerId && ["OUT1","OUT2","BAT1","BAT2","IN","EN1"].includes(o.circuitJsonMetadata?.source_port_name ?? "")) ||
    (o.componentId === boostId && ["VIN","VOUT","SW"].includes(o.circuitJsonMetadata?.source_port_name ?? "")) ||
    (o.componentId === gaugeId && ["CELL","VDD"].includes(o.circuitJsonMetadata?.source_port_name ?? "")) ||
    (o.componentId === lcdRegulatorId && ["VIN","EN"].includes(o.circuitJsonMetadata?.source_port_name ?? "")) ||
    (o.componentId === usbId && ["B4A9","A4B9"].includes(o.circuitJsonMetadata?.source_port_name ?? "")) ||
    ["J8_1","J8_2","J8_4"].includes(o.circuitJsonMetadata?.source_port_name??""))
    .map(o=>o.circuitJsonMetadata?.pcb_port_id))
  if (groundAsPlane && powerManualPortIds.size !== 18)
    throw new Error("Review the charger and boost manual supply escapes after changing their footprints")
  const chargerBatPortIds = new Set(input.obstacles.filter(o=>o.componentId === chargerId &&
    ["BAT1","BAT2"].includes(o.circuitJsonMetadata?.source_port_name??""))
    .map(o=>o.circuitJsonMetadata?.pcb_port_id))
  const batteryCapPortIds = new Set(input.connections.flatMap(c=>(c.externallyConnectedPointIds??[])
    .filter(pair=>pair.some(id=>chargerBatPortIds.has(id)))
    .flatMap(pair=>pair.filter(id=>!chargerBatPortIds.has(id)))))
  if (groundAsPlane && batteryCapPortIds.size !== 1)
    throw new Error("Review the manual battery feed after changing its bypass connections")
  const routingInput: SimpleRouteJson = {...input,traces:[],layerCount:4,allowBlindAndBuriedVias:false,allowViaInPad:false,
    // 0.25mm leaves room for the 0.5mm-pitch FPC's 0.3mm pads;
    // its immediate 0.15mm escapes have at most 0.275mm to adjacent pads.
    defaultObstacleMargin:0.25,minTraceToPadEdgeClearance:0.25,
    minTraceToHoleEdgeClearance:0.8,
    minViaEdgeToPadEdgeClearance:0.35,minViaHoleEdgeToViaHoleEdgeClearance:0.7,minPlatedHoleDrillEdgeToDrillEdgeClearance:0.5,
    obstacles:[...conservativeTraceObstacles(input.obstacles),...fixedCopper(previous)].map(o=>({...o,
      layers:o.layers.filter(l=>layers.includes(l))})).filter(o=>o.layers.length),
    connections:input.connections.filter(c=>(!groundAsPlane||!["source_net_0","source_net_1"].includes(c.name)) &&
      // The complete local feedback net has actual manual traces.
      !c.pointsToConnect.some(p=>p.pcb_port_id === feedbackPortId || p.pcb_port_id === lrclkPortId ||
        p.pcb_port_id === bclkPortId || p.pcb_port_id === dinPortId ||
        p.pcb_port_id === audioModePortId ||
        p.pcb_port_id === ampEnablePortId ||
        p.pcb_port_id === lcdSelectPortId || lcdManualSignalPortIds.has(p.pcb_port_id) ||
        (groundAsPlane && p.pcb_port_id === boostVinPortId) ||
        p.pcb_port_id === keysResetPortId || manualControlPortIds.has(p.pcb_port_id) ||
        p.pcb_port_id === lcdOutPortId || p.pcb_port_id === pgoodPortId || p.pcb_port_id === chargingPortId || p.pcb_port_id === thermistorPortId ||
        p.pcb_port_id === lcdResetPortId || p.pcb_port_id===currentSettingPortId || p.pcb_port_id===cc2PortId ||
        usbDataPortIds.has(p.pcb_port_id)))
      .map(c=>({...c,pointsToConnect:c.pointsToConnect
        .filter(p=>p.pcb_port_id !== gaugeSdaPortId && p.pcb_port_id!==keysLeftPortId &&
          !keysLeftManualPeerIds.has(p.pcb_port_id??""))
        // These three pins have actual manual traces to bypass capacitor pads,
        // which remain targets of the wide 5V autoroute.
        .filter(p=>!groundAsPlane||(!audioManualPortIds.has(p.pcb_port_id)&&
          !audioHfPortIds.has(p.pcb_port_id??"")&&!audioBulkPortIds.has(p.pcb_port_id??"")&&!powerManualPortIds.has(p.pcb_port_id)&&
          !batteryCapPortIds.has(p.pcb_port_id??"")&&!gaugeCapPortIds.has(p.pcb_port_id??"")&&
          !lcdInputCapPortIds.has(p.pcb_port_id??"")&&
          !keysCapPortIds.has(p.pcb_port_id??"")&&
          !feedbackFeedIds.has(p.pcb_port_id??"")&&!feedforwardFeedIds.has(p.pcb_port_id??"")&&
          !enableFeedIds.has(p.pcb_port_id??"")&&
          p.pcb_port_id !== keysVddPortId))
        .map(p=>{
        if (!platedPortIds.has(p.pcb_port_id)) return p
        const {layer,...rest} = p
        return {...rest,layers}
      })})).filter(c=>c.pointsToConnect.length >= 2),
  }
  const saved = await savedRouting(input,groundAsPlane?1:previous.length?2:0)
  const solver = !saved && routingInput.connections.length?
    new AutoroutingPipelineSolver9_PreloadedTraceGraph(routingInput,{effort:2}):undefined
  const listeners: Record<string,((event:any)=>void)[]> = {}
  let output = previous
  let stopped = false
  const emit = (type:string,event:any) => listeners[type]?.forEach(fn=>fn(event))
  const run = async () => {
    try {
      let steps=0
      while (!stopped && solver && !solver.solved && !solver.failed) {
        const start=Date.now(),iterations=solver.iterations
        while (!stopped && Date.now()-start<200 && !solver.solved && !solver.failed) solver.step()
        emit("progress",{steps:++steps,progress:solver.progress,phase:solver.getCurrentPhase(),
          iterationsPerSecond:(solver.iterations-iterations)*1000/Math.max(1,Date.now()-start)})
        await new Promise(resolve=>setTimeout(resolve,0))
      }
      if (stopped) return
      if (solver?.failed) throw new Error(solver.error ?? "Power autorouting failed")
      output=[...previous,...(saved??(solver?explicitSegmentWidths(solver.getOutputSimplifiedPcbTraces()):[]))]
      if (groundAsPlane) {
        // Explicit short copper contacts remain entirely inside each GND pad.
        // They let the trace-only native connectivity check see the plane net;
        // KiCad's filled-zone connectivity independently verifies the return.
        const ground = input.connections.find(c=>c.name === "source_net_0")
        if (!ground) throw new Error("Ground connection missing from power phase")
        output = [...output,...ground.pointsToConnect.map((p,i)=>{
          const pad = input.obstacles.find(o=>o.circuitJsonMetadata?.pcb_port_id === p.pcb_port_id)
          // Through-hole contacts extend into the annular copper, past the
          // drill. All current imported holes have sufficient annular width.
          const length = pad?.circuitJsonMetadata?.pcb_plated_hole_id
            ? 0.36*Math.min(pad.width,pad.height) : 0.025
          return {
          type:"pcb_trace" as const,pcb_trace_id:`gnd_plane_contact_${i}`,
          connection_name:"source_net_0",connectsTo:p.pcb_port_id?[p.pcb_port_id]:[],
          route:[{route_type:"wire" as const,x:p.x,y:p.y,width:0.15,layer:p.layer ?? p.layers?.[0] ?? "top"},
            {route_type:"wire" as const,x:p.x+length,y:p.y,width:0.15,layer:p.layer ?? p.layers?.[0] ?? "top"}],
        }} )]
      }
      emit("complete",{traces:output})
    } catch (error) { emit("error",{error}) }
  }
  return {
    on(type:string,fn:(event:any)=>void) { (listeners[type]??=[]).push(fn) },
    start() { void run() },
    stop() { stopped = true },
    getOutputSimpleRouteJson() { return {...input,traces:output} },
  }
}

export const routeSignalsAroundEarlierCopper = (input:SimpleRouteJson) => routePhase(input,false)
export const routePowerAroundEarlierCopper = (input:SimpleRouteJson) => routePhase(input,true)
