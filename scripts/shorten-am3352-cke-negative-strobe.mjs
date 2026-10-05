import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// A scoped manual repair on top of the checked native bus_lanes bootstrap.
// Search only ordered wire shortcuts. Never move/drop a physical hole or any
// other net. The independent full-board checks remain required after replay.
const [directory,mode]=process.argv.slice(2);assert(directory)
assert(!mode||mode==='two-cuts')
mkdirSync(directory,{recursive:true})
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const summaryPath='checks/integrated/am3352-ddr-usbc-cke-joint-power-plane-bounded-check-summary.json',summary=read(summaryPath)
const prepPath='dist/am3352-ddr25-address-control-top-prep-attempt-449/result.json',prep=read(prepPath)
for(const a of [summary.source,summary.paths,prep.input,prep.source])checked(a)
const source=read(summary.source.path),paths=read(summary.paths.path),input=read(prep.input.path)
const oldSource=read(prep.source.path),pads=s=>s.filter(e=>e.type==='pcb_smtpad')
assert.deepEqual(pads(source),pads(oldSource),'Bootstrap pad inventory must match every current physical pad')
assert.equal(pads(source).length,912)
assert.equal(source.filter(e=>e.type==='pcb_via').length,143)
const owner='source_trace_27',shapes=[]
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
const route=paths.DDR_DQSn1,length=r=>r.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-r[i].x,p.y-r[i].y),0)
const originalLength=length(route),targetLength=length(paths.DDR_DQS1)
let layer='top';const layers=route.map(p=>{if(p.via)layer=p.toLayer;return layer})
if(mode==='two-cuts'){
  const diagnosticPath='dist/am3352-ddr26-cke-negative-shortcuts-attempt-466/result.json',diagnostic=read(diagnosticPath)
  assert.deepEqual(diagnostic.source,summary.source);assert.deepEqual(diagnostic.paths,summary.paths)
  // These two visibility edges remove the excessive handoff return and one
  // existing tuning loop. The remaining original tuning loop is retained.
  const cuts=[[61,127],[201,227]],preflights=[]
  for(const [a,b] of cuts){
    assert.equal(diagnostic.retainedIndices[diagnostic.retainedIndices.indexOf(a)+1],b)
    assert(route.slice(a,b+1).every(p=>!p.via));assert.equal(layers[a],layers[b])
    const preflight=legal(route[a],route[b],layers[a]);assert(preflight,'Exact shortcut clearance failed')
    preflights.push({from:a,to:b,fromPoint:route[a],toPoint:route[b],layer:layers[a],savedPlanarMm:length(route.slice(a,b+1))-length([route[a],route[b]]),...preflight})
  }
  paths.DDR_DQSn1=route.filter((p,i)=>!cuts.some(([a,b])=>i>a&&i<b))
  assert.deepEqual(paths.DDR_DQSn1.filter(p=>p.via),route.filter(p=>p.via))
  const negativeMm=length(paths.DDR_DQSn1),pairSkewMm=Math.abs(negativeMm-targetLength)
  const byte1Names=['DDR_D8','DDR_D9','DDR_D10','DDR_D11','DDR_D12','DDR_D13','DDR_D14','DDR_D15','DDR_DQM1','DDR_DQS1','DDR_DQSn1']
  const byteLengths=byte1Names.map(n=>length(paths[n])),byte1SkewMm=Math.max(...byteLengths)-Math.min(...byteLengths)
  assert(pairSkewMm<=.127);assert(byte1SkewMm<=.635+1e-8)
  const destination=`${directory}/paths.json`;writeFileSync(destination,JSON.stringify(paths,null,2)+'\n')
  const result={status:'DDR26_NEGATIVE_STROBE_TWO_WIRE_SHORTCUTS_PLANAR_MATCHING_PASS_INDEPENDENT_CHECKS_REQUIRED',
    input:artifact(summaryPath),source:summary.source,priorPaths:summary.paths,paths:artifact(destination),shortcutDiagnostic:artifact(diagnosticPath),
    bootstrapPreparation:artifact(prepPath),changedSignals:['DDR_DQSn1'],preflights,originalLengthMm:originalLength,negativeStrobePlanarMm:negativeMm,positiveStrobePlanarMm:targetLength,
    strobePlanarSkewMm:pairSkewMm,byte1PlanarSkewMm:byte1SkewMm,wireGuardMm:.003,wireWidthMm:.1016,wireClearanceMinimumMm:.1016,
    preservedPhysicalThroughVias:143,newVias:0,otherNetChanges:0,nativeBusLanesBootstrap:true,manualWireRepair:true,copperLayers:4,defaultChanged:false,
    ckeNominalLengthPass:false,independentSourceAndPhysicalChecksRequired:true,fullElectricalTimingQualified:false,fabricationReady:false}
  writeFileSync(`${directory}/result.json`,JSON.stringify(result,null,2)+'\n')
  console.log(JSON.stringify({status:result.status,negativeStrobePlanarMm:negativeMm,strobePlanarSkewMm:pairSkewMm,byte1PlanarSkewMm:byte1SkewMm,newVias:0,fabricationReady:false}))
  process.exit(0)
}
const cumulative=[0],dp=[{length:0,previous:-1}],shortcuts=[]
for(let j=1;j<route.length;j++){
  cumulative[j]=cumulative[j-1]+Math.hypot(route[j].x-route[j-1].x,route[j].y-route[j-1].y)
  dp[j]={length:dp[j-1].length+cumulative[j]-cumulative[j-1],previous:j-1}
  if(route[j].via||route[j-1].via)continue
  for(let i=j-2;i>=0;i--){
    if(route[i].via)break
    assert.equal(layers[i],layers[j])
    const direct=Math.hypot(route[j].x-route[i].x,route[j].y-route[i].y),saving=cumulative[j]-cumulative[i]-direct
    if(saving<=.0001)continue
    const preflight=legal(route[i],route[j],layers[i]);if(!preflight)continue
    shortcuts.push({from:i,to:j,saving,layer:layers[i],preflight})
    if(dp[i].length+direct<dp[j].length-.0001)dp[j]={length:dp[i].length+direct,previous:i}
  }
}
const retained=[route.length-1];while(retained[0]>0)retained.unshift(dp[retained[0]].previous)
const shortest=retained.map(i=>route[i]),shortestLength=length(shortest)
const requiredSaving=originalLength-targetLength
shortcuts.sort((a,b)=>b.saving-a.saving)
const result={status:'CKE_NEGATIVE_STROBE_SHORTCUT_DIAGNOSTIC',input:artifact(summaryPath),source:summary.source,paths:summary.paths,bootstrapPreparation:artifact(prepPath),
  originalLengthMm:originalLength,positiveStrobeLengthMm:targetLength,requiredSavingMm:requiredSaving,availableTautPathSavingMm:originalLength-shortestLength,tautPathLengthMm:shortestLength,
  exactStraightSegmentClearanceCalls:calls,wireGuardMm:.003,wireWidthMm:.1016,wireClearanceMinimumMm:.1016,preservedPhysicalThroughVias:143,newVias:0,otherNetChanges:0,
  bestSingleShortcuts:shortcuts.slice(0,15),retainedIndices:retained,fullElectricalTimingQualified:false,fabricationReady:false}
writeFileSync(`${directory}/taut-path.json`,JSON.stringify(shortest,null,2)+'\n')
writeFileSync(`${directory}/result.json`,JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify({status:result.status,originalLengthMm:originalLength,targetLengthMm:targetLength,availableSavingMm:originalLength-shortestLength,tautPathLengthMm:shortestLength,bestSingleSavingMm:shortcuts[0]?.saving,calls,newVias:0,fabricationReady:false}))
