// Remove copper bypasses from a rejected outer-layer planning artifact.
// The real shortened path, unchanged native checks and foreign scope gate
// every result; this does not restore missing power/ground or qualify a board.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {normalizeOneG350DdrRoute} from './lib/g350-one-ddr-route-normalizer.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
const [input,root]=process.argv.slice(2);assert(input&&root&&!fs.existsSync(root))
const canonicalCoordinates=process.env.G350_DDR_CANONICAL_COORDINATES??'0';assert(['0','1'].includes(canonicalCoordinates))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),sha=hash(input)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const ddr=new Map(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>[e.source_trace_id,e.name]));assert.equal(ddr.size,49)
const traces=base.filter(e=>e.type==='pcb_trace'&&ddr.has(e.source_trace_id));assert(traces.length>0&&traces.length<=49);assert.equal(new Set(traces.map(t=>t.source_trace_id)).size,traces.length)
const ids=new Set(traces.map(t=>t.pcb_trace_id)),outside=e=>!(['pcb_trace','pcb_via'].includes(e.type)&&ids.has(e.pcb_trace_id))
const output=structuredClone(base.filter(outside)),changes=[];let maximumCoordinateChangeMm=0
for(const old of traces){
 const t=structuredClone(old),before=ddrRouteLength(t.route),first=structuredClone(t.route[0]),last=structuredClone(t.route.at(-1))
 // Grid arithmetic can leave almost-collinear micro-segments with noisy
 // coordinates. Canonicalize authored interior coordinates to 1e-9 mm;
 // real checker code/limits remain unchanged and endpoints remain exact.
 if(canonicalCoordinates==='1')for(const p of t.route.slice(1,-1))for(const key of ['x','y']){const v=Math.round(p[key]*1e9)/1e9;maximumCoordinateChangeMm=Math.max(maximumCoordinateChangeMm,Math.abs(v-p[key]));p[key]=v}
 const edits=normalizeOneG350DdrRoute(t)
 assert.deepEqual(t.route[0],first);assert.deepEqual(t.route.at(-1),last)
 assert(t.route.every(p=>p.route_type==='wire'?['top','bottom'].includes(p.layer):p.route_type==='via'&&['top','bottom'].includes(p.from_layer)&&['top','bottom'].includes(p.to_layer)&&p.from_layer!==p.to_layer))
 delete t.trace_length;output.push(t)
 for(const [i,v]of t.route.filter(p=>p.route_type==='via').entries())output.push({type:'pcb_via',pcb_via_id:`g350_normalized_outer_${t.pcb_trace_id}_${i}`,pcb_trace_id:t.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:t.subcircuit_id})
 changes.push({name:ddr.get(t.source_trace_id),edits,beforeLengthMm:before,afterLengthMm:ddrRouteLength(t.route)})
}
assert.deepEqual(output.filter(outside),base.filter(outside));assert.equal(hash(input),sha)
fs.mkdirSync(root);fs.copyFileSync('scripts/normalize-g350-outer-ddr-planning.mjs',root+'/helper.executed.mjs');fs.copyFileSync('scripts/lib/g350-one-ddr-route-normalizer.mjs',root+'/normalizer.executed.mjs')
fs.writeFileSync(root+'/planning.circuit.json',JSON.stringify(output,null,2)+'\n')
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const c=structuredClone(output),details=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](c)]));details.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e))
const counts=Object.fromEntries(Object.entries(details).map(([k,v])=>[k,v.length])),physicalPassed=Object.values(counts).every(v=>v===0)
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:sha},canonicalCoordinates,maximumCoordinateChangeMm,changes,counts,details,physicalPassed,allForeignRecordsPreserved:true,physicalDdrCarriers:traces.length,missingDdrCarriers:49-traces.length,planningOnly:true,missingRamReferences:true,sourceMatchingGroundAndCadUnqualified:true,fabricationReady:false},null,2)+'\n');console.log(JSON.stringify({counts,physicalPassed}));process.exitCode=physicalPassed?0:2
