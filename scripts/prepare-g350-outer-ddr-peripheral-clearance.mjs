// Reversible planning host: reserve DDR Top escapes and move legal peripheral
// via-to-via carriers inward. Missing DDR carriers make this host unqualified.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {createG350LocalGuard} from './lib/g350-ddr-local-guard.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,root]=process.argv.slice(2);assert(input&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),sha=hash(input)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),c=structuredClone(base)
const names=new Map(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>[e.source_trace_id,e.name]));assert.equal(names.size,49)
const removed=new Set(),ddrIds=new Set()
for(const t of c.filter(e=>e.type==='pcb_trace'&&names.has(e.source_trace_id))){
 ddrIds.add(t.pcb_trace_id)
 const vi=t.route.flatMap((p,i)=>p.route_type==='via'?[i]:[]);assert(vi.length>=2)
 const first=vi[0],last=vi.at(-1)
 for(const i of vi.slice(1,-1))for(const v of c.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id&&Math.hypot(e.x-t.route[i].x,e.y-t.route[i].y)<1e-8))removed.add(v.pcb_via_id)
 // Keep both Top stubs as separate hard obstacles, never a fictitious join.
 const a={...structuredClone(t),pcb_trace_id:t.pcb_trace_id+'_open_cpu',route:t.route.slice(0,first)},b={...structuredClone(t),pcb_trace_id:t.pcb_trace_id+'_open_ram',route:t.route.slice(last+1)}
 for(const [point,stub] of [[t.route[first],a],[t.route[last],b]]){
  const v=c.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id&&Math.hypot(e.x-point.x,e.y-point.y)<1e-8);assert.equal(v.length,1)
  v[0].pcb_trace_id=stub.pcb_trace_id
 }
 c.push(a,b)
}
const open=c.filter(e=>!(e.type==='pcb_trace'&&ddrIds.has(e.pcb_trace_id))&&!(e.type==='pcb_via'&&removed.has(e.pcb_via_id)))
const candidates=[]
for(const t of open.filter(e=>e.type==='pcb_trace'&&!names.has(e.source_trace_id))){
 for(let first=0;first<t.route.length;first++){
  const p=t.route[first];if(p.route_type!=='wire'||!['top','bottom'].includes(p.layer)||first===0||t.route[first-1].route_type!=='via')continue
  let last=first;while(last+1<t.route.length&&t.route[last+1].route_type==='wire'&&t.route[last+1].layer===p.layer)last++
  if(last+1===t.route.length||t.route[last+1].route_type!=='via'){first=last;continue}
  const span=t.route.slice(first,last+1),length=span.slice(1).reduce((sum,q,i)=>sum+Math.hypot(q.x-span[i].x,q.y-span[i].y),0)
  if(length>=1&&span.some(q=>q.x>=-12&&q.x<=12&&q.y>=-6&&q.y<=21))candidates.push({traceId:t.pcb_trace_id,first,last,length,from:p.layer})
  first=last
 }
}
candidates.sort((a,b)=>Number(b.from==='bottom')-Number(a.from==='bottom')||b.length-a.length)
const changes=[]
for(const proposal of candidates){
 const t=open.find(e=>e.type==='pcb_trace'&&e.pcb_trace_id===proposal.traceId),original=structuredClone(t.route),guard=createG350LocalGuard(open,t)
 for(const layer of ['inner1','inner2']){
  if(original[proposal.first-1].from_layer===layer||original[proposal.last+1].to_layer===layer)continue
  const r=structuredClone(original);for(let i=proposal.first;i<=proposal.last;i++)r[i].layer=layer
  r[proposal.first-1].to_layer=layer;r[proposal.last+1].from_layer=layer
  if(!guard(r))continue
  t.route=r;delete t.trace_length;changes.push({...proposal,to:layer});break
 }
 if(changes.length>=80)break
}
fs.mkdirSync(root);fs.copyFileSync('scripts/prepare-g350-outer-ddr-peripheral-clearance.mjs',root+'/helper.executed.mjs')
// Reinsert checked DDR only to create an exact carrier donor, not to claim
// it coexists with the new inner peripheral wires. Outer replanning removes it.
const donor=structuredClone(base)
for(const id of new Set(changes.map(p=>p.traceId)))donor.find(e=>e.type==='pcb_trace'&&e.pcb_trace_id===id).route=structuredClone(open.find(e=>e.type==='pcb_trace'&&e.pcb_trace_id===id).route)
const counts=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](open).length]));counts.manufacturing=checkG350ViaTrackManufacturingClearance(open).length
assert.equal(hash(input),sha)
fs.writeFileSync(root+'/incomplete-outer-routing-host.circuit.json',JSON.stringify(donor,null,2)+'\n')
fs.writeFileSync(root+'/open-geometry.circuit.json',JSON.stringify(open,null,2)+'\n')
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:sha},changes,probedCarrierCount:candidates.length,counts,physicalOpenGeometryPassed:Object.values(counts).every(n=>n===0),ddrCarriersIntentionallyOpen:49,donorCheckedDdrIsPlaceholderForReplanningOnly:true,allPadsPlacementsLogicAndForeignPhysicalHolesUnchanged:true,wireCoordinatesAndWidthsUnchanged:true,sourceGroundConnectivityAndMatchingUnqualified:true,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({changes:changes.length,counts,planningOnly:true}));process.exitCode=Object.values(counts).every(n=>n===0)?0:2
