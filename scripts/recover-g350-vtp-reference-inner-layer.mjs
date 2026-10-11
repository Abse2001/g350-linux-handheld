// Open a CPU Bottom escape corridor by rebuilding only the VTP reference.
// The 49 DDR bus signals still require Top/Bottom; VTP is a calibration net.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {routeGuardedOuterBridge} from './lib/g350-ddr-timing-detour-bridge.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,cpuReservation,root]=process.argv.slice(2);assert(input&&cpuReservation&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),inputSha=hash(input),reservationSha=hash(cpuReservation)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const ddr=new Set(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>e.source_trace_id));assert.equal(ddr.size,49)
const originalDdr=base.filter(e=>e.type==='pcb_trace'&&ddr.has(e.source_trace_id));assert.equal(originalDdr.length,49)
const source=base.find(e=>e.type==='source_trace'&&e.name==='U_SOC_DDR_VTP_J3');assert(source)
const targetIds=new Set(['g350_rest_negotiated_06_trace_1231_local_57','g350_rest_negotiated_06_trace_1231_local_58','g350_ground_fill_local_recover_18_trace_113'])
const selected=base.filter(e=>e.type==='pcb_trace'&&targetIds.has(e.pcb_trace_id));assert.equal(selected.length,3);assert(selected.every(t=>t.source_trace_id===source.source_trace_id&&t.route.every(p=>p.route_type==='wire'&&p.layer==='bottom')))
assert(!base.some(e=>e.type==='pcb_via'&&targetIds.has(e.pcb_trace_id)))
const ddrTraceIds=new Set(originalDdr.map(t=>t.pcb_trace_id))
const fixed=base.filter(e=>!(e.type==='pcb_trace'&&(targetIds.has(e.pcb_trace_id)||ddrTraceIds.has(e.pcb_trace_id)))&&!(e.type==='pcb_via'&&ddrTraceIds.has(e.pcb_trace_id)))
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const reservation=JSON.parse(fs.readFileSync(cpuReservation)).filter(e=>e.type==='pcb_trace'&&e.pcb_trace_id.endsWith('_cpu_reserved')||e.type==='pcb_via'&&e.pcb_trace_id.endsWith('_cpu_reserved'))
assert.equal(reservation.filter(e=>e.type==='pcb_trace').length,49)
const scene=[...fixed,...reservation],ports=new Map(base.filter(e=>e.type==='pcb_port').map(p=>[p.pcb_port_id,p.source_port_id])),owners=new Map(scene.filter(e=>e.type==='pcb_trace').map(t=>[t.pcb_trace_id,find(t.source_trace_id)])),shapes=[]
for(const p of scene.filter(e=>e.type==='pcb_smtpad')){
 const polygon=p.shape==='polygon',xs=polygon?p.points.map(q=>q.x):[],ys=polygon?p.points.map(q=>q.y):[]
 const x=polygon?(Math.min(...xs)+Math.max(...xs))/2:p.x,y=polygon?(Math.min(...ys)+Math.max(...ys))/2:p.y,w=polygon?Math.max(...xs)-Math.min(...xs):p.width??2*p.radius,h=polygon?Math.max(...ys)-Math.min(...ys):p.height??w
 assert([x,y,w,h].every(Number.isFinite));shapes.push({kind:p.shape==='circle'?'circle':'rect',x,y,w,h,layers:[p.layer],pad:true,owner:find(ports.get(p.pcb_port_id)??p.pcb_smtpad_id)})
}
for(const v of scene.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers:['top','inner1','inner2','bottom'],owner:owners.get(v.pcb_trace_id)??'FIXED_HOLE'})
for(const t of scene.filter(e=>e.type==='pcb_trace'))for(let i=1;i<t.route.length;i++){const a=t.route[i-1],b=t.route[i];if(a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer&&Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:b.width??.1016,layers:[a.layer],owner:find(t.source_trace_id)})}
const carrier=selected.find(t=>t.pcb_trace_id.endsWith('_57')),start=carrier.route[0],end={x:0,y:14.4,layer:'inner1'}
assert(base.some(e=>e.type==='pcb_via'&&e.pcb_via_id==='pcb_via_584'&&e.x===end.x&&e.y===end.y&&owners.get(e.pcb_trace_id)===find(source.source_trace_id)))
const result=routeGuardedOuterBridge({connection:{name:find(source.source_trace_id),pointsToConnect:[start,end]},shapes,searchBounds:{minX:-5,maxX:5,minY:9,maxY:17},seconds:30,gridMm:.025,maxVias:8,viaGrid:.025,routingLayers:['bottom','inner1','inner2','top'],viaCostMm:2,viaCopperClearance:.254,guardNonterminalOwnVias:true,primaryTerminalLayer:true})
fs.mkdirSync(root);fs.copyFileSync('scripts/recover-g350-vtp-reference-inner-layer.mjs',root+'/helper.executed.mjs');fs.copyFileSync('scripts/lib/g350-ddr-timing-detour-bridge.mjs',root+'/bridge.executed.mjs')
const report={input:{path:input,sha256:inputSha},cpuReservation:{path:cpuReservation,sha256:reservationSha},referenceNet:source.name,removedTraceIds:[...targetIds],found:Boolean(result.route),error:result.error??null,expanded:result.expanded,missingDdrCarriers:49,missingRamReferences:true,sourceGroundMatchingAndCadUnqualified:true,fabricationReady:false}
if(result.route){
 const route=structuredClone(result.route);route[0]=structuredClone(start)
 const trace={...structuredClone(carrier),route};delete trace.trace_length
 const vias=route.filter(p=>p.route_type==='via').map((p,i)=>({type:'pcb_via',pcb_via_id:'g350_vtp_reference_rebuild_'+i,pcb_trace_id:trace.pcb_trace_id,x:p.x,y:p.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:trace.subcircuit_id}))
 const output=[...fixed,trace,...vias],checked=structuredClone(output)
 const details=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](checked)]));details.manufacturing=checkG350ViaTrackManufacturingClearance(checked.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e))
 report.counts=Object.fromEntries(Object.entries(details).map(([n,e])=>[n,e.length]));report.details=details;report.physicalAndContiguityPassedOnOpenGeometry=Object.values(report.counts).every(n=>n===0);report.newVias=vias.length
 const outside=e=>!(e.type==='pcb_trace'&&targetIds.has(e.pcb_trace_id))&&!(e.type==='pcb_via'&&e.pcb_trace_id===trace.pcb_trace_id)
 assert.deepEqual(output.filter(outside),fixed)
 fs.writeFileSync(root+'/open-planning.circuit.json',JSON.stringify(output,null,2)+'\n');fs.writeFileSync(root+'/incomplete-routing-input.circuit.json',JSON.stringify([...output,...originalDdr],null,2)+'\n')
}
assert.equal(hash(input),inputSha);assert.equal(hash(cpuReservation),reservationSha)
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({found:report.found,counts:report.counts,newVias:report.newVias}));process.exitCode=report.physicalAndContiguityPassedOnOpenGeometry?0:2
