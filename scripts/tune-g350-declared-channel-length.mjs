// A bounded proposal on an explicitly reconstructed DDR channel. Never qualify
// timing from native length alone; fresh source/CAD/Gerber checks remain required.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {tuneOneG350DdrTrace,ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'
const [input,root,name,goalText,secondsText='90']=process.argv.slice(2),goal=Number(goalText),seconds=Number(secondsText)
assert(input&&root&&name?.startsWith('DDR_')&&!fs.existsSync(root)&&goal>0&&goal<=100&&seconds>0&&seconds<=180)
const allowNewVias=process.env.G350_CHANNEL_ALLOW_NEW_VIAS==='1'
assert(process.env.G350_CHANNEL_ALLOW_NEW_VIAS===undefined||['0','1'].includes(process.env.G350_CHANNEL_ALLOW_NEW_VIAS))
assert.equal(process.env.G350_LENGTH_SIMPLIFY_SECONDS,'0')
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const c=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),before=structuredClone(c)
const id=c.find(e=>e.type==='source_trace'&&e.name===name)?.source_trace_id,t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===id);assert(t)
const ownViaIds=new Set(c.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id).map(e=>e.pcb_via_id))
const skew=b=>{const v=c.filter(e=>e.type==='pcb_trace'&&b.source_trace_ids.includes(e.source_trace_id)).map(e=>ddrRouteLength(e.route));return Math.max(...v)-Math.min(...v)}
const matched=c.filter(e=>e.type==='source_bus'&&skew(e)<=e.max_length_skew)
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of c.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
const physics=()=>{
 const counts=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkPcbRoutingConstraints','checkTracesAreContiguous','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](c).length]))
 counts.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length
 return counts
}
assert(Object.values(physics()).every(v=>v===0));const initialGround=await fillG350LockedGround(c);assert.equal(initialGround.portErrors,0)
const beforeMm=ddrRouteLength(t.route);assert(goal>beforeMm)
const coalesce=process.env.G350_CHANNEL_COALESCE_COLLINEAR==='1'
assert(process.env.G350_CHANNEL_COALESCE_COLLINEAR===undefined||['0','1'].includes(process.env.G350_CHANNEL_COALESCE_COLLINEAR))
const originalVertexCount=t.route.length
if(coalesce){
 const route=[]
 for(const p of t.route){
  route.push(p)
  while(route.length>=3){
   const [a,b,d]=route.slice(-3)
   if(![a,b,d].every(q=>q.route_type==='wire'&&q.layer===a.layer&&(q.width??.1016)===(a.width??.1016)))break
   if(Object.keys(b).some(k=>!['route_type','x','y','layer','width','copper_pour_id','is_inside_copper_pour'].includes(k)))break
   const ux=b.x-a.x,uy=b.y-a.y,vx=d.x-b.x,vy=d.y-b.y
   if(Math.abs(ux*vy-uy*vx)>1e-12||ux*vx+uy*vy<-1e-12)break
   route.splice(route.length-2,1)
  }
 }
 t.route=route
 assert(Math.abs(ddrRouteLength(t.route)-beforeMm)<1e-7)
 assert(Object.values(physics()).every(v=>v===0))
}
fs.mkdirSync(root);for(const p of ['scripts/tune-g350-declared-channel-length.mjs','scripts/lib/g350-full-board-length-tuning.mjs'])fs.copyFileSync(p,root+'/'+p.replaceAll('/','__'))
const result=tuneOneG350DdrTrace(c,t,goal,seconds,{allowNewVias})
const own=v=>v.type==='pcb_trace'&&v.source_trace_id===id||v.type==='pcb_via'&&v.pcb_trace_id===t.pcb_trace_id
assert.deepEqual(c.filter(e=>!own(e)),before.filter(e=>!own(e)),'Foreign source, pads, placement, holes and copper must remain unchanged')
for(const v of before.filter(e=>e.type==='pcb_via'&&ownViaIds.has(e.pcb_via_id)))assert.deepEqual(c.find(e=>e.pcb_via_id===v.pcb_via_id),v)
const previous=before.find(e=>e.pcb_trace_id===t.pcb_trace_id&&e.type==='pcb_trace')
assert.deepEqual([t.route[0],t.route.at(-1)],[previous.route[0],previous.route.at(-1)])
const counts=physics(),matchingPreserved=matched.every(b=>skew(b)<=b.max_length_skew)
let ground=null
if(result.found&&Object.values(counts).every(v=>v===0)&&matchingPreserved){const g=await fillG350LockedGround(c);ground={portErrors:g.portErrors,errors:g.errors,elapsedSeconds:g.elapsedSeconds};fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')}
delete t.trace_length;fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
const passed=result.found&&Object.values(counts).every(v=>v===0)&&matchingPreserved&&ground?.portErrors===0
const report={input:{path:input,sha256:hash(input)},name,goalMm:goal,beforeMm,afterMm:ddrRouteLength(t.route),seconds,allowNewVias,coalesce,originalVertexCount,finalVertexCount:t.route.length,result,counts,matchingPreserved,initialGroundPortErrors:initialGround.portErrors,ground,newVias:c.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id&&!ownViaIds.has(e.pcb_via_id)),passed,requiresFreshSourceAndNumericCadAndGerber:true,fullElectricalTimingQualified:false,fabricationReady:false}
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,ground:ground&&{...ground,errors:undefined}}));process.exitCode=passed?0:1
