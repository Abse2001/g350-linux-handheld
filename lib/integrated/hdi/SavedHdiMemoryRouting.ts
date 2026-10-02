import type {SimpleRouteJson} from "@tscircuit/capacity-autorouter"
import phases from "../../../routing/rk3566-memory-hdi-routes.json"
import project from "../../../package.json"
import {memoryInputFingerprint} from "../MemoryRoutingIdentity"
import {auditHdiMemory,type HdiTrace} from "./HdiGeometry"

// Actual checked HDI copper, reused only for an identical complete physical
// input and package versions. Unmatched phases invoke the live autorouter.
export async function savedHdiMemoryRouting(input:SimpleRouteJson) {
  const fingerprint=await memoryInputFingerprint(input)
  const saved=phases.find(p=>p.inputFingerprint===fingerprint&&
    p.generatorVersion===project.devDependencies["@tscircuit/capacity-autorouter"]&&p.tscircuitVersion===project.devDependencies.tscircuit)
  if(!saved)return undefined
  const traces=structuredClone(saved.traces) as unknown as HdiTrace[]
  if(traces.length!==input.connections.length)throw new Error("Saved HDI phase count differs")
  for(const t of traces) {
    const c=input.connections.find(c=>c.name===t.connection_name)
    if(!c||c.pointsToConnect.length!==2)throw new Error("Saved HDI connection is missing")
    const matched=new Set<number>()
    for(const p of [t.route[0],t.route[t.route.length-1]]) {
      const i=c.pointsToConnect.findIndex(q=>p.route_type==="wire"&&p.layer==="inner1"&&Math.hypot(p.x-q.x,p.y-q.y)<1e-5)
      if(i<0||matched.has(i))throw new Error("Saved HDI route misses an actual L2 terminal")
      matched.add(i)
    }
  }
  if(auditHdiMemory(input,traces).issues.length)throw new Error("Saved HDI copper fails its full physical audit")
  console.log(`Retaining checked Pipeline9 + manual HDI copper: phase ${saved.phase}, ${traces.length} signals`)
  return traces
}
