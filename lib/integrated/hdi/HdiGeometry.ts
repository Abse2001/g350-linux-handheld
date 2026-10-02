import type {SimpleRouteJson,Obstacle} from "@tscircuit/capacity-autorouter"
import {isMemoryEscapeVia,distanceToCopper} from "../auditMemoryThroughVias"
import {pointSegment,segments,segmentToCopper} from "../repairMemoryViaSites"

import {standardHdi,coreReservation,type HdiProcess} from "./HdiProcess"

export type HdiTrace=NonNullable<SimpleRouteJson["traces"]>[number]
export const hdiLayers=["top","inner1","inner2","inner3","inner4","inner5","inner6","bottom"]
export const hdiCoreLayers=hdiLayers.slice(1,-1)
export const hdiSignalLayers=["inner1","inner3","inner5","inner6"]
export const hdiMicroLayers=["top","inner1"]
const netIds=(t:HdiTrace)=>[t.connection_name,t.pcb_trace_id,...(t.connectsTo??[])].filter((s):s is string=>typeof s==="string")
const sameNet=(a:string[],b:string[])=>a.some(n=>b.includes(n))
const near=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y)<1e-5
const equalLayers=(a:string[],b:string[])=>a.length===b.length&&b.every(l=>a.includes(l))

export function hdiEscapes(input:SimpleRouteJson) {
  if(input.layerCount!==8||input.allowBlindAndBuriedVias!==true)
    throw new Error("HDI fixture requires eight physical layers and declared blind/buried vias")
  const vias=input.obstacles.filter(isMemoryEscapeVia)
  if(vias.length!==134||vias.some(v=>v.width!==.25||v.height!==.25||!equalLayers(v.layers,hdiMicroLayers)))
    throw new Error("Expected 134 declared 0.25/0.10mm Top-L2 microvia escapes")
  return vias
}

export function hdiCopperObstacles(traces:HdiTrace[],reserveDrill=false,process:HdiProcess=standardHdi):Obstacle[] {
  return traces.flatMap((t,ti)=>t.route.flatMap((a,i):Obstacle[]=>{
    const b=t.route[i+1],connectedTo=netIds(t)
    if(a.route_type==="via") {
      if(!a.layers||!equalLayers(a.layers,hdiCoreLayers)||a.via_diameter!==process.coreDiameter||a.via_hole_diameter!==process.coreHole)
        throw new Error("An autorouted HDI via must explicitly occupy the complete L2-L7 core")
      const diameter=reserveDrill ? coreReservation(process) : process.coreDiameter
      return [{type:"rect" as const,shape:"circle" as const,center:{x:a.x,y:a.y},width:diameter,height:diameter,
        layers:[...hdiCoreLayers],connectedTo,obstacleId:`hdi_${ti}_via_${i}`}]
    }
    if(a.route_type!=="wire"||b?.route_type!=="wire"||a.layer!==b.layer)return []
    const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),width=Math.max(a.width,b.width)
    if(length<1e-9)return []
    return [{type:"rect" as const,center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},width:length+width,height:width,
      ccwRotationDegrees:Math.atan2(dy,dx)*180/Math.PI,layers:[a.layer],connectedTo,
      obstacleId:`hdi_${ti}_segment_${i}`}]
  }))
}

