// Isolate beneficial complete planar routes before the strict checked overlay.
// This writes a donor, not a qualified board; the overlay checks actual geometry.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
const [currentPath,baselinePath,donorPath,root]=process.argv.slice(2)
assert(currentPath&&baselinePath&&donorPath&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const read=p=>JSON.parse(fs.readFileSync(p)).filter(e=>!e.type.includes('error'))
const current=read(currentPath),baseline=read(baselinePath),donor=read(donorPath),out=structuredClone(baseline)
const strip=x=>Array.isArray(x)?x.map(strip):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).filter(([k])=>!['copper_pour_id','is_inside_copper_pour'].includes(k)).map(([k,v])=>[k,strip(v)])):x
const metadata=t=>Object.fromEntries(Object.entries(strip(t)).filter(([k])=>!['route','trace_length'].includes(k)))
const trace=(j,id)=>{const matches=j.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===id);assert.equal(matches.length,1);return matches[0]}
for(const type of ['source_trace','source_bus','source_port','source_net','source_component','pcb_board','pcb_port','pcb_smtpad','pcb_component','pcb_hole','pcb_plated_hole','pcb_via']){
 assert.deepEqual(current.filter(e=>e.type===type),baseline.filter(e=>e.type===type),type)
 assert.deepEqual(donor.filter(e=>e.type===type),baseline.filter(e=>e.type===type),type)
}
const selected=[]
for(const bus of current.filter(e=>e.type==='source_bus'&&['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(e.name))){
 const maximum=Math.max(...bus.source_trace_ids.map(id=>ddrRouteLength(trace(current,id).route)))
 for(const id of bus.source_trace_ids){
  const old=trace(current,id),next=trace(donor,id),base=trace(baseline,id),beforeMm=ddrRouteLength(old.route),afterMm=ddrRouteLength(next.route)
  if(afterMm<=beforeMm+.005||afterMm>maximum+1e-7)continue
  assert.deepEqual(metadata(next),metadata(old));assert.deepEqual(metadata(next),metadata(base))
  assert.deepEqual(strip([next.route[0],next.route.at(-1)]),strip([old.route[0],old.route.at(-1)]))
  assert.deepEqual(next.route.filter(p=>p.route_type==='via'),old.route.filter(p=>p.route_type==='via'))
  trace(out,id).route=strip(structuredClone(next.route));delete trace(out,id).trace_length
  selected.push({name:current.find(e=>e.type==='source_trace'&&e.source_trace_id===id).name,id,beforeMm,afterMm})
 }
}
assert(selected.length,'No beneficial routes found')
for(const pair of [['DDR_CK','DDR_CKn'],['DDR_DQS0','DDR_DQSn0'],['DDR_DQS1','DDR_DQSn1']])assert(!selected.some(s=>pair.includes(s.name))||pair.every(n=>selected.some(s=>s.name===n)),'Differential pairs must stay together')
const ids=new Set(selected.map(s=>s.id));assert.deepEqual(out.filter(e=>!(e.type==='pcb_trace'&&ids.has(e.source_trace_id))),baseline.filter(e=>!(e.type==='pcb_trace'&&ids.has(e.source_trace_id))))
fs.mkdirSync(root)
fs.copyFileSync('scripts/isolate-g350-ddr-progress-donor.mjs',root+'/isolate.executed.mjs')
fs.writeFileSync(root+'/unqualified-donor.circuit.json',JSON.stringify(out,null,2)+'\n')
fs.writeFileSync(root+'/selected-names.txt',selected.map(s=>s.name).join(',')+'\n')
fs.writeFileSync(root+'/report.json',JSON.stringify({inputs:[currentPath,baselinePath,donorPath].map(path=>({path,sha256:hash(path)})),selected,allForeignRecordsOriginalHolesAndEndpointsExactlyPreserved:true,requiresStrictOverlayFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify(selected))
