// Validate the complete public native CPU dogbone output on the open board.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,escapesPath,root]=process.argv.slice(2);assert(input&&escapesPath&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),inputSha=hash(input),escapesSha=hash(escapesPath)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),escapes=JSON.parse(fs.readFileSync(escapesPath))
const ids=new Set(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>e.source_trace_id));assert.equal(ids.size,49)
const original=base.filter(e=>e.type==='pcb_trace'&&ids.has(e.source_trace_id));assert.equal(original.length,49);const removed=new Set(original.map(t=>t.pcb_trace_id))
const fixed=base.filter(e=>!(e.type==='pcb_trace'&&removed.has(e.pcb_trace_id))&&!(e.type==='pcb_via'&&removed.has(e.pcb_trace_id)))
assert(Array.isArray(escapes)&&escapes.length===49&&new Set(escapes.map(t=>t.source_trace_id)).size===49)
const output=structuredClone(fixed)
for(const t of escapes){
 const old=original.find(x=>x.source_trace_id===t.source_trace_id);assert(old)
 const route=structuredClone(t.route);assert(route[0].route_type==='wire'&&route[0].layer==='top'&&Math.hypot(route[0].x-old.route[0].x,route[0].y-old.route[0].y)<1e-8);route[0]=structuredClone(old.route[0])
 assert(route.every(p=>p.route_type==='wire'?['top','bottom'].includes(p.layer)&&p.width===.1016:p.route_type==='via'&&p.from_layer==='top'&&p.to_layer==='bottom'&&p.via_diameter===.4572&&p.via_hole_diameter===.254&&JSON.stringify(p.layers)===JSON.stringify(['top','inner1','inner2','bottom'])))
 const vias=route.filter(p=>p.route_type==='via');assert.equal(vias.length,1)
 assert(!fixed.some(e=>e.pcb_trace_id===t.pcb_trace_id))
 output.push({type:'pcb_trace',pcb_trace_id:t.pcb_trace_id,source_trace_id:t.source_trace_id,subcircuit_id:old.subcircuit_id,route})
 for(const [i,v] of vias.entries())output.push({type:'pcb_via',pcb_via_id:t.pcb_trace_id+'_physical_'+i,pcb_trace_id:t.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:old.subcircuit_id})
}
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const checked=structuredClone(output),details=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](checked)]));details.manufacturing=checkG350ViaTrackManufacturingClearance(checked.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e))
const counts=Object.fromEntries(Object.entries(details).map(([n,e])=>[n,e.length]))
// This artifact contains CPU fanouts only. Preserve and report the unchanged
// whole-connection check's 49 missing RAM endpoints; it is not a routed board.
const localMissingRamOnly=details.checkTracesAreContiguous.length===49&&new Set(details.checkTracesAreContiguous.map(e=>e.source_trace_id)).size===49&&details.checkTracesAreContiguous.every(e=>ids.has(e.source_trace_id)&&e.message.includes('is missing a connection to SMD pad U_RAM.'))
const physicalCounts=Object.fromEntries(Object.entries(counts).filter(([n])=>n!=='checkTracesAreContiguous'))
const passed=Object.values(physicalCounts).every(n=>n===0)&&localMissingRamOnly
assert.deepEqual(output.slice(0,fixed.length),fixed);assert.equal(hash(input),inputSha);assert.equal(hash(escapesPath),escapesSha)
fs.mkdirSync(root);fs.copyFileSync('scripts/qualify-g350-outer-ddr-cpu-dogbones.mjs',root+'/helper.executed.mjs')
fs.writeFileSync(root+'/'+(passed?'physical-only':'rejected')+'-cpu-escapes.circuit.json',JSON.stringify(output,null,2)+'\n')
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:inputSha},escapes:{path:escapesPath,sha256:escapesSha},counts,physicalCounts,details,all49CpuEscapesPhysicalPassed:passed,localMissingRamOnly,localMissingRamConnections:details.checkTracesAreContiguous.length,completeDdrCarriers:0,required:49,missingRamReferences:true,sourceMatchingGroundAndCadUnqualified:true,fabricationReady:false},null,2)+'\n');console.log(JSON.stringify({counts,passed}));process.exitCode=passed?0:2
