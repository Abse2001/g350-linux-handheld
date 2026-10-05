import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'

// Retain the registered native bus_lanes command bootstrap and all physical holes.
// Test one two-via carrier bridge against every current pad, hole and other net.
const [validationPath,directory]=process.argv.slice(2);assert(validationPath&&directory);mkdirSync(directory,{recursive:true})
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const validation=read(validationPath),provenance=read(validation.provenance.path)
const {summary,registration}=readCheckedCommandSummary(provenance.priorCheckedSummary)
for(const a of [validation.source,validation.paths,validation.provenance,provenance.source,provenance.nativeChannelInput])checked(a)
assert.deepEqual(validation.priorCheckedSummary,provenance.priorCheckedSummary)
assert.equal(provenance.newSignals.length,1)
const name=provenance.newSignals[0],source=read(validation.source.path),paths=read(validation.paths.path),input=read(provenance.nativeChannelInput.path),previous=read(provenance.source.path)
assert(summary.remainingDdrSignalNames.includes(name))
assert.deepEqual(source.filter(e=>e.type==='pcb_smtpad'),previous.filter(e=>e.type==='pcb_smtpad'))
assert.equal(source.filter(e=>e.type==='pcb_via').length,registration.holes+provenance.throughVias)
const owner=provenance.sourceTraceId,shapes=[]
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

