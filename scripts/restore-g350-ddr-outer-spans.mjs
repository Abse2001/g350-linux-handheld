// Recover the checked outer-layer paths while retaining inner-layer tuning.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,reference,root]=process.argv.slice(2);assert(input&&reference&&root&&!fs.existsSync(root));fs.mkdirSync(root)
const read=p=>JSON.parse(fs.readFileSync(p)),hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const c=read(input).filter(e=>!e.type.includes('error')),baseline=read(reference),original=structuredClone(c)
const names=new Map(c.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>[e.source_trace_id,e.name])),rows=[]
const selectedNames=process.env.G350_RESTORE_OUTER_NAMES?.split(',')??null
const selectedLayers=process.env.G350_RESTORE_OUTER_LAYERS?.split(',')??['top','bottom']
assert(selectedNames===null||selectedNames.every(n=>[...names.values()].includes(n)))
assert(selectedLayers.length&&selectedLayers.every(l=>['top','bottom'].includes(l)))
const split=route=>{const spans=[],vias=[];let span=[];for(const p of route){if(p.route_type==='via'){spans.push(span);span=[];vias.push(p)}else span.push(p)}spans.push(span);return {spans,vias}}
for(const t of c.filter(e=>e.type==='pcb_trace'&&names.has(e.source_trace_id))){
 if(selectedNames&&!selectedNames.includes(names.get(t.source_trace_id)))continue
 const old=baseline.find(e=>e.type==='pcb_trace'&&e.source_trace_id===t.source_trace_id);assert(old)
 const a=split(t.route),b=split(old.route);assert.deepEqual(a.vias,b.vias);assert.equal(a.spans.length,b.spans.length)
 const before=ddrRouteLength(t.route),restored=[];const joined=[]
 for(let i=0;i<a.spans.length;i++){
  const s=a.spans[i],ref=b.spans[i];assert(s.length&&ref.length&&s.every(p=>p.layer===s[0].layer)&&ref.every(p=>p.layer===s[0].layer))
  assert.deepEqual(s[0],ref[0]);assert.deepEqual(s.at(-1),ref.at(-1))
  const outer=selectedLayers.includes(s[0].layer)&&(selectedNames===null||selectedNames.includes(names.get(t.source_trace_id)))
  if(outer&&JSON.stringify(s)!==JSON.stringify(ref))restored.push({span:i,layer:s[0].layer})
  joined.push(...structuredClone(outer?ref:s));if(i<a.vias.length)joined.push(structuredClone(a.vias[i]))
 }
 t.route=joined;delete t.trace_length
 rows.push({name:names.get(t.source_trace_id),beforeMm:before,afterMm:ddrRouteLength(joined),baselineMm:ddrRouteLength(old.route),restored})
}
for(let i=0;i<c.length;i++)if(c[i].type!=='pcb_trace'||!names.has(c[i].source_trace_id))assert.deepEqual(c[i],original[i])
if(selectedNames)assert.deepEqual(c.filter(e=>e.type==='pcb_trace'&&names.has(e.source_trace_id)&&!selectedNames.includes(names.get(e.source_trace_id))),original.filter(e=>e.type==='pcb_trace'&&names.has(e.source_trace_id)&&!selectedNames.includes(names.get(e.source_trace_id))))
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of c.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const counts=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbBusLengthSkew'].map(n=>[n,checks[n](c).length]))
counts.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n');fs.copyFileSync('scripts/restore-g350-ddr-outer-spans.mjs',root+'/restore.executed.mjs')
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:hash(input)},reference:{path:reference,sha256:hash(reference)},selectedNames,selectedLayers,candidateSha256:hash(root+'/candidate.circuit.json'),rows,counts,allNonDdrCopperAndHolesPreserved:true,planningOnly:true,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({counts,retainedInnerLengthGrowthMm:rows.reduce((n,r)=>n+r.afterMm-r.baselineMm,0),restoredOuterSpans:rows.flatMap(r=>r.restored).length}))
assert(Object.entries(counts).every(([n,v])=>n==='checkPcbBusLengthSkew'||v===0))
