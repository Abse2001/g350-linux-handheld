import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [inputPath,sourcePath,reportPath]=process.argv.slice(2);assert(inputPath&&sourcePath&&reportPath)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const input=read(inputPath),source=read(sourcePath),mapPath='lib/am3352/memory-byte1-top-centered-swizzled-connections.json',mapping=read(mapPath),type=t=>source.filter(e=>e.type===t)
const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
assert.equal(type('source_component').length,212);assert.equal(type('pcb_smtpad').length,912)
assert.equal(input.traces.length,type('pcb_trace').length)
for(const t of type('pcb_trace')){const n=input.traces.find(n=>n.pcb_trace_id===t.pcb_trace_id);assert(n);assert.equal(n.source_trace_id,t.source_trace_id);assert.deepEqual(geometry(n.route),geometry(t.route))}
for(const p of type('pcb_smtpad')){
 const o=input.obstacles.find(o=>o.circuitJsonMetadata?.pcb_smtpad_id===p.pcb_smtpad_id);assert(o)
 const x=p.shape==='polygon'?(Math.min(...p.points.map(p=>p.x))+Math.max(...p.points.map(p=>p.x)))/2:p.x,y=p.shape==='polygon'?(Math.min(...p.points.map(p=>p.y))+Math.max(...p.points.map(p=>p.y)))/2:p.y
 assert(Math.hypot(o.center.x-x,o.center.y-y)<1e-8);assert.deepEqual(o.layers,[p.layer])
}
for(const v of type('pcb_via')){
 const o=input.obstacles.find(o=>o.circuitJsonMetadata?.pcb_via_id===v.pcb_via_id)
 if(o){assert.equal(o.center.x,v.x);assert.equal(o.center.y,v.y);assert.equal(o.width,v.outer_diameter);assert.deepEqual(o.layers,v.layers)}
 else assert(input.traces.flatMap(t=>t.route).some(p=>p.route_type==='via'&&Math.hypot(p.x-v.x,p.y-v.y)<1e-8))
}
const missing=mapping.filter(m=>{const t=type('source_trace').find(t=>t.name===m.name);assert(t);return !type('pcb_trace').some(n=>n.source_trace_id===t.source_trace_id)})
assert.equal(input.connections.length,missing.length)
for(const m of missing){
 const t=type('source_trace').find(t=>t.name===m.name),c=input.connections.find(c=>c.source_trace_id===t.source_trace_id);assert(c);assert.equal(c.width,.1016);assert.equal(c.pointsToConnect.length,2)
 for(const [k,name,pin,ball] of [[0,'U_SOC',m.socPin,m.socBall],[1,'U_RAM',m.ramPin,m.ramBall]]){
  const component=type('source_component').find(c=>c.name===name),port=type('source_port').find(p=>p.source_component_id===component.source_component_id&&p.pin_number===Number(pin.slice(3)))
  assert.equal(port.name,ball);assert(t.connected_source_port_ids.includes(port.source_port_id))
  const physical=type('pcb_port').find(p=>p.source_port_id===port.source_port_id),point=c.pointsToConnect[k];assert.equal(point.pcb_port_id,physical.pcb_port_id);assert.equal(point.x,physical.x);assert.equal(point.y,physical.y);assert(physical.layers.includes(point.layer))
 }
}
assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false);assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254);assert.equal(input.minTraceToHoleEdgeClearance,.2);assert.equal(input.minViaHoleEdgeToViaHoleEdgeClearance,.254)
assert.equal(input.buses.length,1);assert.equal(input.buses[0].maxLengthSkew,.635);assert.deepEqual(input.buses[0].allowedLayers,['top','bottom']);assert.deepEqual(input.buses[0].connectionNames.toSorted(),input.connections.map(c=>c.name).toSorted())
// Only already routed pairs are omitted in the native continuation. The
// complete editable source must retain all three independent pair declarations.
assert.equal(input.differentialPairs?.length??0,0)
for(const name of ['DDR_DQS0_PAIR','DDR_DQS1_PAIR','DDR_CK_PAIR']){const b=type('source_bus').find(b=>b.name===name);assert(b);assert.equal(b.max_length_skew,.127);assert(b.source_trace_ids.every(id=>type('pcb_trace').some(t=>t.source_trace_id===id)))}
const report={status:'LATEST_NATIVE_COMMAND_PHASE_REAL_PADS_AND_ALL_FIXED_COPPER_PRESERVED',input:artifact(inputPath),source:artifact(sourcePath),memoryMap:artifact(mapPath),executionHelper:artifact('scripts/check-am3352-command-replay-native-input.mjs'),components:212,physicalPads:912,fixedTraces:input.traces.length,fixedVias:type('pcb_via').length,openConnections:missing.length,actualNumericPadEndpoints:missing.length*2,remainingSignals:missing.map(m=>m.name),completeReplayPairDeclarationsRestored:true,nativeOnlyAlreadyFixedPairsOmitted:true,referenceLayersReserved:['inner1','inner2'],qualifiedNewDdrSignals:0,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,open:missing.length,fixedTraces:report.fixedTraces,fixedVias:report.fixedVias,physicalPads:912}))
