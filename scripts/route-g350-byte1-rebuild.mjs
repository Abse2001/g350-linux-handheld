// Manual fallback after the retained native bus-lanes attempt. Incomplete
// bytes are planning evidence only; every accepted channel has its real pads,
// actual full-depth barrels and unchanged complete native physical checks.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {routeGuardedOuterBridge} from './lib/g350-ddr-timing-detour-bridge.mjs'
import {normalizeOneG350DdrRoute} from './lib/g350-one-ddr-route-normalizer.mjs'
import {tuneOneG350DdrTrace,ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [base,root,namesText='DDR_D9',prior]=process.argv.slice(2);assert(base&&root&&!fs.existsSync(root));fs.mkdirSync(root)
const prep=JSON.parse(fs.readFileSync(base+'/preparation.json'));assert.equal(prep.physicalErrors,0)
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
for(const a of prep.files)assert.equal(hash(a.path),a.sha256)
let c=JSON.parse(fs.readFileSync((prior??base)+'/candidate.circuit.json')),initial=structuredClone(c)
const names=namesText.split(','),busGoal=prep.goalNativeMm;assert(names.length&&new Set(names).size===names.length)
const carrierOnlyText=process.env.G350_REBUILD_CARRIER_ONLY
assert(carrierOnlyText===undefined||['0','1'].includes(carrierOnlyText))
const carrierOnly=carrierOnlyText==='1'
const freeTerminalsText=process.env.G350_REBUILD_FREE_BARREL_TERMINALS
assert(freeTerminalsText===undefined||['0','1'].includes(freeTerminalsText))
const freeTerminals=freeTerminalsText==='1'
const movableText=process.env.G350_REBUILD_MOVABLE_TERMINAL_VIAS
assert(movableText===undefined||['0','1'].includes(movableText))
const movableTerminals=movableText==='1'
const fullPadText=process.env.G350_REBUILD_FULL_PAD_ACCESS
assert(fullPadText===undefined||['0','1'].includes(fullPadText))
const fullPadAccess=fullPadText==='1';assert(!fullPadAccess||movableTerminals)
const priorRecord=prior?JSON.parse(fs.readFileSync(prior+'/report.json')):null
const original=JSON.parse(fs.readFileSync(base+'/candidate.circuit.json'))
for(const type of ['source_trace','source_bus','source_net','source_port','source_component','pcb_component','pcb_smtpad','pcb_port','pcb_board','pcb_hole','pcb_plated_hole'])assert.deepEqual(c.filter(e=>e.type===type),original.filter(e=>e.type===type))
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of c.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const bus=c.find(e=>e.type==='source_bus'&&e.name==='DDR_BYTE1'),namesById=new Map(c.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e.name]))
assert(names.every(n=>bus.source_trace_ids.some(id=>namesById.get(id)===n)))
const physical=j=>{const counts=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkPcbRoutingConstraints','checkTracesAreContiguous','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](j).length]));counts.manufacturing=checkG350ViaTrackManufacturingClearance(j.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length;const ids=j.filter(e=>e.type==='pcb_via').map(e=>e.pcb_via_id);counts.duplicateViaIds=ids.length-new Set(ids).size;return counts}
const ports=new Map(c.filter(e=>e.type==='pcb_port').map(e=>[e.pcb_port_id,e.source_port_id]))
const attempts=[],solved=priorRecord?structuredClone(priorRecord.solved):[];const layers=['inner2','inner1','bottom','top'],bounds={minX:-16,maxX:16,minY:-6,maxY:30}
for(const done of solved){const sid=c.find(e=>e.type==='source_trace'&&e.name===done.name).source_trace_id,traces=c.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===sid);assert.equal(traces.length,1);assert(Math.abs(ddrRouteLength(traces[0].route)-done.nativeLengthMm)<1e-8)}
assert(Object.values(physical(c)).every(n=>n===0))
for(const p of ['scripts/route-g350-byte1-rebuild.mjs','scripts/lib/g350-one-ddr-route-normalizer.mjs','scripts/lib/g350-full-board-length-tuning.mjs','scripts/lib/g350-ddr-timing-detour-bridge.mjs','scripts/lib/g350-ddr-planar-planning-validator.mjs'])fs.copyFileSync(p,root+'/'+p.replaceAll('/','__'))
const persist=()=>{fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n');fs.writeFileSync(root+'/report.json',JSON.stringify({base:{path:base+'/preparation.json',sha256:hash(base+'/preparation.json')},prior:prior?{path:prior+'/candidate.circuit.json',sha256:hash(prior+'/candidate.circuit.json')}:null,goalNativeMm:busGoal,carrierOnly,candidateSha256:hash(root+'/candidate.circuit.json'),attempts,solved,openChannels:11-solved.length,planningOnly:true,completeSourceBusAndPairLimitsRetained:true,requiresCompleteByteFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n')}
for(const name of names){
 if(solved.some(e=>e.name===name))continue
 const partner=name==='DDR_DQS1'?'DDR_DQSn1':name==='DDR_DQSn1'?'DDR_DQS1':null,goal=solved.find(e=>e.name===partner)?.nativeLengthMm??busGoal,tolerance=partner?0.05:0.5
 const s=c.find(e=>e.type==='source_trace'&&e.name===name),own=find(s.source_trace_id),escapes=c.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===s.source_trace_id);assert.equal(escapes.length,2)
 const cpu=escapes.find(e=>e.pcb_trace_id.startsWith('g350_byte1_cpu_')),ram=escapes.find(e=>e!==cpu);assert(cpu&&ram)
 const eid=new Set(escapes.map(e=>e.pcb_trace_id)),owners=new Map(c.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,find(e.source_trace_id)])),shapes=[]
 for(const p of c.filter(e=>e.type==='pcb_smtpad'&&Number.isFinite(e.x))){const w=p.width??2*p.radius,h=p.height??w;assert(Number.isFinite(w)&&Number.isFinite(h));shapes.push({kind:p.shape==='circle'?'circle':'rect',x:p.x,y:p.y,w,h,layers:[p.layer],pad:true,owner:find(ports.get(p.pcb_port_id)??p.pcb_smtpad_id)})}
 for(const v of c.filter(e=>e.type==='pcb_via'&&!(movableTerminals&&eid.has(e.pcb_trace_id))))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers,owner:owners.get(v.pcb_trace_id)})
 for(const t of c.filter(e=>e.type==='pcb_trace'))for(let i=1;i<t.route.length;i++){const a=t.route[i-1],b=t.route[i];if(a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer&&Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:b.width??a.width,layers:[a.layer],owner:find(t.source_trace_id)})}
 let accepted=false
 for(const primary of movableTerminals?['top']:freeTerminals?['mixed','inner2','inner1','bottom']:['inner2','inner1','bottom']){
  const terminals=[cpu,ram].map(p=>({...p.route.at(fullPadAccess?0:movableTerminals?-3:-1),layer:primary==='mixed'?'inner2':primary})),r=routeGuardedOuterBridge({connection:{name:own,pointsToConnect:terminals},shapes,searchBounds:bounds,seconds:20,gridMm:.025,maxVias:movableTerminals?6:4,viaGrid:.025,routingLayers:layers,viaCopperClearance:.15,rasterGuardMm:0,guardNonterminalOwnVias:true,primaryTerminalLayer:true,...(primary==='mixed'?{startTerminalLayers:['inner2','inner1','bottom'],goalTerminalLayers:['inner2','inner1','bottom']}:{})})
  const record={name,primary,error:r.error??null,expanded:r.expanded,accepted:false};attempts.push(record)
  if(!r.route){console.log(JSON.stringify(record));continue}
  console.log(JSON.stringify({name,primary,stage:'guarded-carrier',newFullDepthVias:r.newVias,planarCarrierLengthMm:r.lengthMm,expanded:r.expanded}))
  const v=structuredClone(c).filter(e=>!(e.type==='pcb_trace'&&eid.has(e.pcb_trace_id))&&!(e.type==='pcb_via'&&eid.has(e.pcb_trace_id)))
  const head=structuredClone(fullPadAccess?[cpu.route[0]]:cpu.route.slice(0,movableTerminals?-2:-1)),tail=structuredClone(fullPadAccess?[ram.route[0]]:ram.route.slice(0,movableTerminals?-2:-1)).reverse().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:p)
  if(!movableTerminals){head.at(-1).to_layer=r.route[0].layer;tail[0].from_layer=r.route.at(-1).layer}
  tail.at(-1).end_pcb_port_id=tail.at(-1).start_pcb_port_id;delete tail.at(-1).start_pcb_port_id
  const t={...cpu,pcb_trace_id:cpu.pcb_trace_id.replace('g350_byte1_cpu_',''),route:[...head,...r.route,...tail]};delete t.trace_length;delete t.connection_name
  record.rawLengthMm=ddrRouteLength(t.route);record.bypassEdits=normalizeOneG350DdrRoute(t)
  const oldVias=c.filter(e=>e.type==='pcb_via'&&eid.has(e.pcb_trace_id))
  v.push(t)
  for(const [i,p]of t.route.filter(p=>p.route_type==='via').entries()){assert(p.from_layer!==p.to_layer);const known=oldVias.find(e=>Math.hypot(e.x-p.x,e.y-p.y)<1e-8);v.push(known?{...known,pcb_trace_id:t.pcb_trace_id}:{type:'pcb_via',pcb_via_id:'g350_rebuild_'+s.source_trace_id+'_'+i,pcb_trace_id:t.pcb_trace_id,x:p.x,y:p.y,outer_diameter:.4572,hole_diameter:.254,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:t.subcircuit_id})}
  record.preTuningCounts=physical(v);record.normalizedLengthMm=ddrRouteLength(t.route)
  console.log(JSON.stringify({name,primary,stage:'physical-seed',nativeLengthMm:record.normalizedLengthMm,counts:record.preTuningCounts}))
  if(Object.values(record.preTuningCounts).some(n=>n)){fs.writeFileSync(root+'/rejected-'+attempts.length+'.circuit.json',JSON.stringify(v,null,2)+'\n');console.log(JSON.stringify(record));continue}
  const untunedCarrierPayload=carrierOnly?JSON.stringify(v):null
  const validator=carrierOnly?null:createG350PlanarPlanningValidator(v)
  const startingViaRecords=JSON.stringify(v.filter(e=>e.type==='pcb_via'))
  const tuneGuard=(j,target)=>JSON.stringify(j.filter(e=>e.type==='pcb_via'))===startingViaRecords?validator.validate(j,target):Object.values(physical(j)).every(n=>n===0)
  const savedSimplify=process.env.G350_LENGTH_SIMPLIFY_SECONDS
  if(ddrRouteLength(t.route)>goal+.05)process.env.G350_LENGTH_SIMPLIFY_SECONDS='4'
  const tuning=carrierOnly?{found:false,skippedForCompleteCarrierPlanning:true}:tuneOneG350DdrTrace(v,t,goal,12,{planningValidator:tuneGuard});record.tuning=tuning
  if(savedSimplify===undefined)delete process.env.G350_LENGTH_SIMPLIFY_SECONDS;else process.env.G350_LENGTH_SIMPLIFY_SECONDS=savedSimplify
  if(!carrierOnly&&!tuning.found){for(let step=0;step<60&&goal-ddrRouteLength(t.route)>tolerance;step++){const original=structuredClone(t.route),priorLength=ddrRouteLength(original);let found=false;for(const delta of [6,3,1.2,.6,.3,.1,.05,.02]){t.route=structuredClone(original);const rr=tuneOneG350DdrTrace(v,t,Math.min(goal,priorLength+delta),3,{planningValidator:tuneGuard});if(rr.found&&ddrRouteLength(t.route)>priorLength+.005){found=true;break}}console.log(JSON.stringify({name,stage:'incremental-length',step,nativeLengthMm:ddrRouteLength(t.route),found}));if(!found){t.route=original;break}}}
  record.finalLengthMm=ddrRouteLength(t.route)
  if(carrierOnly)assert.equal(JSON.stringify(v),untunedCarrierPayload)
  record.finalPhysicalCounts=carrierOnly?{...record.preTuningCounts}:physical(v)
  record.accepted=Object.values(record.finalPhysicalCounts).every(n=>n===0)&&(carrierOnly||Math.abs(record.finalLengthMm-goal)<tolerance)
  const unchanged=j=>j.filter(e=>!(e.type==='pcb_trace'&&e.source_trace_id===s.source_trace_id)&&!(e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id||e.type==='pcb_via'&&eid.has(e.pcb_trace_id)))
  assert.deepEqual(unchanged(v),unchanged(c))
  fs.writeFileSync(root+'/trial-'+attempts.length+'.circuit.json',JSON.stringify(v,null,2)+'\n')
  console.log(JSON.stringify(record))
  if(record.accepted){c=v;accepted=true;solved.push({name,nativeLengthMm:record.finalLengthMm});break}
 }
 persist();console.log(JSON.stringify({name,accepted,completed:solved.length,required:11}))
}
const f=j=>j.filter(e=>!(e.type==='pcb_trace'&&bus.source_trace_ids.includes(e.source_trace_id))&&!(e.type==='pcb_via'&&j.some(t=>t.type==='pcb_trace'&&t.pcb_trace_id===e.pcb_trace_id&&bus.source_trace_ids.includes(t.source_trace_id))))
assert.deepEqual(f(c),f(initial));persist()
