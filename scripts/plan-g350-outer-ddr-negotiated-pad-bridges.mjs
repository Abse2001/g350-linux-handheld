// Negotiated DDR-only planning. Soft staged conflicts must pass full checks before acceptance.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {routeGuardedOuterBridge} from './lib/g350-ddr-timing-detour-bridge.mjs'
import {g350HardSceneShapes} from './lib/g350-hard-scene-shapes.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
const [input,root,seedPath,roundText='3',order='longest-first',gridText='.025']=process.argv.slice(2)
assert(input&&root&&!fs.existsSync(root)&&['longest-first','byte-first','command-first'].includes(order))
const gridMm=Number(gridText);assert([.025,.0125].includes(gridMm))
const rounds=Number(roundText);assert(Number.isInteger(rounds)&&rounds>=1&&rounds<=6)
const penaltyBase=Number(process.env.G350_DDR_NEGOTIATION_STEP_PENALTY_MM??8)
assert(Number.isFinite(penaltyBase)&&penaltyBase>=.025&&penaltyBase<=8)
const routeSeconds=Number(process.env.G350_DDR_NEGOTIATION_ROUTE_SECONDS??6)
assert(Number.isFinite(routeSeconds)&&routeSeconds>=6&&routeSeconds<=60)
const localBounds=process.env.G350_DDR_NEGOTIATION_LOCAL_BOUNDS??'0';assert(['0','1'].includes(localBounds))
const rasterGuardMm=process.env.G350_DDR_NEGOTIATION_RASTER_GUARD_MM===undefined?undefined:Number(process.env.G350_DDR_NEGOTIATION_RASTER_GUARD_MM)
assert(rasterGuardMm===undefined||(Number.isFinite(rasterGuardMm)&&rasterGuardMm>=0&&rasterGuardMm<=gridMm*Math.SQRT1_2+1e-4))
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
const cpuReference=process.env.G350_DDR_CPU_ESCAPES_REFERENCE,escapes=new Map(),fixedEscapeShapes=[]
const ramReference=process.env.G350_DDR_RAM_ESCAPES_REFERENCE,ramEscapes=new Map(),referenceReservations=[]
let ramReferenceSha=null
const bothCpuOuterLayers=process.env.G350_DDR_CPU_ALLOW_BOTH_OUTER_LAYERS??'0';assert(['0','1'].includes(bothCpuOuterLayers));assert(bothCpuOuterLayers==='0'||cpuReference)
const guardOwnCpuCopper=process.env.G350_DDR_GUARD_OWN_CPU_COPPER??'0';assert(['0','1'].includes(guardOwnCpuCopper))
const pruneDominatedViaStates=process.env.G350_DDR_PRUNE_DOMINATED_VIA_STATES??'0';assert(['0','1'].includes(pruneDominatedViaStates))
// An unqualified warm start is only a rip-up planning input. It may never
// lock conflicting copper or bypass the unchanged final acceptance checks.
const unqualifiedWarmStart=process.env.G350_DDR_UNQUALIFIED_WARM_START??'0';assert(['0','1'].includes(unqualifiedWarmStart));assert(unqualifiedWarmStart==='0'||seedPath)
const onlyNames=process.env.G350_DDR_NEGOTIATION_ONLY_NAMES?JSON.parse(process.env.G350_DDR_NEGOTIATION_ONLY_NAMES):null;assert(onlyNames===null||(Array.isArray(onlyNames)&&onlyNames.length>0&&onlyNames.every(n=>[...names.values()].includes(n))))
const lockedNames=process.env.G350_DDR_NEGOTIATION_LOCKED_NAMES?JSON.parse(process.env.G350_DDR_NEGOTIATION_LOCKED_NAMES):[];assert(Array.isArray(lockedNames)&&new Set(lockedNames).size===lockedNames.length&&lockedNames.every(n=>[...names.values()].includes(n))&&(!lockedNames.length||seedPath))
const lockedOwners=new Set([...names].filter(([id,name])=>lockedNames.includes(name)).map(([id])=>find(id)))
assert(unqualifiedWarmStart==='0'||lockedNames.length===0,'Unqualified seed copper must remain eligible for rip-up')
let cpuReferenceSha=null
if(cpuReference){
 cpuReferenceSha=hash(cpuReference);const reference=JSON.parse(fs.readFileSync(cpuReference))
 for(const old of originals){
  const prior=reference.find(e=>e.type==='pcb_trace'&&e.source_trace_id===old.source_trace_id);assert(prior)
  assert.deepEqual(prior.route[0],old.route[0],'CPU pad must stay exact')
  const first=prior.route.findIndex(p=>p.route_type==='via');assert(first>0)
  const head=structuredClone(prior.route.slice(0,first+1));head.at(-1).to_layer='bottom'
  assert(head.slice(0,-1).every(p=>p.route_type==='wire'&&p.layer==='top'))
  const via=head.at(-1);escapes.set(old.pcb_trace_id,{head,via})
  const owner=find(old.source_trace_id)
  fixedEscapeShapes.push({kind:'circle',x:via.x,y:via.y,w:.4572,h:.4572,hole:.254,layers:['top','bottom'],owner,fixedEscape:true})
  for(let i=1;i<head.length;i++){const a=head[i-1],b=head[i];if(a.route_type==='wire'&&b.route_type==='wire'&&Math.hypot(a.x-b.x,a.y-b.y)>1e-8)fixedEscapeShapes.push({kind:'segment',a,b,w:b.width??.1016,layers:['top'],owner,fixedEscape:true})}
 }
}
if(ramReference){
 assert(cpuReference,'Joint package planning must also reserve the checked CPU approaches')
 ramReferenceSha=hash(ramReference);const reference=JSON.parse(fs.readFileSync(ramReference))
 const ram=base.find(e=>e.type==='pcb_component'&&base.some(s=>s.type==='source_component'&&s.name==='U_RAM'&&s.source_component_id===e.source_component_id));assert(ram)
 const ramPorts=new Set(base.filter(e=>e.type==='pcb_port'&&e.pcb_component_id===ram.pcb_component_id).map(e=>e.pcb_port_id))
 for(const old of originals){
  const end=old.route.at(-1),prior=reference.find(e=>e.type==='pcb_trace'&&e.source_trace_id===old.source_trace_id&&e.route[0].start_pcb_port_id===end.end_pcb_port_id);assert(prior)
  assert(Math.hypot(prior.route[0].x-end.x,prior.route[0].y-end.y)<1e-8,'RAM pad must stay exact')
  const first=prior.route.findIndex(p=>p.route_type==='via');assert(first>0)
  const head=structuredClone(prior.route.slice(0,first+1)),via=head.at(-1);via.to_layer='bottom';assert(head.slice(0,-1).every(p=>p.route_type==='wire'&&p.layer==='top'))
  ramEscapes.set(old.pcb_trace_id,{head,via})
  const owner=find(old.source_trace_id);fixedEscapeShapes.push({kind:'circle',x:via.x,y:via.y,w:.4572,h:.4572,hole:.254,layers:['top','bottom'],owner,fixedEscape:true})
  for(let i=1;i<head.length;i++){const a=head[i-1],b=head[i];if(a.route_type==='wire'&&b.route_type==='wire'&&Math.hypot(a.x-b.x,a.y-b.y)>1e-8)fixedEscapeShapes.push({kind:'segment',a,b,w:b.width??.1016,layers:['top'],owner,fixedEscape:true})}
 }
 const refs=reference.filter(e=>e.type==='pcb_trace'&&!names.has(e.source_trace_id)&&ramPorts.has(e.route[0]?.start_pcb_port_id));assert.equal(refs.length,42)
 const refIds=new Set(refs.map(t=>t.pcb_trace_id));referenceReservations.push(...structuredClone(reference.filter(e=>['pcb_trace','pcb_via'].includes(e.type)&&refIds.has(e.pcb_trace_id))))
 assert.equal(referenceReservations.length,84);assert(!fixed.some(e=>refIds.has(e.pcb_trace_id)))
 fixedEscapeShapes.push(...g350HardSceneShapes([...referenceReservations,...base.filter(e=>e.type==='pcb_port')],find,['top','bottom']))
}
let nativeDetails={}
// Reference fanouts are checked as actual copper for every physical gate.
// Their external supply branches are still absent: whole-board connectivity
// and source/CAD qualification remain mandatory after DDR planning.
const counts=input=>{const c=structuredClone(input),physical=structuredClone([...input,...referenceReservations]);nativeDetails=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](n==='checkTracesAreContiguous'?c:physical)]));nativeDetails.manufacturing=checkG350ViaTrackManufacturingClearance(physical.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e));return Object.fromEntries(Object.entries(nativeDetails).map(([n,e])=>[n,e.length]))}
const zero=c=>Object.values(c).every(n=>n===0)
const initialCounts=counts(fixed);assert(zero(initialCounts),'Open host must pass physical checks before planning')
let reservedCpuPhysicalCounts=null
if(cpuReference){
 const reserved=[...structuredClone(fixed)]
 for(const old of originals){const {head,via}=escapes.get(old.pcb_trace_id),id=old.pcb_trace_id+'_cpu_reserved';reserved.push({...structuredClone(old),pcb_trace_id:id,route:[...head,{route_type:'wire',x:via.x,y:via.y,layer:'bottom',width:.1016}]},{type:'pcb_via',pcb_via_id:id+'_via',pcb_trace_id:id,x:via.x,y:via.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:old.subcircuit_id})}
 for(const old of originals)if(ramEscapes.has(old.pcb_trace_id)){const {head,via}=ramEscapes.get(old.pcb_trace_id),id=old.pcb_trace_id+'_ram_reserved';reserved.push({...structuredClone(old),pcb_trace_id:id,route:[...head,{route_type:'wire',x:via.x,y:via.y,layer:'bottom',width:.1016}]},{type:'pcb_via',pcb_via_id:id+'_via',pcb_trace_id:id,x:via.x,y:via.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:old.subcircuit_id})}
 reserved.push(...structuredClone(referenceReservations))
 const checked=structuredClone(reserved);reservedCpuPhysicalCounts=Object.fromEntries(g350DdrPhysicalChecks.map(n=>[n,checks[n](checked).length]));reservedCpuPhysicalCounts.manufacturing=checkG350ViaTrackManufacturingClearance(checked.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length
 assert(zero(reservedCpuPhysicalCounts),'Every reserved CPU stub and physical hole must pass full physical checks')
}
const congestion=[]
const shapeNear=(s,p)=>{if(s.kind!=='segment')return Math.hypot(s.x-p.x,s.y-p.y);const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,f=Math.max(0,Math.min(1,((p.x-s.a.x)*dx+(p.y-s.a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(s.a.x+f*dx-p.x,s.a.y+f*dy-p.y)}
const shapesFor=c=>{
 const shapes=[],owners=new Map(c.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,find(e.source_trace_id)]))
 for(const p of c.filter(e=>e.type==='pcb_smtpad')){
  const polygon=p.shape==='polygon',xs=polygon?p.points.map(q=>q.x):[],ys=polygon?p.points.map(q=>q.y):[]
  const x=polygon?(Math.min(...xs)+Math.max(...xs))/2:p.x,y=polygon?(Math.min(...ys)+Math.max(...ys))/2:p.y
  const w=polygon?Math.max(...xs)-Math.min(...xs):p.width??2*p.radius,h=polygon?Math.max(...ys)-Math.min(...ys):p.height??w
  assert([x,y,w,h].every(Number.isFinite),'Every real pad must be modeled; polygon bounding boxes conservatively block routing')
  shapes.push({kind:p.shape==='circle'?'circle':'rect',x,y,w,h,layers:[p.layer],pad:true,viaOnly:!['top','bottom'].includes(p.layer),owner:find(ports.get(p.pcb_port_id)??p.pcb_smtpad_id)})
 }
 for(const v of c.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers:['top','bottom'],owner:owners.get(v.pcb_trace_id)??'FIXED_HOLE'})
 for(const t of c.filter(e=>e.type==='pcb_trace'))for(let i=1;i<t.route.length;i++){const a=t.route[i-1],b=t.route[i];if(a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer&&Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:b.width??.1016,layers:[a.layer],viaOnly:!['top','bottom'].includes(a.layer),owner:find(t.source_trace_id)})}
 // Only this planner's staged wires and holes may be negotiated. Real
 // package pads remain hard even when they belong to a DDR signal.
 return [...shapes.map(s=>!s.pad&&s.owner&&!lockedOwners.has(s.owner)&&[...names.keys()].some(id=>find(id)===s.owner)?{...s,soft:true,softWeight:1+Math.min(12,congestion.filter(p=>shapeNear(s,p)<.8).length)}:s),...fixedEscapeShapes]
}
const distance=t=>Math.hypot(t.route[0].x-t.route.at(-1).x,t.route[0].y-t.route.at(-1).y),command=t=>!/^DDR_D(?:\d+|QS|QSn|QM)/.test(names.get(t.source_trace_id))
const ordered=[...originals].filter(t=>!lockedNames.includes(names.get(t.source_trace_id))&&(!onlyNames||onlyNames.includes(names.get(t.source_trace_id)))).sort((a,b)=>(order==='byte-first'?Number(command(a))-Number(command(b)):order==='command-first'?Number(command(b))-Number(command(a)):0)||distance(b)-distance(a))
fs.mkdirSync(root);fs.copyFileSync('scripts/plan-g350-outer-ddr-negotiated-pad-bridges.mjs',root+'/helper.executed.mjs');fs.copyFileSync('scripts/lib/g350-ddr-timing-detour-bridge.mjs',root+'/bridge.executed.mjs')
fs.copyFileSync('scripts/lib/g350-hard-scene-shapes.mjs',root+'/scene-shapes.executed.mjs')
fs.writeFileSync(root+'/preflight.json',JSON.stringify({initialCounts,cpuReference,cpuReferenceSha,reservedCpuPhysicalCounts,allRealPadsAndCpuEscapesHard:true,missingRamReferences:true,planningOnly:true,fabricationReady:false},null,2)+'\n')
let circuit=structuredClone(fixed);const history=[];let lockedRecords=[],seedCounts=null
if(seedPath){
 const seed=JSON.parse(fs.readFileSync(seedPath));const scope=e=>!(e.type==='pcb_trace'&&selected.has(e.pcb_trace_id))&&!(e.type==='pcb_via'&&selected.has(e.pcb_trace_id))
 assert.deepEqual(seed.filter(scope),fixed)
 assert(seed.filter(e=>e.type==='pcb_trace'&&selected.has(e.pcb_trace_id)).every(t=>t.route.every(p=>p.route_type==='wire'?['top','bottom'].includes(p.layer):['top','bottom'].includes(p.from_layer)&&['top','bottom'].includes(p.to_layer))))
 circuit=structuredClone(seed);fs.writeFileSync(root+'/seed.circuit.json',JSON.stringify(seed)+'\n');fs.writeFileSync(root+'/seed-input.json',JSON.stringify({path:seedPath,sha256:hash(seedPath)},null,2)+'\n')
 const lockedIds=new Set(originals.filter(t=>lockedNames.includes(names.get(t.source_trace_id))).map(t=>t.pcb_trace_id))
 lockedRecords=structuredClone(circuit.filter(e=>['pcb_trace','pcb_via'].includes(e.type)&&lockedIds.has(e.pcb_trace_id)))
 assert.equal(lockedRecords.filter(e=>e.type==='pcb_trace').length,lockedNames.length)
 seedCounts=counts(circuit)
 if(unqualifiedWarmStart==='0')assert(zero(seedCounts),'Seeded locked routes must pass all physical and contiguity checks')
 else for(const error of Object.values(nativeDetails).flat())if(error.center&&Number.isFinite(error.center.x)&&Number.isFinite(error.center.y))congestion.push(error.center)
}
let complete=false,finalCounts
for(let round=0;round<rounds;round++){
 const attempts=[],penalty=Math.min(100,penaltyBase*2**round)
 const available=new Set(circuit.filter(e=>e.type==='pcb_trace'&&selected.has(e.pcb_trace_id)).map(t=>t.pcb_trace_id))
 const activeOrder=(round%2?[...ordered].reverse():[...ordered]).sort((a,b)=>Number(available.has(a.pcb_trace_id))-Number(available.has(b.pcb_trace_id)))
 for(const old of activeOrder){
 const previous=circuit.filter(e=>(e.type==='pcb_trace'&&e.pcb_trace_id===old.pcb_trace_id)||(e.type==='pcb_via'&&e.pcb_trace_id===old.pcb_trace_id))
 circuit=circuit.filter(e=>!previous.includes(e))
 const originalStart=old.route[0],originalEnd=old.route.at(-1);assert(originalStart.layer==='top'&&originalEnd.layer==='top')
 const ramEscape=ramEscapes.get(old.pcb_trace_id),b=ramEscape?{x:ramEscape.via.x,y:ramEscape.via.y,layer:'bottom'}:originalEnd
 const escape=escapes.get(old.pcb_trace_id),a=escape?{x:escape.via.x,y:escape.via.y,layer:'bottom'}:originalStart
 const bounds=localBounds==='0'?{minX:-20,maxX:20,minY:-8,maxY:34}:{minX:Math.max(-20,Math.floor((Math.min(a.x,b.x)-5)/.025)*.025),maxX:Math.min(20,Math.ceil((Math.max(a.x,b.x)+5)/.025)*.025),minY:Math.max(-8,Math.floor((Math.min(a.y,b.y)-5)/.025)*.025),maxY:Math.min(34,Math.ceil((Math.max(a.y,b.y)+5)/.025)*.025)}
 const begun=performance.now(),result=routeGuardedOuterBridge({connection:{name:find(old.source_trace_id),pointsToConnect:[a,b]},shapes:shapesFor(circuit),searchBounds:bounds,seconds:routeSeconds,gridMm,maxVias:8,viaGrid:.025,routingLayers:['top','bottom'],viaCostMm:2,heuristicWeight:1.5,overlapPenalty:penalty,viaCopperClearance:bothCpuOuterLayers==='1'?.254:.15,rasterGuardMm,guardNonterminalOwnVias:true,guardTerminalOwnerCopper:guardOwnCpuCopper==='1',pruneDominatedViaStates:pruneDominatedViaStates==='1',primaryTerminalLayer:true,...(escape&&bothCpuOuterLayers==='1'?{startTerminalLayers:['top','bottom']}:{}),...(ramEscape&&bothCpuOuterLayers==='1'?{goalTerminalLayers:['top','bottom']}:{})})
 const record={round,name:names.get(old.source_trace_id),found:Boolean(result.route),elapsedSeconds:(performance.now()-begun)/1000,error:result.error??null,expanded:result.expanded,startBlocked:result.startBlocked,goalBlocked:result.goalBlocked,softOverlapCost:result.overlapCost??null,staged:false}
 if(result.route){
  // A carrier that leaves on Top uses the verified Top stub without adding
  // an unused CPU barrel or a fictitious Top/Bottom transition.
  const prefix=escape?structuredClone(escape.head):[]
  if(escape&&result.route[0].layer==='top')prefix[prefix.length-1]={route_type:'wire',x:escape.via.x,y:escape.via.y,layer:'top',width:.1016}
  const route=escape?[...prefix,...structuredClone(result.route)]:structuredClone(result.route);if(!escape)route[0]=structuredClone(a)
  if(ramEscape){
   if(route.at(-1).layer==='bottom')route.push({...structuredClone(ramEscape.via),from_layer:'bottom',to_layer:'top'})
   route.push(...structuredClone(ramEscape.head.slice(0,-1)).reverse());route[route.length-1]=structuredClone(originalEnd)
  }else route[route.length-1]=structuredClone(originalEnd)
  assert(route.every(p=>p.route_type==='wire'?['top','bottom'].includes(p.layer):p.route_type==='via'&&['top','bottom'].includes(p.from_layer)&&['top','bottom'].includes(p.to_layer)&&p.from_layer!==p.to_layer))
  const next={...structuredClone(old),route};delete next.trace_length
  const vias=route.filter(p=>p.route_type==='via').map((p,i)=>({type:'pcb_via',pcb_via_id:'g350_outer_pad_bridge_'+old.pcb_trace_id+'_'+i,pcb_trace_id:old.pcb_trace_id,x:p.x,y:p.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:old.subcircuit_id}))
  record.staged=true;record.newVias=vias.length;record.nativeLengthMm=ddrRouteLength(route)
  circuit=[...circuit,next,...vias]
 }
 else circuit.push(...previous)
 attempts.push(record);console.log(JSON.stringify(record))
 fs.writeFileSync(root+'/progress.json',JSON.stringify({order,gridMm,round,penalty,attempted:attempts.length,staged:attempts.filter(a=>a.staged).length,carriers:circuit.filter(e=>e.type==='pcb_trace'&&selected.has(e.pcb_trace_id)).length,required:49,attempts,planningOnly:true,physicallyAccepted:false,fabricationReady:false},null,2)+'\n')
 fs.writeFileSync(root+'/incomplete-planning.circuit.json',JSON.stringify(circuit,null,2)+'\n')
 }
 finalCounts=counts(circuit);complete=circuit.filter(e=>e.type==='pcb_trace'&&selected.has(e.pcb_trace_id)).length===49&&zero(finalCounts)
 const record={round,penalty,attempts,counts:finalCounts,nativeDetails:structuredClone(nativeDetails),complete};history.push(record)
 for(const error of Object.values(nativeDetails).flat())if(error.center&&Number.isFinite(error.center.x)&&Number.isFinite(error.center.y))congestion.push(error.center)
 fs.writeFileSync(root+'/round-'+round+'.json',JSON.stringify(record,null,2)+'\n');fs.writeFileSync(root+'/round-'+round+'.circuit.json',JSON.stringify(circuit,null,2)+'\n')
 if(complete)break
}
assert.deepEqual(circuit.filter(e=>!(e.type==='pcb_trace'&&selected.has(e.pcb_trace_id))&&!(e.type==='pcb_via'&&selected.has(e.pcb_trace_id))),fixed,'Preserve every foreign trace, hole, pad, placement and logical constraint')
assert.equal(hash(input),inputSha)
if(cpuReference)assert.equal(hash(cpuReference),cpuReferenceSha)
if(ramReference)assert.equal(hash(ramReference),ramReferenceSha)
const lockedIds=new Set(lockedRecords.filter(e=>e.type==='pcb_trace').map(e=>e.pcb_trace_id));assert.deepEqual(circuit.filter(e=>['pcb_trace','pcb_via'].includes(e.type)&&lockedIds.has(e.pcb_trace_id)),lockedRecords,'Preserve checked locked signal paths and holes exactly')
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:inputSha},order,gridMm,penaltyBase,routeSeconds,localBounds,rasterGuardMm,cpuReference,cpuReferenceSha,ramReference,ramReferenceSha,referenceFanoutsIncludedInPhysicalChecks:referenceReservations.length/2,bothCpuOuterLayers,guardOwnCpuCopper,pruneDominatedViaStates,unqualifiedWarmStart,seedCounts,onlyNames,lockedNames,reservedCpuPhysicalCounts,realPackagePadsAlwaysHard:true,initialCounts,history,carriers:circuit.filter(e=>e.type==='pcb_trace'&&selected.has(e.pcb_trace_id)).length,required:49,complete,counts:finalCounts,sourceGroundMatchingAndIndependentCadUnqualified:true,allForeignCopperAndPlacementExactlyPreserved:true,fabricationReady:false},null,2)+'\n')
if(complete)fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(circuit,null,2)+'\n')
process.exitCode=complete?0:2