export function auditHdiMemory(input:SimpleRouteJson,candidates:HdiTrace[],process:HdiProcess=standardHdi) {
  const escapes=hdiEscapes(input),escapeSet=new Set(escapes)
  const sourceCopper=input.obstacles.map(o=>escapeSet.has(o)?{...o,shape:"circle" as const}:o)
  const all=[...(input.traces??[]),...candidates]
  const drills=escapes.map((o,i)=>({center:o.center,hole:.1,diameter:.25,layers:hdiMicroLayers,
    net:o.connectedTo,id:`micro_escape_${i}`,candidate:false}))
  for(const t of all)for(let i=0;i<t.route.length;i++) {
    const p=t.route[i];if(p.route_type!=="via")continue
    if(!p.layers||!equalLayers(p.layers,hdiCoreLayers)||p.via_diameter!==process.coreDiameter||p.via_hole_diameter!==process.coreHole)
      throw new Error("HDI core via span or drill/land differs from the proposed process")
    const net=netIds(t)
    if(drills.some(d=>near(d.center,p)&&sameNet(d.net,net)&&equalLayers(d.layers,p.layers!)))continue
    drills.push({center:p,hole:process.coreHole,diameter:process.coreDiameter,layers:[...hdiCoreLayers],net,id:`${t.connection_name}_via_${i}`,candidate:candidates.includes(t)})
  }
  // Routing rectangles conservatively cover a segment's round end caps.
  // Physical audits instead use the exact capsule below, in both directions:
  // otherwise adding a wire beside an earlier via can pass while auditing
  // that same via against the wire later reports a fictitious square corner.
  const copper=[...sourceCopper,...hdiCopperObstacles(all,false,process).filter(o=>o.obstacleId?.includes("_via_"))]
  const wires=all.flatMap(t=>t.route.flatMap((a,i)=>{
    const b=t.route[i+1]
    if(a.route_type!=="wire"||b?.route_type!=="wire"||a.layer!==b.layer||near(a,b))return []
    return [{a,b,width:Math.max(a.width,b.width),layer:a.layer,net:netIds(t),trace:t.connection_name,index:i,candidate:candidates.includes(t)}]
  }))
  const issues:{kind:string;trace:string;index?:number;obstacle:string;clearance:number;minimum:number;x?:number;y?:number}[]=[]
  const add=(kind:string,trace:string,obstacle:string,clearance:number,minimum:number,extra={})=>{
    if(clearance<minimum-1e-6)issues.push({kind,trace,obstacle,clearance,minimum,...extra})
  }
  for(const d of drills.filter(d=>d.candidate)) {
    const extra={x:d.center.x,y:d.center.y}
    add("via_edge",d.id,"board_edge",Math.min(d.center.x-input.bounds.minX,input.bounds.maxX-d.center.x,d.center.y-input.bounds.minY,input.bounds.maxY-d.center.y)-d.diameter/2,.2,extra)
    for(const o of copper) {
      if(!o.layers.some(l=>d.layers.includes(l))||sameNet(d.net,o.connectedTo))continue
      const dist=distanceToCopper(d.center,o),id=o.obstacleId??JSON.stringify(o.connectedTo)
      add("via_copper",d.id,id,dist-d.diameter/2,.09,extra)
      add("via_hole_copper",d.id,id,dist-d.hole/2,.2,extra)
    }
    for(const w of wires) {
      if(!d.layers.includes(w.layer)||sameNet(d.net,w.net))continue
      const dist=pointSegment(d.center,w.a,w.b)-w.width/2
      const id=`${w.trace}_segment_${w.index}`
      add("via_copper",d.id,id,dist-d.diameter/2,.09,extra)
      add("via_hole_copper",d.id,id,dist-d.hole/2,.2,extra)
    }
    for(const other of drills) {
      if(d===other||!d.layers.some(l=>other.layers.includes(l)))continue
      // Intentional same-net microvia/core-via stacks share L2. Both
      // physical drill spans remain recorded; no foreign overlap is waived.
      if(near(d.center,other.center)&&sameNet(d.net,other.net)&&
        !equalLayers(d.layers,other.layers)&&other.layers.length===2)continue
      add("via_hole_hole",d.id,other.id,Math.hypot(d.center.x-other.center.x,d.center.y-other.center.y)-(d.hole+other.hole)/2,.24,extra)
    }
  }
  for(const w of wires.filter(w=>w.candidate)) {
    const extra={index:w.index}
    for(const p of [w.a,w.b])add("wire_edge",w.trace,"board_edge",Math.min(p.x-input.bounds.minX,input.bounds.maxX-p.x,p.y-input.bounds.minY,input.bounds.maxY-p.y)-w.width/2,.2,extra)
    for(const o of sourceCopper) {
      if(!o.layers.includes(w.layer)||sameNet(w.net,o.connectedTo))continue
      add("wire_copper",w.trace,o.obstacleId??JSON.stringify(o.connectedTo),segmentToCopper(w.a,w.b,o)-w.width/2,.09,extra)
    }
    for(const other of wires) {
      if(other.layer!==w.layer||sameNet(w.net,other.net))continue
      add("wire_wire",w.trace,`${other.trace}_segment_${other.index}`,segments(w.a,w.b,other.a,other.b)-(w.width+other.width)/2,.09,extra)
    }
    for(const d of drills) {
      if(!d.layers.includes(w.layer)||sameNet(w.net,d.net))continue
      const dist=pointSegment(d.center,w.a,w.b)
      add("wire_via_copper",w.trace,d.id,dist-w.width/2-d.diameter/2,.09,extra)
      add("wire_via_hole",w.trace,d.id,dist-w.width/2-d.hole/2,.2,extra)
    }
  }
  return {newVias:drills.filter(d=>d.candidate).length,issues}
}
