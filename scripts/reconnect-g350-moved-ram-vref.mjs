// Rebuild the moved RAM's two VREF approaches on an open, CPU-reserved host.
// This is reference repair only: missing DDR/power/ground remain explicit.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {routeGuardedOuterBridge} from './lib/g350-ddr-timing-detour-bridge.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,originalPath,root]=process.argv.slice(2);assert(input&&originalPath&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),inputSha=hash(input),originalSha=hash(originalPath)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),original=JSON.parse(fs.readFileSync(originalPath))
const ram=base.find(e=>e.type==='pcb_component'&&base.some(s=>s.type==='source_component'&&s.name==='U_RAM'&&s.source_component_id===e.source_component_id));assert(ram)
const source=base.find(e=>e.type==='source_trace'&&e.name==='U_SOC_DDR_VREF_J4');assert(source)
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const ramPorts=base.filter(e=>e.type==='pcb_port'&&e.pcb_component_id===ram.pcb_component_id&&find(e.source_port_id)===find(source.source_trace_id));assert.equal(ramPorts.length,2)
const portOwners=new Map(base.filter(e=>e.type==='pcb_port').map(e=>[e.pcb_port_id,find(e.source_port_id)]))
function shapesFor(c){
 const shapes=[],owners=new Map(c.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,find(e.source_trace_id)]))
 for(const p of c.filter(e=>e.type==='pcb_smtpad')){
  const poly=p.shape==='polygon',xs=poly?p.points.map(q=>q.x):[],ys=poly?p.points.map(q=>q.y):[]
  const x=poly?(Math.min(...xs)+Math.max(...xs))/2:p.x,y=poly?(Math.min(...ys)+Math.max(...ys))/2:p.y,w=poly?Math.max(...xs)-Math.min(...xs):p.width??2*p.radius,h=poly?Math.max(...ys)-Math.min(...ys):p.height??w
  assert([x,y,w,h].every(Number.isFinite));shapes.push({kind:p.shape==='circle'?'circle':'rect',x,y,w,h,layers:[p.layer],pad:true,owner:portOwners.get(p.pcb_port_id)??p.pcb_smtpad_id})
 }
 for(const v of c.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers:['top','inner1','inner2','bottom'],owner:owners.get(v.pcb_trace_id)??'FIXED_HOLE'})
 for(const t of c.filter(e=>e.type==='pcb_trace'))for(let i=1;i<t.route.length;i++){const a=t.route[i-1],b=t.route[i];if(a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer&&Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:b.width??.1016,layers:[a.layer],owner:find(t.source_trace_id)})}
 return shapes
}
function physical(c){const d=structuredClone(c),details=Object.fromEntries(g350DdrPhysicalChecks.map(n=>[n,checks[n](d)]));details.manufacturing=checkG350ViaTrackManufacturingClearance(d.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e));return {details,counts:Object.fromEntries(Object.entries(details).map(([n,e])=>[n,e.length]))}}
assert(Object.values(physical(base).counts).every(n=>n===0),'The CPU-reserved open host must pass unchanged physical checks')
fs.mkdirSync(root);fs.copyFileSync('scripts/reconnect-g350-moved-ram-vref.mjs',root+'/helper.executed.mjs');fs.copyFileSync('scripts/lib/g350-ddr-timing-detour-bridge.mjs',root+'/bridge.executed.mjs')
let circuit=structuredClone(base);const attempts=[]
for(const pad of ramPorts){
 const old=original.find(e=>e.type==='pcb_trace'&&e.source_trace_id===source.source_trace_id&&e.route[0].start_pcb_port_id===pad.pcb_port_id);assert(old&&!base.some(e=>e.type==='pcb_trace'&&e.pcb_trace_id===old.pcb_trace_id))
 const end=structuredClone(old.route.at(-1));assert(end.route_type==='wire')
 const start={route_type:'wire',x:pad.x,y:pad.y,layer:'top',width:.1016,start_pcb_port_id:pad.pcb_port_id}
 const result=routeGuardedOuterBridge({connection:{name:find(source.source_trace_id),pointsToConnect:[start,end]},shapes:shapesFor(circuit),searchBounds:{minX:-20,maxX:20,minY:-8,maxY:34},seconds:20,gridMm:.025,maxVias:8,viaGrid:.025,routingLayers:['top','inner1','inner2','bottom'],viaCopperClearance:.254,primaryTerminalLayer:true,pruneDominatedViaStates:true})
 const record={pcb_port_id:pad.pcb_port_id,pcb_trace_id:old.pcb_trace_id,found:Boolean(result.route),error:result.error??null,expanded:result.expanded,accepted:false}
 if(result.route){
  const route=structuredClone(result.route);route[0]=start;route[route.length-1]=end
  const t={...structuredClone(old),route};delete t.trace_length
  const vias=route.filter(p=>p.route_type==='via').map((p,i)=>({type:'pcb_via',pcb_via_id:`g350_ram_vref_${pad.pcb_port_id}_${i}`,pcb_trace_id:t.pcb_trace_id,x:p.x,y:p.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:t.subcircuit_id}))
  const next=[...circuit,t,...vias],checked=physical(next);record.counts=checked.counts;record.details=checked.details;record.accepted=Object.values(checked.counts).every(n=>n===0)
  fs.writeFileSync(root+'/'+pad.pcb_port_id+'-proposal.circuit.json',JSON.stringify(next,null,2)+'\n')
  if(record.accepted)circuit=next
 }
 attempts.push(record);console.log(JSON.stringify({pcb_port_id:record.pcb_port_id,found:record.found,accepted:record.accepted,counts:record.counts,error:record.error}))
}
const added=new Set(attempts.filter(a=>a.accepted).map(a=>a.pcb_trace_id));assert.deepEqual(circuit.filter(e=>!(['pcb_trace','pcb_via'].includes(e.type)&&added.has(e.pcb_trace_id))),base)
assert.equal(hash(input),inputSha);assert.equal(hash(originalPath),originalSha)
const contiguous=checks.checkTracesAreContiguous(structuredClone(circuit)),vrefErrors=contiguous.filter(e=>find(e.source_trace_id)===find(source.source_trace_id)),passed=added.size===2&&vrefErrors.length===0
fs.writeFileSync(root+'/reference-planning.circuit.json',JSON.stringify(circuit,null,2)+'\n')
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:inputSha},original:{path:originalPath,sha256:originalSha},attempts,vrefErrors,ramVrefRebuiltAndNativeContiguous:passed,accepted:added.size,required:2,allForeignRecordsPreserved:true,completeDdrCarriers:0,powerGroundSourceAndCadStillUnqualified:true,fabricationReady:false},null,2)+'\n');process.exitCode=passed?0:2
