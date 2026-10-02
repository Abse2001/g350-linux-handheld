import {standardHdi,type HdiProcess} from "./HdiProcess"
import type {SimpleRouteJson} from "@tscircuit/capacity-autorouter"
import {auditHdiMemory,type HdiTrace} from "./HdiGeometry"

// Bounded manual bend corrections on the NEW solver candidate. Earlier
// phases, terminals, vias and layer transitions never move. Accept only
// strict improvement without introducing or worsening any physical issue.
export function repairHdiWires(input:SimpleRouteJson,original:HdiTrace[],process:HdiProcess=standardHdi) {
  let traces=original
  const deadline=Date.now()+4000
  const moves:{trace:string;indices:number[];dx:number;dy:number}[]=[]
  const offsets:{x:number;y:number}[]=[]
  for(let x=-10;x<=10;x++)for(let y=-10;y<=10;y++)if(x||y)offsets.push({x:x*.01,y:y*.01})
  for(let x=-12;x<=12;x++)for(let y=-12;y<=12;y++)if(Math.hypot(x,y)*.05<=.600001)offsets.push({x:x*.05,y:y*.05})
  offsets.sort((a,b)=>Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y))
  for(let round=0;round<40;round++) {
    const before=auditHdiMemory(input,traces,process)
    if(!before.issues.length)break
    const key=(i:typeof before.issues[number])=>`${i.kind}:${i.trace}:${i.obstacle}:${i.index??""}`
    const old=new Map(before.issues.map(i=>[key(i),i.clearance]))
    const deficit=(issues:typeof before.issues)=>issues.reduce((s,i)=>s+Math.max(0,i.minimum-i.clearance),0)
    let accepted=false
    for(let ti=0;ti<traces.length&&!accepted;ti++) {
      const t=traces[ti]
      const indices=[...new Set(before.issues.filter(i=>i.trace===t.connection_name&&i.index!==undefined).flatMap(i=>[i.index!,i.index!+1]))]
        .filter(i=>i>0&&i<t.route.length-1&&[i-1,i,i+1].every(j=>t.route[j].route_type==="wire")&&
          [i-1,i+1].every(j=>t.route[j].route_type==="wire"&&t.route[i].route_type==="wire"&&t.route[j].layer===t.route[i].layer))
      const groups=[indices,...indices.map(i=>[i])].filter(g=>g.length)
      for(const group of groups) {
        for(const d of offsets) {
          if(Date.now()>deadline)return {traces,moves,audit:auditHdiMemory(input,traces,process)}
          if(group.some(i=>{
            const p=t.route[i],initial=original[ti].route[i]
            return p.route_type!=="wire"||initial.route_type!=="wire"||Math.hypot(p.x+d.x-initial.x,p.y+d.y-initial.y)>.800001
          }))continue
          const moved={...t,route:t.route.map((p,i)=>group.includes(i)&&p.route_type==="wire"?{...p,x:p.x+d.x,y:p.y+d.y}:p)}
          const proposed=traces.map((t,i)=>i===ti?moved:t),audit=auditHdiMemory(input,proposed,process)
          if(deficit(audit.issues)>=deficit(before.issues)-1e-6||
            audit.issues.some(i=>!old.has(key(i))||i.clearance<old.get(key(i))!-1e-6))continue
          traces=proposed;moves.push({trace:t.connection_name,indices:group,dx:d.x,dy:d.y});accepted=true;break
        }
        if(accepted)break
      }
    }
    if(!accepted)break
  }
  return {traces,moves,audit:auditHdiMemory(input,traces,process)}
}
