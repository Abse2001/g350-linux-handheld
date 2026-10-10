// Real two-layer detours, with two new standard through-holes. No layer-only
// timing anchors: both barrels switch layers and the full new copper is checked.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {getFullConnectivityMapFromCircuitJson} from 'circuit-json-to-connectivity-map'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,root,name='DDR_D9',secondsText='60']=process.argv.slice(2);assert(input&&root&&!fs.existsSync(root));fs.mkdirSync(root)
const seconds=Number(secondsText);assert(seconds>0&&seconds<=60)
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const c=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),original=structuredClone(c)
const source=c.find(e=>e.type==='source_trace'&&e.name===name);assert(source&&source.connected_source_port_ids.length===2)
const t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===source.source_trace_id);assert(t)
const bus=c.find(e=>e.type==='source_bus'&&['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(e.name)&&e.source_trace_ids.includes(source.source_trace_id));assert(bus)
const goal=Math.max(...c.filter(e=>e.type==='pcb_trace'&&bus.source_trace_ids.includes(e.source_trace_id)).map(e=>ddrRouteLength(e.route))),before=ddrRouteLength(t.route),delta=goal-before;assert(delta>3.65)
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of c.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const manufacturing=()=>checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e))
const complete=()=>({...Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkSourceTracesMatchPcbTraceThickness','checkTracesAreContiguous','checkPcbTraceViaCounts','checkPcbRoutingConstraints'].map(n=>[n,checks[n](c).length])),manufacturing:manufacturing().length})
assert(Object.values(complete()).every(n=>!n))
fs.copyFileSync('scripts/try-g350-ddr-physical-via-detour.mjs',root+'/planner.executed.mjs')
const r=structuredClone(t.route),deadline=Date.now()+seconds*1000,attempts=[];let accepted=false
const segments=r.slice(0,-1).map((a,i)=>({a,b:r[i+1],i})).filter(({a,b})=>a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer&&Math.hypot(a.x-b.x,a.y-b.y)>.85).sort((a,b)=>Math.hypot(b.a.x-b.b.x,b.a.y-b.b.y)-Math.hypot(a.a.x-a.b.x,a.a.y-a.b.y))
outer:for(const {a,b,i} of segments)for(const fraction of [.8,.6,.4])for(const layer of ['inner1','inner2','top','bottom'].filter(l=>l!==a.layer))for(const sign of [-1,1]){
 if(Date.now()>deadline)break outer
 const span=Math.hypot(b.x-a.x,b.y-a.y),offset=(1-fraction)/2;if(span*fraction<.65)continue
 const ux=(b.x-a.x)/span,uy=(b.y-a.y)/span,h=(delta-3.2)/2
 const p=(d,height=0,l=layer)=>({route_type:'wire',x:a.x+ux*d-uy*sign*height,y:a.y+uy*d+ux*sign*height,layer:l,width:.1016})
 const v1=p(offset*span),v2=p((offset+fraction)*span),via=(v,from_layer,to_layer)=>({route_type:'via',x:v.x,y:v.y,from_layer,to_layer,via_diameter:.4572,via_hole_diameter:.254})
 t.route=[...r.slice(0,i+1),p(offset*span,0,a.layer),via(v1,a.layer,layer),v1,p(offset*span,h),p((offset+fraction)*span,h),v2,via(v2,layer,a.layer),p((offset+fraction)*span,0,a.layer),...r.slice(i+1)]
 assert(Math.abs(ddrRouteLength(t.route)-goal)<1e-7)
 const added=[v1,v2].map((v,j)=>({type:'pcb_via',pcb_via_id:'g350_true_detour_'+t.pcb_trace_id+'_'+j,pcb_trace_id:t.pcb_trace_id,source_trace_id:source.source_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:t.subcircuit_id}))
 c.push(...added)
 const attempt={segment:i,from:a.layer,to:layer,sign,fraction,accepted:false}
 attempts.push(attempt)
 const connMap=getFullConnectivityMapFromCircuitJson(c),changed=c.map(e=>e.type==='pcb_trace'&&e!==t?{...e,route:[]}:e)
 const quick=checks.checkViaPadClearance(c,{connMap}).length===0&&checks.checkDifferentNetViaSpacing(c,{connMap}).length===0&&checks.checkViasInPads(c).length===0&&checks.checkViaTraceClearance(c,{connMap}).length===0&&checks.checkPadTraceClearance(changed,{connMap}).length===0&&checks.checkPcbTraceSelfShorts(c).length===0&&checks.checkEachPcbTraceNonOverlapping(c).length===0
 if(quick){attempt.counts=complete();if(Object.values(attempt.counts).every(n=>!n)){accepted=true;attempt.accepted=true;delete t.trace_length;break outer}}
 c.splice(-2);t.route=structuredClone(r)
}
if(!accepted)t.route=r
for(let i=0;i<original.length;i++)if(original[i].type!=='pcb_trace'||original[i].source_trace_id!==source.source_trace_id)assert.deepEqual(c[i],original[i])
const counts=complete();assert(Object.values(counts).every(n=>!n));fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:hash(input)},candidateSha256:hash(root+'/candidate.circuit.json'),signal:name,beforeMm:before,afterMm:ddrRouteLength(t.route),targetMm:goal,accepted,attempts,counts,addedPhysicalVias:accepted?2:0,allExistingViasAndPeripheralGeometryPreserved:true,requiresFreshGroundSourceAndIndependentChecks:true,planningOnly:true,fabricationReady:false},null,2)+'\n');console.log(JSON.stringify({signal:name,accepted,beforeMm:before,afterMm:ddrRouteLength(t.route),targetMm:goal,probes:attempts.length,counts}))
