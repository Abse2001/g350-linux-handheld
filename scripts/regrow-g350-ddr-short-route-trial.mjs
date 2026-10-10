// Re-grow an alternate D9 planar carrier while preserving every original hole,
// endpoint and foreign record. Intermediate trial skew is not a promoted board.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {ddrRouteLength,tuneOneG350DdrTrace} from './lib/g350-full-board-length-tuning.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'
const [input,donorPath,root,secondsText='30',roundsText='12']=process.argv.slice(2)
const seconds=Number(secondsText),rounds=Number(roundsText)
assert(input&&donorPath&&root&&!fs.existsSync(root)&&seconds>0&&seconds<=60&&Number.isInteger(rounds)&&rounds>0&&rounds<=20)
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const inputHash=hash(input),donorHash=hash(donorPath),read=p=>JSON.parse(fs.readFileSync(p)).filter(e=>!e.type.includes('error'))
const baseline=read(input),donor=read(donorPath),c=structuredClone(baseline),source=baseline.find(e=>e.type==='source_trace'&&e.name==='DDR_D9')
assert(source)
const sid=source.source_trace_id,get=j=>{const a=j.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===sid);assert.equal(a.length,1);return a[0]},t=get(c),original=get(baseline),d=get(donor)
assert.deepEqual(d.route.filter(p=>p.route_type==='via'),original.route.filter(p=>p.route_type==='via'))
assert.deepEqual([d.route[0],d.route.at(-1)],[original.route[0],original.route.at(-1)])
const strip=v=>Array.isArray(v)?v.map(strip):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!['copper_pour_id','is_inside_copper_pour'].includes(k)).map(([k,x])=>[k,strip(x)])):v
const omit=t=>Object.fromEntries(Object.entries(strip(t)).filter(([k])=>!['route','trace_length'].includes(k)))
assert.deepEqual(omit(d),omit(original))
t.route=strip(structuredClone(d.route));delete t.trace_length
const groups=j=>j.filter(e=>e.type==='source_bus'&&e.name?.startsWith('DDR_')&&e.source_trace_ids.length>=2).map(b=>{const lengths=j.filter(e=>e.type==='pcb_trace'&&b.source_trace_ids.includes(e.source_trace_id)).map(e=>ddrRouteLength(e.route));return {name:b.name,skewMm:Math.max(...lengths)-Math.min(...lengths),limitMm:b.max_length_skew}})
const bus=baseline.find(e=>e.type==='source_bus'&&e.name==='DDR_BYTE1'),goalMm=Math.max(...baseline.filter(e=>e.type==='pcb_trace'&&bus.source_trace_ids.includes(e.source_trace_id)).map(e=>ddrRouteLength(e.route)))-.25
const validator=createG350PlanarPlanningValidator(baseline),complete=()=>{const counts=validator.complete(c);for(const n of ['checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'])counts[n]=checks[n](c).length;assert(Object.values(counts).every(n=>n===0));return counts}
complete()
fs.mkdirSync(root)
for(const p of ['scripts/regrow-g350-ddr-short-route-trial.mjs','scripts/lib/g350-full-board-length-tuning.mjs','scripts/lib/g350-ddr-planar-planning-validator.mjs','scripts/lib/g350-ddr-local-guard.mjs','scripts/lib/g350-ddr-physical-checks.mjs','scripts/lib/g350-locked-ground-fill.mjs','scripts/lib/g350-locked-ground-fill-worker.mjs'])fs.copyFileSync(p,root+'/'+p.replaceAll('/','__'))
const baselineGround=await fillG350LockedGround(c);assert.equal(baselineGround.portErrors,0)
const beforeGroups=groups(baseline),progress=[]
const persist=()=>{
 assert.equal(hash(input),inputHash);assert.equal(hash(donorPath),donorHash)
 assert.deepEqual(c.filter(e=>!(e.type==='pcb_trace'&&e.source_trace_id===sid)),baseline.filter(e=>!(e.type==='pcb_trace'&&e.source_trace_id===sid)))
 assert.deepEqual(t.route.filter(p=>p.route_type==='via'),original.route.filter(p=>p.route_type==='via'))
 assert.deepEqual([t.route[0],t.route.at(-1)],[original.route[0],original.route.at(-1)])
 const afterGroups=groups(c),retained=afterGroups.every((g,i)=>g.skewMm<=beforeGroups[i].skewMm+1e-7)&&Math.abs(ddrRouteLength(t.route)-goalMm)<1e-6
 fs.writeFileSync(root+'/'+(retained?'candidate':'unqualified-trial')+'.circuit.json',JSON.stringify(c,null,2)+'\n')
 fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:inputHash},donor:{path:donorPath,sha256:donorHash},signal:'DDR_D9',goalMm,afterMm:ddrRouteLength(t.route),progress,beforeGroups,groups:afterGroups,counts:complete(),allOriginalHolesEndpointsAndForeignRecordsExactlyPreserved:true,retained,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n');return retained
}
for(let round=1;round<=rounds&&ddrRouteLength(t.route)<goalMm-.005;round++){
 const oldRoute=structuredClone(t.route),beforeMm=ddrRouteLength(t.route);let accepted=false
 for(const step of [6,3,1.2,.6,.3,.1]){
  t.route=structuredClone(oldRoute)
  const result=tuneOneG350DdrTrace(c,t,Math.min(goalMm,beforeMm+step),seconds,{planningValidator:validator.validate,allowNewVias:false})
  if(!result.found||ddrRouteLength(t.route)<=beforeMm+.005)continue
  complete();const g=await fillG350LockedGround(c)
  const record={round,step,beforeMm,afterMm:ddrRouteLength(t.route),...result,groundPortErrors:g.portErrors,accepted:g.portErrors===0};progress.push(record);console.log(JSON.stringify(record))
  if(g.portErrors===0){accepted=true;fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n');break}
 }
 if(!accepted)t.route=oldRoute
 persist();if(!accepted)break
}
process.exitCode=persist()?0:1
