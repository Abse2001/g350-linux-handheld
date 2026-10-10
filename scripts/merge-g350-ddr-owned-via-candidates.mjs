// Merge disjoint DDR edits, with explicitly bounded owned-barrel coordinate changes.
// Every peripheral record and original hole identity/dimension remains exact.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'
const [basePath,aPath,bPath,root,ownedNamesText]=process.argv.slice(2)
assert(basePath&&aPath&&bPath&&root&&ownedNamesText&&!fs.existsSync(root))
const ownedNames=ownedNamesText.split(',');assert(ownedNames.length&&new Set(ownedNames).size===ownedNames.length&&ownedNames.every(n=>['DDR_A0','DDR_D12'].includes(n)))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const read=p=>JSON.parse(fs.readFileSync(p)).filter(e=>!e.type.includes('error')),base=read(basePath),a=read(aPath),b=read(bPath),c=structuredClone(base)
const names=new Map(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>[e.source_trace_id,e.name]));assert.equal(names.size,49)
const allowedTraceIds=new Set(base.filter(e=>e.type==='pcb_trace'&&ownedNames.includes(names.get(e.source_trace_id))).map(e=>e.pcb_trace_id))
const foreign=j=>j.filter(e=>!(e.type==='pcb_trace'&&names.has(e.source_trace_id))&&!(e.type==='pcb_via'&&allowedTraceIds.has(e.pcb_trace_id)))
assert.deepEqual(foreign(a),foreign(base));assert.deepEqual(foreign(b),foreign(base))
const without=(e,keys)=>Object.fromEntries(Object.entries(e).filter(([k])=>!keys.includes(k)))
for(const candidate of [a,b]){
 const bv=base.filter(e=>e.type==='pcb_via'),cv=candidate.filter(e=>e.type==='pcb_via');assert.equal(cv.length,bv.length)
 for(let i=0;i<bv.length;i++){
  if(allowedTraceIds.has(bv[i].pcb_trace_id)){assert.deepEqual(without(cv[i],['x','y']),without(bv[i],['x','y']));assert(Math.hypot(cv[i].x-bv[i].x,cv[i].y-bv[i].y)<=1.5+1e-7)}
  else assert.deepEqual(cv[i],bv[i])
 }
}
const changed=[]
for(const [id,name] of names){
 const get=j=>{const matches=j.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===id);assert.equal(matches.length,1);return matches[0]},original=get(base),ta=get(a),tb=get(b),target=get(c)
 for(const t of [ta,tb]){
  assert.deepEqual(without(t,['route','trace_length']),without(original,['route','trace_length']))
  assert.deepEqual([t.route[0],t.route.at(-1)],[original.route[0],original.route.at(-1)])
  const vias=t.route.filter(p=>p.route_type==='via'),old=original.route.filter(p=>p.route_type==='via');assert.equal(vias.length,old.length)
  for(let i=0;i<vias.length;i++){
   if(ownedNames.includes(name)){assert.deepEqual(without(vias[i],['x','y']),without(old[i],['x','y']));assert(Math.hypot(vias[i].x-old[i].x,vias[i].y-old[i].y)<=1.5+1e-7);if(i===0||i===vias.length-1)assert.deepEqual(vias[i],old[i])}
   else assert.deepEqual(vias[i],old[i])
  }
 }
 const ac=JSON.stringify(ta.route)!==JSON.stringify(original.route),bc=JSON.stringify(tb.route)!==JSON.stringify(original.route)
 assert(!(ac&&bc)||JSON.stringify(ta.route)===JSON.stringify(tb.route),'Conflicting DDR route edits: '+name)
 const selected=ac?a:bc?b:base
 if(ac||bc){target.route=structuredClone((ac?ta:tb).route);delete target.trace_length;changed.push({name,from:ac?'a':'b'})}
 if(allowedTraceIds.has(target.pcb_trace_id))for(const v of c.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===target.pcb_trace_id))Object.assign(v,selected.find(e=>e.type==='pcb_via'&&e.pcb_via_id===v.pcb_via_id))
}
// This complete validator sees the actual merged physical holes, after the
// original-record contracts above have independently constrained their changes.
const validator=createG350PlanarPlanningValidator(c),counts=validator.complete(c)
for(const n of ['checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'])counts[n]=checks[n](c).length
assert(Object.values(counts).every(n=>n===0))
const groups=j=>j.filter(e=>e.type==='source_bus'&&e.name?.startsWith('DDR_')&&e.source_trace_ids.length>2).map(bus=>{const lengths=j.filter(e=>e.type==='pcb_trace'&&bus.source_trace_ids.includes(e.source_trace_id)).map(t=>ddrRouteLength(t.route));return {name:bus.name,skewMm:Math.max(...lengths)-Math.min(...lengths),limitMm:bus.max_length_skew}})
const merged=groups(c),previous=[groups(base),groups(a),groups(b)];assert(merged.every((g,i)=>g.skewMm<=Math.min(...previous.map(p=>p[i].skewMm))+1e-7))
const ground=await fillG350LockedGround(c);assert.equal(ground.portErrors,0)
fs.mkdirSync(root);fs.copyFileSync('scripts/merge-g350-ddr-owned-via-candidates.mjs',root+'/merge.executed.mjs')
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n');fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(ground.circuit,null,2)+'\n')
fs.writeFileSync(root+'/report.json',JSON.stringify({inputs:[basePath,aPath,bPath].map(path=>({path,sha256:hash(path)})),ownedNames,changed,counts,groundPortErrors:0,groups:merged,originalHoleIdsDimensionsFullDepthForeignCopperAndEndpointPadsExactlyPreserved:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n');console.log(JSON.stringify({changed,groups:merged,groundPortErrors:0}))
