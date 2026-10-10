// Bounded real barrel relocation. Planning only; fresh source/CAD must follow.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350LocalGuard} from './lib/g350-ddr-local-guard.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'
const [input,root,namesText='DDR_A0,DDR_D12',secondsText='45']=process.argv.slice(2)
const names=namesText.split(','),seconds=Number(secondsText)
assert(input&&root&&!fs.existsSync(root)&&seconds>0&&seconds<=90)
assert(names.length&&new Set(names).size===names.length&&names.every(n=>['DDR_A0','DDR_D12'].includes(n)))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const inputHash=hash(input),checksHash=hash('node_modules/@tscircuit/checks/dist/index.js')
assert.equal(checksHash,'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const baseline=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),c=structuredClone(baseline)
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of c.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const counts=()=>{
 const result=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](c).length]))
 result.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length
 return result
}
assert(Object.values(counts()).every(n=>n===0))
const anglesPass=r=>r.every((p,i)=>{const a=r[i-1],b=r[i+1];if(!a||!b||![a,p,b].every(q=>q.route_type==='wire'&&q.layer===p.layer))return true;const la=Math.hypot(a.x-p.x,a.y-p.y),lb=Math.hypot(b.x-p.x,b.y-p.y);return la<1e-9||lb<1e-9||Math.acos(Math.max(-1,Math.min(1,((a.x-p.x)*(b.x-p.x)+(a.y-p.y)*(b.y-p.y))/(la*lb))))*180/Math.PI>=25-1e-7})
fs.mkdirSync(root)
for(const p of ['scripts/relocate-g350-ddr-owned-vias.mjs','scripts/lib/g350-ddr-local-guard.mjs','scripts/lib/g350-ddr-physical-checks.mjs','scripts/lib/g350-full-board-length-tuning.mjs','scripts/lib/g350-locked-ground-fill.mjs','scripts/lib/g350-locked-ground-fill-worker.mjs'])fs.copyFileSync(p,root+'/'+p.replaceAll('/','__'))
const baseGround=await fillG350LockedGround(c);assert.equal(baseGround.portErrors,0)
const progress=[],changedViaIds=new Set()
const groups=()=>c.filter(e=>e.type==='source_bus'&&e.name?.startsWith('DDR_')&&e.source_trace_ids.length>2).map(b=>{const lengths=c.filter(e=>e.type==='pcb_trace'&&b.source_trace_ids.includes(e.source_trace_id)).map(t=>ddrRouteLength(t.route));return {name:b.name,skewMm:Math.max(...lengths)-Math.min(...lengths),limitMm:b.max_length_skew}})
const beforeGroups=groups()
const persist=()=>{
 assert.equal(hash(input),inputHash)
 const changedTraces=new Set(names.map(name=>c.find(e=>e.type==='source_trace'&&e.name===name).source_trace_id))
 const unchanged=j=>j.filter(e=>!(e.type==='pcb_trace'&&changedTraces.has(e.source_trace_id))&&!(e.type==='pcb_via'&&changedViaIds.has(e.pcb_via_id)))
 assert.deepEqual(unchanged(c),unchanged(baseline))
 const oldVias=baseline.filter(e=>e.type==='pcb_via'),newVias=c.filter(e=>e.type==='pcb_via');assert.equal(newVias.length,oldVias.length)
 for(let i=0;i<newVias.length;i++)assert.deepEqual(Object.fromEntries(Object.entries(newVias[i]).filter(([k])=>!['x','y'].includes(k))),Object.fromEntries(Object.entries(oldVias[i]).filter(([k])=>!['x','y'].includes(k))))
 fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
 fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:inputHash},checksSha256:checksHash,names,secondsPerSignal:seconds,baselineGroundErrors:0,beforeGroups,groups:groups(),changedOwnedViaIds:[...changedViaIds],physicalViaCount:newVias.length,progress,sourceBytesUnchanged:true,peripheralCopperAndForeignHolesExactlyPreserved:true,viaIdsDimensionsFullDepthAndEndpointPadsPreserved:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n')
}
for(const name of names){
 const sid=c.find(e=>e.type==='source_trace'&&e.name===name).source_trace_id,t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===sid)
 assert(anglesPass(t.route));const original=structuredClone(t),oldVias=structuredClone(c.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id)),before=groups(),beforeMm=ddrRouteLength(t.route),guard=createG350LocalGuard(c,t),deadline=Date.now()+seconds*1000
 const indices=t.route.flatMap((p,i)=>p.route_type==='via'?[i]:[]),moved=new Set();let probes=0,accepted=0
 search:for(let cycle=0;cycle<3;cycle++)for(const index of indices.slice(1,-1)){
  const r=t.route,via=r[index],physical=c.find(e=>e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id&&Math.hypot(e.x-via.x,e.y-via.y)<1e-8);assert(physical)
  let first=index,last=index
  while(first>0&&Math.hypot(r[first-1].x-via.x,r[first-1].y-via.y)<1e-8)first--
  while(last+1<r.length&&Math.hypot(r[last+1].x-via.x,r[last+1].y-via.y)<1e-8)last++
  assert(first>0&&last<r.length-1)
  const a=r[first-1],b=r[last+1];if(a.route_type!=='wire'||b.route_type!=='wire')continue
  const la=Math.hypot(via.x-a.x,via.y-a.y),lb=Math.hypot(via.x-b.x,via.y-b.y),angle=Math.atan2(-(via.y-a.y)/la-(via.y-b.y)/lb,-(via.x-a.x)/la-(via.x-b.x)/lb)
  for(const turn of [0,Math.PI/8,-Math.PI/8,Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2])for(const distance of [1.5,.75,.3,.15,.075,.025]){
   if(Date.now()>deadline)break search
   const x=via.x+Math.cos(angle+turn)*distance,y=via.y+Math.sin(angle+turn)*distance
   const initial=oldVias.find(v=>v.pcb_via_id===physical.pcb_via_id)
   if(Math.hypot(x-initial.x,y-initial.y)>1.5+1e-7)continue
   // A near-point thick wire conservatively screens the real land on all layers.
   if(!['top','inner1','inner2','bottom'].every(layer=>guard([{route_type:'wire',x:x-.00001,y,layer,width:.4572},{route_type:'wire',x:x+.00001,y,layer,width:.4572}])))continue
   const next=r.map((p,i)=>i>=first&&i<=last?{...p,x,y}:p)
   if(ddrRouteLength(next)>=ddrRouteLength(t.route)-.005||!anglesPass(next))continue
   if(!guard(next.slice(first-1,last+2)))continue
   const previousRoute=t.route,previousXY={x:physical.x,y:physical.y};physical.x=x;physical.y=y;t.route=next;probes++
   if(Object.values(counts()).every(n=>n===0)){accepted++;moved.add(physical.pcb_via_id);continue}
   Object.assign(physical,previousXY);t.route=previousRoute
  }
 }
 const row={name,beforeMm,afterMm:ddrRouteLength(t.route),probes,accepted,counts:counts(),movedViaIds:[...moved],retained:false}
 assert(Object.values(row.counts).every(n=>n===0))
 if(row.afterMm<beforeMm-.005){
  const g=await fillG350LockedGround(c);row.groundPortErrors=g.portErrors;row.nonregressing=groups().every((b,i)=>b.skewMm<=before[i].skewMm+1e-7);row.retained=g.portErrors===0&&row.nonregressing
  if(row.retained){delete t.trace_length;for(const id of moved)changedViaIds.add(id);fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')}
 }
 if(!row.retained){Object.assign(t,original);for(const old of oldVias)Object.assign(c.find(v=>v.type==='pcb_via'&&v.pcb_via_id===old.pcb_via_id),old)}
 assert.deepEqual([t.route[0],t.route.at(-1)],[original.route[0],original.route.at(-1)])
 progress.push(row);persist();console.log(JSON.stringify(row))
}
persist();process.exitCode=progress.some(p=>p.retained)?0:1
