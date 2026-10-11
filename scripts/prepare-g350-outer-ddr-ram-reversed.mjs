// Reversible alternate side orientation for the open planning host only.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,root]=process.argv.slice(2);assert(input&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),sha=hash(input)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),a=structuredClone(base)
const ram=a.find(e=>e.type==='pcb_component'&&a.some(s=>s.type==='source_component'&&s.name==='U_RAM'&&s.source_component_id===e.source_component_id));assert.deepEqual(ram.center,{x:0,y:6});assert.equal(ram.rotation,90)
const ramId=ram.pcb_component_id,ports=new Map(base.filter(e=>e.type==='pcb_port'&&e.pcb_component_id===ramId).map(p=>[p.pcb_port_id,p]));assert.equal(ports.size,96)
const ddr=new Set(a.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>e.source_trace_id));assert.equal(ddr.size,49)
const ids=new Set(a.filter(e=>e.type==='pcb_trace'&&ddr.has(e.source_trace_id)).map(e=>e.pcb_trace_id));assert.equal(ids.size,49)
assert(!a.some(e=>e.type==='pcb_trace'&&!ddr.has(e.source_trace_id)&&e.route.some(p=>[p.start_pcb_port_id,p.end_pcb_port_id,p.pcb_port_id].some(id=>ports.has(id)))),'Open all RAM external approaches before this diagnostic')
for(const e of a.filter(e=>['pcb_port','pcb_smtpad'].includes(e.type)&&e.pcb_component_id===ramId)){
 assert(Number.isFinite(e.x)&&Number.isFinite(e.y));if(e.type==='pcb_smtpad')assert(['circle','rect'].includes(e.shape),'Do not guess polygon rotation')
 e.x=Math.round((2*ram.center.x-e.x)*1e9)/1e9;e.y=Math.round((2*ram.center.y-e.y)*1e9)/1e9
}
ram.rotation=270
for(const t of a.filter(e=>e.type==='pcb_trace'&&ddr.has(e.source_trace_id))){const last=t.route.at(-1);assert(ports.has(last.end_pcb_port_id));const end=a.find(e=>e.type==='pcb_port'&&e.pcb_port_id===last.end_pcb_port_id);t.route=[structuredClone(t.route[0]),{...structuredClone(last),x:end.x,y:end.y}]}
const fixed=a.filter(e=>!(['pcb_trace','pcb_via'].includes(e.type)&&ids.has(e.pcb_trace_id)))
const outside=e=>!(e.pcb_component_id===ramId||['pcb_trace','pcb_via'].includes(e.type)&&ids.has(e.pcb_trace_id))
assert.deepEqual(a.filter(outside),base.filter(outside))
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of a.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const details=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](structuredClone(fixed))]));details.manufacturing=checkG350ViaTrackManufacturingClearance(structuredClone(fixed).map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e))
const counts=Object.fromEntries(Object.entries(details).map(([n,v])=>[n,v.length])),passed=Object.values(counts).every(n=>n===0)
fs.mkdirSync(root);fs.copyFileSync('scripts/prepare-g350-outer-ddr-ram-reversed.mjs',root+'/helper.executed.mjs');fs.writeFileSync(root+'/incomplete-routing-input.circuit.json',JSON.stringify(a,null,2)+'\n');fs.writeFileSync(root+'/open-planning.circuit.json',JSON.stringify(fixed,null,2)+'\n');fs.writeFileSync(root+'/report.json',JSON.stringify({input,sha256:sha,ramPosition:ram.center,ramRotation:270,counts,details,physicalPassedOnOpenGeometryOnly:passed,requiredDdrCarriers:49,completeDdrCarriers:0,missingReferencesAndFullSourceCadUnqualified:true,allOtherPlacementsAndForeignRecordsPreserved:true,fabricationReady:false},null,2)+'\n');assert.equal(hash(input),sha);console.log(JSON.stringify({passed,counts}));process.exitCode=passed?0:2
