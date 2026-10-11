// Test an original verified CPU escape against the open moved-RAM scene.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {routeGuardedOuterBridge} from './lib/g350-ddr-timing-detour-bridge.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,original,root,name='DDR_D5']=process.argv.slice(2);assert(input&&original&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),inputSha=hash(input)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const names=new Map(base.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e.name]))
const ddrIds=new Set([...names].filter(([id,name])=>name?.startsWith('DDR_')).map(([id])=>id));assert.equal(ddrIds.size,49)
const ddr=base.filter(e=>e.type==='pcb_trace'&&ddrIds.has(e.source_trace_id));assert.equal(ddr.length,49)
const source=base.find(e=>e.type==='source_trace'&&e.name===name);assert(source&&name.startsWith('DDR_'))
const old=base.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===source.source_trace_id);assert.equal(old.length,1)
const selected=new Set(old.map(t=>t.pcb_trace_id)),removed=base.filter(e=>e.type==='pcb_via'&&selected.has(e.pcb_trace_id))
const fixed=base.filter(e=>!(e.type==='pcb_trace'&&(ddrIds.has(e.source_trace_id)||selected.has(e.pcb_trace_id)))&&!(e.type==='pcb_via'&&removed.includes(e)))
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const ports=new Map(base.filter(e=>e.type==='pcb_port').map(e=>[e.pcb_port_id,e.source_port_id]))
const shapes=[],owners=new Map(fixed.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,find(e.source_trace_id)]))
for(const p of fixed.filter(e=>e.type==='pcb_smtpad'&&Number.isFinite(e.x))){const w=p.width??2*p.radius,h=p.height??w;if(Number.isFinite(w)&&Number.isFinite(h))shapes.push({kind:p.shape==='circle'?'circle':'rect',x:p.x,y:p.y,w,h,layers:[p.layer],pad:true,owner:find(ports.get(p.pcb_port_id)??p.pcb_smtpad_id)})}
for(const v of fixed.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers:['top','inner1','inner2','bottom'],owner:owners.get(v.pcb_trace_id)??'FIXED_HOLE'})
for(const t of fixed.filter(e=>e.type==='pcb_trace'))for(let i=1;i<t.route.length;i++){const a=t.route[i-1],b=t.route[i];if(a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer&&Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:b.width??.1016,layers:[a.layer],owner:find(t.source_trace_id)})}
const originalSha=hash(original),reference=JSON.parse(fs.readFileSync(original)),prior=reference.find(e=>e.type==='pcb_trace'&&e.source_trace_id===source.source_trace_id);assert(prior)
const first=prior.route.findIndex(p=>p.route_type==='via');assert(first>0)
const portal=prior.route[first],carrier=old[0],end=carrier.route.at(-1),layers=['top','bottom']
// Inner copper remains hard for the drill/annulus while only outer wires route.
for(const s of shapes){s.viaOnly=s.layers.some(l=>!layers.includes(l));if(s.hole){s.layers=layers;s.viaOnly=false}}
shapes.push({kind:'circle',x:portal.x,y:portal.y,w:.4572,h:.4572,hole:.254,layers,owner:find(source.source_trace_id)})
const result=routeGuardedOuterBridge({connection:{name:find(source.source_trace_id),pointsToConnect:[{x:portal.x,y:portal.y,layer:'bottom'},end]},shapes,searchBounds:{minX:-20,maxX:20,minY:-8,maxY:34},seconds:30,gridMm:.025,maxVias:8,viaGrid:.025,routingLayers:layers,viaCostMm:2,viaCopperClearance:.15,guardNonterminalOwnVias:true,primaryTerminalLayer:true})
fs.mkdirSync(root);fs.copyFileSync('scripts/try-g350-existing-cpu-ddr-escape.mjs',root+'/helper.executed.mjs');fs.copyFileSync('scripts/lib/g350-ddr-timing-detour-bridge.mjs',root+'/bridge.executed.mjs')
const report={input:{path:input,sha256:inputSha},original:{path:original,sha256:originalSha},name,portal,found:Boolean(result.route),error:result.error??null,expanded:result.expanded,startBlocked:result.startBlocked,goalBlocked:result.goalBlocked,removedTraceIds:[...selected],removedViaIds:removed.map(v=>v.pcb_via_id),missingDdrCarriers:49,ramReferencesStillNeedRebuild:true,noCandidatePromoted:true,fabricationReady:false}
if(result.route){
 const head=structuredClone(prior.route.slice(0,first+1));head.at(-1).to_layer='bottom'
 const route=[...head,...structuredClone(result.route)];route[route.length-1]=structuredClone(end)
 assert(route.every(p=>p.route_type==='wire'?layers.includes(p.layer):layers.includes(p.from_layer)&&layers.includes(p.to_layer)&&p.from_layer!==p.to_layer))
 const trace={...structuredClone(carrier),route};delete trace.trace_length
 const vias=route.filter(p=>p.route_type==='via').map((p,i)=>({type:'pcb_via',pcb_via_id:'g350_original_cpu_escape_'+name+'_'+i,pcb_trace_id:trace.pcb_trace_id,x:p.x,y:p.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:trace.subcircuit_id}))
 const c=[...structuredClone(fixed),trace,...vias],checked=structuredClone(c)
 report.counts=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](checked).length]));report.counts.manufacturing=checkG350ViaTrackManufacturingClearance(checked.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length
 report.physicalAndContiguityPassedOnOpenGeometry=Object.values(report.counts).every(n=>n===0);report.newVias=vias.length
 const outside=e=>!(e.type==='pcb_trace'&&e.source_trace_id===source.source_trace_id)&&!(e.type==='pcb_via'&&e.pcb_trace_id===trace.pcb_trace_id)
 assert.deepEqual(c.filter(outside),fixed)
 fs.writeFileSync(root+'/open-planning.circuit.json',JSON.stringify(c,null,2)+'\n')
 report.missingDdrCarriers=48
}
assert.equal(hash(input),inputSha)
assert.equal(hash(original),originalSha)
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));process.exitCode=report.physicalAndContiguityPassedOnOpenGeometry?0:2
