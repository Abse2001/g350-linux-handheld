import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'

// Exact copper capsules explain local failures before editing checked routes.
// This diagnostic does not substitute for source replay, native checks or DRC.
const [overridePath,outputPath='checks/integrated/g350-ddr-bootstrap/byte1-local-site-collisions.json']=process.argv.slice(2)
const read=p=>JSON.parse(readFileSync(p,'utf8'))
const source='dist/g350-byte1-bootstrap-core2088/phase-3.input.simple-route.json'
const circuitPath='dist/g350-current-index-byte0-handoff-fixed/compiled.circuit.json'
const raw=read(source),circuit=read(circuitPath)
const names=new Map(circuit.filter(r=>r.type==='source_trace').map(t=>[t.source_trace_id,t.name]))
const sourceNames=new Map(circuit.filter(r=>r.type==='source_component').map(t=>[t.source_component_id,t.name]))
const componentNames=new Map(circuit.filter(r=>r.type==='pcb_component').map(t=>[t.pcb_component_id,sourceNames.get(t.source_component_id)]))
if(overridePath){
 const paths=read(overridePath)
 for(const path of paths){
  const trace=raw.traces.find(t=>t.connection_name===path.source_trace_id)
  assert(trace,`Unknown override ${path.source_trace_id}`)
  trace.route=path.route
 }
}
const pointSegment=(p,a,b)=>{
 const x=b.x-a.x,y=b.y-a.y,n=x*x+y*y
 const t=n?Math.max(0,Math.min(1,((p.x-a.x)*x+(p.y-a.y)*y)/n)):0
 return Math.hypot(p.x-a.x-t*x,p.y-a.y-t*y)
}
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)
const segmentDistance=(a,b,c,d)=>{
 if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)return 0
 return Math.min(pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b))
}
const pointObstacle=(p,o)=>o.shape==='circle'
 ?Math.hypot(p.x-o.center.x,p.y-o.center.y)-o.width/2
 :Math.hypot(Math.max(0,Math.abs(p.x-o.center.x)-o.width/2),Math.max(0,Math.abs(p.y-o.center.y)-o.height/2))
const segmentObstacle=(a,b,o)=>{
 if(o.shape==='circle')return pointSegment(o.center,a,b)-o.width/2
 const x=o.center.x,y=o.center.y,w=o.width/2,h=o.height/2
 if(pointObstacle(a,o)===0||pointObstacle(b,o)===0)return 0
 const ps=[{x:x-w,y:y-h},{x:x+w,y:y-h},{x:x+w,y:y+h},{x:x-w,y:y+h}]
 return Math.min(...ps.map((p,i)=>segmentDistance(a,b,p,ps[(i+1)%4])))
}
const vias=new Map(),segments=[]
for(const t of raw.traces)for(let i=0;i<t.route.length;i++){
 const p=t.route[i],q=t.route[i-1],net=names.get(t.connection_name)??t.connection_name
 if(p.route_type==='via')vias.set(`${p.x.toFixed(8)},${p.y.toFixed(8)}`,{center:p,diameter:p.via_diameter,net})
 if(p.route_type==='wire'&&q?.route_type==='wire'&&p.layer===q.layer&&Math.hypot(p.x-q.x,p.y-q.y)>1e-8)
  segments.push({a:q,b:p,width:Math.max(p.width,q.width),layer:p.layer,net,index:i})
}
assert.equal(vias.size,119)
const clearance=.1016,viaRadius=.4572/2,traceRadius=.1016/2
const results=raw.connections.flatMap(c=>c.pointsToConnect.map(port=>{
 const sourcePad=raw.obstacles.find(o=>o.componentId&&Math.hypot(o.center.x-port.x,o.center.y-port.y)<1e-8)
 assert(sourcePad)
 const candidates=[]
 for(const dx of [-.4,0,.4])for(const dy of [-.4,0,.4]){
  if(!dx&&!dy)continue
  const site={x:port.x+dx,y:port.y+dy},blockers=[]
  for(const o of raw.obstacles){
   const label=o.circuitJsonMetadata?.source_port_name??o.obstacleId??'other obstacle'
   const component=componentNames.get(o.componentId)
   const viaGap=pointObstacle(site,o)-viaRadius
   if(viaGap<clearance-1e-8)blockers.push({kind:'pad-to-via',component,label,gapMm:viaGap})
   if(o!==sourcePad&&o.layers.includes(port.layer)){
    const gap=segmentObstacle(port,site,o)-traceRadius
    if(gap<clearance-1e-8)blockers.push({kind:'pad-to-stub',component,label,gapMm:gap})
   }
  }
  for(const via of vias.values()){
   const gap=Math.hypot(site.x-via.center.x,site.y-via.center.y)-viaRadius-via.diameter/2
   if(gap<clearance-1e-8)blockers.push({kind:'fixed-via',net:via.net,position:{x:via.center.x,y:via.center.y},gapMm:gap})
   const stubGap=pointSegment(via.center,port,site)-via.diameter/2-traceRadius
   if(stubGap<clearance-1e-8)blockers.push({kind:'fixed-via-to-stub',net:via.net,gapMm:stubGap})
  }
  for(const segment of segments){
   const gap=pointSegment(site,segment.a,segment.b)-segment.width/2-viaRadius
   if(gap<clearance-1e-8)blockers.push({kind:'fixed-wire-to-via',net:segment.net,layer:segment.layer,gapMm:gap})
   if(segment.layer===port.layer){
    const stubGap=segmentDistance(port,site,segment.a,segment.b)-segment.width/2-traceRadius
    if(stubGap<clearance-1e-8)blockers.push({kind:'fixed-wire-to-stub',net:segment.net,layer:segment.layer,gapMm:stubGap})
   }
  }
  candidates.push({site,clear:!blockers.length,blockers})
 }
 return {signal:names.get(c.name),package:componentNames.get(sourcePad.componentId),port,
  clearLocalSites:candidates.filter(c=>c.clear).length,candidates}
}))
const artifact=p=>({path:p,sha256:createHash('sha256').update(readFileSync(p)).digest('hex')})
const report={status:'EXACT_LOCAL_SITE_DIAGNOSTIC_REQUIRES_NATIVE_AND_PHYSICAL_REPLAY',
 source:artifact(source),circuit:artifact(circuitPath),override:overridePath?artifact(overridePath):null,
 helper:artifact('scripts/analyze-g350-byte1-local-sites.mjs'),
 rules:{viaPadDiameterMm:.4572,viaHoleDiameterMm:.254,clearanceMm:clearance,traceWidthMm:.1016},
 fixedThroughVias:vias.size,fixedTraces:raw.traces.length,results,
 jointAssignmentVerified:false,qualifiedNewSignals:0,fabricationReady:false}
writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(results.map(r=>({signal:r.signal,package:r.package,clearLocalSites:r.clearLocalSites,
 blockers:[...new Set(r.candidates.flatMap(c=>c.blockers.map(b=>b.net??`${b.component}.${b.label}`)))]})),null,2))
