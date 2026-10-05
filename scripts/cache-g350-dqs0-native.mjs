import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {fanoutTracePath} from '@tscircuit/props'

const root='dist/g350-dqs0-native-bootstrap'
const read=p=>JSON.parse(readFileSync(p,'utf8'))
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const result=read(`${root}/result.json`),circuit=read(`${root}/compiled.circuit.json`)
assert.equal(result.selectedPhaseFinished,true)
assert.equal(result.sourceDefinitionsUnchanged,true)
const traces=read(`${root}/phase-1.output.traces.json`).filter(t=>t.pcb_trace_id?.startsWith('bus_lane_'))
assert.equal(traces.length,2)
const paths=[],records=[]
for(const trace of traces){
 const source=circuit.find(e=>e.type==='source_trace'&&e.source_trace_id===trace.connection_name)
 assert(source&&['DDR_DQS0','DDR_DQSn0'].includes(source.name))
 assert.equal(source.connected_source_port_ids.length,2)
 const first=trace.route[0],last=trace.route.at(-1)
 const ports=source.connected_source_port_ids.map(id=>circuit.find(e=>e.type==='source_port'&&e.source_port_id===id))
 const physical=ports.map(p=>circuit.find(e=>e.type==='pcb_port'&&e.source_port_id===p.source_port_id))
 const startIndex=physical.findIndex(p=>Math.hypot(p.x-first.x,p.y-first.y)<1e-8)
 assert(startIndex>=0)
 const endIndex=1-startIndex
 assert(Math.hypot(physical[endIndex].x-last.x,physical[endIndex].y-last.y)<1e-8)
 const component=circuit.find(e=>e.type==='source_component'&&e.source_component_id===ports[startIndex].source_component_id)
 assert.equal(component.name,'U_SOC')
 assert.equal(circuit.find(e=>e.type==='source_component'&&e.source_component_id===ports[endIndex].source_component_id).name,'U_RAM')
 assert(trace.route.filter(p=>p.route_type==='wire').every(p=>p.width===.1016&&['top','bottom'].includes(p.layer)))
 const vias=trace.route.filter(p=>p.route_type==='via')
 assert.equal(vias.length,2)
 assert(vias.every(v=>v.via_diameter===.4572&&v.via_hole_diameter===.254))
 paths.push(fanoutTracePath.parse({connection:`U_SOC.pin${ports[startIndex].pin_number}`,route:trace.route}))
 const length=trace.route.slice(1).reduce((n,p,i)=>{const q=trace.route[i];return n+(p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer?Math.hypot(p.x-q.x,p.y-q.y):0)},0)
 records.push({name:source.name,cpuPin:ports[startIndex].pin_number,ramPin:ports[endIndex].pin_number,lengthMm:length,throughVias:2,nativeTraceId:trace.pcb_trace_id})
}
const skew=Math.abs(records[0].lengthMm-records[1].lengthMm)
assert(skew<=.127+1e-8)
const cache='lib/am3352/placement/ddr-dqs0-native-paths.json'
writeFileSync(cache,JSON.stringify(paths,null,2)+'\n')
const report={status:'NATIVE_BUS_LANES_STROBE_CACHE_REQUIRES_SHAPED_REPLAY_CHECKS',
 sourceDomain:'76 × 118 mm computational rectangle; not a manufacturing outline',
 fixedPowerTraces:101,signalTraces:records,pairPlanarSkewMm:skew,pairPlanarSkewLimitMm:.127,
 nativeWireCoordinatesRetained:true,artifacts:[artifact(`${root}/result.json`),artifact(`${root}/phase-1.input.simple-route.json`),artifact(`${root}/phase-1.output.traces.json`),artifact(cache)],
 qualifiedDdrSignals:0,fabricationReady:false,
 scope:'First native bus_lanes strobe pair around all placed obstacles and 101 power escapes. Requires fresh actual-outline native and independent physical/connectivity checks; planar lengths alone do not qualify DDR timing or impedance.'}
writeFileSync('checks/integrated/g350-ddr-bootstrap/dqs0-native-cache.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,records,pairPlanarSkewMm:skew}))
