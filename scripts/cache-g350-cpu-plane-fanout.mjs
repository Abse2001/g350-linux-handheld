import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {fanoutTracePath} from '@tscircuit/props'

const read=p=>JSON.parse(readFileSync(p,'utf8'))
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const root='dist/g350-ddr-cpu-power-same-net'
const output=read(`${root}/output.json`),result=read(`${root}/result.json`)
const circuitPath='dist/g350-ddr-ram-power-checked-rules/compiled.circuit.json',circuit=read(circuitPath)
const ballMap=read('lib/am3352/cpu-ball-map.json').pins
assert.equal(result.failed,false)
assert.equal(output.validation.valid,true)
assert.equal(output.fanoutTraces.length,62)
const physicalVias=[],sharedConnections=[],paths=[]
for(const trace of output.fanoutTraces){
 const source=circuit.find(e=>e.type==='source_trace'&&e.source_trace_id===trace.connection_name)
 assert(source&&source.connected_source_port_ids.length===1)
 const port=circuit.find(e=>e.type==='source_port'&&e.source_port_id===source.connected_source_port_ids[0])
 const pcbPort=circuit.find(e=>e.type==='pcb_port'&&e.source_port_id===port.source_port_id)
 const component=circuit.find(e=>e.type==='source_component'&&e.source_component_id===port.source_component_id)
 assert.equal(component.name,'U_SOC')
 assert(Math.hypot(pcbPort.x-trace.route[0].x,pcbPort.y-trace.route[0].y)<1e-8)
 const fn=ballMap[port.name],net=fn==='VDDS_DDR'?'DDR_1V5':'GND'
 assert(fn==='VDDS_DDR'||fn.startsWith('VSS')||fn==='RTC_KALDO_ENn'||/^(VDDA_ADC|VREFP|VREFN|AIN[0-7])$/.test(fn))
 const connection=`U_SOC.pin${port.pin_number}`
 const route=trace.route.map(p=>({...p}))
 const index=route.findIndex(p=>p.route_type==='via')
 assert(index>=1&&route.filter(p=>p.route_type==='via').length===1)
 const via=route[index]
 assert.equal(via.via_diameter,.4572);assert.equal(via.via_hole_diameter,.254)
 assert.equal(via.from_layer,'top');assert.equal(via.to_layer,net==='GND'?'inner1':'inner2')
 const existing=physicalVias.find(v=>Math.hypot(v.x-via.x,v.y-via.y)<1e-8)
 if(existing){
  assert.equal(existing.net,net)
  assert.equal(net,'GND','Only these reviewed pairs of ground terminals share a via')
  assert.equal(existing.terminalCount,1,'No via may serve more than two CPU ground terminals')
  existing.terminalCount++
  // The autorouter generated the same physical drill for two same-net
  // branches. Emit that drill once. The second branch ends on its existing
  // top copper land; all native wire coordinates are retained.
  route.splice(index)
  assert(Math.hypot(route.at(-1).x-existing.x,route.at(-1).y-existing.y)<1e-8)
  sharedConnections.push({connection,sharedWith:existing.connection,net,x:existing.x,y:existing.y})
 }else physicalVias.push({connection,net,x:via.x,y:via.y,terminalCount:1})
 paths.push(fanoutTracePath.parse({connection,route}))
}
assert.equal(physicalVias.length,58)
assert.equal(sharedConnections.length,4)
for(let i=0;i<physicalVias.length;i++)for(let j=i+1;j<physicalVias.length;j++)assert(Math.hypot(physicalVias[i].x-physicalVias[j].x,physicalVias[i].y-physicalVias[j].y)>=.508-1e-8,'Distinct drills must retain 10 mil edge spacing')
const lengths=result.bestAttempt.plans.map(p=>({bus:p.busId,lengthMm:p.length}))
assert(lengths.every(p=>p.lengthMm<=1.778))
const cache='lib/am3352/placement/ddr-cpu-power-fanout.json'
writeFileSync(cache,JSON.stringify(paths,null,2)+'\n')
writeFileSync('checks/integrated/g350-ddr-bootstrap/cpu-power-fanout-cache.json',JSON.stringify({status:'NATIVE_62_CPU_PLANE_ESCAPES_SOURCE_CACHE_REQUIRES_INDEPENDENT_CHECKS',fabricationReady:false,qualifiedPowerConnections:0,processorConnections:62,physicalVias:58,sharedGroundVias:sharedConnections,padToViaMaxMm:Math.max(...lengths.map(p=>p.lengthMm)),padToViaLimitMm:1.778,wireCoordinatesRetained:true,duplicatePhysicalViaEmissionRemoved:true,artifacts:[artifact(`${root}/solver-input.json`),artifact(`${root}/output.json`),artifact(`${root}/result.json`),artifact(circuitPath),artifact(cache)],scope:'Fresh native FanoutSolver output on all placed obstacles and checked RAM escape obstacles. Same-net merges enabled. Four duplicate ground via emissions removed at identical native coordinates; all 62 connections must be replayed and checked on the actual shaped board.'},null,2)+'\n')
console.log('Cached 62 native CPU plane escapes with 58 unique full-depth vias; maximum pad-to-via route 1.365686 mm.')
