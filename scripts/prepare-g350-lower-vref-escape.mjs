// Test one owned VREF barrel moved outward from the lower RAM bank.
// This opens an inner-layer reference exit without changing DDR fanouts.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,root,xText='0']=process.argv.slice(2);assert(input&&root&&!fs.existsSync(root));const escapeX=Number(xText);assert([0,-.8].includes(escapeX))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),sha=hash(input)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),c=structuredClone(base)
const port=base.find(e=>e.type==='pcb_port'&&e.pcb_port_id==='pcb_port_331');assert(port&&Math.abs(port.x+.4)<1e-8&&Math.abs(port.y-2.8)<1e-8)
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const source=base.find(e=>e.type==='source_trace'&&e.name==='U_SOC_DDR_VREF_J4');assert(source&&find(source.source_trace_id)===find(port.source_port_id))
const trace=c.find(e=>e.type==='pcb_trace'&&e.route[0]?.start_pcb_port_id===port.pcb_port_id);assert(trace&&trace.route.length===4)
const owned=c.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===trace.pcb_trace_id);assert.equal(owned.length,1)
const via=owned[0];assert(Math.abs(via.x)<1e-8&&Math.abs(via.y-3.2)<1e-8);assert.equal(via.outer_diameter,.4572);assert.equal(via.hole_diameter,.254);assert.deepEqual(via.layers,['top','inner1','inner2','bottom'])
via.x=escapeX;via.y=2.4;for(const p of trace.route.slice(1)){assert(Math.abs(p.x)<1e-8&&Math.abs(p.y-3.2)<1e-8);p.x=escapeX;p.y=2.4}
const untouched=e=>!(e.type==='pcb_trace'&&e.pcb_trace_id===trace.pcb_trace_id)&&!(e.type==='pcb_via'&&e.pcb_via_id===via.pcb_via_id)
assert.deepEqual(c.filter(untouched),base.filter(untouched));assert.deepEqual(trace.route[0],base.find(e=>e.type==='pcb_trace'&&e.pcb_trace_id===trace.pcb_trace_id).route[0])
const details=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](structuredClone(c))]));details.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e))
const counts=Object.fromEntries(Object.entries(details).map(([k,v])=>[k,v.length])),passed=Object.values(counts).every(v=>v===0)
assert.equal(hash(input),sha);fs.mkdirSync(root);fs.copyFileSync('scripts/prepare-g350-lower-vref-escape.mjs',root+'/helper.executed.mjs')
fs.writeFileSync(root+'/reference-planning.circuit.json',JSON.stringify(c,null,2)+'\n');fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:sha},movedOnlyOneOwnedVrefBarrel:true,pcbViaId:via.pcb_via_id,from:{x:0,y:3.2},to:{x:escapeX,y:2.4},counts,details,physicalPassed:passed,allDdrFanoutsAndSupplyGroundPathsExactlyPreserved:true,missingReferenceBranchesAndWholeBoardSourceTimingCadUnqualified:true,fabricationReady:false},null,2)+'\n');process.exitCode=passed?0:2
