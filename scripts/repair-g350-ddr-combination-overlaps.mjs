// Repair an explicitly rejected planar combination. Intermediate circuits retain
// actual failing native counts and are never qualified; only a zero-error final
// circuit with fresh ground can become a proposal for source/CAD qualification.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {createG350LocalGuard} from './lib/g350-ddr-local-guard.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'
const [input,legalBaseline,root,namesText,secondsText='180']=process.argv.slice(2),names=namesText?.split(','),seconds=Number(secondsText)
assert(input&&legalBaseline&&root&&names?.length&&!fs.existsSync(root)&&seconds>0&&seconds<=600&&new Set(names).size===names.length)
assert(names.every(n=>n.startsWith('DDR_')));fs.mkdirSync(root);fs.copyFileSync('scripts/repair-g350-ddr-combination-overlaps.mjs',root+'/planner.executed.mjs')
const read=p=>JSON.parse(fs.readFileSync(p)).filter(e=>!e.type.includes('error')),hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const baseline=read(legalBaseline),c=read(input),original=structuredClone(c),validator=createG350PlanarPlanningValidator(baseline)
validator.assertImmutable(c)
const namesById=new Map(c.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e.name]))
const targets=names.map(name=>c.find(e=>e.type==='pcb_trace'&&namesById.get(e.source_trace_id)===name));assert(targets.every(Boolean))
const selectedIds=new Set(targets.map(t=>t.pcb_trace_id)),initialErrors=checks.checkEachPcbTraceNonOverlapping(c),originalErrorIds=new Set(initialErrors.map(e=>e.pcb_trace_error_id));assert(initialErrors.length>0&&initialErrors.length<=12)
const constantLength=process.env.G350_DDR_REPAIR_CONSTANT_LENGTH==='1'
assert(process.env.G350_DDR_REPAIR_CONSTANT_LENGTH===undefined||['0','1'].includes(process.env.G350_DDR_REPAIR_CONSTANT_LENGTH))
const blockSize=Number(process.env.G350_DDR_REPAIR_BLOCK_SIZE??1);assert(Number.isInteger(blockSize)&&blockSize>=1&&blockSize<=4);assert(blockSize===1||constantLength)
const skew=b=>{const v=c.filter(t=>t.type==='pcb_trace'&&b.source_trace_ids.includes(t.source_trace_id)).map(t=>ddrRouteLength(t.route));return Math.max(...v)-Math.min(...v)}
const initiallyMatchedBuses=c.filter(e=>e.type==='source_bus'&&skew(e)<=e.max_length_skew)
const retainsMatching=()=>initiallyMatchedBuses.every(b=>skew(b)<=b.max_length_skew)
const distanceToSegment=(q,a,b)=>{const vx=b.x-a.x,vy=b.y-a.y,u=Math.max(0,Math.min(1,((q.x-a.x)*vx+(q.y-a.y)*vy)/(vx*vx+vy*vy||1)));return Math.hypot(q.x-a.x-u*vx,q.y-a.y-u*vy)}
const angle=(a,p,b)=>Math.acos(Math.max(-1,Math.min(1,((a.x-p.x)*(b.x-p.x)+(a.y-p.y)*(b.y-p.y))/(Math.hypot(a.x-p.x,a.y-p.y)*Math.hypot(b.x-p.x,b.y-p.y)))))*180/Math.PI
const begun=performance.now(),deadline=Date.now()+seconds*1000,progress=[];let remaining=initialErrors,probes=0
for(const t of targets){
 const targetDeadline=Math.min(deadline,Date.now()+seconds*1000/targets.length)
 const old=structuredClone(t.route),beforeMm=ddrRouteLength(old),guard=createG350LocalGuard(c,t),spots=remaining.filter(e=>e.pcb_trace_error_id.includes(t.pcb_trace_id)).map(e=>e.center)
 if(!spots.length)continue
 const vertices=old.map((p,i)=>({p,i,a:old[i-1],b:old[i+blockSize],block:old.slice(i,i+blockSize)})).filter(({p,i,a,b,block})=>i>0&&i+blockSize<old.length&&[a,...block,b].every(q=>q.route_type==='wire'&&q.layer===p.layer)&&spots.some(q=>[a,...block].some((e,k)=>distanceToSegment(q,e,[...block,b][k])<.4)))
 let found=false
 search:for(const distance of [.02,.04,.08,.1,.15,.2,.3,.4])for(const {p,i,a,b,block}of vertices)for(let j=0;j<32;j++){
  if(Date.now()>targetDeadline)break search
  let q={...p,x:p.x+distance*Math.cos(j*Math.PI/16),y:p.y+distance*Math.sin(j*Math.PI/16)}
  if(constantLength){
   const last=block.at(-1),fa={x:a.x-p.x,y:a.y-p.y},fb={x:b.x-last.x,y:b.y-last.y}
   const span=Math.hypot(fb.x-fa.x,fb.y-fa.y),major=(Math.hypot(fa.x,fa.y)+Math.hypot(fb.x,fb.y))/2
   const minor=Math.sqrt(Math.max(0,major*major-span*span/4));if(span<1e-9||minor<1e-9)continue
   const ux=(fb.x-fa.x)/span,uy=(fb.y-fa.y)/span,cx=(fa.x+fb.x)/2,cy=(fa.y+fb.y)/2
   const theta0=Math.atan2((cx*uy-cy*ux)/minor,(-cx*ux-cy*uy)/major)
   const theta=theta0+(j<16?1:-1)*distance*(1+j%16)/major
   q={...p,x:p.x+cx+ux*major*Math.cos(theta)-uy*minor*Math.sin(theta),y:p.y+cy+uy*major*Math.cos(theta)+ux*minor*Math.sin(theta)}
   if(Math.hypot(q.x-p.x,q.y-p.y)>.8)continue
   assert(Math.abs(Math.hypot(q.x-a.x,q.y-a.y)+Math.hypot(last.x+q.x-p.x-b.x,last.y+q.y-p.y-b.y)-major*2)<1e-7)
  }
  const moved=block.map(v=>({...v,x:v.x+q.x-p.x,y:v.y+q.y-p.y})),chain=[a,...moved,b]
  if(angle(a,moved[0],chain[2])<25||angle(chain.at(-3),moved.at(-1),b)<25||!guard(chain))continue
  t.route=[...old.slice(0,i),...moved,...old.slice(i+blockSize)]
  if(!retainsMatching()||checks.checkPcbTraceSelfShorts(c).length)continue
  probes++;const errors=checks.checkEachPcbTraceNonOverlapping(c)
  if(errors.length>=remaining.length||errors.some(e=>!originalErrorIds.has(e.pcb_trace_error_id)))continue
  const counts=validator.complete(c)
  if(Object.entries(counts).some(([k,v])=>k!=='checkEachPcbTraceNonOverlapping'&&v!==0))continue
  assert.equal(counts.checkEachPcbTraceNonOverlapping,errors.length)
  delete t.trace_length;remaining=errors;found=true
  const record={name:namesById.get(t.source_trace_id),vertexIndex:i,oldPoint:p,newPoint:q,oldBlock:block,newBlock:moved,angleDegrees:angle(a,moved[0],chain[2]),beforeMm,afterMm:ddrRouteLength(t.route),remainingNativeOverlapErrors:remaining,counts,planningOnly:true}
  progress.push(record);fs.writeFileSync(root+'/intermediate-'+progress.length+'.circuit.json',JSON.stringify(c,null,2)+'\n');console.log(JSON.stringify(record));break search
 }
 if(!found)t.route=old
}
for(const t of c.filter(e=>e.type==='pcb_trace')){
 const old=original.find(e=>e.pcb_trace_id===t.pcb_trace_id)
 if(!selectedIds.has(t.pcb_trace_id))assert.deepEqual(t,old)
 assert.deepEqual(t.route.filter(p=>p.route_type==='via'),old.route.filter(p=>p.route_type==='via'));assert.deepEqual([t.route[0],t.route.at(-1)],[old.route[0],old.route.at(-1)])
}
validator.assertImmutable(c);const counts=validator.complete(c);let ground=null
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
if(Object.values(counts).every(v=>v===0)){const g=await fillG350LockedGround(c);ground={portErrors:g.portErrors,errors:g.errors,elapsedSeconds:g.elapsedSeconds};fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')}
const passed=Object.values(counts).every(v=>v===0)&&ground?.portErrors===0&&retainsMatching()
const report={input:{path:input,sha256:hash(input)},legalBaseline:{path:legalBaseline,sha256:hash(legalBaseline)},selectedNames:names,constantLength,blockSize,maximumSecondsPerTarget:seconds/targets.length,initialErrors,progress,probes,elapsedSeconds:(performance.now()-begun)/1000,counts,ground,initiallyMatchedBusesPreserved:initiallyMatchedBuses.map(b=>b.name),groups:c.filter(e=>e.type==='source_bus'&&['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(e.name)).map(b=>({name:b.name,skewMm:skew(b),limitMm:b.max_length_skew})),passed,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false}
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,initialErrors:undefined,progress:undefined}));process.exitCode=passed?0:1
