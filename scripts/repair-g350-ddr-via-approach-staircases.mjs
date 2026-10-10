// Remove real raster staircases inside the original D9 via approaches.
// A short donor is unqualified timing evidence; every physical/ground check remains required.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'

const [input,donorPath,root]=process.argv.slice(2)
assert(input&&donorPath&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const inputHash=hash(input),donorHash=hash(donorPath)
const read=p=>JSON.parse(fs.readFileSync(p)).filter(e=>!e.type.includes('error'))
const baseline=read(input),donor=read(donorPath),c=structuredClone(baseline)
const source=c.find(e=>e.type==='source_trace'&&e.name==='DDR_D9');assert(source)
const get=j=>{const rows=j.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===source.source_trace_id);assert.equal(rows.length,1);return rows[0]}
const t=get(c),original=get(baseline),d=get(donor)
const strip=v=>Array.isArray(v)?v.map(strip):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!['copper_pour_id','is_inside_copper_pour'].includes(k)).map(([k,x])=>[k,strip(x)])):v
const metadata=t=>Object.fromEntries(Object.entries(strip(t)).filter(([k])=>!['route','trace_length'].includes(k)))
assert.deepEqual(metadata(d),metadata(original))
assert.deepEqual(d.route.filter(p=>p.route_type==='via'),original.route.filter(p=>p.route_type==='via'))
assert.deepEqual(strip([d.route[0],d.route.at(-1)]),strip([original.route[0],original.route.at(-1)]))
const r=strip(structuredClone(d.route)),viaIndices=r.flatMap((p,i)=>p.route_type==='via'?[i]:[])
assert.equal(viaIndices.length,2)
const [first,last]=viaIndices,a=r[first],b=r[last],layer=a.to_layer
assert.equal(layer,b.from_layer)
assert(r.slice(first+1,last).every(p=>p.route_type==='wire'&&p.layer===layer))
const validator=createG350PlanarPlanningValidator(baseline)
fs.mkdirSync(root)
for(const p of ['scripts/repair-g350-ddr-via-approach-staircases.mjs','scripts/lib/g350-full-board-length-tuning.mjs','scripts/lib/g350-ddr-planar-planning-validator.mjs','scripts/lib/g350-ddr-local-guard.mjs','scripts/lib/g350-ddr-physical-checks.mjs','scripts/lib/g350-locked-ground-fill.mjs','scripts/lib/g350-locked-ground-fill-worker.mjs'])fs.copyFileSync(p,root+'/'+p.replaceAll('/','__'))
const attempts=[];let retained=false
for(const radius of [.35,.4,.45,.5,.6,.8,1]){
 const lo=r.findIndex((p,i)=>i>first&&i<last&&Math.hypot(p.x-a.x,p.y-a.y)>=radius)
 let hi=last-1;while(hi>first&&Math.hypot(r[hi].x-b.x,r[hi].y-b.y)<radius)hi--
 assert(lo>first&&hi<last&&lo<hi)
 const wire=v=>({route_type:'wire',x:v.x,y:v.y,layer,width:.1016})
 t.route=[...r.slice(0,first+1),wire(a),...r.slice(lo,hi+1),wire(b),...r.slice(last)]
 delete t.trace_length
 const selfShorts=checks.checkPcbTraceSelfShorts(c),record={radiusMm:radius,removedVertices:lo-first-1+last-hi-1,nativeLengthMm:ddrRouteLength(t.route),selfShortErrors:selfShorts.length,retained:false}
 attempts.push(record)
 if(selfShorts.length)continue
 const counts=validator.complete(c)
 for(const n of ['checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'])counts[n]=checks[n](c).length
 record.counts=counts
 if(Object.values(counts).some(v=>v!==0))continue
 const ground=await fillG350LockedGround(c);record.groundPortErrors=ground.portErrors
 if(ground.portErrors)continue
 assert.deepEqual(c.filter(e=>!(e.type==='pcb_trace'&&e.source_trace_id===source.source_trace_id)),baseline.filter(e=>!(e.type==='pcb_trace'&&e.source_trace_id===source.source_trace_id)))
 assert.deepEqual(t.route.filter(p=>p.route_type==='via'),original.route.filter(p=>p.route_type==='via'))
 assert.deepEqual(strip([t.route[0],t.route.at(-1)]),strip([original.route[0],original.route.at(-1)]))
 fs.writeFileSync(root+'/unqualified-trial.circuit.json',JSON.stringify(c,null,2)+'\n')
 fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(ground.circuit,null,2)+'\n')
 retained=true;record.retained=true;break
}
assert.equal(hash(input),inputHash);assert.equal(hash(donorPath),donorHash)
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:inputHash},donor:{path:donorPath,sha256:donorHash},attempts,physicalCarrierRetained:retained,timingQualified:false,requiresRegrowthAndFreshSourceAndIndependentQualification:true,allOriginalHolesEndpointsAndForeignRecordsPreserved:true,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({physicalCarrierRetained:retained,attempts}))
process.exitCode=retained?0:1
