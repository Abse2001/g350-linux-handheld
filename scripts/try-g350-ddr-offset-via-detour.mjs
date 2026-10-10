// Real offset two-barrel layer detour; never changes a peripheral connection or promotes source.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {gzipSync} from 'node:zlib'
import * as checks from '@tscircuit/checks'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350LocalGuard} from './lib/g350-ddr-local-guard.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'
const [input,root,name='DDR_D9',secondsText='60']=process.argv.slice(2),seconds=Number(secondsText)
assert(input&&root&&!fs.existsSync(root)&&name==='DDR_D9'&&seconds>0&&seconds<=90)
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),inputHash=hash(input),checksHash=hash('node_modules/@tscircuit/checks/dist/index.js')
assert.equal(checksHash,'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const baseline=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),c=structuredClone(baseline),sid=c.find(e=>e.type==='source_trace'&&e.name===name).source_trace_id,t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===sid),original=structuredClone(t)
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of c.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const counts=()=>{const result=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](c).length]));result.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length;return result}
assert(Object.values(counts()).every(n=>n===0))
const bus=c.find(e=>e.type==='source_bus'&&e.name==='DDR_BYTE1'),lengths=()=>c.filter(e=>e.type==='pcb_trace'&&bus.source_trace_ids.includes(e.source_trace_id)).map(e=>ddrRouteLength(e.route)),goal=Math.max(...lengths()),beforeMm=ddrRouteLength(t.route),delta=goal-beforeMm
assert(delta>3.65)
fs.mkdirSync(root)
for(const p of ['scripts/try-g350-ddr-offset-via-detour.mjs','scripts/lib/g350-ddr-local-guard.mjs','scripts/lib/g350-ddr-physical-checks.mjs','scripts/lib/g350-full-board-length-tuning.mjs','scripts/lib/g350-locked-ground-fill.mjs','scripts/lib/g350-locked-ground-fill-worker.mjs'])fs.copyFileSync(p,root+'/'+p.replaceAll('/','__'))
const baseGround=await fillG350LockedGround(c);assert.equal(baseGround.portErrors,0)
const guard=createG350LocalGuard(c,t),deadline=Date.now()+seconds*1000,attempts=[]
const segments=[]
for(let i=0;i<original.route.length-2;i++)for(const count of [1,2,4,8,12,16,24,32,48,64]){
 const j=i+count;if(j>=original.route.length)continue
 const window=original.route.slice(i,j+1),a=window[0],b=window.at(-1),span=Math.hypot(b.x-a.x,b.y-a.y)
 if(!window.every(p=>p.route_type==='wire'&&p.layer===a.layer)||span<.8||span>16)continue
 segments.push({a,b,i,j,span,removedMm:ddrRouteLength(window)})
}
segments.sort((a,b)=>Number(b.a.layer.startsWith('inner'))-Number(a.a.layer.startsWith('inner'))||b.span-a.span)
const anglesPass=r=>r.every((p,i)=>{const a=r[i-1],b=r[i+1];if(!a||!b||![a,p,b].every(q=>q.route_type==='wire'&&q.layer===p.layer))return true;const la=Math.hypot(a.x-p.x,a.y-p.y),lb=Math.hypot(b.x-p.x,b.y-p.y);return la<1e-9||lb<1e-9||Math.acos(Math.max(-1,Math.min(1,((a.x-p.x)*(b.x-p.x)+(a.y-p.y)*(b.y-p.y))/(la*lb))))*180/Math.PI>=25-1e-7})
assert(anglesPass(original.route))
let retained=false,retainedViaIds=[]
search:for(const {a,b,i,j,removedMm} of segments)for(const layer of ['inner1','inner2','bottom','top'].filter(l=>l!==a.layer))for(const fraction of [.1,.2,.3])for(const sign of [1,-1]){
 if(Date.now()>deadline)break search
 const span=Math.hypot(b.x-a.x,b.y-a.y),ux=(b.x-a.x)/span,uy=(b.y-a.y)/span,h=(delta-3.2+removedMm-span)/2
 if((1-2*fraction)*span<.6)continue
 const point=(d,height=0,l=layer)=>({route_type:'wire',x:a.x+ux*d-uy*sign*height,y:a.y+uy*d+ux*sign*height,layer:l,width:.1016}),v1=point(fraction*span,h),v2=point((1-fraction)*span,h)
 const landClear=v=>['top','inner1','inner2','bottom'].every(l=>guard([{route_type:'wire',x:v.x-.00001,y:v.y,layer:l,width:.4572},{route_type:'wire',x:v.x+.00001,y:v.y,layer:l,width:.4572}]))
 if(!landClear(v1)||!landClear(v2))continue
 const detour=[v1,v2]
 const left=[a,point(fraction*span,0,a.layer),point(fraction*span,h,a.layer)],right=[point((1-fraction)*span,h,a.layer),point((1-fraction)*span,0,a.layer),b]
 if(!guard(detour)||!guard(left)||!guard(right))continue
 const via=(v,from_layer,to_layer)=>({route_type:'via',x:v.x,y:v.y,from_layer,to_layer,via_diameter:.4572,via_hole_diameter:.254})
 t.route=[...original.route.slice(0,i+1),...left.slice(1),via(v1,a.layer,layer),...detour,via(v2,layer,a.layer),...right.slice(0,-1),...original.route.slice(j)]
 if(!anglesPass(t.route)){t.route=structuredClone(original.route);continue}
 assert(Math.abs(ddrRouteLength(t.route)-goal)<1e-6)
 const added=[v1,v2].map((v,j)=>({type:'pcb_via',pcb_via_id:'g350_real_detour_'+t.pcb_trace_id+'_'+j,pcb_trace_id:t.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:t.subcircuit_id}))
 assert(added.every(v=>!baseline.some(e=>e.type==='pcb_via'&&e.pcb_via_id===v.pcb_via_id)))
 c.push(...added)
 const row={segment:i,windowEnd:j,offsetMm:h,originalLayer:a.layer,layer,fraction,sign,counts:counts(),groundPortErrors:null,retained:false}
 if(Object.values(row.counts).every(n=>n===0)){
  const g=await fillG350LockedGround(c);row.groundPortErrors=g.portErrors
  if(g.portErrors===0){retained=true;row.retained=true;retainedViaIds=added.map(v=>v.pcb_via_id);delete t.trace_length;fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')}
  else fs.writeFileSync(root+'/rejected-ground-'+(attempts.length+1)+'.circuit.json.gz',gzipSync(JSON.stringify(g.circuit)+'\n'))
 }
 attempts.push(row);console.log(JSON.stringify(row))
 if(retained)break search
 c.splice(c.length-2,2);t.route=structuredClone(original.route)
}
if(!retained)Object.assign(t,original)
const unchanged=j=>j.filter(e=>!(e.type==='pcb_trace'&&e.source_trace_id===sid)&&!(e.type==='pcb_via'&&retainedViaIds.includes(e.pcb_via_id)))
assert.deepEqual(unchanged(c),unchanged(baseline))
assert.deepEqual([t.route[0],t.route.at(-1)],[original.route[0],original.route.at(-1)])
assert.equal(hash(input),inputHash)
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:inputHash},checksSha256:checksHash,name,beforeMm,goalMm:goal,afterMm:ddrRouteLength(t.route),retained,retainedViaIds,physicalViaCount:c.filter(e=>e.type==='pcb_via').length,attempts,sourceBytesUnchanged:true,allOriginalBarrelsEndpointsForeignHolesAndPeripheralCopperExactlyPreserved:true,realNewStandardFullDepthViasOnly:retained?2:0,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n')
process.exitCode=retained?0:1
