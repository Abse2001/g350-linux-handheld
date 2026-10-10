// Open a specific acute trace corner without changing rules or any barrel.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {createG350LocalGuard} from './lib/g350-ddr-local-guard.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'
const [input,root,name,xText,yText]=process.argv.slice(2),x=Number(xText),y=Number(yText)
assert(input&&root&&name?.startsWith('DDR_')&&!fs.existsSync(root)&&Number.isFinite(x)&&Number.isFinite(y));fs.mkdirSync(root)
fs.copyFileSync('scripts/reshape-g350-ddr-sliver-corner.mjs',root+'/planner.executed.mjs')
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),c=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const id=c.find(e=>e.type==='source_trace'&&e.name===name)?.source_trace_id,t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===id);assert(t)
const validator=createG350PlanarPlanningValidator(c),guard=createG350LocalGuard(c,t),original=structuredClone(t.route)
const indices=original.map((p,i)=>[p,i]).filter(([p])=>p.route_type==='wire'&&Math.hypot(p.x-x,p.y-y)<1e-5).map(([,i])=>i);assert.equal(indices.length,1)
const i=indices[0],a=original[i-1],p=original[i],b=original[i+1];assert([a,b].every(q=>q.route_type==='wire'&&q.layer===p.layer))
const matchedBuses=c.filter(e=>e.type==='source_bus'&&e.source_trace_ids.includes(id)).filter(bus=>{
 const lengths=c.filter(e=>e.type==='pcb_trace'&&bus.source_trace_ids.includes(e.source_trace_id)).map(e=>ddrRouteLength(e.route))
 return Math.max(...lengths)-Math.min(...lengths)<=bus.max_length_skew
})
const retainsMatchedBuses=()=>matchedBuses.every(bus=>{
 const lengths=c.filter(e=>e.type==='pcb_trace'&&bus.source_trace_ids.includes(e.source_trace_id)).map(e=>ddrRouteLength(e.route))
 return Math.max(...lengths)-Math.min(...lengths)<=bus.max_length_skew
})
const angle=q=>Math.acos(Math.max(-1,Math.min(1,((a.x-q.x)*(b.x-q.x)+(a.y-q.y)*(b.y-q.y))/(Math.hypot(a.x-q.x,a.y-q.y)*Math.hypot(b.x-q.x,b.y-q.y)))))*180/Math.PI
const probes=[];let passed=false
search:for(const distance of [.1,.15,.2,.25,.3,.4,.5,.6,.8])for(let j=0;j<32;j++){
 const q={...p,x:p.x+distance*Math.cos(j*Math.PI/16),y:p.y+distance*Math.sin(j*Math.PI/16)}
 if(angle(q)<23||!guard([a,q,b]))continue
 t.route=[...original.slice(0,i),q,...original.slice(i+1)]
 if(!retainsMatchedBuses())continue
 if(!validator.validate(c,t))continue
 const counts=validator.complete(c);assert(Object.values(counts).every(v=>v===0))
 const g=await fillG350LockedGround(c);probes.push({point:q,angleDegrees:angle(q),counts,ground:{portErrors:g.portErrors,elapsedSeconds:g.elapsedSeconds,errors:g.errors}})
 if(g.portErrors)continue
 delete t.trace_length;fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n');fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n');passed=true;break search
}
if(!passed)t.route=original
validator.assertImmutable(c)
const report={input:{path:input,sha256:hash(input)},name,originalPoint:p,originalAngleDegrees:angle(p),beforeMm:ddrRouteLength(original),afterMm:ddrRouteLength(t.route),probes,passed,previouslyMatchedBusesPreserved:matchedBuses.map(b=>b.name),barrelsPadsEndpointsAndForeignCopperPreserved:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false}
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));process.exitCode=passed?0:1
