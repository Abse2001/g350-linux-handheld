import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {fanoutTracePath} from '@tscircuit/props'

const read=p=>JSON.parse(readFileSync(p,'utf8'))
const checkpoint='dist/g350-byte0-native-lanes-from-escapes/partial-carrier-snapshots.json'
const escapePath='checks/integrated/g350-ddr-bootstrap/byte0-native-escapes.traces.json'
const sourcePath='dist/g350-dqs0-center-approach/compiled.circuit.json'
const snapshots=read(checkpoint),escapes=read(escapePath),source=read(sourcePath)
// Use one internally consistent native search snapshot, never the union of
// routes from different search attempts. This is not a completed nine-lane solve.
const carriers=snapshots.find(s=>s.length===7)
assert(carriers&&new Set(carriers.map(t=>t.source_trace_id)).size===7)
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
const reverse=route=>route.slice().reverse().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:{...p})
const paths=carriers.map(t=>{
 const endpoints=escapes.filter(e=>e.source_trace_id===t.source_trace_id)
 assert.equal(endpoints.length,2)
 const cpu=endpoints.find(e=>e.route[0].y>10),ram=endpoints.find(e=>e.route[0].y<10)
 assert(cpu&&ram&&near(cpu.route.at(-1),t.route[0])&&near(ram.route.at(-1),t.route.at(-1)))
 const port=source.find(e=>e.type==='pcb_port'&&e.pcb_port_id===cpu.connectsTo[0])
 const logical=source.find(e=>e.type==='source_port'&&e.source_port_id===port.source_port_id)
 const component=source.find(e=>e.type==='source_component'&&e.source_component_id===logical.source_component_id)
 assert.equal(component.name,'U_SOC')
 const route=[...cpu.route,...t.route.slice(1),...reverse(ram.route).slice(1)]
 assert.equal(route.filter(p=>p.route_type==='via').length,2)
 return fanoutTracePath.parse({connection:`U_SOC.pin${logical.pin_number}`,route})
})
const out='lib/am3352/placement/ddr-byte0-seven-native-paths.json'
writeFileSync(out,JSON.stringify(paths,null,2)+'\n')
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const report={status:'SEVEN_NATIVE_LANES_REQUIRE_ACTUAL_SOURCE_REPLAY',completeNineSignalSolverResult:false,
 singleNativeSnapshotUsed:true,nativeCarrierGeometryUnmodified:true,nativeEscapesUnmodified:true,
 completePaths:7,sourceTraceIds:carriers.map(t=>t.source_trace_id),
 signals:carriers.map(t=>source.find(e=>e.type==='source_trace'&&e.source_trace_id===t.source_trace_id).name),
 source:artifact(sourcePath),checkpoint:artifact(checkpoint),escapes:artifact(escapePath),paths:artifact(out),
 qualifiedNewDdrSignals:0,fabricationReady:false}
writeFileSync('checks/integrated/g350-ddr-bootstrap/byte0-seven-native-cache.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,signals:report.signals}))
