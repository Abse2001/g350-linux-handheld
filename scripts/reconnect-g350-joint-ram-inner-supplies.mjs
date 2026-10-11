// Extend jointly checked RAM fanouts to existing supply copper on inner layers.
// DDR fanouts are fixed; this is not complete DDR or whole-board qualification.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {routeGuardedOuterBridge} from './lib/g350-ddr-timing-detour-bridge.mjs'
import {g350HardSceneShapes} from './lib/g350-hard-scene-shapes.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,root,mode]=process.argv.slice(2);assert(input&&root&&!fs.existsSync(root)&&['power','ground','vref'].includes(mode))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),inputSha=hash(input)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const source=base.find(e=>e.type==='source_trace'&&e.name===({power:'U_SOC_VDDS_DDR_E5',ground:'U_SOC_VSS_A1',vref:'U_SOC_DDR_VREF_J4'}[mode]));assert(source)
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const ram=base.find(e=>e.type==='pcb_component'&&base.some(s=>s.type==='source_component'&&s.name==='U_RAM'&&s.source_component_id===e.source_component_id));assert(ram)
const ports=base.filter(e=>e.type==='pcb_port'&&e.pcb_component_id===ram.pcb_component_id&&find(e.source_port_id)===find(source.source_trace_id))
assert.equal(ports.length,{power:18,ground:21,vref:2}[mode])
const fanouts=ports.map(p=>{const ts=base.filter(e=>e.type==='pcb_trace'&&e.route[0]?.start_pcb_port_id===p.pcb_port_id);assert.equal(ts.length,1);return ts[0]})
const ramTraceIds=new Set(base.filter(e=>e.type==='pcb_trace'&&ports.some(p=>e.route[0]?.start_pcb_port_id===p.pcb_port_id)).map(t=>t.pcb_trace_id))
const allRamTraceIds=new Set(base.filter(e=>e.type==='pcb_trace'&&base.some(p=>p.type==='pcb_port'&&p.pcb_component_id===ram.pcb_component_id&&p.pcb_port_id===e.route[0]?.start_pcb_port_id)).map(t=>t.pcb_trace_id))
const owners=new Map(base.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,find(e.source_trace_id)]))
const targets=base.filter(e=>e.type==='pcb_via'&&!allRamTraceIds.has(e.pcb_trace_id)&&owners.get(e.pcb_trace_id)===find(source.source_trace_id)&&['inner1','inner2'].every(l=>e.layers.includes(l))&&['x','y'].every(k=>Math.abs(e[k]/.025-Math.round(e[k]/.025))<1e-6));assert(targets.length)
const native=c=>{const details=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](structuredClone(c))]));details.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e));return {details,counts:Object.fromEntries(Object.entries(details).map(([k,v])=>[k,v.length]))}}
const preflight=native(base);assert(Object.values(preflight.counts).every(n=>n===0),'Joint package input must pass every physical gate')
fs.mkdirSync(root);fs.copyFileSync('scripts/reconnect-g350-joint-ram-inner-supplies.mjs',root+'/helper.executed.mjs');fs.copyFileSync('scripts/lib/g350-ddr-timing-detour-bridge.mjs',root+'/bridge.executed.mjs');fs.copyFileSync('scripts/lib/g350-hard-scene-shapes.mjs',root+'/scene-shapes.executed.mjs')
let circuit=structuredClone(base);const attempts=[],addedViaIds=new Set()
for(const old of fanouts){
 const oldVia=old.route.find(p=>p.route_type==='via');assert(oldVia&&old.route.at(-1).layer==='bottom');assert.equal(old.route.filter(p=>p.route_type==='via').length,1)
 const start={route_type:'wire',x:oldVia.x,y:oldVia.y,layer:'inner1',width:.1016}
 const chosen=targets.toSorted((a,b)=>Math.hypot(a.x-start.x,a.y-start.y)-Math.hypot(b.x-start.x,b.y-start.y)).slice(0,6)
 let accepted=null;const trials=[]
 for(const target of chosen){
  const end={route_type:'wire',x:target.x,y:target.y,layer:'inner1',width:.1016}
  const shapes=g350HardSceneShapes(circuit,find,['inner1','inner2'])
  const result=routeGuardedOuterBridge({connection:{name:find(old.source_trace_id),pointsToConnect:[start,end]},shapes,searchBounds:{minX:Math.floor((Math.min(start.x,end.x)-4)/.025)*.025,maxX:Math.ceil((Math.max(start.x,end.x)+4)/.025)*.025,minY:Math.floor((Math.min(start.y,end.y)-4)/.025)*.025,maxY:Math.ceil((Math.max(start.y,end.y)+4)/.025)*.025},seconds:12,gridMm:.025,maxVias:4,viaGrid:.025,routingLayers:['inner1','inner2'],viaCopperClearance:.254,primaryTerminalLayer:true,startTerminalLayers:['inner1','inner2'],goalTerminalLayers:['inner1','inner2'],pruneDominatedViaStates:true})
  trials.push({targetViaId:target.pcb_via_id,found:Boolean(result.route),error:result.error??null,expanded:result.expanded})
  if(result.route){accepted={route:result.route,target};break}
 }
 const record={pcb_trace_id:old.pcb_trace_id,startPortId:old.route[0].start_pcb_port_id,staged:Boolean(accepted),trials}
 if(accepted){
  const prefix=structuredClone(old.route.slice(0,old.route.findIndex(p=>p.route_type==='via')))
  const route=[...prefix,{...structuredClone(oldVia),to_layer:accepted.route[0].layer},...structuredClone(accepted.route)]
  const next={...structuredClone(old),route};delete next.trace_length
  circuit=circuit.map(e=>e.type==='pcb_trace'&&e.pcb_trace_id===old.pcb_trace_id?next:e)
  for(const [i,v]of accepted.route.filter(p=>p.route_type==='via').entries()){
   const id='g350_ram_inner_supply_'+old.pcb_trace_id+'_'+i;addedViaIds.add(id)
   circuit.push({type:'pcb_via',pcb_via_id:id,pcb_trace_id:old.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:old.subcircuit_id})
  }
  record.externalTargetViaId=accepted.target.pcb_via_id
 }
 attempts.push(record);fs.writeFileSync(root+'/progress.json',JSON.stringify({mode,attempted:attempts.length,staged:attempts.filter(a=>a.staged).length,required:ports.length,attempts,planningOnly:true,fabricationReady:false},null,2)+'\n');fs.writeFileSync(root+'/incomplete-reference-planning.circuit.json',JSON.stringify(circuit,null,2)+'\n')
}
const foreign=e=>!(e.type==='pcb_trace'&&ramTraceIds.has(e.pcb_trace_id))&&!(e.type==='pcb_via'&&addedViaIds.has(e.pcb_via_id))
assert.deepEqual(circuit.filter(foreign),base.filter(foreign),'Every DDR fanout, foreign trace, original hole and logical constraint remains exact')
assert.equal(hash(input),inputSha)
const checked=native(circuit),staged=attempts.filter(a=>a.staged).length,passed=staged===ports.length&&Object.values(checked.counts).every(n=>n===0)
const netErrors=checks.checkTracesAreContiguous(structuredClone(circuit)).filter(e=>find(e.source_trace_id)===find(source.source_trace_id))
fs.writeFileSync(root+'/reference-planning.circuit.json',JSON.stringify(circuit,null,2)+'\n')
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:inputSha},mode,preflightCounts:preflight.counts,attempts,staged,required:ports.length,counts:checked.counts,details:checked.details,allRequestedReferenceApproachesPhysicalPassed:passed,canonicalSupplyNativeContiguityErrors:netErrors,allOriginalHolesAndDdrFanoutsPreserved:true,completeDdrCarriersByInputTopology:circuit.filter(t=>t.type==='pcb_trace'&&t.route[0]?.start_pcb_port_id&&t.route.at(-1)?.end_pcb_port_id&&base.some(s=>s.type==='source_trace'&&s.source_trace_id===t.source_trace_id&&s.name?.startsWith('DDR_'))).length,wholeBoardSourceGroundMatchingAndCadUnqualified:true,fabricationReady:false},null,2)+'\n');process.exitCode=passed?0:2
