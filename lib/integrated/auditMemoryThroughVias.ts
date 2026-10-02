import type { SimpleRouteJson, Obstacle } from "@tscircuit/capacity-autorouter"

type Trace = NonNullable<SimpleRouteJson["traces"]>[number]
const physicalLayers = ["top", "inner1", "inner2", "inner3", "inner4", "bottom"]
const near = (a:{x:number;y:number},b:{x:number;y:number}) => Math.hypot(a.x-b.x,a.y-b.y)<1e-5
const sameNet = (a:string[],b:string[]) => a.some(id=>b.includes(id))
export const isMemoryEscapeVia = (o:Obstacle) => o.layers.length>1 &&
  [0.25,0.3].some(d=>Math.abs(o.width-d)<1e-6&&Math.abs(o.height-d)<1e-6) &&
  o.connectedTo.some(id=>id.startsWith("breakout:pcb_breakout_point_"))

// Use actual copper for physical validation. For solver obstacles, expand
// via lands enough that its 0.09mm copper rule also protects 0.2mm drill gaps.
export function memoryCopperObstacles(traces:Trace[], reserveDrill=true):Obstacle[] {
  return traces.flatMap((trace,ti)=>{
    const result:Obstacle[]=[]
    const connectedTo=[trace.connection_name,trace.pcb_trace_id,...(trace.connectsTo??[])]
      .filter((id):id is string=>typeof id==="string")
    for(let i=0;i<trace.route.length;i++) {
      const a=trace.route[i],b=trace.route[i+1]
      if(a.route_type==="via") {
        const diameter=a.via_diameter??0.3,hole=a.via_hole_diameter??0.15
        const size=reserveDrill?Math.max(diameter,hole+2*(0.2-0.09)):diameter
        result.push({obstacleId:`memory_fixed_${ti}_via_${i}`,type:"rect",shape:"circle",
          layers:physicalLayers,center:{x:a.x,y:a.y},width:size,height:size,connectedTo})
      }
      if(a.route_type!=="wire"||b?.route_type!=="wire"||a.layer!==b.layer)continue
      const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),width=Math.max(a.width,b.width)
      if(length<1e-9)continue
      result.push({obstacleId:`memory_fixed_${ti}_segment_${i}`,type:"rect",layers:[a.layer],
        center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},width:length+width,height:width,
        ccwRotationDegrees:Math.atan2(dy,dx)*180/Math.PI,connectedTo})
    }
    return result
  })
}

type Drill = {x:number;y:number;hole:number;diameter:number;net:string[];id:string;candidate:boolean}
export type MemoryViaIssue = {
  via:{x:number;y:number;id:string;net:string[]}; obstacle:string;
  rule:"copper_clearance"|"hole_clearance"|"hole_to_hole"|"edge_clearance";
  clearance:number; minimum:number
}

export function distanceToCopper(p:{x:number;y:number},o:Obstacle) {
  const dx=p.x-o.center.x,dy=p.y-o.center.y
  if(o.shape==="circle")return Math.hypot(dx,dy)-o.width/2
  if(o.type!=="rect")throw new Error(`Unsupported physical obstacle ${o.type}`)
  const angle=(o.ccwRotationDegrees??0)*Math.PI/180
  const x=dx*Math.cos(angle)+dy*Math.sin(angle),y=-dx*Math.sin(angle)+dy*Math.cos(angle)
  return Math.hypot(Math.max(0,Math.abs(x)-o.width/2),Math.max(0,Math.abs(y)-o.height/2))
}

// The solver's logical inner-to-inner via can still touch unrelated copper
// on top/bottom: on this board every drill traverses all SIX physical layers.
// Check new vias before accepting a phase, including other nets in that same
// phase. This supplements, and never replaces, final Gerber and KiCad DRC.
export function auditMemoryThroughVias(input:SimpleRouteJson,candidates:Trace[],onlyViaIds?:Set<string>) {
  const manual=input.obstacles.filter(isMemoryEscapeVia)
  const manualSet=new Set(manual)
  const sourceCopper=input.obstacles.map(o=>manualSet.has(o)?{...o,shape:"circle" as const,layers:physicalLayers}:o)
  const drills:Drill[]=manual.map((o,i)=>({x:o.center.x,y:o.center.y,hole:0.15,diameter:o.width,
    net:o.connectedTo,id:`manual_escape_${i}`,candidate:false}))
  for(const [set,isCandidate] of [[input.traces??[],false],[candidates,true]] as const) {
    for(const t of set) for(let i=0;i<t.route.length;i++) {
      const p=t.route[i]
      if(p.route_type!=="via")continue
      const net=[t.connection_name,t.pcb_trace_id,...(t.connectsTo??[])].filter((s):s is string=>typeof s==="string")
      if(drills.some(d=>near(d,p)&&sameNet(d.net,net)))continue
      drills.push({x:p.x,y:p.y,hole:p.via_hole_diameter??0.15,diameter:p.via_diameter??0.3,
        net,id:`${t.connection_name}_via_${i}`,candidate:isCandidate})
    }
  }
  const copper=[...sourceCopper,...memoryCopperObstacles(input.traces??[],false),...memoryCopperObstacles(candidates,false)]
  const issues:MemoryViaIssue[]=[]
  let minDrillCopper=Infinity,minCopper=Infinity,minDrillDrill=Infinity
  for(const a of drills.filter(d=>d.candidate&&(!onlyViaIds||onlyViaIds.has(d.id)))) {
    const via={x:a.x,y:a.y,id:a.id,net:a.net}
    const edge=Math.min(a.x-input.bounds.minX,input.bounds.maxX-a.x,a.y-input.bounds.minY,input.bounds.maxY-a.y)-a.diameter/2
    if(edge<0.2-1e-6)issues.push({via,obstacle:"board_edge",rule:"edge_clearance",clearance:edge,minimum:0.2})
    for(const b of drills) {
      if(a===b)continue
      const c=Math.hypot(a.x-b.x,a.y-b.y)-(a.hole+b.hole)/2
      minDrillDrill=Math.min(minDrillDrill,c)
      if(c<0.2-1e-6)issues.push({via,obstacle:b.id,rule:"hole_to_hole",clearance:c,minimum:0.2})
    }
    for(const o of copper) {
      if(!o.layers.length||sameNet(a.net,o.connectedTo))continue
      const distance=distanceToCopper(a,o),cc=distance-a.diameter/2,hc=distance-a.hole/2
      minDrillCopper=Math.min(minDrillCopper,hc);minCopper=Math.min(minCopper,cc)
      const obstacle=o.obstacleId??JSON.stringify(o.circuitJsonMetadata??o.connectedTo)
      if(cc<0.09-1e-6)issues.push({via,obstacle,rule:"copper_clearance",clearance:cc,minimum:0.09})
      if(hc<0.2-1e-6)issues.push({via,obstacle,rule:"hole_clearance",clearance:hc,minimum:0.2})
    }
  }
  return {newViaCount:drills.filter(d=>d.candidate).length,minDrillCopper,minCopper,minDrillDrill,issues}
}
