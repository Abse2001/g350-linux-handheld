import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {selectCheckedCommandSummary,readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'

// Retain the registered native bus_lanes command bootstrap and all physical holes.
// Shorten one wire-only detour against every current pad, hole and other net.
const [validationPath,directory,name='DDR_CSn0']=process.argv.slice(2);assert(validationPath&&directory&&!existsSync(`${directory}/result.json`));assert.equal(name,'DDR_CSn0');mkdirSync(directory,{recursive:true})
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const validation=read(validationPath),provenance=read(validation.provenance.path)
const checkedSummaryArtifact=selectCheckedCommandSummary(validation.source),{summary,registration}=readCheckedCommandSummary(checkedSummaryArtifact);assert.equal(registration.signals,33)
for(const a of [validation.source,validation.paths,validation.provenance,summary.source])checked(a)
assert.deepEqual(validation.source,summary.source)
assert.equal(summary.csnNominalLengthPass,false)
const source=read(validation.source.path),paths=read(validation.paths.path),input=read(provenance.nativeCsn0Run.path.replace(/result\.json$/,'input.simple-route.json'))
assert(summary.csnConnected);assert(!paths[name].some(p=>p.via))
assert.equal(source.filter(e=>e.type==='pcb_smtpad').length,912)
assert.equal(source.filter(e=>e.type==='pcb_via').length,registration.holes)
const owner=source.find(e=>e.type==='source_trace'&&e.name===name).source_trace_id,shapes=[]
for(const o of input.obstacles)if(!o.circuitJsonMetadata?.pcb_via_id)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers,owners:o.connectedTo??[],label:o.circuitJsonMetadata?.pcb_smtpad_id??o.circuitJsonMetadata?.pcb_plated_hole_id??'fixed_obstacle'})
const traces=source.filter(e=>e.type==='pcb_trace')
for(const t of traces)if(t.source_trace_id!==owner)for(let i=1;i<t.route.length;i++){
  const a=t.route[i-1],b=t.route[i]
  if(Math.hypot(a.x-b.x,a.y-b.y)<1e-8)continue
  shapes.push({kind:'segment',a,b,w:Math.max(a.width??.1016,b.width??.1016),layers:[a.route_type==='wire'?a.layer:b.layer],owners:[t.source_trace_id],label:t.pcb_trace_id})
}
for(const v of source.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,layers:['top','inner1','inner2','bottom'],owners:[traces.find(t=>t.pcb_trace_id===v.pcb_trace_id)?.source_trace_id].filter(Boolean),label:v.pcb_via_id})
const pointSegment=(p,a,b)=>{
  const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy
  const t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)
}
const segmentDistance=(a,b,c,d)=>{
  const ux=b.x-a.x,uy=b.y-a.y,vx=d.x-c.x,vy=d.y-c.y,den=ux*vy-uy*vx
  if(Math.abs(den)>1e-14){
    const t=((c.x-a.x)*vy-(c.y-a.y)*vx)/den,u=((c.x-a.x)*uy-(c.y-a.y)*ux)/den
    if(t>=0&&t<=1&&u>=0&&u<=1)return 0
  }
  return Math.min(pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b))
}
for(const s of shapes){
  s.left=s.kind==='segment'?Math.min(s.a.x,s.b.x)-s.w/2:s.x-s.w/2
  s.right=s.kind==='segment'?Math.max(s.a.x,s.b.x)+s.w/2:s.x+s.w/2
  s.low=s.kind==='segment'?Math.min(s.a.y,s.b.y)-s.w/2:s.y-s.h/2
  s.high=s.kind==='segment'?Math.max(s.a.y,s.b.y)+s.w/2:s.y+s.h/2
}
const distance=(s,a,b)=>{
  if(s.kind==='circle')return pointSegment(s,a,b)-s.w/2
  if(s.kind==='segment')return segmentDistance(a,b,s.a,s.b)-s.w/2
  const inside=p=>p.x>=s.left&&p.x<=s.right&&p.y>=s.low&&p.y<=s.high
  if(inside(a)||inside(b))return 0
  const corners=[{x:s.left,y:s.low},{x:s.right,y:s.low},{x:s.right,y:s.high},{x:s.left,y:s.high}]
  return Math.min(...corners.map((c,i)=>segmentDistance(a,b,c,corners[(i+1)%4])))
}
let calls=0
const legal=(a,b,layer)=>{
  calls++;let minimumCopperEdgeGapMm=Infinity,nearest
  const left=Math.min(a.x,b.x)-.2,right=Math.max(a.x,b.x)+.2,low=Math.min(a.y,b.y)-.2,high=Math.max(a.y,b.y)+.2
  for(const s of shapes){
    if(!s.layers.includes(layer)||s.owners.includes(owner)||s.left>right||s.right<left||s.low>high||s.high<low)continue
    const gap=distance(s,a,b)-.0508
    if(gap<.1016+.003-1e-8)return
    if(gap<minimumCopperEdgeGapMm){minimumCopperEdgeGapMm=gap;nearest=s.label}
  }
  return {minimumCopperEdgeGapMm,nearest}
}

