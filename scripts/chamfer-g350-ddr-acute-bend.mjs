// Remove a real acute copper corner; retain every pad/barrel and foreign trace.
// Fresh-source replay and all-rule KiCad qualification are still required.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'
const [input,root,name,xText,yText,trimText]=process.argv.slice(2)
const x=Number(xText),y=Number(yText),trim=Number(trimText)
assert(input&&root&&name?.startsWith('DDR_')&&!fs.existsSync(root)&&[x,y,trim].every(Number.isFinite)&&trim>.1&&trim<=1)
fs.mkdirSync(root);fs.copyFileSync('scripts/chamfer-g350-ddr-acute-bend.mjs',root+'/planner.executed.mjs')
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const c=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const id=c.find(e=>e.type==='source_trace'&&e.name===name)?.source_trace_id,t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===id);assert(t)
const validator=createG350PlanarPlanningValidator(c),before=structuredClone(t.route),beforeMm=ddrRouteLength(before)
const indices=before.map((p,i)=>[p,i]).filter(([p])=>p.route_type==='wire'&&Math.hypot(p.x-x,p.y-y)<1e-5).map(([,i])=>i)
assert.equal(indices.length,1);const i=indices[0],a=before[i-1],p=before[i],b=before[i+1]
assert(a.route_type==='wire'&&b.route_type==='wire'&&a.layer===p.layer&&b.layer===p.layer&&i>0&&i<before.length-1)
const pointToward=q=>{const length=Math.hypot(q.x-p.x,q.y-p.y);assert(length>trim*1.1);return {...p,x:p.x+(q.x-p.x)*trim/length,y:p.y+(q.y-p.y)*trim/length}}
const q1=pointToward(a),q2=pointToward(b)
t.route=[...before.slice(0,i),q1,q2,...before.slice(i+1)];delete t.trace_length
assert.deepEqual(t.route.filter(p=>p.route_type==='via'),before.filter(p=>p.route_type==='via'))
assert.deepEqual([t.route[0],t.route.at(-1)],[before[0],before.at(-1)])
validator.assertImmutable(c);const counts=validator.complete(c)
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
let ground=null
if(Object.values(counts).every(v=>v===0)){const g=await fillG350LockedGround(c);ground={portErrors:g.portErrors,errors:g.errors,elapsedSeconds:g.elapsedSeconds};fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')}
const passed=Object.values(counts).every(v=>v===0)&&ground?.portErrors===0
const report={input:{path:input,sha256:hash(input)},name,originalPoint:p,trimMm:trim,insertedPoints:[q1,q2],beforeMm,afterMm:ddrRouteLength(t.route),counts,ground,passed,barrelsPadsEndpointsAndForeignCopperPreserved:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false}
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));process.exitCode=passed?0:1
