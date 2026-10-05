import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {getSimpleRouteJsonFromCircuitJson} from '@tscircuit/core'

// Insert wire-only trombones in a completed diagnostic path. Physical holes,
// actual terminals, all other copper and native routing provenance stay fixed.
// Exact geometry screening never grants independent CAD qualification.
const [sourcePath,pathsPath,directory,signal,targetArg]=process.argv.slice(2)
assert(sourcePath&&pathsPath&&directory&&signal&&!existsSync(`${directory}/result.json`))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const source=read(sourcePath),paths=read(pathsPath),board=source.find(e=>e.type==='pcb_board')
assert.equal(board.num_layers,4);assert.equal(board.min_via_pad_diameter,.4572);assert.equal(board.min_via_hole_diameter,.254)
const st=source.find(e=>e.type==='source_trace'&&e.name===signal);assert(st&&paths[signal])
const trace=source.find(e=>e.type==='pcb_trace'&&e.source_trace_id===st.source_trace_id);assert(trace)
assert.equal(source.filter(e=>e.type.endsWith('_error')).length,0)
for(const [name,path] of Object.entries(paths)){
 const s=source.find(e=>e.type==='source_trace'&&e.name===name),t=source.find(e=>e.type==='pcb_trace'&&e.source_trace_id===s?.source_trace_id);assert(t)
 assert.equal(t.route.length,path.length+2,'Every replayed path must match the actual obstacle source before tuning')
 let currentLayer='top'
 for(const [i,p] of path.entries()){const q=t.route[i+1];assert(Math.hypot(p.x-q.x,p.y-q.y)<1e-8)
  if(p.via){assert.equal(q.route_type,'via');assert.equal(q.from_layer,currentLayer);assert.equal(q.to_layer,p.toLayer);currentLayer=p.toLayer}
  else{assert.equal(q.route_type,'wire');assert.equal(q.layer,currentLayer);assert.equal(q.width,.1016)}
 }
 assert.equal(currentLayer,'top')
}
const width=.1016,clearance=.1016,bounds={minX:-17.5,maxX:17.5,minY:-38.5,maxY:9.5}
const length=r=>r.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-r[i].x,p.y-r[i].y),0)
const before=length(paths[signal]),target=Number(targetArg),delta=target-before
assert(delta>.01&&delta<30)
const {simpleRouteJson:input}=getSimpleRouteJsonFromCircuitJson({circuitJson:source,minTraceWidth:width,nominalTraceWidth:width,
 minTraceToPadEdgeClearance:board.min_trace_to_pad_edge_clearance,minTraceToHoleEdgeClearance:board.min_trace_to_hole_edge_clearance,
 minViaHoleEdgeToViaHoleEdgeClearance:board.min_via_hole_edge_to_via_hole_edge_clearance,minPadEdgeToPadEdgeClearance:board.min_pad_edge_to_pad_edge_clearance,
 minBoardEdgeClearance:board.min_board_edge_clearance,minViaPadDiameter:.4572,minViaHoleDiameter:.254})
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,912)
const shapes=[]
for(const o of input.obstacles)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers,own:o.connectedTo?.includes(st.source_trace_id)})
for(const t of source.filter(e=>e.type==='pcb_trace')){
 const own=t.source_trace_id===st.source_trace_id
 for(let i=1;i<t.route.length;i++){
  const a=t.route[i-1],b=t.route[i]
  if(a.route_type!=='wire'||b.route_type!=='wire'||a.layer!==b.layer||Math.hypot(a.x-b.x,a.y-b.y)<1e-8)continue
  shapes.push({kind:'segment',a,b,w:Math.max(a.width??width,b.width??width),layers:[a.layer],own})
 }
}
for(const v of source.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,layers:v.layers,
 own:v.pcb_trace_id===trace.pcb_trace_id})
