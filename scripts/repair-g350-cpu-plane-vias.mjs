import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {fanoutTracePath} from '@tscircuit/props'
import {getFullConnectivityMapFromCircuitJson} from 'circuit-json-to-connectivity-map'

const read=p=>JSON.parse(readFileSync(p,'utf8'))
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const circuitPath='dist/g350-ddr-power-replay-native/compiled.circuit.json'
const originalPath='lib/am3352/placement/ddr-cpu-power-fanout.json'
const circuit=read(circuitPath),original=read(originalPath),conn=getFullConnectivityMapFromCircuitJson(circuit)
const badSites=[[-6.4,18.4],[-6.4,20],[3.2,21.6],[-1.6,20],[.8,21.6],[.8,20]]
assert.equal(circuit.filter(e=>e.type==='pcb_placement_error').length,6)
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)
const near=(a,b)=>distance(a,b)<1e-7
const end=p=>p.route.find(r=>r.route_type==='via')??p.route.at(-1)
const allPads=circuit.filter(e=>e.type==='pcb_smtpad')
const pads=allPads.filter(p=>p.x>=-10&&p.x<=10&&p.y>=11&&p.y<=29)
assert(pads.every(p=>['rect','circle'].includes(p.shape)),'Review unsupported local pad geometry')
const group=badSites.map(([x,y])=>{
 const old={x,y},paths=original.filter(p=>near(end(p),old))
 assert(paths.length>=1&&paths.length<=2)
 const via=circuit.find(e=>e.type==='pcb_via'&&near(e,old))
 assert(via)
 return {old,paths,via,candidates:[]}
})
const groundVia=group[0].via
assert(group.every(g=>conn.areIdsConnected(g.via.pcb_via_id,groundVia.pcb_via_id)))
const fixedVias=circuit.filter(e=>e.type==='pcb_via'&&!group.some(g=>near(g.old,e)))
const pointToPad=(v,p)=>p.shape==='circle'?distance(v,p)-p.radius:Math.hypot(Math.max(Math.abs(v.x-p.x)-p.width/2,0),Math.max(Math.abs(v.y-p.y)-p.height/2,0))
const pointToSegment=(p,a,b)=>{
 const dx=b.x-a.x,dy=b.y-a.y,s=dx*dx+dy*dy
 const t=s?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/s)):0
 return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)
}
const topPads=pads.filter(p=>p.layer==='top')
const padBoundingRadius=p=>p.shape==='circle'?p.radius:Math.hypot(p.width/2,p.height/2)
const segmentDistance=(a,b,c,d)=>{
 const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)
 const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b)
 if(x*y<0&&z*w<0)return 0
 return Math.min(pointToSegment(a,c,d),pointToSegment(b,c,d),pointToSegment(c,a,b),pointToSegment(d,a,b))
}
const foreignSegments=[]
for(const trace of circuit.filter(e=>e.type==='pcb_trace')){
 if(conn.areIdsConnected(trace.pcb_trace_id,groundVia.pcb_via_id))continue
 for(let i=1;i<trace.route.length;i++){
  const a=trace.route[i-1],b=trace.route[i]
  if(a.route_type===b.route_type&&a.route_type==='wire'&&a.layer===b.layer&&distance(a,b)>1e-9)foreignSegments.push({a,b,width:Math.max(a.width,b.width),layer:a.layer})
 }
}
const foreignVias=fixedVias.filter(v=>!conn.areIdsConnected(v.pcb_via_id,groundVia.pcb_via_id))
const segmentClear=(a,b)=>{
 // A circumscribed circle is conservative for the few rectangular top
 // pads around the CPU; the actual native and KiCad checks follow.
 if(topPads.some(p=>!conn.areIdsConnected(p.pcb_smtpad_id,groundVia.pcb_via_id)&&pointToSegment(p,a,b)-padBoundingRadius(p)<.1524-1e-8))return false
 if(foreignVias.some(v=>pointToSegment(v,a,b)<.381-1e-8))return false
 if(foreignSegments.some(s=>s.layer==='top'&&segmentDistance(a,b,s.a,s.b)<.0508+s.width/2+.1016-1e-8))return false
 return true
}
const possibleWires=(source,v)=>{
 const dx=v.x-source.x,dy=v.y-source.y,ax=Math.abs(dx),ay=Math.abs(dy),d=Math.min(ax,ay)
 const intermediate=[{x:source.x+Math.sign(dx)*d,y:source.y+Math.sign(dy)*d},{x:v.x-Math.sign(dx)*d,y:v.y-Math.sign(dy)*d}]
 const routes=intermediate.map(p=>[source,p,v].filter((p,i,a)=>i===0||!near(p,a[i-1])))
 return routes.filter(r=>r.slice(1).every((b,i)=>segmentClear(r[i],b))).map(r=>({points:r,length:r.slice(1).reduce((n,b,i)=>n+distance(r[i],b),0)})).filter(r=>r.length<=1.778+1e-8).sort((a,b)=>a.length-b.length)
}
for(const g of group){
 const source=g.paths[0].route[0]
 for(const dx of [-1.2,-.4,.4,1.2])for(const dy of [-1.2,-.4,.4,1.2]){
  const v={x:source.x+dx,y:source.y+dy}
  // Even same-net capacitor pads retain 4 mil copper separation from the
  // via land here: the drill cannot enter a solderable aperture.
  if(pads.some(p=>pointToPad(v,p)<.3302-1e-8))continue
  if(fixedVias.some(p=>distance(v,p)<.508-1e-8))continue
  if(foreignSegments.some(s=>pointToSegment(v,s.a,s.b)<Math.max(.2286+s.width/2+.1016,.127+s.width/2+.2)-1e-8))continue
  const routes=g.paths.map(p=>possibleWires(p.route[0],v)[0])
  if(routes.some(r=>!r))continue
  g.candidates.push({via:v,routes,score:routes.reduce((n,r)=>n+r.length,0)})
 }
 g.candidates.sort((a,b)=>a.score-b.score)
 assert(g.candidates.length,`No clear local repair for ${JSON.stringify(g.old)}`)
}
const order=[...group].sort((a,b)=>a.candidates.length-b.candidates.length),chosen=[]
const assign=i=>{
 if(i===order.length)return true
 for(const candidate of order[i].candidates){
  if(chosen.some(c=>distance(c.candidate.via,candidate.via)<.508-1e-8))continue
  chosen.push({group:order[i],candidate})
  if(assign(i+1))return true
  chosen.pop()
 }
 return false
}
assert(assign(0),'No joint six-via assignment meets drill spacing')
const repaired=structuredClone(original),changes=[]
for(const {group:g,candidate:c} of chosen){
 for(let i=0;i<g.paths.length;i++){
  const path=g.paths[i],target=repaired.find(p=>p.connection===path.connection),hasVia=path.route.some(p=>p.route_type==='via')
  const wires=c.routes[i].points.map(p=>({route_type:'wire',x:p.x,y:p.y,width:.1016,layer:'top'}))
  target.route=hasVia?[...wires,{route_type:'via',...c.via,from_layer:'top',to_layer:'inner1',via_diameter:.4572,via_hole_diameter:.254},{route_type:'wire',...c.via,width:.1016,layer:'inner1'}]:wires
  fanoutTracePath.parse(target)
  changes.push({connection:path.connection,oldVia:g.old,newVia:c.via,lengthMm:c.routes[i].length,sharedExistingVia:!hasVia})
 }
}
assert.equal(changes.length,9)
const out='lib/am3352/placement/ddr-cpu-power-fanout-repaired.json'
writeFileSync(out,JSON.stringify(repaired,null,2)+'\n')
writeFileSync('checks/integrated/g350-ddr-bootstrap/cpu-plane-via-repair.json',JSON.stringify({status:'SIX_LOCAL_MANUAL_VIA_REPAIRS_REQUIRE_FRESH_BUILD_AND_DRC',fabricationReady:false,unmodifiedNativeConnections:53,repairedConnections:9,relocatedPhysicalVias:6,componentPlacementUnchanged:true,endpointsAndNetsUnchanged:true,viaLandMm:.4572,viaDrillMm:.254,distinctDrillEdgeSpacingMm:.254,allMovedViasClearSolderablePads:true,allRepairedRoutesWithin70Mil:true,changes,artifacts:[artifact(circuitPath),artifact(originalPath),artifact(out)],scope:'Manual repair of native CPU plane-fanout bootstrap, limited to six via sites that collided with bottom-side capacitor pads. Full reconstructed copper and refill checks remain required.'},null,2)+'\n')
console.log(JSON.stringify({relocatedVias:6,repairedConnections:changes.length,candidates:group.map(g=>({oldVia:g.old,choices:g.candidates.length})),changes}))
