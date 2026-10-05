import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [directory,destination]=process.argv.slice(2);assert(directory&&destination)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const r=read(`${directory}/result.json`)
assert.equal(r.status,'RAM_FANOUTS_REACHED_CHECKED_CPU_CHANNEL_HANDOFFS');assert(r.firstPackageOnly&&r.layeredRamHandoffs)
for(const a of [r.source,r.preservedSavedDdr,r.nativeBootstrap,r.checkedCpuChannelReuse.sections,r.checkedCpuChannelReuse.checkedSummary,r.retainedStagedCkeCopper,r.temporaryOpenRamTails])assert.equal(hash(a.path),a.sha256)
const paths=read(r.preservedSavedDdr.path),prior=structuredClone(paths),sections=read(r.checkedCpuChannelReuse.sections.path),native=read(r.nativeBootstrap.path),localPath=`${directory}/local-escapes.json`,local=read(localPath),changes=[]
const nameById={'source_trace_27':'DDR_DQSn1','source_trace_31':'DDR_D1','source_trace_32':'DDR_D7'}
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
const reverse=t=>t.toReversed().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:{...p})
const length=r=>r.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-r[i].x,p.y-r[i].y),0)
// The local search can reuse its own checked channel before reaching the
// requested handoff. Join at the first exact same-layer centreline contact,
// removing the unused wire-only stub rather than exporting duplicate copper.
const intersection=(a,b,c,d)=>{
  const dx=b.x-a.x,dy=b.y-a.y,ex=d.x-c.x,ey=d.y-c.y,den=dx*ey-dy*ex
  if(Math.abs(den)<1e-10){
    if(Math.abs((c.x-a.x)*dy-(c.y-a.y)*dx)>1e-8)return
    const l=dx*dx+dy*dy;if(l<1e-12)return
    const ts=[c,d].map(p=>((p.x-a.x)*dx+(p.y-a.y)*dy)/l).sort((a,b)=>a-b),t=Math.max(0,ts[0])
    if(t<=Math.min(1,ts[1])+1e-8)return {x:a.x+t*dx,y:a.y+t*dy,t}
    return
  }
  const t=((c.x-a.x)*ey-(c.y-a.y)*ex)/den,u=((c.x-a.x)*dy-(c.y-a.y)*dx)/den
  if(t>=-1e-8&&t<=1+1e-8&&u>=-1e-8&&u<=1+1e-8)return {x:a.x+t*dx,y:a.y+t*dy,t}
}
for(const section of sections){
  const id=section.source_trace_id,name=nameById[id],tail=local.find(t=>t.source_trace_id===id);assert(name&&tail)
  const ram=native.find(t=>t.pcb_trace_id===`local_dogbone_${id}_1`)
  let prefix=structuredClone(section.route),localRoute=structuredClone(tail.route),pruning
  const hits=[];let distance=0
  for(let i=1;i<localRoute.length;i++){
    const a=localRoute[i-1],b=localRoute[i],segmentLength=Math.hypot(b.x-a.x,b.y-a.y)
    if(segmentLength>1e-8&&a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer)for(let j=1;j<prefix.length;j++){
      const c=prefix[j-1],d=prefix[j]
      if(c.route_type!=='wire'||d.route_type!=='wire'||c.layer!==a.layer||d.layer!==a.layer||Math.hypot(c.x-d.x,c.y-d.y)<1e-8)continue
      const p=intersection(a,b,c,d);if(p)hits.push({point:p,localSegment:i,prefixSegment:j,distance:distance+Math.max(0,p.t)*segmentLength,layer:a.layer})
    }
    distance+=segmentLength
  }
  hits.sort((a,b)=>a.distance-b.distance);assert(hits.length,'RAM tail does not meet its exact checked prefix')
  const hit=hits[0],join={route_type:'wire',x:hit.point.x,y:hit.point.y,layer:hit.layer,width:.1016}
  const oldLength=length(prefix)+length(localRoute)
  assert(prefix.slice(hit.prefixSegment).every(p=>p.route_type==='wire'),'Pruning must not drop an original physical hole')
  prefix=[...prefix.slice(0,hit.prefixSegment),join];localRoute=[...localRoute.slice(0,hit.localSegment),join]
  const removedMm=oldLength-length(prefix)-length(localRoute)
  if(removedMm>1e-7)pruning={kind:'WIRE_ONLY_UNUSED_HANDOFF_STUB_REMOVED_AT_FIRST_SAME_LAYER_CENTRELINE_CONTACT',join,removedPlanarMm:removedMm,newHoles:0}
  const parts=[prefix,reverse(localRoute),...ram?[reverse(ram.route)]:[]]
  for(let i=1;i<parts.length;i++)assert(near(parts[i-1].at(-1),parts[i][0]))
  const joined=parts.flat();let layer='top'
  paths[name]=joined.map(p=>{
    if(p.route_type==='via'){assert.equal(p.from_layer,layer);layer=p.to_layer;assert.equal(p.via_diameter,.4572);assert.equal(p.via_hole_diameter,.254);return {x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}}
    assert.equal(p.layer,layer);assert.equal(p.width,.1016);return {x:p.x,y:p.y}
  })
  assert.equal(layer,'top');assert(near(paths[name][0],prior[name][0])&&near(paths[name].at(-1),prior[name].at(-1)))
  changes.push({name,sourceTraceId:id,priorPlanarMm:length(prior[name]),planarMm:length(paths[name]),throughVias:paths[name].filter(p=>p.via).length,pruning})
}
const cke=read(r.retainedStagedCkeCopper.path);paths.DDR_CKE=cke.route.map(p=>p.route_type==='via'?{x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}:{x:p.x,y:p.y})
// KiCad quantizes to nanometres. Avoid exporting the near-identical wire
// endpoints at native/manual joins as zero-length dangling physical tracks.
// Never collapse a via or a layer transition, and leave other nets untouched.
const coincidentWirePruning=[]
for(const name of [...changes.map(c=>c.name),'DDR_CKE']){
  const cleaned=[];let removed=0
  for(const p of paths[name]){
    const q=cleaned.at(-1)
    if(q&&!q.via&&!p.via&&Math.hypot(p.x-q.x,p.y-q.y)<1e-7){removed++;continue}
    cleaned.push(p)
  }
  paths[name]=cleaned;coincidentWirePruning.push({name,removedWirePoints:removed,maximumCoincidentSeparationMm:1e-7,preservedAllVias:true})
}
assert.equal(Object.keys(paths).length,26)
for(const name of Object.keys(prior))if(!changes.some(c=>c.name===name))assert.deepEqual(paths[name],prior[name])
writeFileSync(destination,JSON.stringify(paths,null,2)+'\n')
const provenance={source:r.source,priorPaths:r.preservedSavedDdr,priorCheckedSummary:r.checkedCpuChannelReuse.checkedSummary,
  checkedCpuChannelReuse:r.checkedCpuChannelReuse,nativeBootstrap:r.nativeBootstrap,ramTailRun:{path:`${directory}/result.json`,sha256:hash(`${directory}/result.json`)},ramTails:{path:localPath,sha256:hash(localPath)},
  stagedCkeCopper:r.retainedStagedCkeCopper,temporaryOpenRamTailPreparation:r.temporaryOpenRamTails,changes,coincidentWirePruning,
  paths:{path:destination,sha256:hash(destination)},newSignals:['DDR_CKE'],remainingUnroutedDdrSignals:23,
  ckePlanarMm:length(paths.DDR_CKE),ckeThroughVias:4,ckePlacementNominalRangeMm:[41.75,44.29],ckeNominalLengthPass:false,
  nativeBusLanesBootstrap:true,copperLayers:4,independentSourceAndPhysicalChecksRequired:true,byteAndStrobePlanarMatchingQualified:false,fullElectricalTimingQualified:false,fabricationReady:false}
writeFileSync(destination.replace(/\.json$/,'.provenance.json'),JSON.stringify(provenance,null,2)+'\n')
console.log(JSON.stringify({signals:26,changes,ckePlanarMm:provenance.ckePlanarMm,fullElectricalTimingQualified:false,fabricationReady:false}))
