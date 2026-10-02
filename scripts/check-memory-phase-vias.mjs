import {readFileSync,writeFileSync} from "node:fs"
import {createHash} from "node:crypto"
import {join} from "node:path"
import {auditMemoryThroughVias} from "../lib/integrated/auditMemoryThroughVias"
import {auditMemoryWires} from "../lib/integrated/auditMemoryWires"

const dir=process.argv[2]??"dist/rk3566-memory-physical-vias"
const phases=Number(process.argv[3]??12)
const destination=process.argv[4]??"checks/integrated/phase-via-validation.json"
const reports=[]
let previousCount=0
for(let phase=0;phase<phases;phase++) {
  const inputPath=join(dir,`phase-${phase}.input.simple-route.json`)
  const outputPath=join(dir,`phase-${phase}.output.traces.json`)
  const rawInput=readFileSync(inputPath),rawOutput=readFileSync(outputPath)
  const input=JSON.parse(rawInput.toString())
  const output=JSON.parse(rawOutput.toString())
  const before=new Set(input.traces?.map(t=>t.connection_name)??[])
  const candidates=output.filter(t=>!before.has(t.connection_name))
  const covered=new Set(candidates.map(t=>t.connection_name))
  const missing=input.connections.filter(c=>!covered.has(c.name)).map(c=>c.name)
  if((input.traces?.length??0)!==previousCount)throw new Error(`Phase ${phase} does not continue the previous completed copper`)
  const audit=auditMemoryThroughVias(input,candidates)
  const wireAudit=auditMemoryWires(input,candidates)
  reports.push({phase,inputPath,outputPath,
    inputSha256:createHash("sha256").update(rawInput).digest("hex"),
    outputSha256:createHash("sha256").update(rawOutput).digest("hex"),
    completed:output.length,newSignals:candidates.length,missing,...audit,wireIssues:wireAudit.issues})
  previousCount=output.length
}
const fail=reports.some(r=>r.issues.length||r.wireIssues.length||r.missing.length)
writeFileSync(destination,JSON.stringify({status:fail?"PHASE_VIA_VALIDATION_FAIL":"COMPLETED_PHASE_VIAS_PASS",
  fabricationReady:false,scope:"New autorouted wires and full-depth vias versus physical copper, drilled holes and edges in the specified completed phases. Not complete host, timing, or final export DRC.",
  completedSignals:previousCount,requiredSignals:67,phases:reports},null,2)+"\n")
console.log(`${fail?"FAIL":"PASS"}: ${phases} completed phases, ${previousCount}/67 memory signals. See ${destination}`)
if(fail)process.exitCode=1
