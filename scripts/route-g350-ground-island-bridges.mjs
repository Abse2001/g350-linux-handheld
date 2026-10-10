// Isolated ground repair planning with the existing physical routing rules.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {routeGuardedOuterBridge} from './lib/g350-ddr-timing-detour-bridge.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,inventory,root]=process.argv.slice(2);assert(input&&inventory&&root&&!fs.existsSync(root));fs.mkdirSync(root)
const read=p=>JSON.parse(fs.readFileSync(p)),hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
fs.copyFileSync('scripts/route-g350-ground-island-bridges.mjs',root+'/planner.executed.mjs')
fs.copyFileSync('scripts/lib/g350-ddr-timing-detour-bridge.mjs',root+'/bridge.executed.mjs')
const c=read(input).filter(e=>!e.type.includes('error')),original=structuredClone(c)
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of c.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const ground=c.find(e=>e.type==='source_net'&&e.name==='GND').source_net_id,G=find(ground)
const owners=new Map(c.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,find(e.source_trace_id)]))
const ports=new Map(c.filter(e=>e.type==='pcb_port').map(e=>[e.pcb_port_id,e]))
const sp=new Map(c.filter(e=>e.type==='source_port').map(e=>[e.source_port_id,e]))
const sc=new Map(c.filter(e=>e.type==='source_component').map(e=>[e.source_component_id,e.name]))
const items=read(inventory).items
const attempts=[]
const counts=()=>({...Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkSourceTracesMatchPcbTraceThickness','checkTracesAreContiguous'].map(n=>[n,checks[n](c).length])),manufacturing:checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length})
assert(Object.values(counts()).every(n=>!n))
for(const missing of items.filter(r=>r.kind==='pad'&&!r.mainGroundConnected)){
 const port=[...ports.values()].find(p=>{const s=sp.get(p.source_port_id);return sc.get(s.source_component_id)===missing.reference&&String(s.pin_number)===missing.pin});assert(port)
 const source=c.find(e=>e.type==='source_trace'&&e.connected_source_port_ids.includes(port.source_port_id)&&find(e.source_trace_id)===G);assert(source)
 const layer=port.layers[0],width=source.min_trace_thickness??.1016
 const start={x:Math.round(port.x/.025)*.025,y:Math.round(port.y/.025)*.025,layer}
 const destinations=items.filter(r=>r.kind==='via'&&r.mainGroundConnected&&Math.hypot(r.x-port.x,r.y-port.y)<12).sort((a,b)=>Math.hypot(a.x-port.x,a.y-port.y)-Math.hypot(b.x-port.x,b.y-port.y)).slice(0,6)
 let accepted=false
 for(const end of destinations){
  if(accepted)break
  const shapes=[]
  for(const p of c.filter(e=>e.type==='pcb_smtpad'&&Number.isFinite(e.x))){const owner=find(ports.get(p.pcb_port_id)?.source_port_id??p.pcb_smtpad_id);const w=p.width??2*p.radius,h=p.height??w;if(!Number.isFinite(w)||!Number.isFinite(h))continue;shapes.push({kind:p.shape==='circle'?'circle':'rect',x:p.x,y:p.y,w,h,layers:[p.layer],pad:true,owner})}
  for(const v of c.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers:['top','inner1','inner2','bottom'],owner:owners.get(v.pcb_trace_id)})
  for(const h of c.filter(e=>e.type==='pcb_hole'))shapes.push({kind:'circle',x:h.x,y:h.y,w:h.hole_diameter,h:h.hole_diameter,hole:h.hole_diameter,layers:['top','inner1','inner2','bottom'],owner:h.pcb_hole_id})
  for(const t of c.filter(e=>e.type==='pcb_trace'))for(let i=1;i<t.route.length;i++){const a=t.route[i-1],b=t.route[i];if(a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer&&Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:b.width??.1016,layers:[a.layer],owner:find(t.source_trace_id)})}
  const result=routeGuardedOuterBridge({connection:{name:G,pointsToConnect:[start,{x:end.x,y:end.y,layer}]},shapes,searchBounds:{minX:-5,maxX:13,minY:-5,maxY:16},seconds:8,gridMm:.025,maxVias:2,viaGrid:.025,routingLayers:['top','bottom','inner1','inner2'],rasterGuardMm:0,guardNonterminalOwnVias:true})
  const attempt={missing,end,error:result.error??null,newVias:result.newVias??null,expanded:result.expanded,accepted:false};attempts.push(attempt)
  if(!result.route){console.log(JSON.stringify(attempt));continue}
  const id='g350_ground_astar_bridge_'+port.pcb_port_id
  const route=result.route.map(p=>p.route_type==='wire'?{...p,width}:p)
  if(Math.hypot(route[0].x-port.x,route[0].y-port.y)>1e-8)route.unshift({route_type:'wire',x:port.x,y:port.y,layer,width})
  route[0].start_pcb_port_id=port.pcb_port_id
  const t={type:'pcb_trace',pcb_trace_id:id,source_trace_id:source.source_trace_id,connection_name:ground,subcircuit_id:source.subcircuit_id,route}
  const added=[t,...route.filter(p=>p.route_type==='via').map((v,i)=>({type:'pcb_via',pcb_via_id:id+'_via_'+i,pcb_trace_id:id,source_trace_id:source.source_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:v.from_layer,to_layer:v.to_layer,subcircuit_id:source.subcircuit_id}))]
  c.push(...added);attempt.counts=counts()
  if(Object.values(attempt.counts).every(n=>!n)){accepted=true;attempt.accepted=true;attempt.route=route}else{fs.writeFileSync(root+'/rejected-'+attempts.length+'.json',JSON.stringify(added,null,2)+'\n');c.splice(-added.length)}
  fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n');fs.writeFileSync(root+'/attempts.json',JSON.stringify(attempts,null,2)+'\n');console.log(JSON.stringify(attempt))
 }
}
assert.deepEqual(c.slice(0,original.length),original)
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:hash(input)},candidateSha256:hash(root+'/candidate.circuit.json'),attempts,counts:counts(),addedGroundTraces:c.filter(e=>e.type==='pcb_trace').length-original.filter(e=>e.type==='pcb_trace').length,addedGroundVias:c.filter(e=>e.type==='pcb_via').length-original.filter(e=>e.type==='pcb_via').length,existingCopperExactlyPreserved:true,planningOnly:true,fabricationReady:false},null,2)+'\n')
