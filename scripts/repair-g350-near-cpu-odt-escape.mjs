// The retained ODT Top approach crosses the closer RAM pose. Replace only
// that local CPU approach; all 49 escapes still require native qualification.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,reference,root]=process.argv.slice(2);assert(input&&reference&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),hashes=[input,reference].map(hash)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),ref=JSON.parse(fs.readFileSync(reference))
const ddr=new Map(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>[e.source_trace_id,e.name]));assert.equal(ddr.size,49)
const old=base.filter(e=>e.type==='pcb_trace'&&ddr.has(e.source_trace_id)),ids=new Set(old.map(e=>e.pcb_trace_id));assert.equal(old.length,49)
const fixed=base.filter(e=>!(['pcb_trace','pcb_via'].includes(e.type)&&ids.has(e.pcb_trace_id)))
const heads=ref.filter(e=>e.type==='pcb_trace'&&ddr.has(e.source_trace_id));assert.equal(heads.length,49)
const odt=heads.find(t=>ddr.get(t.source_trace_id)==='DDR_ODT');assert(odt)
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
fs.mkdirSync(root);fs.copyFileSync('scripts/repair-g350-near-cpu-odt-escape.mjs',root+'/helper.executed.mjs');const trials=[];let accepted=null
for(const [i,[dx,dy]]of [[-.4,-.4],[.4,-.4],[.4,.4],[-.4,.4]].entries()){
 const output=structuredClone(fixed)
 for(const prior of heads){
  const t=structuredClone(prior);assert.deepEqual(t.route[0],old.find(e=>e.source_trace_id===t.source_trace_id).route[0])
  if(t.source_trace_id===odt.source_trace_id){const a=t.route[0],v={x:a.x+dx,y:a.y+dy};t.route=[a,{route_type:'wire',...v,layer:'top',width:.1016},{route_type:'via',...v,from_layer:'top',to_layer:'bottom',layers:['top','inner1','inner2','bottom'],via_diameter:.4572,via_hole_diameter:.254},{route_type:'wire',...v,layer:'bottom',width:.1016}]}
  delete t.trace_length;output.push(t)
  const vias=t.route.filter(p=>p.route_type==='via');assert.equal(vias.length,1)
  output.push({type:'pcb_via',pcb_via_id:t.pcb_trace_id+'_near_cpu_via',pcb_trace_id:t.pcb_trace_id,x:vias[0].x,y:vias[0].y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:t.subcircuit_id})
 }
 assert.deepEqual(output.slice(0,fixed.length),fixed)
 const c=structuredClone(output),details=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTraceViaCounts','checkPcbTracesOutOfBoard','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](c)]));details.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e))
 const counts=Object.fromEntries(Object.entries(details).map(([n,e])=>[n,e.length])),passed=Object.values(counts).every(n=>n===0)
 trials.push({i,dx,dy,counts,details,passed});fs.writeFileSync(root+'/trial-'+i+'.circuit.json',JSON.stringify(output,null,2)+'\n');fs.writeFileSync(root+'/trial-'+i+'.json',JSON.stringify(trials.at(-1),null,2)+'\n');console.log(JSON.stringify({i,counts,passed}))
 if(passed){accepted=i;fs.writeFileSync(root+'/physical-only-cpu-escapes.circuit.json',JSON.stringify(output,null,2)+'\n');break}
}
assert.deepEqual([input,reference].map(hash),hashes)
fs.writeFileSync(root+'/report.json',JSON.stringify({input,reference,hashes,trials,accepted,all49CpuEscapesPhysicalPassed:accepted!==null,changedOnlyDdrApproach:'DDR_ODT',completeDdrCarriers:0,referenceReconnectionAndSourceMatchingGroundAndCadUnqualified:true,fabricationReady:false},null,2)+'\n');process.exitCode=accepted===null?2:0
