// Reversible whole-byte planning. The checked source and every foreign wire
// stay untouched; incomplete escapes never qualify connectivity or timing.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,root,goalText='55.31114610832671']=process.argv.slice(2);assert(input&&root&&!fs.existsSync(root));fs.mkdirSync(root)
const goal=Number(goalText);assert(Number.isFinite(goal)&&goal>20&&goal<80)
const old=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const bus=old.find(e=>e.type==='source_bus'&&e.name==='DDR_BYTE1');assert(bus&&bus.source_trace_ids.length===11&&bus.max_length_skew===.635)
const ids=new Set(bus.source_trace_ids),ddr=old.filter(e=>e.type==='pcb_trace'&&ids.has(e.source_trace_id));assert.equal(ddr.length,11)
const removedTraceIds=new Set(ddr.map(t=>t.pcb_trace_id))
const c=old.filter(e=>!(e.type==='pcb_trace'&&ids.has(e.source_trace_id))&&!(e.type==='pcb_via'&&removedTraceIds.has(e.pcb_trace_id)))
const connections=[],prefixes=[],perNetBounds=[],removedHoles=[]
for(const t of ddr){
 const first=t.route.findIndex(p=>p.route_type==='via'),last=t.route.findLastIndex(p=>p.route_type==='via');assert(first>0&&last>first&&last<t.route.length-1)
 const cpu={...t,pcb_trace_id:'g350_byte1_cpu_'+t.pcb_trace_id,connection_name:t.source_trace_id,route:structuredClone(t.route.slice(0,first+2))}
 const ram={...t,pcb_trace_id:'g350_byte1_ram_'+t.pcb_trace_id,connection_name:t.source_trace_id,route:structuredClone(t.route.slice(last-1)).reverse().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:p)}
 ram.route[0].start_pcb_port_id=ram.route[0].end_pcb_port_id;delete ram.route[0].end_pcb_port_id
 for(const p of [cpu,ram]){
  delete p.trace_length;assert.equal(p.route.at(-2).route_type,'via');assert.equal(p.route.at(-1).route_type,'wire');assert.equal(p.route.at(-2).from_layer,'top')
  p.route.at(-2).to_layer='inner2';p.route.at(-1).layer='inner2'
  const barrel=old.find(e=>e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id&&Math.hypot(e.x-p.route.at(-1).x,e.y-p.route.at(-1).y)<1e-8);assert(barrel)
  c.push(p,{...barrel,pcb_trace_id:p.pcb_trace_id});prefixes.push(p)
 }
 const fixedMm=ddrRouteLength(cpu.route)+ddrRouteLength(ram.route),nominal=goal-fixedMm;assert(nominal>10)
 connections.push({name:t.source_trace_id,source_trace_id:t.source_trace_id,width:.1016,nominalTraceWidth:.1016,pointsToConnect:[cpu,ram].map(p=>({x:p.route.at(-1).x,y:p.route.at(-1).y,layer:'inner2'}))})
 // Native BusLanes includes the fixed planar prefix copper in bus length.
 // Only its two physical barrel terms are absent from that planar total.
 perNetBounds.push({busId:'g350_byte1_via_compensated_'+t.source_trace_id,connectionNames:[t.source_trace_id],traceWidth:.1016,minLength:goal-3.2,maxLength:goal-3.2+.01,allowedLayers:['inner2']})
 const retained=new Set(c.filter(e=>e.type==='pcb_via').map(e=>e.pcb_via_id));removedHoles.push(...old.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id&&!retained.has(e.pcb_via_id)).map(e=>e.pcb_via_id))
}
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of old.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const ports=new Map(c.filter(e=>e.type==='pcb_port').map(e=>[e.pcb_port_id,e.source_port_id])),owners=new Map(c.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,find(e.source_trace_id)]))
const srj=JSON.parse(fs.readFileSync('dist/g350-ddr-inner-ground-preserved-source-209/phase-0.input.simple-route.json'))
const bounds={minX:-16,maxX:16,minY:-6,maxY:30},outline=c.find(e=>e.type==='pcb_board').outline
const inside=(x,y)=>{let hit=false;for(let i=0,j=outline.length-1;i<outline.length;j=i++){const a=outline[i],b=outline[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit}return hit}
const corners=[{x:bounds.minX,y:bounds.minY},{x:bounds.maxX,y:bounds.minY},{x:bounds.maxX,y:bounds.maxY},{x:bounds.minX,y:bounds.maxY}]
assert(corners.every(p=>inside(p.x,p.y)))
const crosses=(a,b,d,e)=>{const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return cross(a,b,d)*cross(a,b,e)<0&&cross(d,e,a)*cross(d,e,b)<0}
assert(!outline.some((a,i)=>corners.some((d,j)=>crosses(a,outline[(i+1)%outline.length],d,corners[(j+1)%corners.length]))))
const obstacles=srj.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id||o.circuitJsonMetadata?.pcb_hole_id||o.circuitJsonMetadata?.pcb_plated_hole_id)
const aliases=new Map();for(const s of old.filter(e=>e.type==='source_trace')){const owner=find(s.source_trace_id);if(!aliases.has(owner))aliases.set(owner,[]);aliases.get(owner).push(s.source_trace_id)}
for(const v of c.filter(e=>e.type==='pcb_via')){const owner=owners.get(v.pcb_trace_id);assert(owner&&aliases.get(owner)?.length);obstacles.push({obstacleId:v.pcb_via_id,type:'rect',shape:'circle',center:{x:v.x,y:v.y},width:v.outer_diameter,height:v.outer_diameter,layers:v.layers,connectedTo:[owner,...aliases.get(owner)]})}
const planning={...srj,outline:undefined,bounds,connections,buses:perNetBounds,differentialPairs:srj.differentialPairs.filter(p=>p.connectionNames.every(id=>ids.has(id))),obstacles,traces:c.filter(e=>e.type==='pcb_trace').map(t=>({...t,connection_name:t.source_trace_id})),allowedLayers:['inner2']}
const counts=Object.fromEntries(g350DdrPhysicalChecks.map(n=>[n,checks[n](c).length]));counts.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length
assert(Object.values(counts).every(n=>n===0),JSON.stringify(counts))
const foreign=x=>x.filter(e=>!(e.type==='pcb_trace'&&ids.has(e.source_trace_id))&&!(e.type==='pcb_via'&&removedTraceIds.has(e.pcb_trace_id)||e.type==='pcb_via'&&e.pcb_trace_id.startsWith('g350_byte1_')))
assert.deepEqual(foreign(c),foreign(old))
const objects={'candidate.circuit.json':c,'solver-input.json':planning,'solver-options.json':{smoothTuning:true,denseSearch:true,maxSearchIterations:200000,maxLaneIterations:200000},'all-ddr-connections.json':connections,'physical-errors.json':[],'targets.json':{byte1:goal},'prefixes.json':prefixes}
for(const [name,data]of Object.entries(objects))fs.writeFileSync(root+'/'+name,JSON.stringify(data,null,2)+'\n')
fs.copyFileSync('scripts/prepare-g350-byte1-bus-rebuild.mjs',root+'/prepare.executed.mjs')
const artifact=p=>({path:p,sha256:createHash('sha256').update(fs.readFileSync(p)).digest('hex')})
fs.writeFileSync(root+'/preparation.json',JSON.stringify({source:artifact(input),physicalErrors:0,physicalCounts:counts,goalNativeMm:goal,prefixes:22,openChannels:11,removedOwnedInteriorHoleIds:removedHoles,foreignCopperAndLogicalDefinitionsExactlyPreserved:true,planningRectangleWithinAuthoredOutline:true,authoredOutlineUnchanged:true,files:[...Object.keys(objects),'prepare.executed.mjs'].map(n=>artifact(root+'/'+n)),planningOnly:true,requiresCompleteWholeBoardFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({physicalCounts:counts,prefixes:22,openChannels:11,removedOwnedInteriorHoles:removedHoles.length,goalNativeMm:goal}))
