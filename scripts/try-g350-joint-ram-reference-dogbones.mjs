// Joint manual package fanout: reserve every connected RAM ball together.
// Local dogbones never count as complete CPU-to-RAM DDR connections.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,cpuReference,root]=process.argv.slice(2);assert(input&&cpuReference&&root&&!fs.existsSync(root))
const pattern=process.env.G350_RAM_DOGBONE_PATTERN??'uniform';assert(['uniform','centre-facing'].includes(pattern))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),hashes=[input,cpuReference].map(hash)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),cpu=JSON.parse(fs.readFileSync(cpuReference))
const ddr=new Set(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>e.source_trace_id));assert.equal(ddr.size,49)
const old=base.filter(e=>e.type==='pcb_trace'&&ddr.has(e.source_trace_id)),ids=new Set(old.map(t=>t.pcb_trace_id));assert.equal(old.length,49)
const fixed=base.filter(e=>!(['pcb_trace','pcb_via'].includes(e.type)&&ids.has(e.pcb_trace_id)))
const cpuTraces=cpu.filter(e=>e.type==='pcb_trace'&&ddr.has(e.source_trace_id));assert.equal(cpuTraces.length,49)
for(const t of cpuTraces)assert.deepEqual(t.route[0],old.find(e=>e.source_trace_id===t.source_trace_id).route[0])
const cpuIds=new Set(cpuTraces.map(t=>t.pcb_trace_id)),reserved=cpu.filter(e=>['pcb_trace','pcb_via'].includes(e.type)&&cpuIds.has(e.pcb_trace_id))
assert(!fixed.some(e=>['pcb_trace','pcb_via'].includes(e.type)&&cpuIds.has(e.pcb_trace_id)))
const ram=base.find(e=>e.type==='pcb_component'&&base.some(s=>s.type==='source_component'&&s.name==='U_RAM'&&s.source_component_id===e.source_component_id));assert(ram)
const sources=new Map(base.filter(e=>e.type==='source_trace').flatMap(t=>t.connected_source_port_ids.map(p=>[p,t])))
const ports=base.filter(e=>e.type==='pcb_port'&&e.pcb_component_id===ram.pcb_component_id&&sources.has(e.source_port_id));assert.equal(ports.length,91)
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
fs.mkdirSync(root);fs.copyFileSync('scripts/try-g350-joint-ram-reference-dogbones.mjs',root+'/helper.executed.mjs');const trials=[];let accepted=null
for(const [i,[dx,dy]]of (pattern==='uniform'?[[.4,.4],[.4,-.4],[-.4,.4],[-.4,-.4]]:[[.4,0],[-.4,0]]).entries()){
 const circuit=structuredClone([...fixed,...reserved])
 for(const p of ports){
  // The RAM has a central aisle between its populated ball banks. Direct
  // the inner-row dogbones toward it, preserving 0.8 mm hole pitch within
  // each bank; this exposes more usable Top handoffs to DDR carriers.
  const actualDy=pattern==='centre-facing'?(p.y>ram.center.y?-.4:.4):dy
  const source=sources.get(p.source_port_id),id='g350_joint_ram_escape_'+p.pcb_port_id,v={x:Math.round((p.x+dx)*1e9)/1e9,y:Math.round((p.y+actualDy)*1e9)/1e9}
  circuit.push({type:'pcb_trace',pcb_trace_id:id,source_trace_id:source.source_trace_id,subcircuit_id:source.subcircuit_id,route:[{route_type:'wire',x:p.x,y:p.y,layer:'top',width:.1016,start_pcb_port_id:p.pcb_port_id},{route_type:'wire',...v,layer:'top',width:.1016},{route_type:'via',...v,from_layer:'top',to_layer:'bottom',layers:['top','inner1','inner2','bottom'],via_diameter:.4572,via_hole_diameter:.254},{route_type:'wire',...v,layer:'bottom',width:.1016}]},{type:'pcb_via',pcb_via_id:id+'_via',pcb_trace_id:id,...v,outer_diameter:.4572,hole_diameter:.254,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:source.subcircuit_id})
 }
 assert.deepEqual(circuit.slice(0,fixed.length),fixed)
 const c=structuredClone(circuit),details=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTraceViaCounts','checkPcbTracesOutOfBoard','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](c)]));details.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e))
 const counts=Object.fromEntries(Object.entries(details).map(([n,e])=>[n,e.length])),passed=Object.values(counts).every(n=>n===0)
  trials.push({i,dx,dy,pattern,counts,details,allCpuAndRamEscapesPhysicalPassed:passed});fs.writeFileSync(root+'/trial-'+i+'.circuit.json',JSON.stringify(circuit,null,2)+'\n');fs.writeFileSync(root+'/trial-'+i+'.json',JSON.stringify(trials.at(-1),null,2)+'\n');console.log(JSON.stringify({i,counts,passed}))
 if(passed){accepted=i;fs.writeFileSync(root+'/physical-only-joint-escapes.circuit.json',JSON.stringify(circuit,null,2)+'\n');break}
}
assert.deepEqual([input,cpuReference].map(hash),hashes)
fs.writeFileSync(root+'/report.json',JSON.stringify({input,cpuReference,hashes,pattern,trials,accepted,localCpuEscapes:49,localRamEscapes:91,completeDdrCarriers:0,referenceReconnectionAndSourceMatchingGroundAndCadUnqualified:true,fabricationReady:false},null,2)+'\n');process.exitCode=accepted===null?2:0
