import type {SimpleRouteJson} from "@tscircuit/capacity-autorouter"
import phases from "../../routing/rk3566-memory-routes.json"
import project from "../../package.json"
import {memoryInputFingerprint} from "./MemoryRoutingIdentity"
import {auditMemoryThroughVias} from "./auditMemoryThroughVias"
import {auditMemoryWires} from "./auditMemoryWires"

// Preserve verified real autorouting plus documented manual corrections.
// Any change to nets, physical obstacles, previous copper or package versions
// invalidates the input identity and requires a fresh live autorouter run.
export async function savedMemoryRouting(input:SimpleRouteJson) {
  const fingerprint=await memoryInputFingerprint(input)
  const saved=phases.find(p=>p.inputFingerprint===fingerprint&&
    p.generatorVersion===project.devDependencies["@tscircuit/capacity-autorouter"]&&
    p.tscircuitVersion===project.devDependencies.tscircuit)
  if(!saved)return undefined
  const traces=structuredClone(saved.traces) as unknown as NonNullable<SimpleRouteJson["traces"]>
  const covered=new Set(traces.map(t=>t.connection_name))
  if(input.connections.some(c=>!covered.has(c.name))||covered.size!==input.connections.length)
    throw new Error("Saved phase does not cover the current memory connections")
  if(auditMemoryThroughVias(input,traces).issues.length||auditMemoryWires(input,traces).issues.length)
    throw new Error("Saved memory phase no longer passes physical copper/drill clearance checks")
  console.log(`Retaining verified Pipeline9 + manual memory copper: phase ${saved.phase}, ${traces.length} signals`)
  return traces
}
