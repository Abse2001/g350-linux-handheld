// Open four explicitly identified branches for a joint RAM fanout trial.
// Each removed branch, including LCD_DATA4, must be rebuilt before promotion.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,root]=process.argv.slice(2);assert(input&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),sha=hash(input)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const names=new Map(base.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e.name])),ddr=new Set([...names].filter(([id,n])=>n?.startsWith('DDR_')).map(([id])=>id));assert.equal(ddr.size,49)
const carriers=base.filter(e=>e.type==='pcb_trace'&&ddr.has(e.source_trace_id));assert.equal(carriers.length,49)
const target=new Set(['g350_rest_negotiated_06_trace_14','g350_rest_negotiated_06_trace_940','g350_ground_fresh_fill_local_recover_20_trace_20','g350_rest_negotiated_06_trace_1232'])
const traces=base.filter(e=>e.type==='pcb_trace'&&target.has(e.pcb_trace_id));assert.equal(traces.length,4)
assert(traces.every(t=>['U_SOC_VDDS_DDR_E5','U_SOC_VSS_A1'].includes(names.get(t.source_trace_id))||t.pcb_trace_id==='g350_rest_negotiated_06_trace_1232'&&base.some(s=>s.type==='source_trace'&&s.source_trace_id===t.source_trace_id&&base.some(n=>n.type==='source_net'&&n.name==='LCD_DATA4'&&s.connected_source_net_ids.includes(n.source_net_id)))))
const removed=base.filter(e=>['pcb_trace','pcb_via'].includes(e.type)&&target.has(e.pcb_trace_id)),ids=new Set(carriers.map(t=>t.pcb_trace_id))
const fixed=base.filter(e=>!removed.includes(e)&&!(['pcb_trace','pcb_via'].includes(e.type)&&ids.has(e.pcb_trace_id)))
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const c=structuredClone(fixed),details=Object.fromEntries(g350DdrPhysicalChecks.map(n=>[n,checks[n](c)]));details.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e))
const counts=Object.fromEntries(Object.entries(details).map(([n,e])=>[n,e.length])),passed=Object.values(counts).every(n=>n===0)
assert.equal(hash(input),sha)
fs.mkdirSync(root);fs.copyFileSync('scripts/prepare-g350-joint-ram-clearance-ripup.mjs',root+'/helper.executed.mjs')
fs.writeFileSync(root+'/open-planning.circuit.json',JSON.stringify(fixed,null,2)+'\n');fs.writeFileSync(root+'/incomplete-routing-input.circuit.json',JSON.stringify([...fixed,...carriers],null,2)+'\n');fs.writeFileSync(root+'/removed-reference-records.circuit.json',JSON.stringify(removed,null,2)+'\n')
fs.writeFileSync(root+'/report.json',JSON.stringify({input,sha256:sha,removedTraceIds:[...target],removedViaIds:removed.filter(e=>e.type==='pcb_via').map(e=>e.pcb_via_id),counts,details,physicalPassedOnOpenGeometryOnly:passed,missingDdrCarriers:49,missingCalibrationPowerGroundAndLcdBranches:true,allOtherRecordsPreserved:true,fabricationReady:false},null,2)+'\n');console.log(JSON.stringify({counts,passed}));process.exitCode=passed?0:2