const original=paths[name],length=r=>r.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-r[i].x,p.y-r[i].y),0)
const originalLength=length(original),range=summary.placementNominalReview.rangeMm,target=summary.placementNominalReview.nominalMm
assert(originalLength>range[1])
const carrier=read(provenance.nativeChannelOutput.path).traces.at(-1).route
assert(carrier.every(p=>p.route_type==='wire'&&p.layer==='bottom'),'Only a native bottom-layer carrier is eligible')
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
let start=original.findIndex(p=>!p.via&&near(p,carrier[0])&&original[original.indexOf(p)-1]?.via)
assert(start>=0)
const end=start+carrier.length-1
assert(original.slice(start,end+1).every((p,i)=>!p.via&&near(p,carrier[i])))
assert(original[end+1]?.via)
const cumulative=[0]
for(let i=1;i<original.length;i++)cumulative[i]=cumulative[i-1]+Math.hypot(original[i].x-original[i-1].x,original[i].y-original[i-1].y)
const holes=source.filter(e=>e.type==='pcb_via')
const viaLegal=p=>{
  for(const h of holes)if(Math.hypot(p.x-h.x,p.y-h.y)-.254<.254+.003-1e-8)return false
  for(const s of shapes){
    if(s.owners.includes(owner))continue
    if(s.left>p.x+.34||s.right<p.x-.34||s.low>p.y+.34||s.high<p.y-.34)continue
    if(distance(s,p,p)-.2286<.1016+.003-1e-8)return false
  }
  // The retained same-net fanouts must remain simple paths. A bridge via
  // cannot touch another point of either fanout and bypass propagation.
  for(let i=1;i<original.length;i++){
    if(i>=start&&i<=end)continue
    if(pointSegment(p,original[i-1],original[i])<.2286+.0508+.003)return false
  }
  return true
}
const samples=[]
for(let i=start;i<end;i++){
  const a=original[i],b=original[i+1],distanceMm=Math.hypot(a.x-b.x,a.y-b.y)
  if(distanceMm<1e-8)continue
  const steps=Math.ceil(distanceMm/.16)
  for(let k=0;k<=steps;k++){
    const fraction=k/steps,p={x:a.x+(b.x-a.x)*fraction,y:a.y+(b.y-a.y)*fraction}
    if(samples.some(s=>near(s.point,p))||!viaLegal(p))continue
    samples.push({segmentIndex:i,fraction,point:p,progressMm:cumulative[i]+distanceMm*fraction})
  }
}
const bridges=(a,b)=>{
  const dx=b.x-a.x,dy=b.y-a.y,sx=Math.sign(dx),sy=Math.sign(dy),ax=Math.abs(dx),ay=Math.abs(dy)
  const mids=ax>=ay?[{x:a.x+sx*ay,y:b.y},{x:b.x-sx*ay,y:a.y}]:[{x:b.x,y:a.y+sy*ax},{x:a.x,y:b.y-sy*ax}]
  return mids.map(m=>[a,m,b].filter((p,i,r)=>i===0||!near(p,r[i-1])))
}
const candidates=[];let tested=0,rangeCandidateCount=0,wireClearancePassCount=0,minimumUncheckedBridgeLengthMm=Infinity,minimumUncheckedBridge
for(let i=0;i<samples.length;i++)for(let j=i+1;j<samples.length;j++){
  const a=samples[i],b=samples[j]
  if(Math.hypot(a.point.x-b.point.x,a.point.y-b.point.y)<.508+.003)continue
  for(const bridge of bridges(a.point,b.point)){
    tested++
    const planarMm=originalLength-(b.progressMm-a.progressMm)+length(bridge)
    if(planarMm<minimumUncheckedBridgeLengthMm){minimumUncheckedBridgeLengthMm=planarMm;minimumUncheckedBridge={from:a,to:b,bridge}}
    if(planarMm<range[0]||planarMm>range[1])continue
    rangeCandidateCount++
    const checks=bridge.slice(1).map((p,k)=>legal(bridge[k],p,'top'))
    if(checks.some(c=>!c))continue
    wireClearancePassCount++
    // Reject same-net fanout branches even though ordinary short checks
    // correctly ignore same-net copper touching itself.
    let branch=false
    for(let k=1;k<original.length;k++){
      if(k>=start&&k<=end)continue
      if(original[k].via||original[k-1].via)continue
      for(let q=1;q<bridge.length;q++)if(segmentDistance(bridge[q-1],bridge[q],original[k-1],original[k])<.1016+.003){branch=true;break}
      if(branch)break
    }
    if(branch)continue
    candidates.push({from:a,to:b,bridge,planarMm,removedPlanarMm:originalLength-planarMm,preflight:checks})
  }
}
const chosen=candidates.sort((a,b)=>Math.abs(a.planarMm-target)-Math.abs(b.planarMm-target))[0]
const result={status:chosen?'COMMAND_TWO_VIA_CARRIER_BRIDGE_FOUND_INDEPENDENT_REPLAY_CHECKS_REQUIRED':'COMMAND_TWO_VIA_CARRIER_BRIDGE_NOT_FOUND',source:validation.source,priorPaths:validation.paths,priorSourceValidation:artifact(validationPath),priorProvenance:validation.provenance,priorCheckedSummary:validation.priorCheckedSummary,nativeChannelInput:provenance.nativeChannelInput,signal:name,originalPlanarMm:originalLength,targetNominalMm:target,rangeMm:range,carrierStartIndex:start,carrierEndIndex:end,legalViaSamples:samples.length,bridgeCandidatesTested:tested,rangeCandidateCount,wireClearancePassCount,minimumUncheckedBridgeLengthMm,minimumUncheckedBridge,nominalPassingCandidates:candidates.length,chosen,wireGuardMm:.003,newVias:chosen?2:0,nativeBusLanesBootstrap:true,independentSourceAndPhysicalChecksRequired:true,fullCommandClassMatchingDeferred:true,fullElectricalTimingQualified:false,defaultChanged:false,fabricationReady:false}
if(chosen){
  const {from,to,bridge}=chosen
  paths[name]=[...original.slice(0,from.segmentIndex+1),from.point,{...from.point,via:true,fromLayer:'bottom',toLayer:'top'},...bridge,{...to.point,via:true,fromLayer:'top',toLayer:'bottom'},to.point,...original.slice(to.segmentIndex+1)]
  assert(Math.abs(length(paths[name])-chosen.planarMm)<1e-8)
  assert.deepEqual(paths[name].filter(p=>p.via).filter(p=>!near(p,from.point)&&!near(p,to.point)),original.filter(p=>p.via))
  const destination=directory+'/paths.json';writeFileSync(destination,JSON.stringify(paths,null,2)+'\n');result.paths=artifact(destination)
}
writeFileSync(directory+'/result.json',JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify({status:result.status,samples:samples.length,tested,candidates:candidates.length,originalPlanarMm:originalLength,planarMm:chosen?.planarMm,newVias:result.newVias,fabricationReady:false}))
process.exitCode=chosen?0:1
