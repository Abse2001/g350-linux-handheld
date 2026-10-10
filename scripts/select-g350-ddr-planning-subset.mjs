// A strict planar-only counterfactual. Selecting edits never qualifies a board.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'

const [basePath,donorPath,root,namesText]=process.argv.slice(2)
assert(basePath&&donorPath&&root&&namesText&&!fs.existsSync(root))
fs.mkdirSync(root)
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const read=p=>JSON.parse(fs.readFileSync(p)).filter(e=>!e.type.includes('error'))
const base=read(basePath),donor=read(donorPath),names=namesText.split(',')
assert(names.length&&new Set(names).size===names.length)
const ids=new Set(base.filter(e=>e.type==='source_trace'&&names.includes(e.name)).map(e=>e.source_trace_id))
assert.equal(ids.size,names.length)
assert(names.every(n=>n.startsWith('DDR_')))
for(const type of ['source_trace','source_bus','source_port','source_net','source_component','pcb_board','pcb_port','pcb_smtpad','pcb_component','pcb_via','pcb_hole','pcb_plated_hole'])
 assert.deepEqual(base.filter(e=>e.type===type),donor.filter(e=>e.type===type),type)
const byId=new Map(donor.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,e]))
const c=structuredClone(base).map(e=>{
 if(e.type!=='pcb_trace'||!ids.has(e.source_trace_id))return e
 const d=byId.get(e.pcb_trace_id);assert(d&&d.source_trace_id===e.source_trace_id)
 const strip=p=>Object.fromEntries(Object.entries(p).filter(([k])=>!['copper_pour_id','is_inside_copper_pour'].includes(k)))
 assert.deepEqual(d.route.filter(p=>p.route_type==='via').map(strip),e.route.filter(p=>p.route_type==='via').map(strip))
 assert.deepEqual([d.route[0],d.route.at(-1)].map(strip),[e.route[0],e.route.at(-1)].map(strip))
 return structuredClone(d)
})
const validator=createG350PlanarPlanningValidator(base),counts=validator.complete(c)
assert(Object.values(counts).every(n=>n===0))
fs.copyFileSync('scripts/select-g350-ddr-planning-subset.mjs',root+'/planner.executed.mjs')
const g=await fillG350LockedGround(c)
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')
const groups=c.filter(e=>e.type==='source_bus'&&['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(e.name)).map(b=>{
 const lengths=c.filter(e=>e.type==='pcb_trace'&&b.source_trace_ids.includes(e.source_trace_id)).map(t=>ddrRouteLength(t.route))
 return {name:b.name,skewMm:Math.max(...lengths)-Math.min(...lengths),limitMm:b.max_length_skew}
})
const report={base:{path:basePath,sha256:hash(basePath)},donor:{path:donorPath,sha256:hash(donorPath)},selection:names,counts,portErrors:g.portErrors,errors:g.errors,groups,passed:g.portErrors===0,allUnselectedRecordsPreserved:true,planningOnly:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false}
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({...report,errors:undefined}))
process.exitCode=g.portErrors?1:0
