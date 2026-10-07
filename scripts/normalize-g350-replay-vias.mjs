// Normalize travel direction and zero-length boundary guards for replay caches.
// Physical segments, via positions and diameters are unchanged. Validate the
// actual props schema instead of suppressing route-cache serialization warnings.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {fanoutTracePath} from '@tscircuit/props'
const [input,out,circuitPath]=process.argv.slice(2)
assert(input&&out&&circuitPath&&!fs.existsSync(out))
const cache=JSON.parse(fs.readFileSync(input)),changes=[]
const circuit=JSON.parse(fs.readFileSync(circuitPath)),parent=new Map()
const find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of circuit.filter(e=>e.type==='source_trace'))for(const m of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(m))
const owners=new Map(circuit.filter(e=>e.type==='pcb_trace').map(t=>[t.pcb_trace_id,find(t.source_trace_id)]))
const declaredVias=circuit.filter(e=>e.type==='pcb_via')
const segments=r=>r.flatMap((p,i)=>{
 const q=r[i+1]
 return q&&p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer&&Math.hypot(p.x-q.x,p.y-q.y)>1e-7?[[p.x,p.y,q.x,q.y,p.width,p.layer]]:[]
})
const vias=r=>r.filter(p=>p.route_type==='via').map(p=>[p.x,p.y,p.via_diameter,p.via_hole_diameter])
for(const t of cache.traces){
 const r=t.route,beforeSegments=segments(r),beforeVias=vias(r)
 if(r[0]?.route_type==='via'){
  const v=r[0],after=r[1];assert(after?.route_type==='wire')
  const layer=after.layer===v.to_layer?v.from_layer:v.to_layer
  assert(after.layer===v.to_layer||after.layer===v.from_layer)
  r.unshift({route_type:'wire',x:v.x,y:v.y,layer,width:after.width})
  changes.push({trace:t.pcb_trace_id,kind:'leading_zero_length_via_guard'})
 }
 if(r.at(-1)?.route_type==='via'){
  const v=r.at(-1),before=r.at(-2);assert(before?.route_type==='wire')
  const layer=before.layer===v.from_layer?v.to_layer:v.from_layer
  assert(before.layer===v.from_layer||before.layer===v.to_layer)
  r.push({route_type:'wire',x:v.x,y:v.y,layer,width:before.width})
  changes.push({trace:t.pcb_trace_id,kind:'trailing_zero_length_via_guard'})
 }
 for(let i=0;i<r.length;i++){
  const v=r[i];if(v.route_type!=='via')continue
  const before=r[i-1],after=r[i+1]
  assert(before?.route_type==='wire'&&after?.route_type==='wire'&&before.layer!==after.layer)
  assert(Math.hypot(before.x-v.x,before.y-v.y)<1e-6&&Math.hypot(after.x-v.x,after.y-v.y)<1e-6)
  if(v.from_layer!==before.layer||v.to_layer!==after.layer){
   changes.push({trace:t.pcb_trace_id,kind:'via_travel_direction',index:i,from:v.from_layer,to:v.to_layer,newFrom:before.layer,newTo:after.layer})
   v.from_layer=before.layer;v.to_layer=after.layer
  }
 }
 assert.deepEqual(segments(r),beforeSegments)
 assert.deepEqual(vias(r),beforeVias)
}
const beforeSegments=cache.traces.flatMap(t=>segments(t.route)),beforeVias=cache.traces.flatMap(t=>vias(t.route)),split=[]
for(const t of cache.traces){
 const chunks=[];let start=0
 for(let i=1;i<t.route.length;i++){
  const a=t.route[i-1],b=t.route[i]
  if(a.route_type!=='wire'||b.route_type!=='wire'||a.layer===b.layer)continue
  assert(Math.hypot(a.x-b.x,a.y-b.y)<1e-6,'Cannot split an unexplained spatial layer jump')
  const physical=declaredVias.filter(v=>Math.hypot(v.x-a.x,v.y-a.y)<1e-6)
  assert.equal(physical.length,1)
  assert.deepEqual(new Set(physical[0].layers),new Set(['top','inner1','inner2','bottom']))
  assert.equal(owners.get(physical[0].pcb_trace_id),find(t.source_trace_id),'Shared junction must be on the authored same net')
  chunks.push(t.route.slice(start,i));start=i
  changes.push({trace:t.pcb_trace_id,kind:'split_branch_at_existing_shared_via',index:i,physicalVia:physical[0].pcb_via_id})
 }
 chunks.push(t.route.slice(start))
 for(let i=0;i<chunks.length;i++){
  const route=chunks[i];assert(route.length)
  if(route.length===1){assert.equal(route[0].route_type,'wire');route.push(structuredClone(route[0]))}
  const trace={...t,pcb_trace_id:chunks.length===1?t.pcb_trace_id:`${t.pcb_trace_id}_shared_via_branch_${i}`,route}
  fanoutTracePath.parse({connection:t.connection_name,route:trace.route});split.push(trace)
 }
}
cache.traces=split
assert.deepEqual(cache.traces.flatMap(t=>segments(t.route)),beforeSegments)
assert.deepEqual(cache.traces.flatMap(t=>vias(t.route)),beforeVias)
fs.writeFileSync(out,JSON.stringify(cache,null,2)+'\n')
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
fs.writeFileSync(out+'.normalization.json',JSON.stringify({sourceSha256:sha(input),physicalCircuitSha256:sha(circuitPath),resultSha256:sha(out),changes,validatedTraces:cache.traces.length,positiveWireSegmentsAndPhysicalViasExactlyPreserved:true,requiresFreshSourceAndIndependentChecks:true,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({validatedTraces:cache.traces.length,metadataChanges:changes.length,physicalGeometryExactlyPreserved:true}))
