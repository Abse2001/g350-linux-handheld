import fs from 'node:fs'
import assert from 'node:assert/strict'
import * as checks from '@tscircuit/checks'
import {ddrRouteLength} from './lib/g350-ddr-trace-tuning.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [prior,root]=process.argv.slice(2);assert(prior&&root&&!fs.existsSync(root));fs.mkdirSync(root)
const read=p=>JSON.parse(fs.readFileSync(p)),circuit=read(`${prior}/candidate.circuit.json`),input=read('dist/g350-ram90-native-auto-pipeline-02/solver-input.json'),escapes=read('dist/g350-ram90-native-auto-pipeline-02/solver-result.json').escapes
const source=new Map(circuit.filter(r=>r.type==='source_trace'&&/^DDR_/.test(r.name)).map(r=>[r.source_trace_id,r])),components=new Map(circuit.filter(r=>r.type==='source_component').map(r=>[r.source_component_id,r.name])),logical=new Map(circuit.filter(r=>r.type==='source_port').map(r=>[r.source_port_id,r])),ports=new Map(circuit.filter(r=>r.type==='pcb_port').map(r=>[r.source_port_id,r]));assert.equal(source.size,49)
const connections=[...source].map(([id,s])=>({name:id,source_trace_id:id,nominalTraceWidth:.1016,pointsToConnect:['U_SOC','U_RAM'].map(name=>{const port=ports.get(s.connected_source_port_ids.find(id=>components.get(logical.get(id).source_component_id)===name)),e=escapes.find(e=>e.source_trace_id===id&&Math.hypot(e.route[0].x-port.x,e.route[0].y-port.y)<1e-8);assert(e);const p=e.route.at(-1);return {x:p.x,y:p.y,layer:p.layer}})}))
const complete=circuit.filter(r=>r.type==='pcb_trace'&&r.pcb_trace_id.startsWith('native_'));assert.equal(complete.length,6)
const targets={reset:29.2},solved=complete.map(t=>({name:source.get(t.source_trace_id).name,lengthMm:ddrRouteLength(t.route),targetMm:ddrRouteLength(t.route)}))
for(const [group,pair]of [['byte0',['DDR_DQS0','DDR_DQSn0']],['byte1',['DDR_DQS1','DDR_DQSn1']],['command',['DDR_CK','DDR_CKn']]]){const lengths=solved.filter(r=>pair.includes(r.name)).map(r=>r.lengthMm);assert.equal(lengths.length,2);targets[group]=(Math.min(...lengths)+Math.max(...lengths))/2}
const prepared={...input,connections,traces:circuit.filter(r=>r.type==='pcb_trace'),obstacles:[...input.obstacles,...circuit.filter(r=>r.type==='pcb_via').map(v=>({type:'rect',shape:'circle',center:{x:v.x,y:v.y},width:v.outer_diameter,height:v.outer_diameter,layers:v.layers,connectedTo:[circuit.find(t=>t.type==='pcb_trace'&&t.pcb_trace_id===v.pcb_trace_id).source_trace_id],obstacleId:`ram90_via_${v.pcb_via_id}`}))]}
const physical=g350DdrPhysicalChecks.flatMap(n=>checks[n](circuit)).concat(checkG350ViaTrackManufacturingClearance(circuit));assert.equal(physical.length,0)
for(const [name,value]of Object.entries({'candidate.circuit.json':circuit,'solver-input.json':prepared,'all-ddr-connections.json':connections,'solved.json':solved,'targets.json':targets,'physical-errors.json':physical,'preparation.json':{physicalErrors:0,source:prior,nativeSeededPairs:6,fabricationReady:false}}))fs.writeFileSync(`${root}/${name}`,JSON.stringify(value,null,2)+'\n')
fs.writeFileSync(`${root}/prepare.executed.mjs`,fs.readFileSync('scripts/prepare-g350-ram90-seeded-manual.mjs'))
console.log(JSON.stringify({nativeSeededSignals:6,targets,physicalErrors:0,fabricationReady:false}))
