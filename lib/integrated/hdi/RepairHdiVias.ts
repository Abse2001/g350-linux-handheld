import {standardHdi,type HdiProcess} from "./HdiProcess"
import type {SimpleRouteJson} from "@tscircuit/capacity-autorouter"
import {auditHdiMemory,hdiEscapes,type HdiTrace} from "./HdiGeometry"

// Manual local corrections to a REAL autorouter candidate. Try a supported
// same-net microvia/core stack first, then bounded drill movements. Never
// move earlier copper or accept a new/worse physical clearance violation.
export function repairHdiVias(input:SimpleRouteJson,original:HdiTrace[],process:HdiProcess=standardHdi) {
  let traces=original
  const deadline=Date.now()+4000
  const moves:{trace:string;before:{x:number;y:number};after:{x:number;y:number}}[]=[]
  const escapes=hdiEscapes(input)
  const initial=auditHdiMemory(input,traces,process)
  const bad=new Map(initial.issues.filter(i=>i.x!==undefined&&i.y!==undefined).map(i=>[i.trace,i]))
  for(const [id,issue]of bad) {
    const ti=traces.findIndex(t=>t.route.some((p,i)=>p.route_type==="via"&&`${t.connection_name}_via_${i}`===id))
    if(ti<0)continue
    const trace=traces[ti],pi=trace.route.findIndex((p,i)=>p.route_type==="via"&&`${trace.connection_name}_via_${i}`===id)
    const p=trace.route[pi],a=trace.route[pi-1],b=trace.route[pi+1]
    if(p.route_type!=="via"||a?.route_type!=="wire"||b?.route_type!=="wire"||
      Math.hypot(a.x-p.x,a.y-p.y)>1e-5||Math.hypot(b.x-p.x,b.y-p.y)>1e-5)continue
    const positions=escapes.filter(o=>o.connectedTo.includes(trace.connection_name)&&Math.hypot(o.center.x-p.x,o.center.y-p.y)<.8).map(o=>o.center)
    const offsets:{x:number;y:number}[]=[]
    for(let x=-10;x<=10;x++)for(let y=-10;y<=10;y++)if(x||y)offsets.push({x:x*.01,y:y*.01})
    for(let x=-12;x<=12;x++)for(let y=-12;y<=12;y++)if(Math.hypot(x,y)*.05<=.600001)offsets.push({x:x*.05,y:y*.05})
    offsets.sort((a,b)=>Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y))
    positions.push(...offsets.map(o=>({x:p.x+o.x,y:p.y+o.y})))
    const before=auditHdiMemory(input,traces,process)
    const key=(i:typeof issue)=>`${i.kind}:${i.trace}:${i.obstacle}:${i.index??""}`
    const old=new Map(before.issues.map(i=>[key(i),i.clearance]))
    for(const after of positions) {
      if(Date.now()>deadline)return {traces,moves,audit:auditHdiMemory(input,traces,process)}
      const moved={...trace,route:trace.route.map((q,i)=>[pi-1,pi,pi+1].includes(i)?{...q,...after}:q)}
      const proposed=traces.map((t,i)=>i===ti?moved:t)
      const audit=auditHdiMemory(input,proposed,process)
      if(audit.issues.some(i=>i.trace===id)||audit.issues.length>=before.issues.length||
        audit.issues.some(i=>!old.has(key(i))||i.clearance<old.get(key(i))!-1e-6))continue
      traces=proposed;moves.push({trace:trace.connection_name,before:{x:p.x,y:p.y},after});break
    }
  }
  return {traces,moves,audit:auditHdiMemory(input,traces,process)}
}
