// Merge independently planned, disjoint DDR route edits. Conflicts are errors.
// Full physical/fresh-ground checks remain mandatory; this does not promote source.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'
const [baselinePath,aPath,bPath,root,outerNamesText]=process.argv.slice(2)
assert(baselinePath&&aPath&&bPath&&root&&outerNamesText&&!fs.existsSync(root))
const permittedOuterNames=outerNamesText.split(',')
assert(permittedOuterNames.length&&new Set(permittedOuterNames).size===permittedOuterNames.length)
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const read=p=>JSON.parse(fs.readFileSync(p)).filter(e=>!e.type.includes('error'))
const baseline=read(baselinePath),a=read(aPath),b=read(bPath),c=structuredClone(baseline)
const ids=new Set(baseline.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>e.source_trace_id));assert.equal(ids.size,49)
assert(permittedOuterNames.every(name=>baseline.some(e=>e.type==='source_trace'&&e.name===name&&ids.has(e.source_trace_id))))
const foreign=j=>j.filter(e=>e.type!=='pcb_trace'||!ids.has(e.source_trace_id))
assert.deepEqual(foreign(a),foreign(baseline));assert.deepEqual(foreign(b),foreign(baseline))
const changed=[],strip=t=>Object.fromEntries(Object.entries(t).filter(([k])=>!['route','trace_length'].includes(k)))
for(const id of ids){
 const get=j=>{const matches=j.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===id);assert.equal(matches.length,1);return matches[0]}
 const original=get(baseline),ta=get(a),tb=get(b),target=get(c)
 for(const t of [ta,tb]){
  assert.deepEqual(strip(t),strip(original))
  assert.deepEqual(t.route.filter(p=>p.route_type==='via'),original.route.filter(p=>p.route_type==='via'))
  assert.deepEqual([t.route[0],t.route.at(-1)],[original.route[0],original.route.at(-1)])
  if(!permittedOuterNames.includes(baseline.find(e=>e.type==='source_trace'&&e.source_trace_id===id).name))assert.deepEqual(t.route.filter(p=>p.route_type==='wire'&&!p.layer.startsWith('inner')),original.route.filter(p=>p.route_type==='wire'&&!p.layer.startsWith('inner')))
 }
 const ac=JSON.stringify(ta.route)!==JSON.stringify(original.route),bc=JSON.stringify(tb.route)!==JSON.stringify(original.route)
 assert(!(ac&&bc)||JSON.stringify(ta.route)===JSON.stringify(tb.route),'Conflicting route edits for '+id+' must be resolved explicitly')
 if(ac||bc){target.route=structuredClone(ac?ta.route:tb.route);delete target.trace_length;changed.push({name:baseline.find(e=>e.type==='source_trace'&&e.source_trace_id===id).name,from:ac&&bc?'identical-both':ac?'a':'b'})}
}
const validator=createG350PlanarPlanningValidator(baseline),counts=validator.complete(c);assert(Object.values(counts).every(n=>n===0))
const groups=j=>j.filter(e=>e.type==='source_bus'&&e.name?.startsWith('DDR_')&&e.source_trace_ids.length>2).map(bus=>{const lengths=j.filter(e=>e.type==='pcb_trace'&&bus.source_trace_ids.includes(e.source_trace_id)).map(t=>ddrRouteLength(t.route));return {name:bus.name,skewMm:Math.max(...lengths)-Math.min(...lengths),limitMm:bus.max_length_skew}})
const merged=groups(c),previous=[groups(baseline),groups(a),groups(b)]
assert(merged.every((g,i)=>g.skewMm<=Math.min(...previous.map(p=>p[i].skewMm))+1e-7),'Merged buses must not regress either candidate')
const ground=await fillG350LockedGround(c);assert.equal(ground.portErrors,0,'Merged routing must retain every ground port')
fs.mkdirSync(root,{recursive:true});fs.copyFileSync('scripts/merge-g350-ddr-selected-layer-candidates.mjs',root+'/merge.executed.mjs')
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(ground.circuit,null,2)+'\n')
const inputs=[baselinePath,aPath,bPath].map(path=>({path,sha256:hash(path)}))
fs.writeFileSync(root+'/report.json',JSON.stringify({inputs,changed,counts,groundPortErrors:ground.portErrors,groups:merged,originalBarrelsEndpointsAndAllForeignRecordsExactlyPreserved:true,permittedOuterNames,outerWiresExactlyPreservedExceptExplicitlyNamedDdrSignals:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n');console.log(JSON.stringify({changed,groups:merged,groundPortErrors:0}))
