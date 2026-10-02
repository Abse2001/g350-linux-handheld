import {readFileSync,writeFileSync} from "node:fs"
import {createHash} from "node:crypto"

// Check the actual manual geometry exported to the router, before waiting
// for routing. This is independent of the code that calculates escapes.
const input=process.argv[2]??"dist/rk3566-memory-hybrid-small-groups/phase-0.input.simple-route.json"
const output=process.argv[3]??"checks/integrated/manual-escape-clearance.json"
const raw=readFileSync(input)
const srj=JSON.parse(raw)
const vias=srj.obstacles.filter(o=>o.layers.length>1&&[0.25,0.3].some(d=>
  Math.abs(o.width-d)<1e-6&&Math.abs(o.height-d)<1e-6)&&
  o.connectedTo.some(id=>id.startsWith("breakout:pcb_breakout_point_")))
const viaSet=new Set(vias)
const sameNet=(a,b)=>a.connectedTo.some(id=>b.connectedTo.includes(id))
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)
const clearance=(point,o)=>{
  const dx=point.x-o.center.x,dy=point.y-o.center.y
  if(o.shape==="circle"||viaSet.has(o)) return Math.hypot(dx,dy)-o.width/2
  if(o.type!=="rect") throw new Error(`Unsupported obstacle geometry ${o.type}`)
  const angle=(o.ccwRotationDegrees??0)*Math.PI/180
  const x=dx*Math.cos(angle)+dy*Math.sin(angle)
  const y=-dx*Math.sin(angle)+dy*Math.cos(angle)
  return Math.hypot(Math.max(0,Math.abs(x)-o.width/2),Math.max(0,Math.abs(y)-o.height/2))
}
let minDrillCopper=Infinity,minDrillDrill=Infinity
const issues=[]
if(vias.length!==134) issues.push({message:`Expected 134 manual vias; found ${vias.length}`})
for(let i=0;i<vias.length;i++) {
  const a=vias[i]
  for(let j=0;j<i;j++) {
    const c=distance(a.center,vias[j].center)-0.15
    minDrillDrill=Math.min(minDrillDrill,c)
    if(c<0.2-1e-6) issues.push({message:"Drill-to-drill below 0.2mm",clearance:c,a:a.connectedTo,b:vias[j].connectedTo})
  }
  for(const b of srj.obstacles) {
    if(a===b||sameNet(a,b)||!b.layers.length) continue
    const c=clearance(a.center,b)-0.075
    minDrillCopper=Math.min(minDrillCopper,c)
    if(c<0.2-1e-6) issues.push({message:"Manual drill-to-foreign-copper below 0.2mm",clearance:c,
      via:a.connectedTo,obstacle:b.circuitJsonMetadata??b.connectedTo})
  }
}
const report={status:issues.length?"MANUAL_ESCAPE_CLEARANCE_FAIL":"MANUAL_ESCAPE_CLEARANCE_PASS",
  scope:"134 manual 0.15mm drills versus physical manual copper/pads and other drills. Autorouted copper, complete export, DDR timing and full-host design require separate checks.",
  input,sha256:createHash("sha256").update(raw).digest("hex"),viaCount:vias.length,
  finePitchLandCount:vias.filter(v=>Math.abs(v.width-0.25)<1e-6).length,
  minDrillCopper,minDrillDrill,issues}
writeFileSync(output,JSON.stringify(report,null,2)+"\n")
console.log(`${report.status}: ${vias.length} vias, ${issues.length} issues; minimum drill-to-copper ${minDrillCopper.toFixed(6)}mm; drill-to-drill ${minDrillDrill.toFixed(6)}mm. See ${output}`)
if(issues.length) process.exitCode=1
