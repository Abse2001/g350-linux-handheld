import type {SimpleRouteJson} from "@tscircuit/capacity-autorouter"
import {isMemoryEscapeVia,auditMemoryThroughVias} from "./auditMemoryThroughVias"
import {pointSegment,segments,segmentToCopper} from "./repairMemoryViaSites"
type Trace=NonNullable<SimpleRouteJson["traces"]>[number]
const sameNet=(a:string[],b:string[])=>a.some(id=>b.includes(id))
const ids=(t:Trace)=>[t.connection_name,t.pcb_trace_id,...(t.connectsTo??[])].filter((s):s is string=>typeof s==="string")
export function auditMemoryWires(input:SimpleRouteJson,candidates:Trace[],onlyTrace?:string) {
  const all=[...(input.traces??[]),...candidates]
  const manual=input.obstacles.filter(isMemoryEscapeVia)
  const physical=input.obstacles.map(o=>isMemoryEscapeVia(o)?{...o,shape:"circle" as const,
    layers:["top","inner1","inner2","inner3","inner4","bottom"]}:o)
  const drills=manual.map((o,i)=>({center:o.center,hole:0.15,diameter:o.width,net:o.connectedTo,id:`manual_escape_${i}`}))
  const wires=all.flatMap(t=>t.route.flatMap((a,i)=>{
    const b=t.route[i+1]
    if(a.route_type!=="wire"||b?.route_type!=="wire"||a.layer!==b.layer||Math.hypot(a.x-b.x,a.y-b.y)<1e-9)return []
    return [{a,b,width:Math.max(a.width,b.width),layer:a.layer,net:ids(t),name:t.connection_name,index:i}]
  }))
  for(const t of all)for(let i=0;i<t.route.length;i++) {
    const p=t.route[i];if(p.route_type!=="via")continue
    const net=ids(t)
    if(drills.some(d=>Math.hypot(d.center.x-p.x,d.center.y-p.y)<1e-5&&sameNet(d.net,net)))continue
    drills.push({center:{x:p.x,y:p.y},hole:p.via_hole_diameter??0.15,diameter:p.via_diameter??0.3,net,id:`${t.connection_name}_via_${i}`})
  }
  const names=new Set(candidates.map(t=>t.connection_name))
  const issues:{trace:string;index:number;obstacle:string;rule:string;clearance:number;minimum:number}[]=[]
  for(const a of wires.filter(w=>names.has(w.name)&&(!onlyTrace||w.name===onlyTrace))) {
    const add=(obstacle:string,rule:string,clearance:number,minimum:number)=>{
      if(clearance<minimum-1e-6)issues.push({trace:a.name,index:a.index,obstacle,rule,clearance,minimum})
    }
    for(const p of [a.a,a.b])add("board_edge","edge_clearance",
      Math.min(p.x-input.bounds.minX,input.bounds.maxX-p.x,p.y-input.bounds.minY,input.bounds.maxY-p.y)-a.width/2,0.2)
    for(const o of physical) {
      if(!o.layers.includes(a.layer)||sameNet(a.net,o.connectedTo))continue
      add(o.obstacleId??JSON.stringify(o.circuitJsonMetadata??o.connectedTo),"copper_clearance",segmentToCopper(a.a,a.b,o)-a.width/2,0.09)
    }
    for(const b of wires) {
      if(b.layer!==a.layer||sameNet(a.net,b.net))continue
      add(`${b.name}_segment_${b.index}`,"copper_clearance",segments(a.a,a.b,b.a,b.b)-(a.width+b.width)/2,0.09)
    }
    for(const d of drills) {
      if(sameNet(a.net,d.net))continue
      const distance=pointSegment(d.center,a.a,a.b)
      add(d.id,"hole_clearance",distance-a.width/2-d.hole/2,0.2)
      add(d.id,"copper_clearance",distance-a.width/2-d.diameter/2,0.09)
    }
  }
  return {issues}
}

// Small manual doglegs around an existing drill; source terminals, trace
// widths and layers stay fixed. Existing autorouted wire geometry is the
// starting point. Reject any change that introduces a copper/via violation.
export function repairMemoryWireSites(input:SimpleRouteJson,original:Trace[]) {
  let traces=original
  const moves:{trace:string;segment:number;bend:{x:number;y:number}}[]=[]
  for(let attempt=0;attempt<24;attempt++) {
    const audit=auditMemoryWires(input,traces)
    if(!audit.issues.length)break
    let repaired=false
    for(const issue of audit.issues) {
      const ti=traces.findIndex(t=>t.connection_name===issue.trace),trace=traces[ti]
      const a=trace.route[issue.index],b=trace.route[issue.index+1]
      if(a.route_type!=="wire"||b.route_type!=="wire"||a.layer!==b.layer)throw new Error("Invalid manual wire-repair index")
      const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)
      if(length<0.02)continue
      search: for(const position of [0.25,0.5,0.75])for(let offset=0.01;offset<=0.160001;offset+=0.01)for(const sign of [-1,1]) {
        const bend={x:a.x+dx*position-sign*dy/length*offset,y:a.y+dy*position+sign*dx/length*offset}
        const moved={...trace,route:[...trace.route.slice(0,issue.index+1),{...a,...bend},...trace.route.slice(issue.index+1)]}
        const proposed=traces.map((t,i)=>i===ti?moved:t)
        if(auditMemoryWires(input,proposed,issue.trace).issues.length)continue
        if(auditMemoryThroughVias(input,proposed).issues.length)continue
        traces=proposed;moves.push({trace:issue.trace,segment:issue.index,bend});repaired=true
        break search
      }
      if(repaired)break
    }
    if(!repaired)break
  }
  return {traces,moves,audit:auditMemoryWires(input,traces)}
}
