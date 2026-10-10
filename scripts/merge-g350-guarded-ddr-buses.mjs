// Combining independently guarded edits still requires new complete physics and
// ground checks. Reject combinations, preserve their evidence, never auto-promote.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
const [basePath,root,...donors]=process.argv.slice(2)
assert(basePath&&root&&donors.length&&donors.length<=3&&!fs.existsSync(root));fs.mkdirSync(root)
const read=p=>JSON.parse(fs.readFileSync(p)),hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const c=read(basePath).filter(e=>!e.type.includes('error')),validator=createG350PlanarPlanningValidator(c),inputs=[],selectedBuses=new Set()
for(const spec of donors){
 const split=spec.indexOf('=');assert(split>0)
 const name=spec.slice(0,split),path=spec.slice(split+1),d=read(path)
 assert(['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(name)&&!selectedBuses.has(name));selectedBuses.add(name)
 for(const type of ['source_trace','source_bus','source_port','source_net','source_component','pcb_board','pcb_port','pcb_smtpad','pcb_component','pcb_via','pcb_hole','pcb_plated_hole'])assert.deepEqual(d.filter(e=>e.type===type),c.filter(e=>e.type===type))
 const ids=new Set(c.find(e=>e.type==='source_bus'&&e.name===name).source_trace_ids)
 for(let i=0;i<c.length;i++)if(c[i].type==='pcb_trace'&&ids.has(c[i].source_trace_id)){
  const t=d.find(e=>e.type==='pcb_trace'&&e.pcb_trace_id===c[i].pcb_trace_id);assert(t&&t.source_trace_id===c[i].source_trace_id)
  assert.deepEqual(t.route.filter(p=>p.route_type==='via'),c[i].route.filter(p=>p.route_type==='via'))
  assert.deepEqual([t.route[0],t.route.at(-1)],[c[i].route[0],c[i].route.at(-1)])
  c[i]=structuredClone(t)
 }
 inputs.push({bus:name,path,sha256:hash(path)})
}
const counts=validator.complete(c)
fs.copyFileSync('scripts/merge-g350-guarded-ddr-buses.mjs',root+'/planner.executed.mjs')
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
let ground=null
if(Object.values(counts).every(n=>n===0)){
 const g=await fillG350LockedGround(c)
 ground={portErrors:g.portErrors,errors:g.errors,elapsedSeconds:g.elapsedSeconds}
 fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')
}
const groups=c.filter(e=>e.type==='source_bus'&&['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(e.name)).map(b=>{const lengths=c.filter(e=>e.type==='pcb_trace'&&b.source_trace_ids.includes(e.source_trace_id)).map(t=>ddrRouteLength(t.route));return {name:b.name,skewMm:Math.max(...lengths)-Math.min(...lengths),limitMm:b.max_length_skew}})
const passed=Object.values(counts).every(n=>n===0)&&ground?.portErrors===0
fs.writeFileSync(root+'/report.json',JSON.stringify({base:{path:basePath,sha256:hash(basePath)},inputs,counts,ground,groups,passed,allBarrelsSourcePadsPlacementsAndPeripheralCopperPreserved:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({counts,portErrors:ground?.portErrors??null,groups,passed}));process.exitCode=passed?0:1
