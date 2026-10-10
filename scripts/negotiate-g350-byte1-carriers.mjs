// Joint manual planning after retained native BusLanes attempts. Only newly
// staged byte1 middle copper is soft during search. Actual source pads,
// original escape barrels and all other routed nets remain hard obstacles.
// Soft proposals never qualify physical connectivity; complete checks gate
// each retained whole-byte result, then source/ground/CAD/Gerber are mandatory.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {routeGuardedOuterBridge} from './lib/g350-ddr-timing-detour-bridge.mjs'
import {normalizeOneG350DdrRoute} from './lib/g350-one-ddr-route-normalizer.mjs'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [base,seed,root,passesText='5']=process.argv.slice(2),passes=Number(passesText)
assert(base&&seed&&root&&!fs.existsSync(root)&&Number.isInteger(passes)&&passes>0&&passes<=8);fs.mkdirSync(root)
const read=p=>JSON.parse(fs.readFileSync(p)),hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const prep=read(base+'/preparation.json');assert.equal(prep.physicalErrors,0);for(const p of prep.files)assert.equal(hash(p.path),p.sha256)
const original=read(base+'/candidate.circuit.json'),donor=read(seed+'/candidate.circuit.json'),bus=original.find(e=>e.type==='source_bus'&&e.name==='DDR_BYTE1'),ids=new Set(bus.source_trace_ids)
assert.equal(ids.size,11);assert.equal(bus.max_length_skew,.635)
for(const type of ['source_trace','source_bus','source_net','source_port','source_component','pcb_component','pcb_smtpad','pcb_port','pcb_board','pcb_hole','pcb_plated_hole'])assert.deepEqual(original.filter(e=>e.type===type),donor.filter(e=>e.type===type))
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of original.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const sources=original.filter(e=>e.type==='source_trace'&&ids.has(e.source_trace_id)),ports=new Map(original.filter(e=>e.type==='pcb_port').map(e=>[e.pcb_port_id,e.source_port_id])),layers=['inner2','inner1','bottom','top'],bounds={minX:-16,maxX:16,minY:-6,maxY:30}
const prefixes=new Map(sources.map(s=>{const ts=original.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===s.source_trace_id);assert.equal(ts.length,2);const cpu=ts.find(e=>e.pcb_trace_id.startsWith('g350_byte1_cpu_')),ram=ts.find(e=>e!==cpu);assert(cpu&&ram);return [s.source_trace_id,{cpu,ram}]}))
const staged=new Map()
for(const s of sources){const ts=donor.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===s.source_trace_id);if(ts.length===1){const t=structuredClone(ts[0]),{cpu,ram}=prefixes.get(s.source_trace_id),first=t.route.findIndex(p=>p.route_type==='via'),last=t.route.findLastIndex(p=>p.route_type==='via');assert(first>0&&last>first);assert(Math.hypot(t.route[first].x-cpu.route.at(-1).x,t.route[first].y-cpu.route.at(-1).y)<1e-8);assert(Math.hypot(t.route[last].x-ram.route.at(-1).x,t.route[last].y-ram.route.at(-1).y)<1e-8);staged.set(s.source_trace_id,t)}}
const owners=new Map(original.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,find(e.source_trace_id)])),fixed=[]
const addSegments=(shapes,t,soft=false)=>{for(let i=1;i<t.route.length;i++){const a=t.route[i-1],b=t.route[i];if(a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer&&Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:b.width??a.width,layers:[a.layer],owner:find(t.source_trace_id),soft})}}
for(const p of original.filter(e=>e.type==='pcb_smtpad'&&Number.isFinite(e.x))){const w=p.width??2*p.radius,h=p.height??w;assert(Number.isFinite(w)&&Number.isFinite(h));fixed.push({kind:p.shape==='circle'?'circle':'rect',x:p.x,y:p.y,w,h,layers:[p.layer],pad:true,owner:find(ports.get(p.pcb_port_id)??p.pcb_smtpad_id)})}
const originalVias=original.filter(e=>e.type==='pcb_via'),fixedViaCoords=new Set(originalVias.map(v=>v.x.toFixed(8)+','+v.y.toFixed(8)))
for(const v of originalVias)fixed.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers,owner:owners.get(v.pcb_trace_id)})
for(const t of original.filter(e=>e.type==='pcb_trace'))addSegments(fixed,t)
const canonicalize=(s,bridge)=>{
 const {cpu,ram}=prefixes.get(s.source_trace_id),head=structuredClone(cpu.route.slice(0,-1)),tail=structuredClone(ram.route.slice(0,-1)).reverse().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:p)
 head.at(-1).to_layer=bridge[0].layer;tail[0].from_layer=bridge.at(-1).layer;tail.at(-1).end_pcb_port_id=tail.at(-1).start_pcb_port_id;delete tail.at(-1).start_pcb_port_id
 const t={...cpu,pcb_trace_id:cpu.pcb_trace_id.replace('g350_byte1_cpu_',''),route:[...head,...bridge,...tail]};delete t.trace_length;delete t.connection_name;normalizeOneG350DdrRoute(t);return t
}
const build=()=>{
 const prefixIds=new Set(original.filter(e=>e.type==='pcb_trace'&&ids.has(e.source_trace_id)&&staged.has(e.source_trace_id)).map(e=>e.pcb_trace_id)),c=structuredClone(original).filter(e=>!(e.type==='pcb_trace'&&prefixIds.has(e.pcb_trace_id))&&!(e.type==='pcb_via'&&prefixIds.has(e.pcb_trace_id)))
 for(const [id,t]of staged){c.push(structuredClone(t));const own=new Set([prefixes.get(id).cpu.pcb_trace_id,prefixes.get(id).ram.pcb_trace_id]);for(const [i,p]of t.route.filter(p=>p.route_type==='via').entries()){const old=originalVias.find(v=>own.has(v.pcb_trace_id)&&Math.hypot(v.x-p.x,v.y-p.y)<1e-8);c.push(old?{...old,pcb_trace_id:t.pcb_trace_id}:{type:'pcb_via',pcb_via_id:'g350_negotiated_'+id+'_'+i,pcb_trace_id:t.pcb_trace_id,x:p.x,y:p.y,outer_diameter:.4572,hole_diameter:.254,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:t.subcircuit_id})}}
 return c
}
const physical=c=>{const counts=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkPcbRoutingConstraints','checkTracesAreContiguous','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](c).length]));counts.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length;return counts}
const foreign=c=>{const own=new Set(c.filter(e=>e.type==='pcb_trace'&&ids.has(e.source_trace_id)).map(e=>e.pcb_trace_id));return c.filter(e=>!(e.type==='pcb_trace'&&ids.has(e.source_trace_id))&&!(e.type==='pcb_via'&&own.has(e.pcb_trace_id)))}
assert.deepEqual(foreign(donor),foreign(original))
const attempts=[],sweeps=[]
for(const p of ['scripts/negotiate-g350-byte1-carriers.mjs','scripts/lib/g350-ddr-timing-detour-bridge.mjs','scripts/lib/g350-one-ddr-route-normalizer.mjs','scripts/lib/g350-full-board-length-tuning.mjs','scripts/lib/g350-ddr-physical-checks.mjs'])fs.copyFileSync(p,root+'/'+p.replaceAll('/','__'))
for(let pass=0;pass<passes;pass++){
 const penalty=Math.min(64,2**(pass+1)),order=[...sources].sort((a,b)=>Number(staged.has(a.source_trace_id))-Number(staged.has(b.source_trace_id))||((ddrRouteLength(staged.get(b.source_trace_id)?.route??[])||0)-(ddrRouteLength(staged.get(a.source_trace_id)?.route??[])||0)))
 for(const s of order){
  const shapes=[...fixed]
  for(const [id,t]of staged)if(id!==s.source_trace_id){const first=t.route.findIndex(p=>p.route_type==='via'),last=t.route.findLastIndex(p=>p.route_type==='via');addSegments(shapes,{...t,route:t.route.slice(first+1,last)},true);for(const p of t.route.filter(p=>p.route_type==='via'))if(!fixedViaCoords.has(p.x.toFixed(8)+','+p.y.toFixed(8)))shapes.push({kind:'circle',x:p.x,y:p.y,w:.4572,h:.4572,hole:.254,layers,owner:find(id),soft:true})}
  const {cpu,ram}=prefixes.get(s.source_trace_id),r=routeGuardedOuterBridge({connection:{name:find(s.source_trace_id),pointsToConnect:[cpu,ram].map(t=>({...t.route.at(-1),layer:'inner2'}))},shapes,searchBounds:bounds,seconds:8,gridMm:.025,maxVias:4,viaGrid:.025,routingLayers:layers,viaCopperClearance:.15,rasterGuardMm:0,guardNonterminalOwnVias:true,primaryTerminalLayer:true,startTerminalLayers:['inner2','inner1','bottom'],goalTerminalLayers:['inner2','inner1','bottom'],overlapPenalty:penalty})
  const record={pass:pass+1,name:s.name,penalty,expanded:r.expanded,error:r.error??null,stagedUnqualified:Boolean(r.route),overlapCost:r.overlapCost??null}
  if(r.route){const t=canonicalize(s,r.route);record.nativeLengthMm=ddrRouteLength(t.route);staged.set(s.source_trace_id,t)}
  attempts.push(record);console.log(JSON.stringify(record))
 }
 const c=build(),counts=physical(c);assert.deepEqual(foreign(c),foreign(original));const complete=staged.size===11,physicalPass=Object.values(counts).every(n=>n===0),path=root+'/sweep-'+(pass+1)+'.circuit.json';fs.writeFileSync(path,JSON.stringify(c,null,2)+'\n')
 const sweep={pass:pass+1,completeChannels:staged.size,openChannels:11-staged.size,counts,physicalPass,allChannelsCompleteAndPhysicalChecksPass:complete&&physicalPass,path,sha256:hash(path),rows:sources.map(s=>({name:s.name,nativeLengthMm:staged.has(s.source_trace_id)?ddrRouteLength(staged.get(s.source_trace_id).route):null})),nativeSkew:checks.checkPcbBusLengthSkew(c)};sweeps.push(sweep)
 fs.writeFileSync(root+'/report.json',JSON.stringify({base:{path:base+'/preparation.json',sha256:hash(base+'/preparation.json')},seed:{path:seed+'/candidate.circuit.json',sha256:hash(seed+'/candidate.circuit.json')},attempts,sweeps,softGeometryScope:'Unqualified staged byte1 middle wires and new barrels only',allForeignCopperAndActualPadsPreserved:true,planningOnly:true,requiresFreshSourceGroundNumericCadAndGerberQualification:true,fabricationReady:false},null,2)+'\n')
 console.log(JSON.stringify({pass:pass+1,completeChannels:staged.size,physicalPass,counts}))
 if(complete&&physicalPass){fs.copyFileSync(path,root+'/candidate.circuit.json');break}
}
