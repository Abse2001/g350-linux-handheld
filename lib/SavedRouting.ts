import type { SimpleRouteJson } from "@tscircuit/capacity-autorouter"
import savedPhases from "../routing/rev-b-routes.json"
import project from "../package.json"

// Retain the real Pipeline 9 routes after their documented manual corrections.
// The identity includes every port, net, obstacle, manual path and earlier
// phase route. Any subsequent design change falls back to the live autorouter.

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value).sort(([a],[b])=>a.localeCompare(b))
      .map(([key,item])=>[key,canonical(item)]))
  return value
}

export async function savedRouting(input: SimpleRouteJson, phase: number) {
  const digest = await crypto.subtle.digest("SHA-256",
    new TextEncoder().encode(JSON.stringify(canonical(input))))
  const fingerprint = Array.from(new Uint8Array(digest))
    .map(byte=>byte.toString(16).padStart(2,"0")).join("")
  console.log(`Routing input SHA256: phase=${phase} ${fingerprint}`)
  const saved = savedPhases[phase]
  if (!saved || saved.generatorVersion !== project.devDependencies["@tscircuit/capacity-autorouter"] ||
      saved.tscircuitVersion !== project.devDependencies.tscircuit ||
      saved.inputFingerprint !== fingerprint)
    return undefined
  console.log(`Using saved Pipeline 9 routes with manual corrections: phase=${phase}`)
  return structuredClone(saved.traces) as unknown as NonNullable<SimpleRouteJson["traces"]>
}
