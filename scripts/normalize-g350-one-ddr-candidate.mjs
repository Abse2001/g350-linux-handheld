// Target-only physical bypass removal. All foreign records remain exact.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {normalizeOneG350DdrRoute} from './lib/g350-one-ddr-route-normalizer.mjs'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,root,name]=process.argv.slice(2);assert(input&&root&&name&&!fs.existsSync(root));fs.mkdirSync(root)
const old=JSON.parse(fs.readFileSync(input)),c=structuredClone(old),s=c.find(e=>e.type==='source_trace'&&e.name===name);assert(s)
const t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===s.source_trace_id);assert(t)
const before=ddrRouteLength(t.route),oldVias=c.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id)
const edits=normalizeOneG350DdrRoute(t);delete t.trace_length
assert.deepEqual([t.route[0],t.route.at(-1)],[old.find(e=>e.type==='pcb_trace'&&e.pcb_trace_id===t.pcb_trace_id).route[0],old.find(e=>e.type==='pcb_trace'&&e.pcb_trace_id===t.pcb_trace_id).route.at(-1)])
const physical=c.filter(e=>!(e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id))
const barrelSites=t.route.filter(p=>p.route_type==='via')
for(const [i,v]of barrelSites.entries()){
 assert(v.from_layer!==v.to_layer)
 const known=oldVias.find(e=>Math.hypot(e.x-v.x,e.y-v.y)<1e-9)
 assert(known,'Normalization cannot introduce a new hole')
 physical.push(known)
}
assert.equal(new Set(barrelSites.map(v=>v.x+':'+v.y)).size,barrelSites.length)
const foreign=x=>x.filter(e=>!(e.type==='pcb_trace'&&e.pcb_trace_id===t.pcb_trace_id)&&!(e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id))
assert.deepEqual(foreign(physical),foreign(old))
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const e of physical.filter(e=>e.type==='source_trace'))for(const id of [...e.connected_source_port_ids,...e.connected_source_net_ids])parent.set(find(e.source_trace_id),find(id))
const counts=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkPcbRoutingConstraints','checkTracesAreContiguous','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](physical).length]))
counts.manufacturing=checkG350ViaTrackManufacturingClearance(physical.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(physical,null,2)+'\n')
for(const p of ['scripts/normalize-g350-one-ddr-candidate.mjs','scripts/lib/g350-one-ddr-route-normalizer.mjs'])fs.copyFileSync(p,root+'/'+p.replaceAll('/','__'))
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:createHash('sha256').update(fs.readFileSync(input)).digest('hex')},name,edits,beforeMm:before,afterMm:ddrRouteLength(t.route),removedUnusedOwnedHoles:oldVias.length-barrelSites.length,counts,allForeignRecordsExactlyPreserved:true,planningOnly:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({name,edits,beforeMm:before,afterMm:ddrRouteLength(t.route),counts}))
