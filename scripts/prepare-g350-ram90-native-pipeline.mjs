import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [root,scope='all',prior,layersText='inner1,inner2']=process.argv.slice(2);assert(['all','byte0','byte1','command','reset'].includes(scope));assert(root&&!fs.existsSync(root));fs.mkdirSync(root)
const read=p=>JSON.parse(fs.readFileSync(p)),base='dist/g350-ram90-four-layer-source-01'
const raw=read(`${base}/board.source-and-pcb.circuit.json`),circuit=prior?read(`${prior}/candidate.circuit.json`):raw,input=read(`${base}/phase-1.input.simple-route.json`)
assert.equal(circuit.filter(r=>r.type==='pcb_component').length,280)
if(!prior)assert.equal(circuit.filter(r=>r.type==='pcb_trace'||r.type==='pcb_via').length,0,'Native auto-fanout needs untouched physical pads')
assert.deepEqual(circuit.filter(r=>r.type==='pcb_component'),raw.filter(r=>r.type==='pcb_component'))
const ports=new Map(circuit.filter(r=>r.type==='pcb_port').map(r=>[r.source_port_id,r]))
const allSignals=circuit.filter(r=>r.type==='source_trace'&&/^DDR_/.test(r.name));assert.equal(allSignals.length,49)
const busName={byte0:'DDR_BYTE0',byte1:'DDR_BYTE1',command:'DDR_COMMAND_CLOCK',reset:'DDR_RESET'}[scope]
const selectedBus=scope==='all'?null:new Set(circuit.find(r=>r.type==='source_bus'&&r.name===busName).source_trace_ids)
const signals=allSignals.filter(s=>scope==='all'||selectedBus.has(s.source_trace_id)),selected=new Set(signals.map(s=>s.source_trace_id))
const layers=layersText.split(','),bounds={minX:-18,maxX:18,minY:-10,maxY:33};assert(layers.length&&layers.every(l=>['top','inner1','inner2','bottom'].includes(l)))
const prepared={...input,bounds,outline:undefined,allowedLayers:layers,traces:[],connections:signals.map(s=>({name:s.source_trace_id,source_trace_id:s.source_trace_id,nominalTraceWidth:.1016,width:.1016,pointsToConnect:s.connected_source_port_ids.map(id=>{const p=ports.get(id);assert(p&&(p.layer==='top'||p.layers?.includes('top')));return {x:p.x,y:p.y,layer:'top',pointId:p.pcb_port_id,pcb_port_id:p.pcb_port_id}})})),buses:circuit.filter(r=>r.type==='source_bus'&&['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(r.name)).map(b=>({busId:b.name,name:b.name,connectionNames:b.source_trace_ids,maxLengthSkew:b.max_length_skew,traceWidth:.1016,allowedLayers:layers})),differentialPairs:circuit.filter(r=>r.type==='source_bus'&&/_PAIR$/.test(r.name)).map(b=>({connectionNames:b.source_trace_ids,lengthTolerance:b.max_length_skew,traceGap:.12}))}
prepared.buses=prepared.buses.filter(b=>b.connectionNames.every(n=>selected.has(n)))
prepared.differentialPairs=prepared.differentialPairs.filter(p=>p.connectionNames.every(n=>selected.has(n)))
assert.deepEqual(prepared.buses.map(b=>b.connectionNames.length),scope==='all'?[11,11,26]:scope==='reset'?[]:[scope==='command'?26:11]);assert.equal(prepared.differentialPairs.length,scope==='all'?3:scope==='reset'?0:1)
prepared.traces=circuit.filter(r=>r.type==='pcb_trace').map(t=>({...t,connection_name:t.source_trace_id}))
prepared.obstacles=[...prepared.obstacles,...circuit.filter(r=>r.type==='pcb_via').map(v=>({type:'rect',shape:'circle',center:{x:v.x,y:v.y},width:v.outer_diameter,height:v.outer_diameter,layers:v.layers,connectedTo:[circuit.find(t=>t.type==='pcb_trace'&&t.pcb_trace_id===v.pcb_trace_id).source_trace_id],obstacleId:v.pcb_via_id,circuitJsonMetadata:{pcb_via_id:v.pcb_via_id}}))]
const physical=g350DdrPhysicalChecks.flatMap(n=>checks[n](circuit)).concat(checkG350ViaTrackManufacturingClearance(circuit));assert.equal(physical.length,0)
const objects={'candidate.circuit.json':circuit,'solver-input.json':prepared,'solver-options.json':{fanout:'auto',smoothTuning:true,denseSearch:true,maxSearchIterations:200000,maxLaneIterations:200000},'physical-errors.json':physical}
for(const [name,data]of Object.entries(objects))fs.writeFileSync(`${root}/${name}`,JSON.stringify(data,null,2)+'\n')
fs.writeFileSync(`${root}/prepare.executed.mjs`,fs.readFileSync('scripts/prepare-g350-ram90-native-pipeline.mjs'))
const artifact=path=>({path,sha256:createHash('sha256').update(fs.readFileSync(path)).digest('hex')})
fs.writeFileSync(`${root}/preparation.json`,JSON.stringify({physicalErrors:0,physicalChecks:g350DdrPhysicalChecks,source:artifact(`${base}/board.source-and-pcb.circuit.json`),files:[...Object.keys(objects),'prepare.executed.mjs'].map(n=>artifact(`${root}/${n}`)),qualifiedNewSignals:0,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({nativeAutomaticDogbones:true,scope,connections:signals.length,busMembers:prepared.buses.map(b=>b.connectionNames.length),pairLimitMm:.127,busLimitMm:.635,carrierLayers:layers,physicalErrors:0,fabricationReady:false}))
