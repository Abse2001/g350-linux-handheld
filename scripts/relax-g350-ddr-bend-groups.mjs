// Bounded selected-layer relaxation. Original pads, barrels and foreign copper stay exact.
// This produces planning evidence; source replay and independent CAD remain required.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {gzipSync} from 'node:zlib'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350LocalGuard} from './lib/g350-ddr-local-guard.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'

const [input,root,namesText='DDR_A0,DDR_D12,DDR_D15',secondsText='45',roundsText='2',layersText='inner1,inner2']=process.argv.slice(2)
const seconds=Number(secondsText),rounds=Number(roundsText),names=namesText.split(',')
assert(input&&root&&!fs.existsSync(root)&&seconds>0&&seconds<=90&&Number.isInteger(rounds)&&rounds>0&&rounds<=8)
assert(names.length&&new Set(names).size===names.length&&names.every(n=>/^DDR_(A(?:[0-9]|1[0-4])|BA[0-2]|D(?:[89]|1[0-5])|DQM1|WEn|RASn|CASn|ODT|CSn0|CKE)$/.test(n)))
const allowedLayers=layersText.split(',')
assert(allowedLayers.length&&new Set(allowedLayers).size===allowedLayers.length&&allowedLayers.every(l=>['top','inner1','inner2','bottom'].includes(l)))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const baseline=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),c=structuredClone(baseline)
const validator=createG350PlanarPlanningValidator(baseline)
for(const name of names)assert(baseline.some(e=>e.type==='source_trace'&&e.name===name))
fs.mkdirSync(root,{recursive:true})
for(const p of ['scripts/relax-g350-ddr-bend-groups.mjs','scripts/lib/g350-ddr-planar-planning-validator.mjs','scripts/lib/g350-ddr-local-guard.mjs','scripts/lib/g350-ddr-physical-checks.mjs','scripts/lib/g350-full-board-length-tuning.mjs','scripts/lib/g350-locked-ground-fill.mjs','scripts/lib/g350-locked-ground-fill-worker.mjs'])fs.copyFileSync(p,root+'/'+p.replaceAll('/','__'))
const buses=c.filter(e=>e.type==='source_bus'&&e.name?.startsWith('DDR_')&&e.source_trace_ids.length>2)
const groups=()=>buses.map(b=>{const lengths=c.filter(e=>e.type==='pcb_trace'&&b.source_trace_ids.includes(e.source_trace_id)).map(t=>ddrRouteLength(t.route));return {name:b.name,skewMm:Math.max(...lengths)-Math.min(...lengths),limitMm:b.max_length_skew}})
const anglesPass=r=>r.every((p,i)=>{
 const a=r[i-1],b=r[i+1]
 if(!a||!b||![a,p,b].every(q=>q.route_type==='wire'&&q.layer===p.layer))return true
 const la=Math.hypot(a.x-p.x,a.y-p.y),lb=Math.hypot(b.x-p.x,b.y-p.y)
 if(la<1e-9||lb<1e-9)return true
 return Math.acos(Math.max(-1,Math.min(1,((a.x-p.x)*(b.x-p.x)+(a.y-p.y)*(b.y-p.y))/(la*lb))))*180/Math.PI>=25-1e-7
})
// Reject unsuitable selections before applying any unit, preserving all inputs.
for(const name of names){
 const sid=baseline.find(e=>e.type==='source_trace'&&e.name===name).source_trace_id
 assert(anglesPass(baseline.find(e=>e.type==='pcb_trace'&&e.source_trace_id===sid).route),'Baseline '+name+' must have no acute bends')
}
const baselineGround=await fillG350LockedGround(c);assert.equal(baselineGround.portErrors,0)
const progress=[],beforeGroups=groups(),inputHash=hash(input)
const persist=()=>{
 assert.equal(hash(input),inputHash)
 validator.assertImmutable(c)
 fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
 fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:inputHash},secondsPerSignal:seconds,roundsRequested:rounds,names,allowedLayers,baselineGroundErrors:0,beforeGroups,groups:groups(),progress,sourceBytesUnchanged:true,originalBarrelsEndpointsUnselectedLayersAndForeignRecordsExactlyPreserved:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n')
}
for(let round=1;round<=rounds;round++){
 let kept=0
 for(const name of names){
  const sid=c.find(e=>e.type==='source_trace'&&e.name===name).source_trace_id,t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===sid)
  const original=structuredClone(t),beforeMm=ddrRouteLength(t.route),beforeSkews=groups(),guard=createG350LocalGuard(c,t),deadline=Date.now()+seconds*1000
  const bus=buses.find(e=>e.source_trace_ids.includes(sid));assert(bus)
  const minimumBeforeMm=Math.min(...c.filter(e=>e.type==='pcb_trace'&&bus.source_trace_ids.includes(e.source_trace_id)).map(e=>ddrRouteLength(e.route)))
  assert(anglesPass(t.route),'Baseline must have no acute bends')
  let proposals=0,accepted=0,cycles=0
  const tryRoute=(route,window)=>{
   const length=ddrRouteLength(route)
   // Removing a large meander must not turn this signal into a new shortest outlier.
   if(length<minimumBeforeMm-1e-7||!guard(window)||!anglesPass(route)||length>=ddrRouteLength(t.route)-.00001)return false
   const previous=t.route;t.route=route;proposals++
   if(!validator.validate(c,t)){t.route=previous;return false}
   accepted++;return true
  }
  while(Date.now()<deadline&&cycles++<8){
   const priorAccepted=accepted
   // Translate several existing bends together, preserving the interior shape.
   // This can release staircase slack that a single-vertex move cannot reach.
   groups:for(const count of [2,3,4,6,8,12,16,24,32])for(let i=1;i+count<t.route.length&&Date.now()<deadline;i++){
    const r=t.route,a=r[i-1],d=r[i+count],group=r.slice(i,i+count),b=group[0],last=group.at(-1)
    if(a.route_type!=='wire'||!allowedLayers.includes(a.layer)||![...group,d].every(p=>p.route_type==='wire'&&p.layer===a.layer))continue
    const ab=Math.hypot(b.x-a.x,b.y-a.y),cd=Math.hypot(last.x-d.x,last.y-d.y)
    if(ab<1e-8||cd<1e-8)continue
    const gx=(b.x-a.x)/ab+(last.x-d.x)/cd,gy=(b.y-a.y)/ab+(last.y-d.y)/cd
    const base=Math.atan2(-gy,-gx)
    for(const angle of [0,Math.PI/8,-Math.PI/8,Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2])for(const distance of [.3,.15,.075,.03,.01]){
     if(Date.now()>=deadline)break groups
     const dx=Math.cos(base+angle)*distance,dy=Math.sin(base+angle)*distance
     const moved=group.map(p=>({...p,x:p.x+dx,y:p.y+dy}))
     if(tryRoute([...r.slice(0,i),...moved,...r.slice(i+count)],[a,...moved,d]))break
    }
   }
   // Short chords include the sub-millimetre grid stairs missed by the older shortcut search.
   for(let i=0;i<t.route.length-2&&Date.now()<deadline;i++){
    const r=t.route,a=r[i];if(a.route_type!=='wire'||!allowedLayers.includes(a.layer))continue
    let end=i+1;while(end<r.length&&r[end].route_type==='wire'&&r[end].layer===a.layer)end++
    for(const distance of [48,32,24,16,12,8,6,4,3,2]){
     const j=Math.min(end-1,i+distance);if(j<i+2)continue
     if(tryRoute([...r.slice(0,i+1),...r.slice(j)],[a,r[j]]))break
     if(Date.now()>=deadline)break
    }
   }
   // Relax one vertex toward its neighbours; never change the layer or endpoints.
   for(let i=1;i<t.route.length-1&&Date.now()<deadline;i++){
    const r=t.route,[a,p,b]=r.slice(i-1,i+2)
    if(p.route_type!=='wire'||!allowedLayers.includes(p.layer)||![a,b].every(q=>q.route_type==='wire'&&q.layer===p.layer))continue
    const ap=Math.hypot(a.x-p.x,a.y-p.y),pb=Math.hypot(p.x-b.x,p.y-b.y),fraction=ap/(ap+pb)
    if(!Number.isFinite(fraction))continue
    const target={x:a.x+(b.x-a.x)*fraction,y:a.y+(b.y-a.y)*fraction}
    for(const f of [1,.5,.25,.1,.04]){
     const next={...p,x:p.x+(target.x-p.x)*f,y:p.y+(target.y-p.y)*f}
     if(tryRoute([...r.slice(0,i),next,...r.slice(i+1)],[a,next,b]))break
     if(Date.now()>=deadline)break
    }
   }
   if(accepted===priorAccepted)break
  }
  const counts=validator.complete(c);assert(Object.values(counts).every(n=>n===0))
  assert.deepEqual(t.route.filter(p=>p.route_type==='via'),original.route.filter(p=>p.route_type==='via'))
  assert.deepEqual(t.route.filter(p=>p.route_type==='wire'&&!allowedLayers.includes(p.layer)),original.route.filter(p=>p.route_type==='wire'&&!allowedLayers.includes(p.layer)))
  assert.deepEqual([t.route[0],t.route.at(-1)],[original.route[0],original.route.at(-1)])
  const row={round,name,beforeMm,minimumBeforeMm,afterMm:ddrRouteLength(t.route),proposals,accepted,cycles,counts,retained:false}
  if(row.afterMm<beforeMm-.005){
   const g=await fillG350LockedGround(c);row.groundPortErrors=g.portErrors
   const afterSkews=groups();row.nonregressing=afterSkews.every((b,i)=>b.skewMm<=beforeSkews[i].skewMm+1e-7)
   row.retained=g.portErrors===0&&row.nonregressing
   if(row.retained){delete t.trace_length;kept++;fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')}
   else fs.writeFileSync(root+'/rejected-'+round+'-'+name+'.circuit.json.gz',gzipSync(JSON.stringify(g.circuit)+'\n'))
  }
  if(!row.retained)Object.assign(t,original)
  assert.deepEqual(c.filter(e=>e!==t&&e.type!=='pcb_trace'),baseline.filter(e=>e.type!=='pcb_trace'))
  progress.push(row);persist();console.log(JSON.stringify(row))
 }
 if(!kept)break
}
assert.deepEqual(c.filter(e=>e.type==='pcb_trace'&&!names.includes(c.find(s=>s.type==='source_trace'&&s.source_trace_id===e.source_trace_id)?.name)),baseline.filter(e=>e.type==='pcb_trace'&&!names.includes(baseline.find(s=>s.type==='source_trace'&&s.source_trace_id===e.source_trace_id)?.name)))
persist();process.exitCode=progress.some(p=>p.retained)?0:1
