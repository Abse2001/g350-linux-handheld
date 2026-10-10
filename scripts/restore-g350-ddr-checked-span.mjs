// Recover a selected planar span from prior checked copper between identical
// anchors. Preserve every hole, endpoint, pad and foreign trace; do not waive DRC.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'
const [input,donor,root,name,startText,endText,donorStartText,donorEndText]=process.argv.slice(2)
const [start,end,donorStart,donorEnd]=[startText,endText,donorStartText,donorEndText].map(Number)
assert(input&&donor&&root&&name?.startsWith('DDR_')&&!fs.existsSync(root)&&[start,end,donorStart,donorEnd].every(Number.isInteger))
fs.mkdirSync(root);fs.copyFileSync('scripts/restore-g350-ddr-checked-span.mjs',root+'/planner.executed.mjs')
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p)).filter(e=>!e.type.includes('error'))
const c=read(input),d=read(donor),id=c.find(e=>e.type==='source_trace'&&e.name===name)?.source_trace_id,t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===id),dt=d.find(e=>e.type==='pcb_trace'&&e.source_trace_id===id);assert(t&&dt)
for(const type of ['source_trace','source_bus','source_port','source_net','source_component','pcb_board','pcb_port','pcb_smtpad','pcb_component','pcb_via','pcb_hole','pcb_plated_hole'])assert.deepEqual(c.filter(e=>e.type===type),d.filter(e=>e.type===type))
assert(start>=0&&start<end&&end<t.route.length&&donorStart>=0&&donorStart<donorEnd&&donorEnd<dt.route.length)
assert.deepEqual(t.route[start],dt.route[donorStart]);assert.deepEqual(t.route[end],dt.route[donorEnd])
const before=structuredClone(t.route),validator=createG350PlanarPlanningValidator(c),selected=dt.route.slice(donorStart,donorEnd+1)
assert([...before.slice(start,end+1),...selected].every(p=>p.route_type==='wire'&&p.layer===selected[0].layer))
t.route=[...before.slice(0,start),...structuredClone(selected),...before.slice(end+1)];delete t.trace_length
assert.deepEqual(t.route.filter(p=>p.route_type==='via'),before.filter(p=>p.route_type==='via'));assert.deepEqual([t.route[0],t.route.at(-1)],[before[0],before.at(-1)]);validator.assertImmutable(c)
const counts=validator.complete(c);fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n');let ground=null
if(Object.values(counts).every(v=>v===0)){const g=await fillG350LockedGround(c);ground={portErrors:g.portErrors,elapsedSeconds:g.elapsedSeconds,errors:g.errors};fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')}
const passed=Object.values(counts).every(v=>v===0)&&ground?.portErrors===0
const report={input:{path:input,sha256:hash(input)},donor:{path:donor,sha256:hash(donor)},name,start,end,donorStart,donorEnd,beforeMm:ddrRouteLength(before),afterMm:ddrRouteLength(t.route),counts,ground,passed,barrelsPadsEndpointsAndForeignCopperPreserved:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false}
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));process.exitCode=passed?0:1
