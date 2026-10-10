// Bounded manual-bridge fallback after public BusLanes planning. Not source-qualified.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {routeGuardedOuterBridge} from './lib/g350-ddr-timing-detour-bridge.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
const [input,root,orderMode='byte-first',gridText='.025',terminalMode='fixed-bottom']=process.argv.slice(2)
assert(input&&root&&!fs.existsSync(root)&&['byte-first','command-first','longest-first'].includes(orderMode))
const gridMm=Number(gridText);assert([.025,.0125].includes(gridMm))
assert(['fixed-bottom','flexible-outer'].includes(terminalMode))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const inputSha256=hash(input)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const names=new Map(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>[e.source_trace_id,e.name]));assert.equal(names.size,49)
const selected=base.filter(e=>e.type==='pcb_trace'&&names.has(e.source_trace_id));assert.equal(selected.length,49)
const selectedIds=new Set(selected.map(e=>e.pcb_trace_id)),removed=new Set(),ends=new Map(),fixed=[]
for(const t of selected){
 const vi=t.route.flatMap((p,i)=>p.route_type==='via'?[i]:[]);assert(vi.length>=2)
 const first=vi[0],last=vi.at(-1),a=t.route[first],b=t.route[last]
 assert(a.from_layer==='top'&&b.to_layer==='top')
 for(const p of [a,b])assert(Math.abs(p.x/.025-Math.round(p.x/.025))<1e-7&&Math.abs(p.y/.025-Math.round(p.y/.025))<1e-7)
 for(const index of vi.slice(1,-1)){
  const p=t.route[index],v=base.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id&&Math.hypot(e.x-p.x,e.y-p.y)<1e-8);assert.equal(v.length,1);removed.add(v[0].pcb_via_id)
 }
 ends.set(t.source_trace_id,{first,last,a,b})
 fixed.push(...[t.route.slice(0,first),t.route.slice(last+1)].map((route,i)=>({type:'pcb_trace',pcb_trace_id:t.pcb_trace_id+'_stub_'+i,source_trace_id:t.source_trace_id,route})))
}
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of base.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const ports=new Map(base.filter(e=>e.type==='pcb_port').map(e=>[e.pcb_port_id,e.source_port_id]))
const owners=new Map(base.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,find(e.source_trace_id)]))
const layers=['top','bottom'],shapes=[]
for(const p of base.filter(e=>e.type==='pcb_smtpad'&&Number.isFinite(e.x))){const w=p.width??2*p.radius,h=p.height??w;if(Number.isFinite(w)&&Number.isFinite(h)&&layers.includes(p.layer))shapes.push({kind:p.shape==='circle'?'circle':'rect',x:p.x,y:p.y,w,h,layers:[p.layer],pad:true,owner:find(ports.get(p.pcb_port_id)??p.pcb_smtpad_id)})}
for(const v of base.filter(e=>e.type==='pcb_via'&&!removed.has(e.pcb_via_id)))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers,owner:owners.get(v.pcb_trace_id)})
const addWires=t=>{for(let i=1;i<t.route.length;i++){const a=t.route[i-1],b=t.route[i];if(a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer&&layers.includes(a.layer)&&Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:b.width??.1016,layers:[a.layer],owner:find(t.source_trace_id)})}}
for(const t of [...base.filter(e=>e.type==='pcb_trace'&&!selectedIds.has(e.pcb_trace_id)),...fixed])addWires(t)
const distance=t=>{const {a,b}=ends.get(t.source_trace_id);return Math.hypot(a.x-b.x,a.y-b.y)}
const command=t=>!/^DDR_D(?:\d+|QS|QSn|QM)/.test(names.get(t.source_trace_id))
const ordered=[...selected].sort((a,b)=>orderMode==='longest-first'?distance(b)-distance(a):(orderMode==='command-first'?Number(command(b))-Number(command(a)):Number(command(a))-Number(command(b)))||distance(b)-distance(a))
fs.mkdirSync(root);fs.copyFileSync('scripts/plan-g350-outer-ddr-guarded-bridges.mjs',root+'/helper.executed.mjs');fs.copyFileSync('scripts/lib/g350-ddr-timing-detour-bridge.mjs',root+'/bridge.executed.mjs')
const c=structuredClone(base).filter(e=>!(e.type==='pcb_trace'&&selectedIds.has(e.pcb_trace_id))&&!(e.type==='pcb_via'&&removed.has(e.pcb_via_id))),attempts=[],added=[]
const bounds={minX:-20,maxX:20,minY:-8,maxY:34}
for(const old of ordered){
 const {first,last,a,b}=ends.get(old.source_trace_id),own=find(old.source_trace_id)
 const legShapes=shapes.map(s=>s.kind==='segment'&&s.owner===own&&![s.a,s.b].some(p=>[a,b].some(q=>Math.hypot(p.x-q.x,p.y-q.y)<1e-8))?{...s,owner:'FIXED_OWN_ESCAPE'}:s)
 const begun=performance.now(),result=routeGuardedOuterBridge({connection:{name:own,pointsToConnect:[a,b].map(p=>({x:p.x,y:p.y,layer:'bottom'}))},shapes:legShapes,searchBounds:bounds,seconds:8,gridMm,maxVias:8,viaGrid:.025,routingLayers:layers,viaCostMm:2,heuristicWeight:1.5,viaCopperClearance:.15,guardNonterminalOwnVias:true,primaryTerminalLayer:terminalMode==='fixed-bottom'})
 const record={name:names.get(old.source_trace_id),elapsedSeconds:(performance.now()-begun)/1000,expanded:result.expanded,error:result.error??null,startBlocked:result.startBlocked,goalBlocked:result.goalBlocked,found:Boolean(result.route)}
 if(result.route){
  assert(result.route.every(p=>p.route_type==='wire'?layers.includes(p.layer):p.route_type==='via'&&layers.includes(p.from_layer)&&layers.includes(p.to_layer)&&p.from_layer!==p.to_layer))
  const startBottom=result.route[0].layer==='bottom',endBottom=result.route.at(-1).layer==='bottom'
  const head=structuredClone(old.route.slice(0,first+(startBottom?1:0))),tail=structuredClone(old.route.slice(last+(endBottom?0:1)))
  if(startBottom)head.at(-1).to_layer='bottom'
  if(endBottom)tail[0].from_layer='bottom'
  for(const p of [!startBottom?a:null,!endBottom?b:null].filter(Boolean)){
   const v=c.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===old.pcb_trace_id&&Math.hypot(e.x-p.x,e.y-p.y)<1e-8);assert.equal(v.length,1)
   removed.add(v[0].pcb_via_id);c.splice(c.indexOf(v[0]),1)
   const index=shapes.findIndex(s=>s.hole&&s.owner===own&&Math.hypot(s.x-p.x,s.y-p.y)<1e-8);assert(index>=0);shapes.splice(index,1)
  }
  const t={...structuredClone(old),route:[...head,...result.route,...tail]};delete t.trace_length
  const vias=result.route.filter(p=>p.route_type==='via').map((p,i)=>({type:'pcb_via',pcb_via_id:'g350_outer_bridge_'+old.pcb_trace_id+'_'+i,pcb_trace_id:old.pcb_trace_id,x:p.x,y:p.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:old.subcircuit_id}))
  c.push(t,...vias);added.push(...vias.map(v=>v.pcb_via_id));addWires(t)
  for(const v of vias)shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers,owner:own})
  record.fullDepthNewVias=vias.length;record.nativeLengthMm=ddrRouteLength(t.route);record.startLayer=result.route[0].layer;record.endLayer=result.route.at(-1).layer
 }
 attempts.push(record)
 fs.writeFileSync(root+'/proposed-ddr-traces.json',JSON.stringify(c.filter(e=>e.type==='pcb_trace'&&selectedIds.has(e.pcb_trace_id)),null,2)+'\n')
 fs.writeFileSync(root+'/proposed-ddr-vias.json',JSON.stringify(c.filter(e=>e.type==='pcb_via'&&added.includes(e.pcb_via_id)),null,2)+'\n')
 fs.writeFileSync(root+'/progress.json',JSON.stringify({orderMode,gridMm,terminalMode,completedAttempts:attempts.length,routed:attempts.filter(a=>a.found).length,required:49,attempts,planningOnly:true,fabricationReady:false},null,2)+'\n');console.log(JSON.stringify(record))
}
const counts=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](c).length]));counts.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length
const foreign=j=>j.filter(e=>!(e.type==='pcb_trace'&&selectedIds.has(e.pcb_trace_id))&&!(e.type==='pcb_via'&&(removed.has(e.pcb_via_id)||added.includes(e.pcb_via_id))))
assert.deepEqual(foreign(c),foreign(base));assert.equal(hash(input),inputSha256,'The checked input must remain byte-for-byte unchanged')
const complete=attempts.every(a=>a.found),physicalPassed=Object.values(counts).every(n=>n===0)
fs.writeFileSync(root+'/'+(complete&&physicalPassed?'candidate':'incomplete-rejected')+'.circuit.json',JSON.stringify(c,null,2)+'\n')
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:hash(input)},orderMode,signalLayers:layers,bounds,attempts,routed:attempts.filter(a=>a.found).length,required:49,complete,counts,physicalPassed,removedOnlyOwnedMiddleViaIds:[...removed],addedIds:added,foreignCopperPadsHolesAndConstraintsExactlyPreserved:true,sourceAndGroundAndIndependentCadAndMatchingUnqualified:true,fabricationReady:false},null,2)+'\n');process.exitCode=complete&&physicalPassed?0:2
