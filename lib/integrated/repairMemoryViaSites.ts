import type {SimpleRouteJson,Obstacle} from "@tscircuit/capacity-autorouter"
import {auditMemoryThroughVias,distanceToCopper,isMemoryEscapeVia,memoryCopperObstacles} from "./auditMemoryThroughVias"

type Point={x:number;y:number}
type Trace=NonNullable<SimpleRouteJson["traces"]>[number]
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y)
const sameNet=(a:string[],b:string[])=>a.some(id=>b.includes(id))
export function pointSegment(p:Point,a:Point,b:Point) {
  const dx=b.x-a.x,dy=b.y-a.y,denom=dx*dx+dy*dy
  const t=denom?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/denom)):0
  return distance(p,{x:a.x+t*dx,y:a.y+t*dy})
}
export function segments(a:Point,b:Point,c:Point,d:Point) {
  const vx=b.x-a.x,vy=b.y-a.y,wx=d.x-c.x,wy=d.y-c.y,den=vx*wy-vy*wx
  if(Math.abs(den)>1e-12) {
    const t=((c.x-a.x)*wy-(c.y-a.y)*wx)/den
    const u=((c.x-a.x)*vy-(c.y-a.y)*vx)/den
    if(t>=0&&t<=1&&u>=0&&u<=1)return 0
  }
  return Math.min(pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b))
}
export function segmentToCopper(a:Point,b:Point,o:Obstacle) {
  if(o.shape==="circle")return pointSegment(o.center,a,b)-o.width/2
  if(o.type!=="rect")throw new Error(`Unsupported copper obstacle ${o.type}`)
  if(distanceToCopper(a,o)===0||distanceToCopper(b,o)===0)return 0
  const angle=(o.ccwRotationDegrees??0)*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle)
  const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sy])=>{
    const x=sx*o.width/2,y=sy*o.height/2
    return {x:o.center.x+x*cos-y*sin,y:o.center.y+x*sin+y*cos}
  })
  return Math.min(...corners.map((p,i)=>segments(a,b,p,corners[(i+1)%4])))
}

// A manual, bounded local adjustment after real autorouting: move a new
// through-via and its two adjoining wire ends, keeping the rest of the route
// unchanged. Every moved segment is checked on its physical copper layer,
// and every drill is checked across all six layers. If no legal position is
// found within 0.8mm, leave it unresolved for a fresh autorouter attempt.
export function repairMemoryViaSites(input:SimpleRouteJson,original:Trace[]) {
  let traces=original
  const moves:{net:string;before:Point;after:Point}[]=[]
  const audit=auditMemoryThroughVias(input,traces)
  const bad=new Map(audit.issues.map(i=>[i.via.id,i.via]))
  for(const [id,via]of bad) {
    const ti=traces.findIndex(t=>t.route.some((p,i)=>p.route_type==="via"&&`${t.connection_name}_via_${i}`===id))
    if(ti<0)throw new Error("Cannot locate new autorouted via for local repair")
    const trace=traces[ti],pi=trace.route.findIndex((p,i)=>p.route_type==="via"&&`${trace.connection_name}_via_${i}`===id)
    const prev=trace.route[pi-1],next=trace.route[pi+1]
    if(prev?.route_type!=="wire"||next?.route_type!=="wire"||distance(prev,via)>1e-5||distance(next,via)>1e-5)continue
    const net=[trace.connection_name,trace.pcb_trace_id,...(trace.connectsTo??[])].filter((n):n is string=>typeof n==="string")
    const offsets:Point[]=[]
    // Include small moves in narrow drill corridors before wider detours.
    for(let x=-10;x<=10;x++)for(let y=-10;y<=10;y++)
      if(x||y)offsets.push({x:x*0.01,y:y*0.01})
    for(let x=-16;x<=16;x++)for(let y=-16;y<=16;y++) {
      const length=Math.hypot(x,y)*0.05
      if(length>0.049&&length<=0.800001)offsets.push({x:x*0.05,y:y*0.05})
    }
    offsets.sort((a,b)=>Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y)||a.x-b.x||a.y-b.y)
    for(const offset of offsets) {
      const after={x:via.x+offset.x,y:via.y+offset.y}
      const moved={...trace,route:trace.route.map((p,i)=>[pi-1,pi,pi+1].includes(i)?{...p,...after}:p)}
      const proposed=traces.map((t,i)=>i===ti?moved:t)
      if(auditMemoryThroughVias(input,proposed,new Set([id])).issues.length)continue
      const copper=[...input.obstacles.map(o=>isMemoryEscapeVia(o)?{...o,shape:"circle" as const,
        layers:["top","inner1","inner2","inner3","inner4","bottom"]}:o),
        ...memoryCopperObstacles(input.traces??[],false),...memoryCopperObstacles(proposed,false)]
      const drills=copper.filter(o=>isMemoryEscapeVia(o)||o.obstacleId?.includes("_via_"))
      let valid=true
      for(let i=Math.max(0,pi-2);i<=Math.min(pi+1,moved.route.length-2);i++) {
        const a=moved.route[i],b=moved.route[i+1]
        if(a.route_type!=="wire"||b.route_type!=="wire"||a.layer!==b.layer||distance(a,b)<1e-9)continue
        const radius=Math.max(a.width,b.width)/2
        if([a,b].some(p=>Math.min(p.x-input.bounds.minX,input.bounds.maxX-p.x,p.y-input.bounds.minY,input.bounds.maxY-p.y)<radius+0.2-1e-6)){valid=false;break}
        for(const o of copper) {
          if(sameNet(net,o.connectedTo)||!o.layers.includes(a.layer))continue
          if(segmentToCopper(a,b,o)-radius<0.09-1e-6){valid=false;break}
        }
        if(!valid)break
        for(const d of drills) {
          if(sameNet(net,d.connectedTo))continue
          if(pointSegment(d.center,a,b)-radius-0.075<0.2-1e-6){valid=false;break}
        }
        if(!valid)break
      }
      if(!valid)continue
      // Check inverse interactions too: shifted wires must not violate the
      // clearance of another new via that had previously been accepted.
      const beforeIssues=new Set(auditMemoryThroughVias(input,traces).issues.map(i=>`${i.via.id}:${i.rule}:${i.obstacle}`))
      if(auditMemoryThroughVias(input,proposed).issues.some(i=>!beforeIssues.has(`${i.via.id}:${i.rule}:${i.obstacle}`)))continue
      traces=proposed;moves.push({net:trace.connection_name,before:{x:via.x,y:via.y},after})
      break
    }
  }
  return {traces,moves,audit:auditMemoryThroughVias(input,traces)}
}
