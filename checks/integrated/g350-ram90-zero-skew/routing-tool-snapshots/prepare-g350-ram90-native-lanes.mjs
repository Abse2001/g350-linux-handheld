import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [root,scope='byte0',prior,carrierOverride]=process.argv.slice(2);assert(root&&!fs.existsSync(root)&&['byte0','byte1','command','reset','pairs'].includes(scope));fs.mkdirSync(root)
const read=p=>JSON.parse(fs.readFileSync(p)),base='dist/g350-ram90-native-auto-pipeline-02'
let circuit=prior?read(`${prior}/candidate.circuit.json`):read(`${base}/candidate.circuit.json`)
const original=read(`${base}/solver-input.json`),signals=new Map(circuit.filter(r=>r.type==='source_trace'&&/^DDR_/.test(r.name)).map(r=>[r.source_trace_id,r]))
const ports=new Map(circuit.filter(r=>r.type==='pcb_port').map(r=>[r.source_port_id,r]))
if(!prior){
 const escapes=read(`${base}/solver-result.json`).escapes;assert.equal(escapes.length,98)
 for(const e of escapes){
  const s=signals.get(e.source_trace_id),route=structuredClone(e.route),p=s.connected_source_port_ids.map(id=>ports.get(id)).find(p=>Math.hypot(p.x-route[0].x,p.y-route[0].y)<1e-8);assert(p)
  route[0]={...route[0],x:p.x,y:p.y,start_pcb_port_id:p.pcb_port_id}
  for(let i=0;i<route.length;i++)if(route[i].route_type==='via')for(const j of [i-1,i+1])if(route[j]?.route_type==='wire'&&Math.hypot(route[j].x-route[i].x,route[j].y-route[i].y)<1e-8){route[j].x=route[i].x;route[j].y=route[i].y}
  const t={type:'pcb_trace',pcb_trace_id:e.pcb_trace_id,source_trace_id:s.source_trace_id,subcircuit_id:s.subcircuit_id,route};circuit.push(t)
  for(const [i,v]of route.filter(p=>p.route_type==='via').entries())circuit.push({type:'pcb_via',pcb_via_id:`${t.pcb_trace_id}_${i}`,pcb_trace_id:t.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:t.subcircuit_id})
 }
}
const selected=new Set(scope==='pairs'?circuit.filter(r=>r.type==='source_bus'&&/_PAIR$/.test(r.name)).flatMap(b=>b.source_trace_ids):circuit.find(r=>r.type==='source_bus'&&r.name==={byte0:'DDR_BYTE0',byte1:'DDR_BYTE1',command:'DDR_COMMAND_CLOCK',reset:'DDR_RESET'}[scope]).source_trace_ids)
if(scope==='pairs'){
 const clock=new Set(circuit.find(r=>r.type==='source_bus'&&r.name==='DDR_CK_PAIR').source_trace_ids)
 for(const t of circuit.filter(r=>r.type==='pcb_trace'&&clock.has(r.source_trace_id))){assert(t.pcb_trace_id.startsWith('local_dogbone_'));t.route.at(-1).layer='bottom';t.route.find(p=>p.route_type==='via').to_layer='bottom'}
}
if(carrierOverride){assert(['top','inner1','inner2','bottom'].includes(carrierOverride));for(const t of circuit.filter(r=>r.type==='pcb_trace'&&selected.has(r.source_trace_id)&&r.pcb_trace_id.startsWith('local_dogbone_'))){t.route.at(-1).layer=carrierOverride;t.route.find(p=>p.route_type==='via').to_layer=carrierOverride}}
const active=new Set([...selected].filter(id=>circuit.filter(r=>r.type==='pcb_trace'&&r.source_trace_id===id).length===2))
const reference=circuit.filter(r=>r.type==='pcb_trace'&&selected.has(r.source_trace_id)&&!active.has(r.source_trace_id))
const planar=r=>r.slice(1).reduce((n,p,i)=>n+(p.route_type==='wire'&&r[i].route_type==='wire'&&p.layer===r[i].layer?Math.hypot(p.x-r[i].x,p.y-r[i].y):0),0)
for(const t of reference)assert.equal(t.route.filter(p=>p.route_type==='via').length,2,'References require the same two full-depth vias as the new planar carriers')
const connections=[...active].map(id=>{const t=circuit.filter(r=>r.type==='pcb_trace'&&r.source_trace_id===id);assert.equal(t.length,2);const p=t.map(t=>t.route.at(-1));assert.equal(p[0].layer,p[1].layer);return {name:id,source_trace_id:id,nominalTraceWidth:.1016,width:.1016,pointsToConnect:p.map(p=>({x:p.x,y:p.y,layer:p.layer}))}})
const input={...original,connections,traces:circuit.filter(r=>r.type==='pcb_trace').map(t=>({...t,connection_name:t.source_trace_id})),buses:original.buses.filter(b=>b.connectionNames.every(n=>selected.has(n))).map(b=>({...b,allowedLayers:carrierOverride?[carrierOverride]:original.allowedLayers})),differentialPairs:original.differentialPairs.filter(p=>p.connectionNames.every(n=>selected.has(n))),allowedLayers:carrierOverride?[carrierOverride]:original.allowedLayers,obstacles:[...original.obstacles,...circuit.filter(r=>r.type==='pcb_via').map(v=>({type:'rect',shape:'circle',center:{x:v.x,y:v.y},width:v.outer_diameter,height:v.outer_diameter,layers:v.layers,connectedTo:[circuit.find(t=>t.type==='pcb_trace'&&t.pcb_trace_id===v.pcb_trace_id).source_trace_id],obstacleId:v.pcb_via_id}))]}
if(scope==='pairs'){
 input.allowedLayers=['inner1','inner2','bottom']
 input.buses=circuit.filter(r=>r.type==='source_bus'&&/_PAIR$/.test(r.name)).map(b=>{const target={DDR_DQS0_PAIR:26,DDR_DQS1_PAIR:28.4,DDR_CK_PAIR:33.62}[b.name];return {busId:b.name,name:b.name,connectionNames:b.source_trace_ids,maxLengthSkew:.127,minLength:target,maxLength:target+.3,traceWidth:.1016,allowedLayers:b.name==='DDR_CK_PAIR'?['bottom']:original.allowedLayers}})
}
if(reference.length){
 const lengths=reference.map(t=>planar(t.route));assert(Math.max(...lengths)-Math.min(...lengths)<=.635+1e-8)
 for(const b of input.buses){b.connectionNames=b.connectionNames.filter(n=>active.has(n));b.minLength=Math.max(...lengths)-.634;b.maxLength=Math.min(...lengths)+.634}
 input.differentialPairs=input.differentialPairs.filter(p=>p.connectionNames.every(n=>active.has(n)))
}
const physical=g350DdrPhysicalChecks.flatMap(n=>checks[n](circuit)).concat(checkG350ViaTrackManufacturingClearance(circuit));assert.equal(physical.length,0,'Actual physical fanouts must pass before routing')
const objects={'candidate.circuit.json':circuit,'solver-input.json':input,'solver-options.json':{smoothTuning:true,denseSearch:true,maxSearchIterations:200000,maxLaneIterations:200000},'physical-errors.json':physical}
for(const [name,data]of Object.entries(objects))fs.writeFileSync(`${root}/${name}`,JSON.stringify(data,null,2)+'\n')
fs.writeFileSync(`${root}/prepare.executed.mjs`,fs.readFileSync('scripts/prepare-g350-ram90-native-lanes.mjs'))
const artifact=path=>({path,sha256:createHash('sha256').update(fs.readFileSync(path)).digest('hex')})
fs.writeFileSync(`${root}/preparation.json`,JSON.stringify({physicalErrors:0,physicalChecks:g350DdrPhysicalChecks,source:artifact(`${base}/candidate.circuit.json`),nativeJointFanouts:artifact(`${base}/solver-result.json`),files:[...Object.keys(objects),'prepare.executed.mjs'].map(n=>artifact(`${root}/${n}`)),qualifiedNewSignals:0,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({scope,connections:connections.length,fixedCopper:circuit.filter(r=>r.type==='pcb_trace').length,physicalErrors:0,fabricationReady:false}))
