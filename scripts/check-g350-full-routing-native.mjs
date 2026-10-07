import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [path,referencePath,out]=process.argv.slice(2)
assert(path&&referencePath&&out&&!fs.existsSync(out))
const read=p=>JSON.parse(fs.readFileSync(p)),circuit=read(path),reference=read(referencePath)
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
for(const [type,key] of [['pcb_trace','pcb_trace_id'],['pcb_via','pcb_via_id']]){
 const ids=circuit.filter(e=>e.type===type).map(e=>e[key])
 assert.equal(new Set(ids).size,ids.length,'Duplicate '+key)
}
assert.deepEqual(circuit.filter(e=>e.type==='pcb_component'),reference.filter(e=>e.type==='pcb_component'))
const ddrIds=new Set(reference.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>e.source_trace_id))
assert.equal(ddrIds.size,49)
const referenceDdr=reference.filter(e=>e.type==='pcb_trace'&&ddrIds.has(e.source_trace_id))
const currentDdr=circuit.filter(e=>e.type==='pcb_trace'&&ddrIds.has(e.source_trace_id))
const ddrCopperExactlyPreserved=JSON.stringify(currentDdr)===JSON.stringify(referenceDdr)
if(process.env.G350_ALLOW_DDR_REPAIR!=='1')assert.deepEqual(currentDdr,referenceDdr)
else {
 assert.deepEqual(circuit.filter(e=>e.type==='source_trace'&&ddrIds.has(e.source_trace_id)),reference.filter(e=>e.type==='source_trace'&&ddrIds.has(e.source_trace_id)))
 assert.deepEqual(new Set(currentDdr.map(e=>e.source_trace_id)),ddrIds)
}
for(const via of circuit.filter(e=>e.type==='pcb_via')){
 assert(Math.abs(via.outer_diameter-.4572)<1e-8&&Math.abs(via.hole_diameter-.254)<1e-8)
 assert.deepEqual(new Set(via.layers),new Set(['top','inner1','inner2','bottom']))
}
const names=[...g350DdrPhysicalChecks,'checkPadPadClearance','checkEachPcbPortConnectedToPcbTraces','checkSourceTracesHavePcbTraces','checkSourceTracesMatchPcbTraceThickness','checkTracesAreContiguous','checkDanglingTraces','checkPcbBusLengthSkew','checkPcbRoutingConstraints','checkPcbTraceLengths','checkPcbTraceViaCounts','checkPcbTracesOutOfBoard','checkPcbCopperOverKeepout','checkPcbComponentOverlap','checkPcbComponentsOutOfBoard']
const results={}
for(const name of names){
 const start=performance.now();results[name]=checks[name](circuit)
 console.log(JSON.stringify({check:name,errors:results[name].length,seconds:(performance.now()-start)/1000}))
 fs.writeFileSync(out+'.partial',JSON.stringify(results,null,2)+'\n')
}
// Full-board nets have multiple source_trace branches. Normalize using only
// logical port/net membership, never copper connectivity (which could hide shorts).
const parent=new Map()
const find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
const union=(a,b)=>parent.set(find(a),find(b))
const source=circuit.filter(e=>e.type==='source_trace')
for(const st of source){const members=[...st.connected_source_port_ids,...st.connected_source_net_ids];for(const member of members)union(st.source_trace_id,member)}
const normalized=circuit.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)
results.checkG350ViaTrackManufacturingClearance=checkG350ViaTrackManufacturingClearance(normalized)
const errors=Object.values(results).flat().length
const report={status:errors?'FULL_BOARD_ROUTING_CHECKS_FAILED':'FULL_BOARD_NATIVE_ROUTING_CHECKS_PASS',sourceSha256:hash(path),referenceSha256:hash(referencePath),checksSha256:hash('node_modules/@tscircuit/checks/dist/index.js'),ddrCopperExactlyPreserved,componentPlacementsExactlyPreserved:true,errors,counts:Object.fromEntries(Object.entries(results).map(([n,e])=>[n,e.length])),results,fabricationReady:false}
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n')
fs.unlinkSync(out+'.partial')
console.log(JSON.stringify({...report,results:undefined}))
process.exitCode=errors?1:0
