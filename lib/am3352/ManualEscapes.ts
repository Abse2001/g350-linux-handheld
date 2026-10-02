import type {FanoutTracePath} from "@tscircuit/props"
import connections from "./memory-connections.json"
import cpu from "./cpu-ball-map.json"
import ram from "./ram-ball-map.json"
import {ddrGroups} from "./DdrConstraints"

// Alternate RAM dogbone quadrant, retaining the native bus_lanes channel
// solver. All through-vias explicitly occupy every physical copper layer.
// This is investigatory fanout geometry; complete native and independent
// copper/drill checks are required before retaining a resulting route.
export const manualEscapes=(chip:"U_SOC"|"U_RAM",selected=connections):FanoutTracePath[]=>selected.map(c=>{
  const ball=chip==="U_SOC"?c.socBall:c.ramBall
  const row=ball[0],column=Number(ball.slice(1))
  const rows=chip==="U_SOC"?"ABCDEFGHJKLMNPRTUV":"ABCDEFGHJKLMNPRT"
  const x=chip==="U_SOC"?(rows.indexOf(row)-8.5)*cpu.pitchMm:(column-5)*ram.pitchMm
  const y=chip==="U_SOC"?(column-9.5)*cpu.pitchMm:(7.5-rows.indexOf(row))*ram.pitchMm
  const layer=c.name==="DDR_RESETn"?"inner4":ddrGroups.find(g=>g.signals.includes(c.name))!.layer
  const pin=chip==="U_SOC"?c.socPin:c.ramPin
  const vx=x+(chip==="U_SOC"?.4:-.4),vy=y+(chip==="U_SOC"?-.4:.4)
  return {connection:`.${chip} > port.${pin}`,route:[
    {route_type:"wire",x,y,layer:"top",width:.1016},
    {route_type:"wire",x:vx,y:vy,layer:"top",width:.1016},
    {route_type:"via",x:vx,y:vy,from_layer:"top",to_layer:layer,
      layers:["top","inner1","inner2","inner3","inner4","inner5","inner6","bottom"],
      via_diameter:.3,via_hole_diameter:.15},
    {route_type:"wire",x:vx,y:vy,layer,width:.1016},
  ]}
})
