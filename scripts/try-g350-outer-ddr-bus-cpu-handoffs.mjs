// Public Bus Lanes trial with native-checked supplied CPU handoffs.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {SOLVERS} from '@tscircuit/core'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,reference,phase,root]=process.argv.slice(2);assert(input&&reference&&phase&&root&&!fs.existsSync(root))
const stepCap=Number(process.env.G350_BUS_PUBLIC_STEP_CAP??20000);assert(Number.isInteger(stepCap)&&stepCap>=20000&&stepCap<=1000000)
const interiorRectangleOnly=process.env.G350_BUS_INTERIOR_RECTANGLE_ONLY??'0';assert(['0','1'].includes(interiorRectangleOnly))
const disjointBusProjection=process.env.G350_BUS_DISJOINT_CONSTRAINT_PROJECTION??'0';assert(['0','1'].includes(disjointBusProjection))
const ramReference=process.env.G350_BUS_RAM_ESCAPES_REFERENCE
const maxLaneExpansions=process.env.G350_BUS_MAX_LANE_EXPANSIONS===undefined?undefined:Number(process.env.G350_BUS_MAX_LANE_EXPANSIONS)
assert(maxLaneExpansions===undefined||(Number.isInteger(maxLaneExpansions)&&maxLaneExpansions>=20000&&maxLaneExpansions<=1000000))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'), hashes=[input,reference,phase].map(hash)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
assert.equal(JSON.parse(fs.readFileSync('node_modules/@tscircuit/core/package.json')).version,'0.0.2107')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),prior=JSON.parse(fs.readFileSync(reference)),srj=JSON.parse(fs.readFileSync(phase))
const ramPrior=ramReference?JSON.parse(fs.readFileSync(ramReference)):null,ramReferenceSha=ramReference?hash(ramReference):null
const ddr=new Map(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>[e.source_trace_id,e.name]));assert.equal(ddr.size,49)
const originals=base.filter(e=>e.type==='pcb_trace'&&ddr.has(e.source_trace_id));assert.equal(originals.length,49)
const ids=new Set(originals.map(t=>t.pcb_trace_id)),fixed=base.filter(e=>!(e.type==='pcb_trace'&&ids.has(e.pcb_trace_id))&&!(e.type==='pcb_via'&&ids.has(e.pcb_trace_id)))
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const canonical=new Map();for(const s of base.filter(e=>e.type==='source_trace'))if(!canonical.has(find(s.source_trace_id)))canonical.set(find(s.source_trace_id),s.source_trace_id)
const net=x=>canonical.get(find(x))??find(x),ports=new Map(base.filter(e=>e.type==='pcb_port').map(e=>[e.pcb_port_id,e.source_port_id]))
const reserved=structuredClone(fixed),connections=[]
for(const old of originals){
 const t=prior.find(e=>e.type==='pcb_trace'&&e.source_trace_id===old.source_trace_id);assert(t);assert.deepEqual(t.route[0],old.route[0])
 const first=t.route.findIndex(p=>p.route_type==='via');assert(first>0)
 const head=structuredClone(t.route.slice(0,first+1)),v=head.at(-1);v.to_layer='bottom'
 const id=old.pcb_trace_id+'_cpu_reserved'
 reserved.push({...structuredClone(old),pcb_trace_id:id,route:[...head,{route_type:'wire',x:v.x,y:v.y,layer:'bottom',width:.1016}]},{type:'pcb_via',pcb_via_id:id+'_via',pcb_trace_id:id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:old.subcircuit_id})
 const end=old.route.at(-1)
 let ramEnd={x:end.x,y:end.y,layer:'top',pcb_port_id:end.end_pcb_port_id}
 if(ramPrior){
  const t=ramPrior.find(e=>e.type==='pcb_trace'&&e.source_trace_id===old.source_trace_id&&e.route[0].start_pcb_port_id===end.end_pcb_port_id);assert(t)
  assert(Math.hypot(t.route[0].x-end.x,t.route[0].y-end.y)<1e-8)
  const first=t.route.findIndex(p=>p.route_type==='via');assert(first>0);const head=structuredClone(t.route.slice(0,first+1)),rv=head.at(-1);rv.to_layer='bottom'
  assert(head.slice(0,-1).every(p=>p.route_type==='wire'&&p.layer==='top'))
  const rid=old.pcb_trace_id+'_ram_reserved';reserved.push({...structuredClone(old),pcb_trace_id:rid,route:[...head,{route_type:'wire',x:rv.x,y:rv.y,layer:'bottom',width:.1016}]},{type:'pcb_via',pcb_via_id:rid+'_via',pcb_trace_id:rid,x:rv.x,y:rv.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:old.subcircuit_id})
  ramEnd={x:rv.x,y:rv.y,layer:'bottom',layers:['top','bottom']}
 }
 connections.push({name:old.source_trace_id,source_trace_id:old.source_trace_id,nominalTraceWidth:.1016,pointsToConnect:[{x:v.x,y:v.y,layer:'bottom',layers:['top','bottom']},ramEnd]})
}
let ramReferenceFanouts=0
if(ramPrior){
 const ram=base.find(e=>e.type==='pcb_component'&&base.some(s=>s.type==='source_component'&&s.name==='U_RAM'&&s.source_component_id===e.source_component_id));assert(ram)
 const ramPorts=new Set(base.filter(e=>e.type==='pcb_port'&&e.pcb_component_id===ram.pcb_component_id).map(e=>e.pcb_port_id))
 const refs=ramPrior.filter(e=>e.type==='pcb_trace'&&!ddr.has(e.source_trace_id)&&ramPorts.has(e.route[0]?.start_pcb_port_id));assert.equal(refs.length,42)
 const refIds=new Set(refs.map(e=>e.pcb_trace_id));assert(!fixed.some(e=>refIds.has(e.pcb_trace_id)))
 reserved.push(...structuredClone(ramPrior.filter(e=>['pcb_trace','pcb_via'].includes(e.type)&&refIds.has(e.pcb_trace_id))));ramReferenceFanouts=refs.length
}
const checked=structuredClone(reserved),counts=Object.fromEntries(g350DdrPhysicalChecks.map(n=>[n,checks[n](checked).length]));counts.manufacturing=checkG350ViaTrackManufacturingClearance(checked.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:net(e.source_trace_id)}:e)).length
assert(Object.values(counts).every(n=>n===0),'Supplied CPU escape geometry must pass every physical check')
const owners=new Map(reserved.filter(e=>e.type==='pcb_trace').map(t=>[t.pcb_trace_id,net(t.source_trace_id)])),obstacles=[]
for(const p of reserved.filter(e=>e.type==='pcb_smtpad')){
 const polygon=p.shape==='polygon';const xs=polygon?p.points.map(q=>q.x):[],ys=polygon?p.points.map(q=>q.y):[]
 const x=polygon?(Math.min(...xs)+Math.max(...xs))/2:p.x,y=polygon?(Math.min(...ys)+Math.max(...ys))/2:p.y
 const width=polygon?Math.max(...xs)-Math.min(...xs):p.width??2*p.radius,height=polygon?Math.max(...ys)-Math.min(...ys):p.height??width
 assert([x,y,width,height].every(Number.isFinite))
 obstacles.push({type:'obstacle',componentId:p.pcb_component_id,center:{x,y},width,height,...(p.shape==='circle'?{shape:'circle'}:{}),layers:[p.layer],connectedTo:[net(ports.get(p.pcb_port_id)??p.pcb_smtpad_id)]})
}
for(const v of reserved.filter(e=>e.type==='pcb_via'))obstacles.push({type:'obstacle',shape:'circle',center:{x:v.x,y:v.y},width:v.outer_diameter,height:v.outer_diameter,layers:['top','inner1','inner2','bottom'],connectedTo:[owners.get(v.pcb_trace_id)??'FIXED_HOLE']})
const sourceBuses=base.filter(e=>e.type==='source_bus'&&e.name?.startsWith('DDR_')),primaryNames=['DDR_RESET','DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK']
let constraintProjection=null
if(disjointBusProjection==='1'){
 const primary=sourceBuses.filter(b=>primaryNames.includes(b.name)),pairs=sourceBuses.filter(b=>!primaryNames.includes(b.name))
 assert.equal(primary.length,4);assert.equal(pairs.length,3)
 const members=primary.flatMap(b=>b.source_trace_ids);assert.equal(members.length,49);assert.equal(new Set(members).size,49)
 for(const b of pairs){const p=srj.differentialPairs.find(p=>JSON.stringify([...p.connectionNames].sort())===JSON.stringify([...b.source_trace_ids].sort()));assert(p&&p.lengthTolerance===b.max_length_skew,'Every overlapping pair bus must retain its exact pair constraint')}
 constraintProjection={primaryBusNames:primaryNames,pairBusNamesRepresentedByDifferentialPairs:pairs.map(b=>b.name),all49MembersUnique:true,sourceBusAndPairLimitsUnchanged:true}
}
const buses=sourceBuses.filter(b=>disjointBusProjection==='0'||primaryNames.includes(b.name)).map(b=>({busId:b.name,connectionNames:b.source_trace_ids,traceWidth:.1016,allowedLayers:['top','bottom'],preferredLayers:['bottom','top'],...(disjointBusProjection==='1'&&b.max_length_skew!==undefined?{maxLengthSkew:b.max_length_skew}:{})}))
const problem={...srj,connections,obstacles,traces:reserved.filter(e=>e.type==='pcb_trace').map(t=>({...t,connection_name:net(t.source_trace_id)})),buses,allowedLayers:['top','bottom'],bounds:{minX:-20,maxX:20,minY:-8,maxY:34}}
let interiorRegionProof=null
if(interiorRectangleOnly==='1'){
 const actualOutline=base.find(e=>e.type==='pcb_board').outline;assert.deepEqual(problem.outline,actualOutline)
 const {minX,maxX,minY,maxY}=problem.bounds,corners=[{x:minX,y:minY},{x:maxX,y:minY},{x:maxX,y:maxY},{x:minX,y:maxY}]
 const inside=p=>{let yes=false;for(let i=0,j=actualOutline.length-1;i<actualOutline.length;j=i++){const a=actualOutline[i],b=actualOutline[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes}return yes}
 const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,f=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-f*dx,p.y-a.y-f*dy)}
 const orientation=(a,b,p)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x)
 let separation=Infinity
 assert(corners.every(inside))
 for(let i=0;i<actualOutline.length;i++)for(let j=0;j<4;j++){
  const a=actualOutline[i],b=actualOutline[(i+1)%actualOutline.length],c=corners[j],d=corners[(j+1)%4]
  const crossing=orientation(a,b,c)*orientation(a,b,d)<=0&&orientation(c,d,a)*orientation(c,d,b)<=0
  assert(!crossing,'The routing window must not cross the real mechanical outline')
  separation=Math.min(separation,distance(a,c,d),distance(b,c,d),distance(c,a,b),distance(d,a,b))
 }
 assert(separation>=.3&&connections.every(c=>c.pointsToConnect.every(p=>p.x>=minX&&p.x<=maxX&&p.y>=minY&&p.y<=maxY)))
 interiorRegionProof={bounds:problem.bounds,realOutline:actualOutline,minimumBoundarySeparationMm:separation,realBoardAndSourceOutlineUnchanged:true,actualOutlineChecksStillRequired:true}
 // The pinned lane solver supports rectangular routing regions. This window
 // is inside the unchanged real board; final source/CAD retain that outline.
 delete problem.outline
}
fs.mkdirSync(root);fs.copyFileSync('scripts/try-g350-outer-ddr-bus-cpu-handoffs.mjs',root+'/helper.executed.mjs')
fs.writeFileSync(root+'/input.simple-route.json',JSON.stringify(problem)+'\n')
fs.writeFileSync(root+'/preflight.json',JSON.stringify({hashes,ramReference,ramReferenceSha,ramReferenceFanouts,counts,interiorRegionProof,constraintProjection,all49CpuStubsNativePhysicalPassed:true,all49RamStubsNativePhysicalPassed:Boolean(ramPrior),completeRoutesNotClaimed:true,missingRamReferences:true,fabricationReady:false},null,2)+'\n')
// Preserve the public solver's algorithm-specific defaults: visibility uses
// 4,000 expansions and dense grid search allows 1,000,000. A blanket20,000
// cap prematurely rejected dense searches. This only changes search effort;
// every geometry, matching and subsequent native/source/CAD gate is unchanged.
const solver=new SOLVERS.BusLanesPipelineSolver(problem,{maxSearchIterations:200000,...(maxLaneExpansions===undefined?{}:{maxLaneIterations:maxLaneExpansions})})
let steps=0,exception=null
try{while(!solver.solved&&!solver.failed&&steps<stepCap){solver.step();steps++;fs.writeFileSync(root+'/progress.json',JSON.stringify({steps,stepCap,phase:solver.phase,solved:solver.solved,failed:solver.failed,error:solver.error??null,stats:solver.stats,planningOnly:true,fabricationReady:false},null,2)+'\n')}}catch(e){exception=e.message}
const report={steps,stepCap,maxLaneExpansions:maxLaneExpansions??'public solver default: visibility4000 / dense1000000',ramReference,ramReferenceSha,ramReferenceFanouts,interiorRegionProof,constraintProjection,aggregatePublicIterationLimit:solver.MAX_ITERATIONS,stepCapReached:steps===stepCap&&!solver.solved&&!solver.failed,phase:solver.phase,solved:solver.solved,failed:solver.failed,error:exception??solver.error??null,failureCode:solver.failureCode??null,stats:solver.stats,onlyPublicStepAndSolvedOutputUsed:true,sourceNativeMatchingGroundAndCadUnqualified:true,fabricationReady:false}
if(solver.solved&&!exception)fs.writeFileSync(root+'/solved-planning.simple-route.json',JSON.stringify(solver.getOutput(),null,2)+'\n')
assert.deepEqual([input,reference,phase].map(hash),hashes)
if(ramReference)assert.equal(hash(ramReference),ramReferenceSha)
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));process.exitCode=solver.solved&&!exception?0:2