const pointSegment=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,f=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)):0;return Math.hypot(p.x-a.x-f*dx,p.y-a.y-f*dy)}
const segmentDistance=(a,b,c,d)=>{
 const ux=b.x-a.x,uy=b.y-a.y,vx=d.x-c.x,vy=d.y-c.y,den=ux*vy-uy*vx
 if(Math.abs(den)>1e-14){const t=((c.x-a.x)*vy-(c.y-a.y)*vx)/den,u=((c.x-a.x)*uy-(c.y-a.y)*ux)/den;if(t>=0&&t<=1&&u>=0&&u<=1)return 0}
 return Math.min(pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b))
}
const segmentShapeDistance=(s,a,b)=>{
 if(s.kind==='circle')return pointSegment(s,a,b)-s.w/2
 if(s.kind==='segment')return segmentDistance(a,b,s.a,s.b)-s.w/2
 const x0=s.x-s.w/2,x1=s.x+s.w/2,y0=s.y-s.h/2,y1=s.y+s.h/2
 const inside=p=>p.x>=x0&&p.x<=x1&&p.y>=y0&&p.y<=y1;if(inside(a)||inside(b))return 0
 const corners=[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}]
 return Math.min(...corners.map((c,i)=>segmentDistance(a,b,c,corners[(i+1)%4])))
}
let layer='top';const original=paths[signal],segmentLayers=original.map(p=>{if(p.via){assert.equal(p.fromLayer,layer);layer=p.toLayer;return null}return layer})
assert.equal(layer,'top')
const visible=(bump,selected,index)=>{
 const others=shapes.filter(s=>!s.own&&s.layers.includes(selected))
 if(bump.some(p=>p.x<bounds.minX||p.x>bounds.maxX||p.y<bounds.minY||p.y>bounds.maxY))return false
 for(let i=1;i<bump.length;i++)if(others.some(s=>segmentShapeDistance(s,bump[i-1],bump[i])-width/2<clearance-1e-8))return false
 // Distant copper on the same path must not bridge across a trombone.
 const ownSegments=original.slice(1).flatMap((p,i)=>i===index||i===index-1||i===index+1||p.via||original[i].via||segmentLayers[i]!==selected||segmentLayers[i+1]!==selected?[]:
  [{kind:'segment',a:original[i],b:p,w:width}])
 const ownVias=original.filter(p=>p.via).map(p=>({kind:'circle',x:p.x,y:p.y,w:.4572}))
 for(let i=1;i<bump.length;i++)if([...ownSegments,...ownVias].some(s=>segmentShapeDistance(s,bump[i-1],bump[i])-width/2<clearance-1e-8))return false
 const arc=[0];for(let i=1;i<bump.length;i++)arc[i]=arc[i-1]+Math.hypot(bump[i].x-bump[i-1].x,bump[i].y-bump[i-1].y)
 for(let i=1;i<bump.length;i++)for(let j=1;j<i-1;j++)if(arc[i-1]-arc[j]>.51&&segmentDistance(bump[i-1],bump[i],bump[j-1],bump[j])<width+clearance-1e-8)return false
 return true
}
let accepted,tested=0
for(let index=0;index<original.length-1&&!accepted;index++){
 const a=original[index],b=original[index+1],selected=segmentLayers[index]
 if(a.via||b.via||!selected||segmentLayers[index+1]!==selected)continue
 const span=Math.hypot(b.x-a.x,b.y-a.y);if(span<.8)continue
 const u={x:(b.x-a.x)/span,y:(b.y-a.y)/span}
 for(let teeth=1;teeth<=24&&!accepted;teeth++)for(const height of [.24,.32,.4])for(const phase of [.5,0,1])for(const side of [1,-1]){
  if(accepted)break
  const pitch=height+.24,total=(teeth-1)*pitch+height,chamfer=.04;if(total>span-.2)continue
  const amplitude=(delta+4*teeth*chamfer*(2-Math.SQRT2))/(2*teeth);if(amplitude>8||amplitude<chamfer*2)continue
  const offset=(span-total-.2)*phase+.1,n={x:-u.y*side,y:u.x*side},inserted=[]
  const point=(v,w)=>({x:a.x+u.x*v+n.x*w,y:a.y+u.y*v+n.y*w})
  for(let k=0;k<teeth;k++){const y=offset+k*pitch;inserted.push(point(y-chamfer,0),point(y,chamfer),point(y,amplitude-chamfer),point(y+chamfer,amplitude),point(y+height-chamfer,amplitude),point(y+height,amplitude-chamfer),point(y+height,chamfer),point(y+height+chamfer,0))}
  const bump=[a,...inserted,b];tested++
  if(!visible(bump,selected,index))continue
  const next=[...original.slice(0,index),...bump,...original.slice(index+2)];assert(Math.abs(length(next)-target)<1e-6)
  accepted={index,layer:selected,teeth,height,pitch,side,amplitude,offset,insertedPoints:inserted,next};break
 }
}
mkdirSync(directory,{recursive:true});const helper=`${directory}/tuning-helper.executed.mjs`;writeFileSync(helper,readFileSync('scripts/tune-am3352-replayed-path.mjs'))
const report={status:accepted?'GUARDED_REPLAY_WIRE_LENGTH_ADDED_INDEPENDENT_CHECKS_REQUIRED':'GUARDED_REPLAY_WIRE_LENGTH_NO_CANDIDATE',source:artifact(sourcePath),priorPaths:artifact(pathsPath),signal,targetPlanarMm:target,beforePlanarMm:before,addedPlanarMm:delta,tested,
 wireWidthMm:width,clearanceMm:clearance,clearanceMethod:'exact segment-to-circle/rectangle/segment geometry',geometricComparisonEpsilonMm:1e-8,referenceSearchBounds:bounds,newPhysicalHoles:0,otherPathsPreserved:true,nativeBootstrapRetained:true,executionHelper:artifact(helper),fabricationReady:false,defaultChanged:false,timingQualified:false}
if(accepted){const {next,...tuning}=accepted;paths[signal]=next;const p=`${directory}/paths.json`;writeFileSync(p,JSON.stringify(paths,null,2)+'\n');report.paths=artifact(p);report.tuning=tuning;report.afterPlanarMm=length(next)}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,signal,tested,before,target,teeth:accepted?.teeth,amplitude:accepted?.amplitude,newHoles:0}));process.exitCode=accepted?0:1
