// Test verified CPU escapes and rigidly moved RAM escapes before bus routing.
// This is open planning geometry, never a source/CAD-qualified board.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,reference,root]=process.argv.slice(2)
assert(input&&reference&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const inputSha=hash(input),referenceSha=hash(reference)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),prior=JSON.parse(fs.readFileSync(reference))
const ramOf=c=>c.find(e=>e.type==='pcb_component'&&c.some(s=>s.type==='source_component'&&s.name==='U_RAM'&&s.source_component_id===e.source_component_id))
const ram=ramOf(base),oldRam=ramOf(prior);assert(ram&&oldRam)
const turns=((ram.rotation-oldRam.rotation+360)%360)/90;assert(Number.isInteger(turns))
const move=p=>{let x=p.x-oldRam.center.x,y=p.y-oldRam.center.y;for(let n=0;n<turns;n++)[x,y]=[-y,x];return {...p,x:x+ram.center.x,y:y+ram.center.y}}
const names=new Map(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>[e.source_trace_id,e.name]));assert.equal(names.size,49)
const originals=base.filter(e=>e.type==='pcb_trace'&&names.has(e.source_trace_id));assert.equal(originals.length,49)
const selected=new Set(originals.map(t=>t.pcb_trace_id))
const fixed=base.filter(e=>!(e.type==='pcb_trace'&&selected.has(e.pcb_trace_id))&&!(e.type==='pcb_via'&&selected.has(e.pcb_trace_id)))
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const reserved=structuredClone(fixed),handoffs=[]
for(const old of originals){
 const t=prior.find(e=>e.type==='pcb_trace'&&e.source_trace_id===old.source_trace_id);assert(t)
 assert.deepEqual(t.route[0],old.route[0])
 const first=t.route.findIndex(p=>p.route_type==='via'),last=t.route.findLastIndex(p=>p.route_type==='via');assert(first>0&&last>first)
 const head=structuredClone(t.route.slice(0,first+1));head.at(-1).to_layer='bottom'
 const tail=t.route.slice(last).map(move);tail[0].from_layer='bottom';tail[0].to_layer='top'
 assert.deepEqual(tail.at(-1),old.route.at(-1))
 const a=head.at(-1),b=tail[0]
 for(const [side,route,v] of [['cpu',[...head,{route_type:'wire',x:a.x,y:a.y,layer:'bottom',width:.1016}],a],['ram',[{route_type:'wire',x:b.x,y:b.y,layer:'bottom',width:.1016},...tail],b]]){
  const id=old.pcb_trace_id+'_'+side+'_reserved'
  reserved.push({...structuredClone(old),pcb_trace_id:id,route},{type:'pcb_via',pcb_via_id:id+'_via',pcb_trace_id:id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:old.subcircuit_id})
 }
 handoffs.push({name:names.get(old.source_trace_id),source_trace_id:old.source_trace_id,pcb_trace_id:old.pcb_trace_id,cpu:{x:a.x,y:a.y,layer:'bottom'},ram:{x:b.x,y:b.y,layer:'bottom'},head,tail})
}
const checked=structuredClone(reserved),details=Object.fromEntries(g350DdrPhysicalChecks.map(n=>[n,checks[n](checked)]))
details.manufacturing=checkG350ViaTrackManufacturingClearance(checked.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e))
const counts=Object.fromEntries(Object.entries(details).map(([n,e])=>[n,e.length])),passed=Object.values(counts).every(n=>n===0)
assert.deepEqual(reserved.slice(0,fixed.length),fixed)
assert.equal(hash(input),inputSha);assert.equal(hash(reference),referenceSha)
fs.mkdirSync(root);fs.copyFileSync('scripts/prepare-g350-outer-ddr-dual-escapes.mjs',root+'/helper.executed.mjs')
fs.writeFileSync(root+'/reserved-escapes.circuit.json',JSON.stringify(reserved,null,2)+'\n')
fs.writeFileSync(root+'/handoffs.json',JSON.stringify(handoffs,null,2)+'\n')
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:inputSha},reference:{path:reference,sha256:referenceSha},ramPose:ram,counts,details,physicalPassedOnOpenEscapesOnly:passed,completeDdrCarriers:0,required:49,missingRamReferences:true,sourceMatchingGroundAndCadUnqualified:true,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({counts,passed}));process.exitCode=passed?0:2
