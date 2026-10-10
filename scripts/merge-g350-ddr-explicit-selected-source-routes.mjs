// Overlay explicitly named planar DDR routes on a checked plan; conflicts/
// foreign edits and any bus regression remain errors before writing outputs.
// Source adds duplicate wire points and regenerated pours; foreign copper stays fixed.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'
const [basePath,sourceBaselinePath,selectedPath,root,namesText]=process.argv.slice(2)
assert(basePath&&sourceBaselinePath&&selectedPath&&root&&namesText&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const read=p=>JSON.parse(fs.readFileSync(p)).filter(e=>!e.type.includes('error')),base=read(basePath),source=read(sourceBaselinePath),selected=read(selectedPath),c=structuredClone(base)
const names=new Map(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>[e.source_trace_id,e.name]));assert.equal(names.size,49)
const allowedNames=namesText.split(',');assert(allowedNames.length>0&&allowedNames.length<=49&&new Set(allowedNames).size===allowedNames.length&&allowedNames.every(n=>[...names.values()].includes(n)));const ids=new Set([...names].filter(([,n])=>allowedNames.includes(n)).map(([id])=>id));assert.equal(ids.size,allowedNames.length)
const strip=v=>Array.isArray(v)?v.map(strip):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!['copper_pour_id','is_inside_copper_pour'].includes(k)).map(([k,x])=>[k,strip(x)])):v
const immutableTypes=['source_trace','source_bus','source_port','source_net','source_component','pcb_board','pcb_port','pcb_smtpad','pcb_component','pcb_hole','pcb_plated_hole','pcb_via']
for(const type of immutableTypes)assert.deepEqual(base.filter(e=>e.type===type),source.filter(e=>e.type===type),type)
// The selected candidate may differ from its own exact source baseline only in
// the explicitly selected route records. Existing regenerated pours and metadata are unchanged.
const foreignSelected=j=>j.filter(e=>!(e.type==='pcb_trace'&&ids.has(e.source_trace_id)))
assert.deepEqual(foreignSelected(selected),foreignSelected(source))
const peripheral=j=>j.filter(e=>e.type==='pcb_trace'&&!names.has(e.source_trace_id)).map(strip)
assert.deepEqual(peripheral(base),peripheral(source))
const omitRoute=t=>Object.fromEntries(Object.entries(strip(t)).filter(([k])=>!['route','trace_length'].includes(k))),changes=[]
for(const id of ids){
 const get=j=>{const a=j.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===id);assert.equal(a.length,1);return a[0]},old=get(base),next=get(selected),target=get(c)
 assert.deepEqual(omitRoute(next),omitRoute(old))
 assert.deepEqual(strip([next.route[0],next.route.at(-1)]),strip([old.route[0],old.route.at(-1)]))
 assert.deepEqual(next.route.filter(p=>p.route_type==='via'),old.route.filter(p=>p.route_type==='via'))
 target.route=strip(structuredClone(next.route));delete target.trace_length
 changes.push({name:names.get(id),beforeMm:ddrRouteLength(old.route),afterMm:ddrRouteLength(target.route)})
}
assert.deepEqual(c.filter(e=>!(e.type==='pcb_trace'&&ids.has(e.source_trace_id))),base.filter(e=>!(e.type==='pcb_trace'&&ids.has(e.source_trace_id))))
const validator=createG350PlanarPlanningValidator(base),counts=validator.complete(c)
for(const n of ['checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'])counts[n]=checks[n](c).length
assert(Object.values(counts).every(n=>n===0))
const groups=j=>j.filter(e=>e.type==='source_bus'&&e.name?.startsWith('DDR_')&&e.source_trace_ids.length>2).map(bus=>{const lengths=j.filter(e=>e.type==='pcb_trace'&&bus.source_trace_ids.includes(e.source_trace_id)).map(t=>ddrRouteLength(t.route));return {name:bus.name,skewMm:Math.max(...lengths)-Math.min(...lengths),limitMm:bus.max_length_skew}})
const merged=groups(c),previous=[groups(base),groups(source),groups(selected)]
assert(merged.every((g,i)=>g.skewMm<=Math.min(...previous.map(p=>p[i].skewMm))+1e-7),'Overlay must not regress any input bus')
const ground=await fillG350LockedGround(c);assert.equal(ground.portErrors,0)
fs.mkdirSync(root);fs.copyFileSync('scripts/merge-g350-ddr-explicit-selected-source-routes.mjs',root+'/merge.executed.mjs')
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n');fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(ground.circuit,null,2)+'\n')
const report={allowedNames,inputs:[basePath,sourceBaselinePath,selectedPath].map(path=>({path,sha256:hash(path)})),changes,counts,groups:merged,groundPortErrors:0,allCurrentUnselectedRecordsExactlyPreserved:true,allHolesPadsPlacementsAndLogicalConstraintsExactlyPreserved:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false}
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
