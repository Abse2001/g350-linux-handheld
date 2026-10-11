// Diagnose and open the authorized near-CPU RAM pose. All removed reference
// branches must be rebuilt; no missing connection counts as a routed board.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,root]=process.argv.slice(2);assert(input&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),sha=hash(input)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const ram=base.find(e=>e.type==='pcb_component'&&base.some(s=>s.type==='source_component'&&s.name==='U_RAM'&&s.source_component_id===e.source_component_id));assert(ram)
assert.deepEqual(ram.center,{x:0,y:6});assert.equal(ram.rotation,90)
const ports=new Set(base.filter(e=>e.type==='pcb_port'&&e.pcb_component_id===ram.pcb_component_id).map(e=>e.pcb_port_id))
const ddrIds=new Set(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>e.source_trace_id));assert.equal(ddrIds.size,49)
const ddr=base.filter(e=>e.type==='pcb_trace'&&ddrIds.has(e.source_trace_id));assert.equal(ddr.length,49)
const remainingRamAliases=base.filter(e=>e.type==='pcb_trace'&&!ddrIds.has(e.source_trace_id)&&e.route.some(p=>[p.start_pcb_port_id,p.end_pcb_port_id,p.pcb_port_id].some(id=>ports.has(id))))
assert.equal(remainingRamAliases.length,7,'Seven edge/metadata RAM branches remained after the earlier exact-center selection')
const rebuildIds=['g350_rest_negotiated_06_trace_933','g350_rest_negotiated_06_trace_1204','g350_rest_negotiated_06_trace_1195','g350_full_board_ground_fine_01_trace_34','g350_ground_dynamic_proxy_recover_21_trace_1']
const zq=base.find(e=>e.type==='source_trace'&&e.name==='U_RAM_ZQ_L8');assert(zq)
const selected=new Set([...ddr,...remainingRamAliases,...base.filter(e=>e.type==='pcb_trace'&&(rebuildIds.includes(e.pcb_trace_id)||e.source_trace_id===zq.source_trace_id))].map(e=>e.pcb_trace_id))
assert(rebuildIds.every(id=>selected.has(id)))
const removed=base.filter(e=>['pcb_trace','pcb_via'].includes(e.type)&&selected.has(e.pcb_trace_id))
const fixed=base.filter(e=>!removed.includes(e)),parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of fixed.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const c=structuredClone(fixed),details=Object.fromEntries(g350DdrPhysicalChecks.map(n=>[n,checks[n](c)]));details.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e))
const counts=Object.fromEntries(Object.entries(details).map(([n,e])=>[n,e.length])),passed=Object.values(counts).every(n=>n===0)
assert.deepEqual(fixed.filter(e=>e.type==='pcb_component'),base.filter(e=>e.type==='pcb_component'));assert.equal(hash(input),sha)
fs.mkdirSync(root);fs.copyFileSync('scripts/prepare-g350-outer-ddr-near-cpu-reference-host.mjs',root+'/helper.executed.mjs')
fs.writeFileSync(root+'/open-planning.circuit.json',JSON.stringify(fixed,null,2)+'\n')
fs.writeFileSync(root+'/incomplete-routing-input.circuit.json',JSON.stringify([...fixed,...ddr],null,2)+'\n')
fs.writeFileSync(root+'/removed-reference-records.circuit.json',JSON.stringify(removed.filter(e=>!ddrIds.has(e.source_trace_id)&&!ddr.some(t=>t.pcb_trace_id===e.pcb_trace_id)),null,2)+'\n')
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:sha},placement:ram.center,rotation:ram.rotation,remainingRamAliases:remainingRamAliases.map(t=>t.pcb_trace_id),removedReferenceTraceIds:removed.filter(e=>e.type==='pcb_trace'&&!ddrIds.has(e.source_trace_id)).map(t=>t.pcb_trace_id),removedViaIds:removed.filter(e=>e.type==='pcb_via').map(e=>e.pcb_via_id),counts,details,physicalPassedOnOpenGeometryOnly:passed,missingDdrCarriers:49,missingRamAndCalibrationReferenceBranches:true,allOutsideRecordsPreserved:true,planningOnly:true,fabricationReady:false},null,2)+'\n');console.log(JSON.stringify({counts,passed}));process.exitCode=passed?0:2
