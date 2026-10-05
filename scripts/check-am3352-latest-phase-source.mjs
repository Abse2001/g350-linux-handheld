import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const inputPath='dist/am3352-latest-bus-lanes-ddr33-fixed-pairs-attempt-754/phase-3.input.simple-route.json',summaryPath='checks/integrated/am3352-ddr-usbc-d12-spacing-repaired-check-summary.json'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const summary=read(summaryPath);assert.equal(hash(summary.source.path),summary.source.sha256);assert.equal(summary.connectedDdrSignals,33)
const source=read(summary.source.path),input=read(inputPath)
assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false);assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254);assert.equal(input.minTraceToHoleEdgeClearance,.2)
const fixed=source.filter(e=>e.type==='pcb_trace');assert.equal(fixed.length,135);assert.equal(input.traces.length,135)
const geometry=route=>route.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
for(const trace of fixed){const actual=input.traces.find(t=>t.pcb_trace_id===trace.pcb_trace_id);assert(actual);assert.equal(actual.source_trace_id,trace.source_trace_id);assert.deepEqual(geometry(actual.route),geometry(trace.route))}
const pads=source.filter(e=>e.type==='pcb_smtpad'),obstacles=input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id);assert.equal(pads.length,912);assert.equal(obstacles.length,912)
for(const pad of pads){const obstacle=obstacles.find(o=>o.circuitJsonMetadata.pcb_smtpad_id===pad.pcb_smtpad_id);assert(obstacle);const center=pad.shape==='polygon'?{x:(Math.min(...pad.points.map(p=>p.x))+Math.max(...pad.points.map(p=>p.x)))/2,y:(Math.min(...pad.points.map(p=>p.y))+Math.max(...pad.points.map(p=>p.y)))/2}:{x:pad.x,y:pad.y};assert(Math.hypot(obstacle.center.x-center.x,obstacle.center.y-center.y)<1e-8);assert.deepEqual(obstacle.layers,[pad.layer]);assert.equal(obstacle.circuitJsonMetadata.pcb_port_id,pad.pcb_port_id)}
const vias=source.filter(e=>e.type==='pcb_via'),routeVias=input.traces.flatMap(t=>t.route).filter(p=>p.route_type==='via');assert.equal(vias.length,169)
for(const via of vias){const obstacle=input.obstacles.find(o=>o.circuitJsonMetadata?.pcb_via_id===via.pcb_via_id);if(obstacle){assert.equal(obstacle.center.x,via.x);assert.equal(obstacle.center.y,via.y);assert.equal(obstacle.width,via.outer_diameter)}else assert(routeVias.some(p=>Math.hypot(p.x-via.x,p.y-via.y)<1e-8),'Fixed source via was dropped')}
assert.equal(input.connections.length,16);const names=[]
for(const c of input.connections){const trace=source.find(e=>e.type==='source_trace'&&e.source_trace_id===c.source_trace_id);assert(trace);assert.equal(c.width,.1016);assert.equal(c.pointsToConnect.length,2);names.push(trace.name)
  for(const p of c.pointsToConnect){const actual=source.find(e=>e.type==='pcb_port'&&e.pcb_port_id===p.pcb_port_id);assert(actual);assert.equal(p.x,actual.x);assert.equal(p.y,actual.y);assert(actual.layers.includes(p.layer));assert(trace.connected_source_port_ids.includes(actual.source_port_id))}}
assert.deepEqual(names.slice().sort(),['DDR_BA0','DDR_A7','DDR_RASn','DDR_BA2','DDR_A0','DDR_A2','DDR_A9','DDR_A13','DDR_A10','DDR_A12','DDR_A1','DDR_A11','DDR_A14','DDR_BA1','DDR_A4','DDR_A8'].sort())
assert.equal(input.buses.length,1);assert.equal(input.buses[0].maxLengthSkew,.635);assert.deepEqual(input.buses[0].allowedLayers,['top','bottom']);assert.equal(input.differentialPairs?.length??0,0)
writeFileSync('checks/integrated/tscircuit-update-2744/phase-754-source-preservation.json',JSON.stringify({status:'NATIVE_PHASE_INPUT_PRESERVATION_PASS',input:artifact(inputPath),checkedSummary:artifact(summaryPath),fixedTracePieces:135,allFixedTraceGeometryExact:true,all912PhysicalPadCentersAndLayersExact:true,all169FixedViasRepresented:true,actualOpenConnections:16,actualPhysicalEndpoints:32,selectedNames:names,innerPlanesReserved:true,fullyGuidedPairsOmittedForDiagnosticOnly:['DDR_DQS0_PAIR','DDR_DQS1_PAIR','DDR_CK_PAIR'],pairDefinitionsMustBeRestoredForReplay:true,qualifiedNewDdrSignals:0,fabricationReady:false},null,2)+'\n')
console.log('Native phase retains 135 traces, 912 real pads, 169 fixed vias and 32 actual DDR endpoints')
