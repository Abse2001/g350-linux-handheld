import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {fanoutTracePath} from '@tscircuit/props'

const resultPath='dist/g350-byte0-center-strobes-native/solver-result.json'
const circuitPath='dist/g350-dqs0-center-approach/compiled.circuit.json'
const result=JSON.parse(readFileSync(resultPath,'utf8')),circuit=JSON.parse(readFileSync(circuitPath,'utf8'))
assert.equal(result.escapes.length,18)
const paths=[],normalized=[],records=[]
for(const trace of result.escapes){
 const source=circuit.find(e=>e.type==='source_trace'&&e.source_trace_id===trace.source_trace_id)
 assert(source&&/^DDR_D[0-7]$|^DDR_DQM0$/.test(source.name))
 const first=trace.route[0],last=trace.route.at(-1)
 const terminals=source.connected_source_port_ids.map(id=>circuit.find(e=>e.type==='source_port'&&e.source_port_id===id))
 const port=terminals.find(p=>{const physical=circuit.find(e=>e.type==='pcb_port'&&e.source_port_id===p.source_port_id);return Math.hypot(physical.x-first.x,physical.y-first.y)<1e-8})
 assert(port)
 const pcbPort=circuit.find(e=>e.type==='pcb_port'&&e.source_port_id===port.source_port_id)
 const component=circuit.find(e=>e.type==='source_component'&&e.source_component_id===port.source_component_id)
 assert(['U_SOC','U_RAM'].includes(component.name))
 const vias=trace.route.filter(p=>p.route_type==='via')
 assert.equal(vias.length,1)
 assert.equal(vias[0].from_layer,'top');assert.equal(vias[0].to_layer,'bottom')
 assert.equal(vias[0].via_diameter,.4572);assert.equal(vias[0].via_hole_diameter,.254)
 assert.equal(last.layer,'bottom')
 assert(Math.hypot(last.x-vias[0].x,last.y-vias[0].y)<1e-8)
 const connection=`${component.name}.pin${port.pin_number}`
 paths.push(fanoutTracePath.parse({connection,route:trace.route}))
 normalized.push({...trace,connectsTo:[pcbPort.pcb_port_id]})
 records.push({signal:source.name,package:component.name,pin:port.pin_number,ball:port.name,via:{x:vias[0].x,y:vias[0].y}})
}
assert.equal(new Set(paths.map(p=>p.connection)).size,18)
assert.equal(records.filter(r=>r.package==='U_SOC').length,9)
assert.equal(records.filter(r=>r.package==='U_RAM').length,9)
const cache='lib/am3352/placement/ddr-byte0-native-escapes.json'
const raw='checks/integrated/g350-ddr-bootstrap/byte0-native-escapes.traces.json'
writeFileSync(cache,JSON.stringify(paths,null,2)+'\n')
writeFileSync(raw,JSON.stringify(normalized,null,2)+'\n')
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const report={status:'NATIVE_PACKAGE_ESCAPE_BOOTSTRAP_REQUIRES_ACTUAL_SOURCE_CHECKS',
 completedPackageEscapeAssignment:18,processorEscapes:9,ramEscapes:9,
 completeNineSignalBusSolved:false,nativeWireAndViaCoordinatesRetained:true,
 source:artifact(resultPath),circuit:artifact(circuitPath),paths:artifact(cache),normalizedNativeTraces:artifact(raw),records,
 fabricationReady:false,qualifiedNewDdrSignals:0,
 scope:'The native pipeline completed its package escape assignment before its lane search budget expired. Only those 18 escape geometries are cached as a bootstrap; full routes are not represented as solved.'}
writeFileSync('checks/integrated/g350-ddr-bootstrap/byte0-native-escapes-cache.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,processorEscapes:9,ramEscapes:9}))