let route=paths[name]
const length=r=>r.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-r[i].x,p.y-r[i].y),0)
const range=summary.placementNominalReview.rangeMm
const originalLength=length(route),target=summary.placementNominalReview.nominalMm,cuts=[]
assert(originalLength>range[1],'Only an overlong command is eligible for shortening')
let candidateCount=0
for(let pass=0;pass<16&&length(route)>target+1e-8;pass++){
const currentLength=length(route),cumulative=[0]
let layer='top';const layers=route.map(p=>{if(p.via)layer=p.toLayer;return layer})
for(let i=1;i<route.length;i++)cumulative[i]=cumulative[i-1]+Math.hypot(route[i].x-route[i-1].x,route[i].y-route[i-1].y)
const candidates=[];let priorVia=-1
for(let j=1;j<route.length;j++){
  if(route[j].via){priorVia=j;continue}
  if(route[j-1].via)continue
  for(let i=j-2;i>priorVia;i--){
    const straight=Math.hypot(route[j].x-route[i].x,route[j].y-route[i].y),saving=cumulative[j]-cumulative[i]-straight,finalLength=currentLength-saving
    if(saving<1e-5||finalLength<range[0])continue
    const preflight=legal(route[i],route[j],layers[i]);if(!preflight)continue
    // A shortcut must not touch another retained same-net via and create a
    // same-net branch that bypasses the declared propagation path.
    if(route.filter(p=>p.via).some(v=>Math.hypot(v.x-route[i].x,v.y-route[i].y)>1e-8&&Math.hypot(v.x-route[j].x,v.y-route[j].y)>1e-8&&pointSegment(v,route[i],route[j])<.2286+.0508+.1016+.003))continue
    candidates.push({from:i,to:j,savingMm:saving,planarMm:finalLength,layer:layers[i],preflight})
  }
}
candidateCount+=candidates.length
const chosen=candidates.sort((a,b)=>Math.abs(a.planarMm-target)-Math.abs(b.planarMm-target)||a.to-a.from-(b.to-b.from))[0]
if(!chosen)break
cuts.push(chosen)
route=route.filter((p,i)=>i<=chosen.from||i>=chosen.to)
}
const nominalLengthPass=length(route)>=range[0]&&length(route)<=range[1]
const result={status:nominalLengthPass?'COMMAND_NOMINAL_WIRE_SHORTCUT_FOUND_INDEPENDENT_REPLAY_CHECKS_REQUIRED':'COMMAND_NOMINAL_WIRE_SHORTCUT_NOT_FOUND',
  source:validation.source,priorPaths:validation.paths,priorSourceValidation:artifact(validationPath),priorProvenance:validation.provenance,
  priorCheckedSummary:checkedSummaryArtifact,obstacleNativeInput:provenance.nativeCsn0Run,signal:name,originalPlanarMm:originalLength,targetNominalMm:target,rangeMm:range,cuts,
  planarMm:length(route),removedPlanarMm:originalLength-length(route),nominalLengthPass,
  candidateCount,exactSegmentClearanceCalls:calls,wireGuardMm:.003,newVias:0,preservedPhysicalThroughVias:source.filter(e=>e.type==='pcb_via').length,nativeBusLanesBootstrap:true,
  independentSourceAndPhysicalChecksRequired:true,fullCommandClassMatchingDeferred:true,fullElectricalTimingQualified:false,defaultChanged:false,fabricationReady:false}
if(nominalLengthPass){
  paths[name]=route
  assert.deepEqual(paths[name].filter(p=>p.via),read(validation.paths.path)[name].filter(p=>p.via))
  const destination=directory+'/paths.json';writeFileSync(destination,JSON.stringify(paths,null,2)+'\n');result.paths=artifact(destination)
}
const snapshot=directory+'/shortening-helper.executed.mjs';writeFileSync(snapshot,readFileSync('scripts/shorten-am3352-coupled-csn0.mjs'));result.executionHelper=artifact(snapshot);result.elapsedSearchScope='At most sixteen exact wire-shortcut passes toward the nominal target, continuing after entry into the permitted range';writeFileSync(directory+'/result.json',JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify({status:result.status,originalPlanarMm:originalLength,planarMm:result.planarMm,cuts,candidates:candidateCount,newVias:0,fabricationReady:false}))
process.exitCode=nominalLengthPass?0:1
