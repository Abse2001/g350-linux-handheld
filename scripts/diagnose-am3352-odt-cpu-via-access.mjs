import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [directory,gridArgument='.04']=process.argv.slice(2);assert(directory);mkdirSync(directory,{recursive:true})
const grid=Number(gridArgument);assert([.02,.04].includes(grid))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)})
const summaryPath='checks/integrated/am3352-ddr-usbc-cke-matched-check-summary.json',summary=read(summaryPath)
const prepPath='dist/am3352-ddr26-odt-guided-prep-attempt-476/result.json',prep=read(prepPath)
for(const a of [summary.source,prep.source,prep.input])assert.equal(hash(a.path),a.sha256)
assert.deepEqual(prep.source,summary.source)
const source=read(summary.source.path),input=read(prep.input.path),shapes=[],owner='source_trace_0'
const traces=source.filter(e=>e.type==='pcb_trace'),sourceTraces=source.filter(e=>e.type==='source_trace'),components=source.filter(e=>e.type==='source_component')
const traceName=id=>sourceTraces.find(t=>t.source_trace_id===id)?.name
for(const o of input.obstacles)if(!o.circuitJsonMetadata?.pcb_via_id){
  const p=source.find(e=>e.type==='pcb_smtpad'&&e.pcb_smtpad_id===o.circuitJsonMetadata?.pcb_smtpad_id)
  const component=source.find(e=>e.type==='pcb_component'&&e.pcb_component_id===p?.pcb_component_id)
  shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers,
    own:o.connectedTo?.includes(owner),pad:!!p,label:p?components.find(c=>c.source_component_id===component.source_component_id)?.name:o.circuitJsonMetadata?.pcb_port_id??'fixed',id:p?.pcb_smtpad_id})
}
for(const t of traces)for(let i=1;i<t.route.length;i++){
  const a=t.route[i-1],b=t.route[i]
  if(Math.hypot(a.x-b.x,a.y-b.y)<1e-8)continue
  shapes.push({kind:'segment',a,b,w:Math.max(a.width??.1016,b.width??.1016),layers:[a.route_type==='wire'?a.layer:b.layer],own:t.source_trace_id===owner,label:traceName(t.source_trace_id),id:t.pcb_trace_id})
}
for(const v of source.filter(e=>e.type==='pcb_via')){
  const t=traces.find(t=>t.pcb_trace_id===v.pcb_trace_id)
  shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,
    layers:['top','bottom'],own:t?.source_trace_id===owner,label:traceName(t?.source_trace_id)??v.subcircuit_connectivity_map_key,id:v.pcb_via_id})
}
const distance=(s,p)=>{
  if(s.kind==='circle')return Math.hypot(p.x-s.x,p.y-s.y)-s.w/2
  if(s.kind==='rect')return Math.hypot(Math.max(0,Math.abs(p.x-s.x)-s.w/2),Math.max(0,Math.abs(p.y-s.y)-s.h/2))
  const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,l=dx*dx+dy*dy,f=Math.max(0,Math.min(1,((p.x-s.a.x)*dx+(p.y-s.a.y)*dy)/l))
  return Math.hypot(p.x-s.a.x-f*dx,p.y-s.a.y-f*dy)-s.w/2
}
const region={minX:-2.16,maxX:-1.42,minY:-11.88,maxY:-6.62},candidates=[],guard=.02*.725
for(let ix=Math.ceil(region.minX/grid);ix<=Math.floor(region.maxX/grid);ix++)for(let iy=Math.ceil(region.minY/grid);iy<=Math.floor(region.maxY/grid);iy++){
  const p={x:ix*grid,y:iy*grid},blockers=[]
  let topWireClear=true
  for(const s of shapes){
    if(!s.layers.some(l=>['top','bottom'].includes(l)))continue
    const d=distance(s,p)
    if(!s.own&&s.layers.includes('top')&&d<.0508+.1016+guard)topWireClear=false
    const violations=[]
    if(!s.own&&d<.2286+.1016)violations.push({kind:'via-copper',deficitMm:.2286+.1016-d})
    if(s.pad&&d<.127+.2)violations.push({kind:'pad-drill',deficitMm:.127+.2-d})
    if(s.hole){const g=Math.hypot(p.x-s.x,p.y-s.y)-.127-s.hole/2;if(g<.254)violations.push({kind:'hole-hole',deficitMm:.254-g})}
    if(violations.length)blockers.push({label:s.label,id:s.id,kind:s.kind,layers:s.layers,violations})
  }
  if(!topWireClear)continue
  const labels=[...new Set(blockers.map(b=>b.label))],maximumDeficitMm=Math.max(0,...blockers.flatMap(b=>b.violations.map(v=>v.deficitMm)))
  candidates.push({point:p,uniqueBlockers:labels.length,labels,maximumDeficitMm,blockers})
}
candidates.sort((a,b)=>a.maximumDeficitMm-b.maximumDeficitMm||a.uniqueBlockers-b.uniqueBlockers)
const report={status:'ODT_CPU_VIA_ACCESS_DIAGNOSTIC_NO_COPPER_CHANGED',source:summary.source,checkedSummary:artifact(summaryPath),preparation:artifact(prepPath),region,
  conservativeTopWireCandidateCount:candidates.length,legalViaCandidates:candidates.filter(c=>!c.blockers.length),bestCandidates:candidates.slice(0,32),
  viaGeometryMm:{land:.4572,drill:.254},minimumsMm:{copper:.1016,padToDrill:.2,holeEdge:.254},wireGuardMm:guard,viaPlacementGridMm:grid,
  scope:'Point placement diagnostic inside the observed reachable bounding region. Does not prove connectivity from the CPU pad, a complete new trace, or independent physical qualification.',fabricationReady:false}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,topWireCandidates:candidates.length,legalViaCandidates:report.legalViaCandidates.length,best:candidates.slice(0,6).map(c=>({point:c.point,labels:c.labels,maximumDeficitMm:c.maximumDeficitMm})),fabricationReady:false}))
