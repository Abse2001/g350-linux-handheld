import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
import {ddrRouteLength} from './lib/g350-ddr-trace-tuning.mjs'

const [input,output,placementReference]=process.argv.slice(2)
assert(input&&output&&placementReference&&!fs.existsSync(output),'Supply source, fresh report, and checked placement reference')
const read=p=>JSON.parse(fs.readFileSync(p))
const artifact=path=>({path,sha256:createHash('sha256').update(fs.readFileSync(path)).digest('hex')})
const circuit=read(input),reference=read(placementReference)
const pcbComponents=c=>c.filter(r=>r.type==='pcb_component')
assert.equal(pcbComponents(circuit).length,280)
assert.deepEqual(pcbComponents(circuit),pcbComponents(reference),'Preserve all checked component placements')
const sourcePorts=new Map(circuit.filter(r=>r.type==='source_port').map(r=>[r.source_port_id,r]))
const componentNames=new Map(circuit.filter(r=>r.type==='source_component').map(r=>[r.source_component_id,r.name]))
const pcbPorts=new Map(circuit.filter(r=>r.type==='pcb_port').map(r=>[r.source_port_id,r]))
const definitions=read('lib/am3352/memory-byte1-top-centered-swizzled-connections.json')
assert.equal(definitions.length,49)
const rows=definitions.map(d=>{
 const source=circuit.filter(r=>r.type==='source_trace'&&r.name===d.name)
 assert.equal(source.length,1)
 const trace=circuit.filter(r=>r.type==='pcb_trace'&&r.source_trace_id===source[0].source_trace_id)
 assert.equal(trace.length,1,`${d.name}: require one complete source-bound path`)
 const t=trace[0],logical=source[0].connected_source_port_ids.map(id=>sourcePorts.get(id))
 assert.equal(logical.length,2)
 for(const [name,pin,point]of [['U_SOC',d.socPin,t.route[0]],['U_RAM',d.ramPin,t.route.at(-1)]]){
  const port=logical.find(p=>componentNames.get(p.source_component_id)===name)
  assert(port&&`pin${port.pin_number}`===pin,`${d.name}: numeric ${name} mapping`)
  const physical=pcbPorts.get(port.source_port_id)
  assert(point.route_type==='wire'&&point.layer==='top'&&Math.hypot(point.x-physical.x,point.y-physical.y)<1e-8,`${d.name}: actual pad contact`)
 }
 for(const p of t.route){
  assert(['wire','via'].includes(p.route_type))
  if(p.route_type==='wire')assert(['top','inner1','inner2','bottom'].includes(p.layer)&&Math.abs(p.width-.1016)<1e-8)
 }
 const vias=t.route.filter(p=>p.route_type==='via'),physicalVias=circuit.filter(r=>r.type==='pcb_via'&&r.pcb_trace_id===t.pcb_trace_id)
 assert.equal(vias.length,physicalVias.length)
 for(const v of vias){
  const physical=physicalVias.filter(p=>Math.hypot(v.x-p.x,v.y-p.y)<1e-8)
  assert.equal(physical.length,1)
  const p=physical[0]
  assert(Math.abs(p.outer_diameter-.4572)<1e-8&&Math.abs(p.hole_diameter-.254)<1e-8)
  assert.deepEqual(new Set(p.layers),new Set(['top','inner1','inner2','bottom']))
  // Core records logical entry/exit separately from the four-layer barrel.
  assert(p.layers.includes(p.from_layer)&&p.layers.includes(p.to_layer))
 }
 return {name:d.name,nativeLengthMm:ddrRouteLength(t.route),standardThroughVias:vias.length}
})
const groups=[
 {name:'DDR_BYTE0',members:rows.filter(r=>/^DDR_D(?:[0-7]|QM0|QS0|QSn0)$/.test(r.name)),limitMm:.635},
 {name:'DDR_BYTE1',members:rows.filter(r=>/^DDR_D(?:8|9|1[0-5]|QM1|QS1|QSn1)$/.test(r.name)),limitMm:.635},
 {name:'DDR_COMMAND_CLOCK',members:rows.filter(r=>!/^DDR_D/.test(r.name)&&r.name!=='DDR_RESETn'),limitMm:.635},
 ...[['DDR_DQS0_PAIR','DDR_DQS0','DDR_DQSn0'],['DDR_DQS1_PAIR','DDR_DQS1','DDR_DQSn1'],['DDR_CK_PAIR','DDR_CK','DDR_CKn']].map(([name,...names])=>({name,members:rows.filter(r=>names.includes(r.name)),limitMm:.127})),
].map(g=>({...g,skewMm:Math.max(...g.members.map(r=>r.nativeLengthMm))-Math.min(...g.members.map(r=>r.nativeLengthMm))}))
assert.deepEqual(groups.map(g=>g.members.length),[11,11,26,2,2,2])
const sourceBuses=circuit.filter(r=>r.type==='source_bus')
for(const g of groups){
 const bus=sourceBuses.find(r=>r.name===g.name);assert(bus,`Preserve ${g.name} source bus`)
 assert.equal(bus.max_length_skew,g.limitMm)
 assert.equal(bus.source_trace_ids.length,g.members.length)
}
const physical=Object.fromEntries(g350DdrPhysicalChecks.map(n=>[n,checks[n](circuit)]))
const strict=checkG350ViaTrackManufacturingClearance(circuit),skew=checks.checkPcbBusLengthSkew(circuit)
const failures=Object.values(physical).flat().length+strict.length+skew.length+groups.filter(g=>g.skewMm>g.limitMm+1e-8).length
const errorCounts={}
for(const r of circuit.filter(r=>r.type.includes('error')))errorCounts[r.type]=(errorCounts[r.type]??0)+1
const report={status:failures?'DDR_NATIVE_QUALIFICATION_FAILED':'DDR_NATIVE_49_LENGTH_AND_PHYSICAL_PASS',source:artifact(input),placementReference:artifact(placementReference),components:280,numericEndpointPairs:49,componentPlacementPreserved:true,groups,physicalChecks:physical,manufacturingViaTrackErrors:strict,nativeSkewErrors:skew,sourceErrorCounts:errorCounts,rows,fullDepthViaThicknessMm:1.6,standardThroughVias:rows.reduce((s,r)=>s+r.standardThroughVias,0),independentKicadAndGerberChecksRequired:true,filledReferencesQualified:false,fullElectricalTimingQualified:false,fabricationReady:false}
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,groups:groups.map(({members,...g})=>g),nativeSkewErrors:skew.length,physicalErrors:Object.values(physical).flat().length,manufacturingViaTrackErrors:strict.length,fabricationReady:false}))
process.exitCode=failures?1:0
