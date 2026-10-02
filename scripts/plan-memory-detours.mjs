import {gridMemoryCandidate} from "../lib/integrated/GridMemoryCandidate"
import {gridMemoryViaCandidate} from "../lib/integrated/GridMemoryViaCandidate"
import {memoryInputFingerprint} from "../lib/integrated/MemoryRoutingIdentity"
import connections from "../lib/integrated/memory-connections.json"
import {isMemoryEscapeVia} from "../lib/integrated/auditMemoryThroughVias"
// Candidate generation only. Do not accept these paths without a native
// phased rebuild, Gerber shorts, independent DRC and connectivity evidence.
const firstPhase=Number(process.argv[2]??13)
const basePath=process.argv[3]??`dist/rk3566-memory-individual/phase-${firstPhase}.input.simple-route.json`
const base=await Bun.file(basePath).json()
const remaining=connections.filter(c=>c.name!=="LPDDR4_RESETn"&&c.phase!==0&&!c.socBall.startsWith("1"))
.sort((a,b)=>{
 const group=c=>{
  const channel=c.name.endsWith("_B")?1:0
  if(c.phase!==1)return 4+channel
  const dq=/DQ(\d+)_/.exec(c.name),dm=/DM(\d+)_/.exec(c.name)
  return channel*2+(dq?Math.floor(Number(dq[1])/8):Number(dm[1]))
 }
 return group(a)-group(b)||connections.indexOf(a)-connections.indexOf(b)
})
const entries=await Bun.file("routing/rk3566-manual-outer-routes.json").json()
let previous=base.traces
for(let phase=firstPhase;phase<37;phase++) {
 const semantic=remaining[phase-6],name=`source_trace_${connections.indexOf(semantic)}`
 const vias=base.obstacles.filter(o=>isMemoryEscapeVia(o)&&o.connectedTo.includes(name))
 if(vias.length!==2)throw new Error(`Missing physical escape vias: ${semantic.name}`)
 const layer=semantic.name.endsWith("_B")?"inner3":"inner2"
 const connection={name,source_trace_id:name,nominalTraceWidth:.1,width:.1,
  pointsToConnect:vias.map(o=>({
   ...o.center,layer,pointId:o.connectedTo.find(s=>s.startsWith("pcb_breakout_point_"))
  }))}
 const input={...base,connections:[connection],buses:base.buses.map(b=>({...b,connectionNames:[name]})),traces:previous}
 if(phase===firstPhase&&(await memoryInputFingerprint(input))!==(await memoryInputFingerprint(base)))throw new Error("Generated first phase differs from native input")
 const continuous=gridMemoryCandidate(input)
 const trace=continuous??gridMemoryViaCandidate(input)
 if(!trace){console.log(`NO PATH IN BOUNDED GRID SEARCH: phase ${phase}, ${semantic.name}`);break}
 const origin=continuous?"Supplementary constant-layer grid router, saved explicit coordinate trace":"Supplementary grid router with one explicit full-depth layer-change via"
 entries.push({signal:semantic.name,origin,inputFingerprint:await memoryInputFingerprint(input),tscircuitVersion:"0.0.2727",traces:[trace]})
 previous=[...previous,trace]
 console.log(`CANDIDATE phase ${phase}: ${semantic.name}, ${trace.route.length} points; ${origin}`)
 await Bun.write(`tmp/grid-memory-phase-${phase}.input.json`,JSON.stringify(input,null,2))
}
await Bun.write("tmp/proposed-memory-detours.json",JSON.stringify(entries,null,2)+"\n")
console.log(`${previous.length}/67 cumulative signal candidates; not fabrication-qualified`)
