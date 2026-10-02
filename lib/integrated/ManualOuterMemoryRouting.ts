import type {SimpleRouteJson} from "@tscircuit/capacity-autorouter"
import routes from "../../routing/rk3566-manual-outer-routes.json"
import project from "../../package.json"
import {memoryInputFingerprint} from "./MemoryRoutingIdentity"
import {isMemoryEscapeVia,auditMemoryThroughVias} from "./auditMemoryThroughVias"
import {auditMemoryWires} from "./auditMemoryWires"

// Saved explicit coordinate traces supplement the actual Pipeline 9 phases. Their
// endpoints must be declared full-depth escape vias; no implied layer jump
// or altered clearances. Changed previous copper invalidates these routes.
export async function manualOuterMemoryRouting(input:SimpleRouteJson) {
  const fingerprint=await memoryInputFingerprint(input)
  const saved=routes.find(r=>r.inputFingerprint===fingerprint&&r.tscircuitVersion===project.devDependencies.tscircuit)
  if(!saved)return undefined
  const traces=structuredClone(saved.traces) as unknown as NonNullable<SimpleRouteJson["traces"]>
  const covered=new Set(traces.map(t=>t.connection_name))
  if(covered.size!==input.connections.length||input.connections.some(c=>!covered.has(c.name)))
    throw new Error("Manual phase does not cover its exact declared connection")
  for(const trace of traces) {
    const ends=[trace.route[0],trace.route[trace.route.length-1]]
    let layer=ends[0].route_type==="wire"?ends[0].layer:undefined
    if(!layer||!["inner2","inner3","bottom"].includes(layer))
      throw new Error("Explicit outer route must start on a signal layer")
    for(let i=0;i<trace.route.length;i++) {
      const p=trace.route[i]
      if(p.route_type==="wire") {
        if(p.layer!==layer)throw new Error("Explicit route changes layer without a via")
      } else if(p.route_type==="via") {
        const a=trace.route[i-1],b=trace.route[i+1]
        if(p.from_layer!==layer||!["inner2","inner3","bottom"].includes(p.to_layer)||
          p.via_diameter!==.3||p.via_hole_diameter!==.15||
          a?.route_type!=="wire"||b?.route_type!=="wire"||b.layer!==p.to_layer||
          Math.hypot(a.x-p.x,a.y-p.y)>1e-5||Math.hypot(b.x-p.x,b.y-p.y)>1e-5)
          throw new Error("Explicit route has a disconnected or unsupported through-via")
        layer=p.to_layer
      } else throw new Error("Explicit outer route supports only physical wires and vias")
    }
    const c=input.connections.find(c=>c.name===trace.connection_name)!
    for(const p of ends) {
      if(p.route_type!=="wire"||!c.pointsToConnect.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<1e-5)||
        !input.obstacles.some(o=>isMemoryEscapeVia(o)&&o.connectedTo.includes(c.name)&&Math.hypot(o.center.x-p.x,o.center.y-p.y)<1e-5))
        throw new Error("Manual route does not terminate at a declared physical escape via")
    }
    if(ends[0].route_type!=="wire"||ends[1].route_type!=="wire")
      throw new Error("Explicit route endpoints must be wire copper")
    if(Math.hypot(ends[0].x-ends[1].x,ends[0].y-ends[1].y)<1e-5)
      throw new Error("Manual route does not join two different terminals")
  }
  if(auditMemoryWires(input,traces).issues.length||auditMemoryThroughVias(input,traces).issues.length)
    throw new Error("Manual outer route fails physical copper/drill checks")
  console.log(`Applying explicit ${saved.signal} trace (${saved.origin}): physical wire clearances checked`)
  return traces
}
