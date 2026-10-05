import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Verify this diagnostic against real pads and the reviewed pin/ball map.
// This is source preservation evidence, not completed DDR qualification.
const [inputPath,sourcePath,reportPath]=process.argv.slice(2)
assert(inputPath&&sourcePath&&reportPath)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const input=read(inputPath),source=read(sourcePath)
const priorPath='dist/diagnostics/am3352-ddr-usbc-d12-spacing-repaired-candidate/circuit.json',prior=read(priorPath)
const mapPath='lib/am3352/memory-byte1-top-centered-swizzled-connections.json',mapping=read(mapPath)
const pathsPath='routing/am3352-ddr23-command-replan-fixed-paths.json',paths=read(pathsPath)
const priorPathsPath='routing/am3352-ddr-usbc-d12-spacing-repaired-paths.json',priorPaths=read(priorPathsPath)
const type=(json,t)=>json.filter(e=>e.type===t)
assert.equal(type(source,'source_component').length,212)
assert.equal(type(source,'pcb_component').length,293)
assert.equal(type(source,'pcb_smtpad').length,912)
assert.equal(type(source,'pcb_trace').length,125)
assert.equal(type(source,'pcb_via').length,141)
for(const t of ['pcb_component','pcb_port','pcb_smtpad','pcb_plated_hole','pcb_keepout'])assert.deepEqual(type(source,t),type(prior,t),`Changed physical ${t}`)
for(const c of type(prior,'source_component')){
 const n=type(source,'source_component').find(e=>e.source_component_id===c.source_component_id)
 assert(n);assert.equal(n.name,c.name);assert.equal(n.manufacturer_part_number,c.manufacturer_part_number)
}
for(const t of type(prior,'source_trace')){
 const n=type(source,'source_trace').find(e=>e.source_trace_id===t.source_trace_id)
 assert(n);assert.equal(n.name,t.name);assert.deepEqual(n.connected_source_port_ids,t.connected_source_port_ids)
}
assert.equal(Object.keys(paths).length,23)
for(const [name,path] of Object.entries(paths)){assert(/^DDR_(D\d+|DQM[01]|DQSn?[01]|RESETn)$/.test(name));assert.deepEqual(path,priorPaths[name])}
const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
assert.equal(input.traces.length,125)
for(const t of type(source,'pcb_trace')){
 const converted=input.traces.find(n=>n.pcb_trace_id===t.pcb_trace_id)
 assert(converted);assert.equal(converted.source_trace_id,t.source_trace_id);assert.deepEqual(geometry(converted.route),geometry(t.route))
 const old=type(prior,'pcb_trace').find(n=>n.source_trace_id===t.source_trace_id&&JSON.stringify(geometry(n.route))===JSON.stringify(geometry(t.route)))
 assert(old,'A retained host/data/reference/USB trace changed')
}
for(const p of type(source,'pcb_smtpad')){
 const o=input.obstacles.find(o=>o.circuitJsonMetadata?.pcb_smtpad_id===p.pcb_smtpad_id);assert(o)
 const x=p.shape==='polygon'?(Math.min(...p.points.map(p=>p.x))+Math.max(...p.points.map(p=>p.x)))/2:p.x
 const y=p.shape==='polygon'?(Math.min(...p.points.map(p=>p.y))+Math.max(...p.points.map(p=>p.y)))/2:p.y
 assert(Math.hypot(o.center.x-x,o.center.y-y)<1e-8);assert.deepEqual(o.layers,[p.layer])
}
for(const v of type(source,'pcb_via')){
 const obstacle=input.obstacles.find(o=>o.circuitJsonMetadata?.pcb_via_id===v.pcb_via_id)
 if(obstacle){assert.equal(obstacle.center.x,v.x);assert.equal(obstacle.center.y,v.y);assert.equal(obstacle.width,v.outer_diameter)}
 else assert(input.traces.flatMap(t=>t.route).some(p=>p.route_type==='via'&&Math.hypot(p.x-v.x,p.y-v.y)<1e-8))
 assert(type(prior,'pcb_via').some(p=>Math.hypot(p.x-v.x,p.y-v.y)<1e-8&&p.outer_diameter===v.outer_diameter&&p.hole_diameter===v.hole_diameter))
}
const expected=mapping.filter(m=>!Object.hasOwn(paths,m.name));assert.equal(expected.length,26);assert.equal(input.connections.length,26)
for(const m of expected){
 const t=type(source,'source_trace').find(t=>t.name===m.name),c=input.connections.find(c=>c.source_trace_id===t.source_trace_id)
 assert(c);assert.equal(c.width,.1016);assert.equal(c.pointsToConnect.length,2)
 for(const [k,name,pin,ball] of [[0,'U_SOC',m.socPin,m.socBall],[1,'U_RAM',m.ramPin,m.ramBall]]){
  const component=type(source,'source_component').find(c=>c.name===name)
  const port=type(source,'source_port').find(p=>p.source_component_id===component.source_component_id&&p.pin_number===Number(pin.slice(3)))
  assert.equal(port.name,ball);assert(t.connected_source_port_ids.includes(port.source_port_id))
  const physical=type(source,'pcb_port').find(p=>p.source_port_id===port.source_port_id),point=c.pointsToConnect[k]
  assert.equal(point.pcb_port_id,physical.pcb_port_id);assert.equal(point.x,physical.x);assert.equal(point.y,physical.y);assert(physical.layers.includes(point.layer))
 }
}
assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false)
assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254);assert.equal(input.minTraceToHoleEdgeClearance,.2);assert.equal(input.minViaHoleEdgeToViaHoleEdgeClearance,.254)
assert.equal(input.buses.length,1);assert.equal(input.buses[0].maxLengthSkew,.635);assert.deepEqual(input.buses[0].allowedLayers,['top','bottom'])
assert.equal(new Set(input.buses[0].connectionNames).size,26)
assert.deepEqual(input.buses[0].connectionNames.toSorted(),input.connections.map(c=>c.name).toSorted())
assert.equal(input.differentialPairs.length,1);assert.equal(input.differentialPairs[0].lengthTolerance,.127);assert.equal(input.differentialPairs[0].traceGap,.12)
assert.deepEqual(input.differentialPairs[0].connectionNames,['DDR_CK','DDR_CKn'].map(name=>type(source,'source_trace').find(t=>t.name===name).source_trace_id))
const report={status:'COMMAND_REPLAN_INPUT_REAL_PAD_AND_FIXED_COPPER_PRESERVATION_PASS',input:artifact(inputPath),source:artifact(sourcePath),priorSource:artifact(priorPath),memoryMap:artifact(mapPath),retainedPaths:artifact(pathsPath),priorPaths:artifact(priorPathsPath),components:212,physicalPads:912,fixedTraces:125,fixedVias:141,retainedDataAndResetPathsExact:23,removedCommandClockRoutes:10,commandClockConnections:26,actualNumericPadEndpoints:52,clockPairConstraintRetained:true,busConnectionOrder:input.buses[0].connectionNames,connectionInputOrder:input.connections.map(c=>c.name),referenceLayersReserved:['inner1','inner2'],qualifiedNewDdrSignals:0,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n')
console.log('Verified 26 commands, 52 real numeric pads, 125 exact traces and 141 fixed vias')
