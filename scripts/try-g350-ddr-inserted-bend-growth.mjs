// Planning only: insert a real planar bend, preserving every existing barrel,
// pad, endpoint and foreign trace. Every retained edit needs a fresh native fill.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {createG350LocalGuard} from './lib/g350-ddr-local-guard.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'

const [input,root,name,goalText,secondsText='180']=process.argv.slice(2)
assert(input&&root&&name&&!fs.existsSync(root))
const goal=Number(goalText),seconds=Number(secondsText)
assert(Number.isFinite(goal)&&goal>0&&seconds>0&&seconds<=600)
fs.mkdirSync(root)
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
fs.copyFileSync('scripts/try-g350-ddr-inserted-bend-growth.mjs',root+'/planner.executed.mjs')
const c=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const s=c.find(e=>e.type==='source_trace'&&e.name===name)
assert(s&&name.startsWith('DDR_'))
const t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===s.source_trace_id)
assert(t)
const original=structuredClone(t.route),before=ddrRouteLength(original),delta=goal-before
assert(delta>.005)
const validator=createG350PlanarPlanningValidator(c),localGuard=createG350LocalGuard(c,t)
const baselineGround=await fillG350LockedGround(c)
assert.equal(baselineGround.portErrors,0)
const begun=performance.now(),deadline=Date.now()+seconds*1000
const probes=[],groundRejections=[];let retained=false
// Test longer inner-layer segments first. A triangular detour uses less lateral
// room than a rectangular tooth, and adds its actual geometric length.
const segments=original.slice(0,-1).map((a,i)=>({a,b:original[i+1],i}))
 .filter(({a,b})=>a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer&&Math.hypot(a.x-b.x,a.y-b.y)>.24)
 .sort((a,b)=>Number(b.a.layer.startsWith('inner'))-Number(a.a.layer.startsWith('inner'))||Math.hypot(b.a.x-b.b.x,b.a.y-b.b.y)-Math.hypot(a.a.x-a.b.x,a.a.y-a.b.y))
search:for(const {a,b,i} of segments)for(const fraction of [.5,.25,.75,.1,.9])for(const sign of [1,-1]){
 if(Date.now()>deadline)break search
 const span=Math.hypot(b.x-a.x,b.y-a.y),ux=(b.x-a.x)/span,uy=(b.y-a.y)/span
 const bend=h=>({route_type:'wire',x:a.x+ux*span*fraction-uy*h*sign,y:a.y+uy*span*fraction+ux*h*sign,layer:a.layer,width:.1016})
 const gain=h=>Math.hypot(span*fraction,h)+Math.hypot(span*(1-fraction),h)-span
 let lo=0,hi=delta+span
 for(let k=0;k<60;k++){const mid=(lo+hi)/2;if(gain(mid)<delta)lo=mid;else hi=mid}
 const p=bend((lo+hi)/2)
 if(!localGuard([a,p,b]))continue
 t.route=[...original.slice(0,i+1),p,...original.slice(i+1)]
 assert(Math.abs(ddrRouteLength(t.route)-goal)<1e-7)
 if(!validator.validate(c,t)){t.route=structuredClone(original);continue}
 const counts=validator.complete(c)
 assert(Object.values(counts).every(n=>n===0))
 const g=await fillG350LockedGround(c)
 const record={segmentIndex:i,layer:a.layer,fraction,sign,bend:p,counts,portErrors:g.portErrors}
 probes.push(record);console.log(JSON.stringify(record))
 if(g.portErrors){
  const path=root+'/rejected-ground-'+probes.length+'.circuit.json'
  fs.writeFileSync(path,JSON.stringify(g.circuit,null,2)+'\n')
  groundRejections.push({path,sha256:hash(path),errors:g.errors})
  t.route=structuredClone(original);continue
 }
 delete t.trace_length
 fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
 fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')
 retained=true;break search
}
if(!retained)t.route=structuredClone(original)
validator.assertImmutable(c)
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:hash(input)},name,beforeMm:before,goalMm:goal,actualLengthMm:ddrRouteLength(t.route),budgetSeconds:seconds,elapsedSeconds:(performance.now()-begun)/1000,probes,groundRejections,retained,barrelsPadsEndpointsAndForeignCopperPreserved:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n')
