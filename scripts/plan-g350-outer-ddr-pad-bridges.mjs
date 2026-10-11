// Rebuild only DDR copper from real package pads. Incomplete output is never a board.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {routeGuardedOuterBridge} from './lib/g350-ddr-timing-detour-bridge.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
const [input,root,order='longest-first',gridText='.025']=process.argv.slice(2)
assert(input&&root&&!fs.existsSync(root)&&['longest-first','byte-first','command-first'].includes(order))
const gridMm=Number(gridText);assert([.025,.0125].includes(gridMm))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),inputSha=hash(input)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const names=new Map(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>[e.source_trace_id,e.name]));assert.equal(names.size,49)
const originals=base.filter(e=>e.type==='pcb_trace'&&names.has(e.source_trace_id));assert.equal(originals.length,49)
const selected=new Set(originals.map(t=>t.pcb_trace_id)),removed=new Set(base.filter(e=>e.type==='pcb_via'&&selected.has(e.pcb_trace_id)).map(e=>e.pcb_via_id))
const fixed=base.filter(e=>!(e.type==='pcb_trace'&&selected.has(e.pcb_trace_id))&&!(e.type==='pcb_via'&&removed.has(e.pcb_via_id)))
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const ports=new Map(base.filter(e=>e.type==='pcb_port').map(e=>[e.pcb_port_id,e.source_port_id]))
const counts=input=>{const c=structuredClone(input);const out=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](c).length]));out.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length;return out}
const zero=c=>Object.values(c).every(n=>n===0)
const initialCounts=counts(fixed);assert(zero(initialCounts),'Open host must pass physical checks before planning')
const shapesFor=c=>{
 const shapes=[],owners=new Map(c.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,find(e.source_trace_id)]))
 for(const p of c.filter(e=>e.type==='pcb_smtpad'&&Number.isFinite(e.x))){const w=p.width??2*p.radius,h=p.height??w;if(Number.isFinite(w)&&Number.isFinite(h))shapes.push({kind:p.shape==='circle'?'circle':'rect',x:p.x,y:p.y,w,h,layers:[p.layer],pad:true,viaOnly:!['top','bottom'].includes(p.layer),owner:find(ports.get(p.pcb_port_id)??p.pcb_smtpad_id)})}
 for(const v of c.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers:['top','bottom'],owner:owners.get(v.pcb_trace_id)??'FIXED_HOLE'})
 for(const t of c.filter(e=>e.type==='pcb_trace'))for(let i=1;i<t.route.length;i++){const a=t.route[i-1],b=t.route[i];if(a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer&&Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:b.width??.1016,layers:[a.layer],viaOnly:!['top','bottom'].includes(a.layer),owner:find(t.source_trace_id)})}
 return shapes
}
const distance=t=>Math.hypot(t.route[0].x-t.route.at(-1).x,t.route[0].y-t.route.at(-1).y),command=t=>!/^DDR_D(?:\d+|QS|QSn|QM)/.test(names.get(t.source_trace_id))
const ordered=[...originals].sort((a,b)=>(order==='byte-first'?Number(command(a))-Number(command(b)):order==='command-first'?Number(command(b))-Number(command(a)):0)||distance(b)-distance(a))
fs.mkdirSync(root);fs.copyFileSync('scripts/plan-g350-outer-ddr-pad-bridges.mjs',root+'/helper.executed.mjs');fs.copyFileSync('scripts/lib/g350-ddr-timing-detour-bridge.mjs',root+'/bridge.executed.mjs')
let circuit=structuredClone(fixed);const attempts=[]
for(const old of ordered){
 const a=old.route[0],b=old.route.at(-1);assert(a.layer==='top'&&b.layer==='top')
 const begun=performance.now(),result=routeGuardedOuterBridge({connection:{name:find(old.source_trace_id),pointsToConnect:[a,b]},shapes:shapesFor(circuit),searchBounds:{minX:-20,maxX:20,minY:-8,maxY:34},seconds:12,gridMm,maxVias:8,viaGrid:.025,routingLayers:['top','bottom'],viaCostMm:2,heuristicWeight:1.5,viaCopperClearance:.15,guardNonterminalOwnVias:true,primaryTerminalLayer:true})
 const record={name:names.get(old.source_trace_id),found:Boolean(result.route),elapsedSeconds:(performance.now()-begun)/1000,error:result.error??null,expanded:result.expanded,startBlocked:result.startBlocked,goalBlocked:result.goalBlocked,accepted:false}
 if(result.route){
  const route=structuredClone(result.route);route[0]=structuredClone(a);route[route.length-1]=structuredClone(b)
  assert(route.every(p=>p.route_type==='wire'?['top','bottom'].includes(p.layer):p.route_type==='via'&&['top','bottom'].includes(p.from_layer)&&['top','bottom'].includes(p.to_layer)&&p.from_layer!==p.to_layer))
  const next={...structuredClone(old),route};delete next.trace_length
  const vias=route.filter(p=>p.route_type==='via').map((p,i)=>({type:'pcb_via',pcb_via_id:'g350_outer_pad_bridge_'+old.pcb_trace_id+'_'+i,pcb_trace_id:old.pcb_trace_id,x:p.x,y:p.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:old.subcircuit_id}))
  const proposed=[...circuit,next,...vias];record.counts=counts(proposed);record.accepted=zero(record.counts);record.newVias=vias.length;record.nativeLengthMm=ddrRouteLength(route)
  if(record.accepted)circuit=proposed
 }
 attempts.push(record);console.log(JSON.stringify(record))
 fs.writeFileSync(root+'/progress.json',JSON.stringify({order,gridMm,attempted:attempts.length,accepted:attempts.filter(a=>a.accepted).length,required:49,attempts,planningOnly:true,fabricationReady:false},null,2)+'\n')
 fs.writeFileSync(root+'/incomplete-planning.circuit.json',JSON.stringify(circuit,null,2)+'\n')
}
assert.deepEqual(circuit.filter(e=>!(e.type==='pcb_trace'&&selected.has(e.pcb_trace_id))&&!(e.type==='pcb_via'&&selected.has(e.pcb_trace_id))),fixed,'Preserve every foreign trace, hole, pad, placement and logical constraint')
assert.equal(hash(input),inputSha)
const complete=attempts.every(a=>a.accepted),finalCounts=counts(circuit)
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:inputSha},order,gridMm,initialCounts,attempts,accepted:attempts.filter(a=>a.accepted).length,required:49,complete,counts:finalCounts,sourceGroundMatchingAndIndependentCadUnqualified:true,allForeignCopperAndPlacementExactlyPreserved:true,fabricationReady:false},null,2)+'\n')
if(complete)fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(circuit,null,2)+'\n')
process.exitCode=complete?0:2
