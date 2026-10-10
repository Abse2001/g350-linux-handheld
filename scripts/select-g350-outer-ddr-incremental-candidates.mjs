// Test individual outer proposals against the entire connected checked board.
// Nothing is promoted without fresh source, ground and independent qualification.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {createG350LocalGuard} from './lib/g350-ddr-local-guard.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,proposalRoot,root]=process.argv.slice(2);assert(input&&proposalRoot&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),sha=hash(input)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),proposed=JSON.parse(fs.readFileSync(proposalRoot+'/proposed-ddr-traces.json')),vias=JSON.parse(fs.readFileSync(proposalRoot+'/proposed-ddr-vias.json'))
fs.mkdirSync(root);fs.copyFileSync('scripts/select-g350-outer-ddr-incremental-candidates.mjs',root+'/helper.executed.mjs')
const attempts=[]
for(const next of proposed){
 const source=base.find(e=>e.type==='source_trace'&&e.source_trace_id===next.source_trace_id),old=base.find(e=>e.type==='pcb_trace'&&e.pcb_trace_id===next.pcb_trace_id)
 assert(source.name.startsWith('DDR_')&&old)
 if(source.name!=='DDR_RESETn')continue
 const retained=next.route.filter(p=>p.route_type==='via'),owned=base.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===old.pcb_trace_id)
 const keep=owned.filter(v=>retained.some(p=>Math.hypot(p.x-v.x,p.y-v.y)<1e-8))
 const c=structuredClone(base).filter(e=>!(e.type==='pcb_via'&&e.pcb_trace_id===old.pcb_trace_id))
 const target=c.find(e=>e.type==='pcb_trace'&&e.pcb_trace_id===old.pcb_trace_id);target.route=structuredClone(next.route);delete target.trace_length
 c.push(...structuredClone(keep),...structuredClone(vias.filter(v=>v.pcb_trace_id===old.pcb_trace_id)))
 const record={name:source.name,routeGuardPassed:createG350LocalGuard(c,target)(target.route)}
 const counts=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](c).length]));counts.manufacturing=checkG350ViaTrackManufacturingClearance(c).length
 record.counts=counts;record.physicalPassed=Object.values(counts).every(n=>n===0)
 fs.writeFileSync(root+'/'+(record.physicalPassed?'candidate':'rejected')+'-'+source.name+'.circuit.json',JSON.stringify(c,null,2)+'\n');attempts.push(record)
}
assert.equal(hash(input),sha)
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:sha},proposalRoot,attempts,allOtherConnectionsAndCopperExactlyPreserved:true,sourceGroundAndIndependentQualificationRequired:true,fabricationReady:false},null,2)+'\n');console.log(JSON.stringify(attempts));process.exitCode=attempts.some(a=>a.physicalPassed)?0:2
