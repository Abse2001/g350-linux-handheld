import {readFileSync,writeFileSync} from "node:fs"
import {createHash} from "node:crypto"
import {standardHdi,thinHdi} from "../lib/integrated/hdi/HdiProcess.ts"
import {hdiEscapes,auditHdiMemory} from "../lib/integrated/hdi/HdiGeometry.ts"
import {distanceToCopper} from "../lib/integrated/auditMemoryThroughVias.ts"

// Analytical precheck of real saved physical obstacles and accepted copper.
// It supplements exported Gerber shorts and independent KiCad DRC.
const inputPath=process.argv[2],outputPath=process.argv[3]
if(!inputPath||!outputPath)throw new Error("Supply the exact phase checkpoint and report path")
const hdiProcess=process.argv[4]==="--thin-hdi"?thinHdi:standardHdi
const raw=readFileSync(inputPath),input=JSON.parse(raw),escapes=hdiEscapes(input)
const sameNet=(a,b)=>a.some(n=>b.includes(n))
const issues=[]
let holeCopper=Infinity,holeHole=Infinity
for(let i=0;i<escapes.length;i++) {
  const via=escapes[i]
  for(const obstacle of input.obstacles) {
    if(!obstacle.layers.some(l=>via.layers.includes(l))||sameNet(via.connectedTo,obstacle.connectedTo))continue
    const copper=escapes.includes(obstacle)?{...obstacle,shape:"circle"}:obstacle
    const clearance=distanceToCopper(via.center,copper)-.05
    holeCopper=Math.min(holeCopper,clearance)
    if(clearance<.2-1e-6)issues.push({kind:"microvia_hole_copper",via:i,obstacle:obstacle.obstacleId??obstacle.connectedTo,clearance,minimum:.2})
  }
  for(let j=0;j<i;j++) {
    const other=escapes[j],clearance=Math.hypot(via.center.x-other.center.x,via.center.y-other.center.y)-.1
    holeHole=Math.min(holeHole,clearance)
    if(clearance<.24-1e-6)issues.push({kind:"microvia_hole_hole",via:i,other:j,clearance,minimum:.24})
  }
}
const accepted=input.traces??[]
if(!accepted.length)throw new Error("No actual completed copper phases to check")
const audit=auditHdiMemory({...input,traces:[]},accepted,hdiProcess)
issues.push(...audit.issues)
// Regression: widening one declared buried drill span to Top must be
// rejected, rather than silently treating its logical transition as its
// physical drill. This protects top BGA pads from phantom through-vias.
const changed=structuredClone(accepted),via=changed.flatMap(t=>t.route).find(p=>p.route_type==="via")
if(!via)throw new Error("Expected a real buried via for the span regression")
via.layers=["top","inner1","inner2","inner3","inner4","inner5","inner6","bottom"]
let spanRegression=false
try{auditHdiMemory({...input,traces:[]},changed,hdiProcess)}catch{spanRegression=true}
if(!spanRegression)throw new Error("Invalid through-via mutation was accepted")
const report={status:issues.length?"HDI_PHYSICAL_PRECHECK_FAIL":"HDI_PHYSICAL_PRECHECK_PASS_HOST_INCOMPLETE",
  fabricationReady:false,proposedProcess:hdiProcess,input:inputPath,sha256:createHash("sha256").update(raw).digest("hex"),
  scope:"Proposed 1+6+1 HDI geometry only; no approved stackup, DDR timing or powered-host qualification.",
  manualMicroVias:escapes.length,completedSignals:accepted.length,buriedVias:audit.newVias,
  minimumManualMicroviaHoleCopper:holeCopper,minimumManualMicroviaHoleHole:holeHole,
  spanMutationRejected:spanRegression,issues}
writeFileSync(outputPath,JSON.stringify(report,null,2)+"\n")
console.log(`${report.status}: ${accepted.length}/67 signals, ${escapes.length} microvias, ${audit.newVias} buried vias, ${issues.length} issues`)
if(issues.length)process.exitCode=1
