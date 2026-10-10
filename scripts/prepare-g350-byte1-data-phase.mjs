// Native nine-data-carrier bootstrap. The complete eleven-member source bus
// and strobe-pair assertions remain in the actual editable circuit unchanged.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks} from './lib/g350-ddr-physical-checks.mjs'
const [base,root,layer='inner2']=process.argv.slice(2)
assert(base&&root&&!fs.existsSync(root)&&['inner1','inner2','bottom'].includes(layer));fs.mkdirSync(root)
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p))
const prep=read(base+'/preparation.json');assert.equal(prep.physicalErrors,0);for(const p of prep.files)assert.equal(hash(p.path),p.sha256)
const original=read(base+'/candidate.circuit.json'),c=structuredClone(original),srj=read(base+'/solver-input.json')
const bus=c.find(e=>e.type==='source_bus'&&e.name==='DDR_BYTE1'),ss=c.filter(e=>e.type==='source_trace'&&bus.source_trace_ids.includes(e.source_trace_id))
assert.equal(bus.source_trace_ids.length,11);assert.equal(bus.max_length_skew,.635)
const pair=ss.filter(s=>['DDR_DQS1','DDR_DQSn1'].includes(s.name)).map(s=>s.source_trace_id),data=ss.filter(s=>!pair.includes(s.source_trace_id)).map(s=>s.source_trace_id)
assert.equal(data.length,9);assert.equal(pair.length,2)
for(const t of c.filter(e=>e.type==='pcb_trace'&&data.includes(e.source_trace_id))){assert(t.route.at(-2).route_type==='via'&&t.route.at(-1).route_type==='wire');t.route.at(-2).to_layer=layer;t.route.at(-1).layer=layer}
const phase={...srj,allowedLayers:[layer],connections:srj.connections.filter(e=>data.includes(e.source_trace_id)).map(e=>({...e,pointsToConnect:e.pointsToConnect.map(p=>({...p,layer}))})),buses:srj.buses.filter(e=>e.connectionNames.every(id=>data.includes(id))).map(e=>({...e,allowedLayers:[layer]})),differentialPairs:srj.differentialPairs.filter(e=>e.connectionNames.every(id=>data.includes(id))),traces:c.filter(e=>e.type==='pcb_trace').map(e=>({...e,connection_name:e.source_trace_id}))}
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of c.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const traceOwners=new Map(c.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,find(e.source_trace_id)])),vias=new Map(c.filter(e=>e.type==='pcb_via').map(e=>[e.pcb_via_id,e]))
const aliases=new Map();for(const s of c.filter(e=>e.type==='source_trace')){const owner=find(s.source_trace_id);if(!aliases.has(owner))aliases.set(owner,[]);aliases.get(owner).push(s.source_trace_id)}
let aliasRepairs=0
for(const o of phase.obstacles){const v=vias.get(o.obstacleId);if(!v)continue;const owner=traceOwners.get(v.pcb_trace_id);assert(owner);assert(Math.hypot(o.center.x-v.x,o.center.y-v.y)<1e-8);const actualAliases=aliases.get(owner);assert(actualAliases?.length);o.connectedTo=[...new Set([...o.connectedTo,...actualAliases])];assert(o.connectedTo.every(id=>find(id)===owner));aliasRepairs++}
// BusLanes counts fixed planar prefix copper in its bus length. Subtract
// only the two real 1.6 mm native barrel terms from the total native target.
for(const b of phase.buses){const id=b.connectionNames[0],prefix=c.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===id);assert.equal(prefix.length,2);const n=prefix.flatMap(t=>t.route).filter(p=>p.route_type==='via').length;assert.equal(n,2);b.minLength=prep.goalNativeMm-n*1.6;b.maxLength=b.minLength+.01}
assert.equal(phase.connections.length,9);assert.equal(phase.buses.length,9);assert.equal(phase.differentialPairs.length,0)
for(const type of ['source_trace','source_bus','source_net','source_port','source_component','pcb_component','pcb_smtpad','pcb_port','pcb_board','pcb_via','pcb_hole','pcb_plated_hole'])assert.deepEqual(c.filter(e=>e.type===type),original.filter(e=>e.type===type))
const counts=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkPcbRoutingConstraints','checkTracesAreContiguous','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](c).length]));assert(Object.values(counts).every(n=>n===0))
for(const [name,content]of [['candidate.circuit.json',c],['solver-input.json',phase],['solver-options.json',read(base+'/solver-options.json')]])fs.writeFileSync(root+'/'+name,JSON.stringify(content,null,2)+'\n')
fs.copyFileSync('scripts/prepare-g350-byte1-data-phase.mjs',root+'/preparation.executed.mjs')
const files=['candidate.circuit.json','solver-input.json','solver-options.json','preparation.executed.mjs'].map(name=>({path:root+'/'+name,sha256:hash(root+'/'+name)}))
fs.writeFileSync(root+'/preparation.json',JSON.stringify({base:{path:base+'/preparation.json',sha256:hash(base+'/preparation.json')},physicalErrors:0,physicalCounts:counts,sourceByteMembershipAndAllLimitsExactlyPreserved:true,nativePhaseCarriers:9,outsideThisPhaseStrobePair:pair,physicalTerminalAccessLayer:layer,logicalAliasRepairs:aliasRepairs,busLengthIncludesFixedPlanarPrefixes:true,files,openChannels:11,planningOnly:true,requiresCompleteByteFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({phaseCarriers:9,layer,physicalErrors:0,allSourceAssertionsPreserved:true}))
