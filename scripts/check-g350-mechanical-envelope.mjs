import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs'

// This checks the actual tscircuit outline, not the unknown shell interior.
// Keep the measured-fit decision separate from an exterior-envelope check.
const read=path=>JSON.parse(readFileSync(path,'utf8'))
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex')
const geometryPath='mechanical/g350-provisional-outline.json'
const status=read('design-status.json')
const geometry=read(geometryPath)
const entries=[...new Set([status.currentWork.entry,status.currentWork.ddrPowerReplayEntry,status.currentWork.ddrSignalReplayEntry].filter(Boolean))]
if(status.currentWork.defaultEntryIsCurrentShapedHandheld)entries.unshift('index.circuit.tsx')
assert(entries.length>0,'No current G350 entry')
assert(geometry.outline.length>=3)
for(const p of geometry.outline)assert(Number.isFinite(p.x)&&Number.isFinite(p.y))
const xs=geometry.outline.map(p=>p.x),ys=geometry.outline.map(p=>p.y)
assert.equal(Math.max(...xs)-Math.min(...xs),geometry.width)
assert.equal(Math.max(...ys)-Math.min(...ys),geometry.height)
assert(geometry.width<geometry.caseWidth&&geometry.height<geometry.caseHeight)
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)
const between=(a,b,p)=>Math.abs(cross(a,b,p))<1e-9&&p.x>=Math.min(a.x,b.x)&&p.x<=Math.max(a.x,b.x)&&p.y>=Math.min(a.y,b.y)&&p.y<=Math.max(a.y,b.y)
const intersects=(a,b,c,d)=>{
 const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b)
 return x*y<0&&z*w<0||between(a,b,c)||between(a,b,d)||between(c,d,a)||between(c,d,b)
}
const pointSegmentDistance=(p,a,b)=>{
 const dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy
 const t=length2?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length2)):0
 return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)
}
const onOrInsideOutline=p=>{
 let inside=false
 for(let i=0,j=geometry.outline.length-1;i<geometry.outline.length;j=i++){
  const a=geometry.outline[i],b=geometry.outline[j]
  if(pointSegmentDistance(p,a,b)<1e-8)return true
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside
 }
 return inside
}
const signedPointClearance=p=>{
 const d=Math.min(...geometry.outline.map((a,i)=>pointSegmentDistance(p,a,geometry.outline[(i+1)%geometry.outline.length])))
 return onOrInsideOutline(p)?d:-d
}
// Split a courtyard edge at every outline crossing. Testing every remaining
// interval also catches a segment crossing the concave speaker-tab shoulders.
const segmentWithinOutline=(a,b)=>{
 const dx=b.x-a.x,dy=b.y-a.y,ts=[0,1]
 for(let i=0;i<geometry.outline.length;i++){
  const c=geometry.outline[i],d=geometry.outline[(i+1)%geometry.outline.length]
  const ex=d.x-c.x,ey=d.y-c.y,den=dx*ey-dy*ex
  if(Math.abs(den)<1e-12)continue
  const t=((c.x-a.x)*ey-(c.y-a.y)*ex)/den
  const u=((c.x-a.x)*dy-(c.y-a.y)*dx)/den
  if(t>=0&&t<=1&&u>=0&&u<=1)ts.push(t)
 }
 ts.sort((a,b)=>a-b)
 return ts.every(t=>onOrInsideOutline({x:a.x+t*dx,y:a.y+t*dy}))&&
  ts.slice(1).every((t,i)=>onOrInsideOutline({x:a.x+(t+ts[i])/2*dx,y:a.y+(t+ts[i])/2*dy}))
}
for(let i=0;i<geometry.outline.length;i++)for(let j=i+1;j<geometry.outline.length;j++){
 const n=geometry.outline.length
 if(j===i+1||i===0&&j===n-1)continue
 assert(!intersects(geometry.outline[i],geometry.outline[(i+1)%n],geometry.outline[j],geometry.outline[(j+1)%n]),'Self-intersecting outline')
}
const circuits=entries.map(entry=>{
 const path=entry===status.currentWork.entry&&status.currentWork.currentRoutingCircuit
  ?status.currentWork.currentRoutingCircuit
  :`dist/${entry.replace(/\.circuit\.tsx$/,'')}/circuit.json`
 const records=read(path),boards=records.filter(r=>r.type==='pcb_board')
 assert.equal(boards.length,1)
 const board=boards[0]
 assert.deepEqual(board.outline,geometry.outline,`${entry}: outline differs`)
 assert.equal(board.width,geometry.width)
 assert.equal(board.height,geometry.height)
 assert.equal(board.thickness,1.6)
 assert.equal(board.num_layers,4)
 assert.deepEqual(board.center,{x:0,y:0})
 const sourceNames=new Map(records.filter(r=>r.type==='source_component').map(r=>[r.source_component_id,r.name]))
 const names=new Map(records.filter(r=>r.type==='pcb_component').map(r=>[r.pcb_component_id,sourceNames.get(r.source_component_id)]))
 // Assembly courtyards include connector mating/assembly space. Check the
 // published exterior rectangle separately; it is not the internal cavity.
 const courtyards=records.filter(r=>r.type.startsWith('pcb_courtyard_')).map(r=>{
  const points=r.outline??r.points
  const xs=points?.map(p=>p.x)??[r.center.x-(r.width??2*r.radius)/2,r.center.x+(r.width??2*r.radius)/2]
  const ys=points?.map(p=>p.y)??[r.center.y-(r.height??2*r.radius)/2,r.center.y+(r.height??2*r.radius)/2]
  const bounds={minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)}
  assert(Object.values(bounds).every(Number.isFinite),'Unknown courtyard geometry')
  assert(bounds.minX>=-geometry.caseWidth/2&&bounds.maxX<=geometry.caseWidth/2&&bounds.minY>=-geometry.caseHeight/2&&bounds.maxY<=geometry.caseHeight/2,'Courtyard exceeds published exterior envelope')
  const vertices=points??[
   {x:bounds.minX,y:bounds.minY},{x:bounds.maxX,y:bounds.minY},
   {x:bounds.maxX,y:bounds.maxY},{x:bounds.minX,y:bounds.maxY},
  ]
  const withinPcbOutline=r.type==='pcb_courtyard_circle'
   ?signedPointClearance(r.center)-r.radius>=-1e-8
   :vertices.every((a,i)=>segmentWithinOutline(a,vertices[(i+1)%vertices.length]))
  return {...bounds,name:names.get(r.pcb_component_id),layer:r.layer,withinPcbOutline,
   minimumVertexClearanceMm:r.type==='pcb_courtyard_circle'
    ?signedPointClearance(r.center)-r.radius:Math.min(...vertices.map(signedPointClearance))}
 })
 const placedComponents=records.filter(r=>r.type==='pcb_component').length
 assert.equal(courtyards.length,placedComponents,'Every placed part needs an assembly courtyard')
 const assemblyCourtyardBoundsMm={
  minX:Math.min(...courtyards.map(c=>c.minX)),maxX:Math.max(...courtyards.map(c=>c.maxX)),
  minY:Math.min(...courtyards.map(c=>c.minY)),maxY:Math.max(...courtyards.map(c=>c.maxY)),
 }
 const boardAndAssemblyBoundsMm={
  minX:Math.min(...xs,assemblyCourtyardBoundsMm.minX),
  maxX:Math.max(...xs,assemblyCourtyardBoundsMm.maxX),
  minY:Math.min(...ys,assemblyCourtyardBoundsMm.minY),
  maxY:Math.max(...ys,assemblyCourtyardBoundsMm.maxY),
 }
 const nominalCenteredExteriorSetbacksMm={
  left:geometry.caseWidth/2+boardAndAssemblyBoundsMm.minX,
  right:geometry.caseWidth/2-boardAndAssemblyBoundsMm.maxX,
  top:geometry.caseHeight/2-boardAndAssemblyBoundsMm.maxY,
  bottom:geometry.caseHeight/2+boardAndAssemblyBoundsMm.minY,
 }
 const projectingCourtyards=courtyards.filter(c=>!c.withinPcbOutline).map(c=>({name:c.name,layer:c.layer,
  minimumVertexClearanceMm:c.minimumVertexClearanceMm,
  review:'Connector assembly space projects beyond the PCB; case-opening and mating clearance remain unverified.'}))
 assert.deepEqual(projectingCourtyards.map(c=>c.name),['J_USB'],'Unexpected assembly courtyard outside the shaped PCB')
 return {entry,circuit:path,circuitSha256:sha(path),dimensionsMm:{width:board.width,height:board.height,thickness:board.thickness},copperLayers:board.num_layers,placedComponents,outlineMatchesSharedGeometry:true,assemblyCourtyardsChecked:courtyards.length,assemblyCourtyardBoundsMm,assemblyCourtyardsWithinPublishedExterior:true,
  assemblyCourtyardsFullyWithinShapedPcb:courtyards.length-projectingCourtyards.length,
  boardAndAssemblyBoundsMm,
  boardAndAssemblyEnvelopeMm:{width:boardAndAssemblyBoundsMm.maxX-boardAndAssemblyBoundsMm.minX,height:boardAndAssemblyBoundsMm.maxY-boardAndAssemblyBoundsMm.minY},
  nominalCenteredExteriorSetbacksMm,
  nominalCenteredExteriorSetbacksAreShellClearances:false,
  projectingCourtyards,shellInteriorAndComponentHeightsChecked:false}
})
const report={
 status:'PASS_DESIGN_OUTLINE_ONLY',
 generatedAt:new Date().toISOString(),
 checkerSha256:sha('scripts/check-g350-mechanical-envelope.mjs'),
 geometry:geometryPath,geometrySha256:sha(geometryPath),
 dimensionsMm:{width:geometry.width,height:geometry.height,thickness:1.6},
 mainBodyHeightMm:geometry.mainBodyHeight,
 speakerTabMm:{width:geometry.speakerTongueWidth,extension:geometry.speakerTongueExtension},
 simpleClosedPolygon:true,outlineVertices:geometry.outline.length,
 publishedExteriorMm:{width:geometry.caseWidth,height:geometry.caseHeight,depth:22},
 nominalExteriorMarginsMm:geometry.nominalCenteredCaseMargin,
 nominalExteriorMarginsAreShellInteriorClearances:false,
 originalShellFitVerified:false,mountingHolePositionsVerified:false,
 buttonAndConnectorAlignmentVerified:false,fabricationReady:false,
 limitation:'The 76 × 118 mm outline is an engineering allowance within published exterior dimensions. Shell walls, ribs, posts and opening locations are unmeasured; this check cannot establish original-enclosure fit.',
 circuits,
}
mkdirSync('checks/mechanical',{recursive:true})
writeFileSync('checks/mechanical/g350-current-envelope-check.json',JSON.stringify(report,null,2)+'\n')
console.log(`Verified ${circuits.length} current tscircuit outputs: ${geometry.width} × ${geometry.height} × 1.6 mm, four layers. Original-shell fit remains unverified.`)
