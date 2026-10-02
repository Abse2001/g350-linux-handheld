import {readFileSync,writeFileSync} from "node:fs"
import {memoryInputFingerprint} from "../lib/integrated/MemoryRoutingIdentity.ts"
import {auditMemoryThroughVias} from "../lib/integrated/auditMemoryThroughVias.ts"
import {auditMemoryWires} from "../lib/integrated/auditMemoryWires.ts"
const read=p=>JSON.parse(readFileSync(p))
const dir=process.argv[2]??"dist/rk3566-memory-through-terminals"
const phaseCount=Number(process.argv[3]??6)
const evidence=process.argv[4]??"checks/integrated/memory-36"
const project=read("package.json")
const drc=read(`${evidence}-kicad-drc.json`)
if(drc.violations.some(v=>v.severity==="error"))throw new Error("Repair the independent diagnostic DRC before retaining these routes")
if(!readFileSync(`${evidence}-shorts.log`,"utf8").includes("No shorts detected"))throw new Error("Actual Gerber shorts verification required")
const saved=[]
let previous=[]
for(let phase=0;phase<phaseCount;phase++) {
  const input=read(`${dir}/phase-${phase}.input.simple-route.json`)
  const output=read(`${dir}/phase-${phase}.output.traces.json`)
  if(await memoryInputFingerprint(input.traces??[])!==await memoryInputFingerprint(previous))
    throw new Error(`Phase ${phase} does not preserve earlier copper`)
  const before=new Set(previous.map(t=>t.connection_name))
  const candidates=output.filter(t=>!before.has(t.connection_name))
  const covered=new Set(candidates.map(t=>t.connection_name))
  if(input.connections.some(c=>!covered.has(c.name))||covered.size!==input.connections.length)
    throw new Error(`Phase ${phase} differs from the actual routing connections`)
  const vias=auditMemoryThroughVias(input,candidates),wires=auditMemoryWires(input,candidates)
  if(vias.issues.length||wires.issues.length)throw new Error(`Phase ${phase} physical clearance check failed`)
  saved.push({phase,inputFingerprint:await memoryInputFingerprint(input),
    generatorVersion:project.devDependencies["@tscircuit/capacity-autorouter"],
    tscircuitVersion:project.devDependencies.tscircuit,
    provenance:"Actual Pipeline9 routes with documented bounded manual via/wire adjustments. Gerber shorts and independent KiCad copper/drill checks passed on the partial diagnostic. Remaining signals, DDR timing and the full host are not qualified.",
    traces:candidates})
  previous=output
}
writeFileSync("routing/rk3566-memory-routes.json",JSON.stringify(saved,null,2)+"\n")
console.log(`Retained ${previous.length}/67 signals in ${saved.length} phases; live autorouting remains required for all others.`)
