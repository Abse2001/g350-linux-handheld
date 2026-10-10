// Real, constant-length planar proposals. A geometry model guides the search;
// fresh source and independent all-rule CAD/numeric checks remain mandatory.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
import {createG350LocalGuard} from './lib/g350-ddr-local-guard.mjs'
import {fillG350LockedGround} from './lib/g350-locked-ground-fill.mjs'
const [input,root,name,indexText,model]=process.argv.slice(2)
let index=Number(indexText)
assert(input&&root&&name?.startsWith('DDR_')&&Number.isInteger(index)&&model&&!fs.existsSync(root));fs.mkdirSync(root)
const c=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),id=c.find(e=>e.type==='source_trace'&&e.name===name)?.source_trace_id,t=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id===id);assert(t)
const validator=createG350PlanarPlanningValidator(c),initialCounts=validator.complete(c);assert(Object.values(initialCounts).every(v=>v===0))
const requestedX=process.env.G350_NECK_X,requestedY=process.env.G350_NECK_Y
if(requestedX!==undefined||requestedY!==undefined){
 assert(requestedX!==undefined&&requestedY!==undefined&&Number.isFinite(Number(requestedX))&&Number.isFinite(Number(requestedY)))
 const matches=t.route.flatMap((q,i)=>q.route_type==='wire'&&Math.hypot(q.x-Number(requestedX),q.y-Number(requestedY))<1e-8?[i]:[])
 assert.equal(matches.length,1);index=matches[0]
}
const original=structuredClone(t.route),beforeMm=ddrRouteLength(original),[a,p,b]=original.slice(index-1,index+2)
assert(index>1&&index+2<original.length&&[a,p,b].every(q=>q.route_type==='wire'&&q.layer===p.layer))
const span=Math.hypot(b.x-a.x,b.y-a.y),major=(Math.hypot(p.x-a.x,p.y-a.y)+Math.hypot(p.x-b.x,p.y-b.y))/2,minor=Math.sqrt(major*major-span*span/4);assert(minor>1e-8)
const ux=(b.x-a.x)/span,uy=(b.y-a.y)/span,cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,theta0=Math.atan2((-(p.x-cx)*uy+(p.y-cy)*ux)/minor,((p.x-cx)*ux+(p.y-cy)*uy)/major),guard=createG350LocalGuard(c,t),attempts=[]
const angle=(u,v,w)=>Math.acos(Math.max(-1,Math.min(1,((u.x-v.x)*(w.x-v.x)+(u.y-v.y)*(w.y-v.y))/(Math.hypot(u.x-v.x,u.y-v.y)*Math.hypot(w.x-v.x,w.y-v.y)))))*180/Math.PI
let selected=null
const minimumOffset=Number(process.env.G350_NECK_MINIMUM_OFFSET_RAD??0)
assert(Number.isFinite(minimumOffset)&&minimumOffset>=0&&minimumOffset<=1)
search:for(const offset of [.01,.02,.04,.08,.1,.15,.2,.3,.4,.6,.8,1])for(const sign of [1,-1]){
 if(offset<minimumOffset)continue
 const theta=theta0+sign*offset,q={...p,x:cx+ux*major*Math.cos(theta)-uy*minor*Math.sin(theta),y:cy+uy*major*Math.cos(theta)+ux*minor*Math.sin(theta)}
 if(Math.hypot(q.x-p.x,q.y-p.y)>.8||angle(a,q,b)<25||angle(original[index-2],a,q)<25||angle(q,b,original[index+2])<25||!guard([a,q,b]))continue
 t.route=[...original.slice(0,index),q,...original.slice(index+1)];assert(Math.abs(ddrRouteLength(t.route)-beforeMm)<1e-7)
 const physical=validator.validate(c,t),record={point:q,physicalProposalPassed:physical};attempts.push(record)
 if(!physical)continue
 const path='/tmp/g350-ground-neck-'+process.pid+'.circuit.json',out='/tmp/g350-ground-neck-'+process.pid+'.space.json';fs.writeFileSync(path,JSON.stringify(c))
 const result=spawnSync('python3',[model,out,path],{encoding:'utf8'});assert.equal(result.status,0,result.stderr)
 const space=JSON.parse(fs.readFileSync(out));record.groundPortsInModel=space.groundPorts;fs.unlinkSync(path);fs.unlinkSync(out)
 if(space.groundPorts>2){selected=q;break search}
}
if(!selected)t.route=original
else t.route=[...original.slice(0,index),selected,...original.slice(index+1)]
validator.assertImmutable(c);assert.deepEqual(t.route.filter(q=>q.route_type==='via'),original.filter(q=>q.route_type==='via'));assert.deepEqual([t.route[0],t.route.at(-1)],[original[0],original.at(-1)])
const counts=validator.complete(c);let ground=null
if(selected&&Object.values(counts).every(v=>v===0)){const g=await fillG350LockedGround(c);ground={portErrors:g.portErrors,elapsedSeconds:g.elapsedSeconds};fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')}
delete t.trace_length;fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
const passed=!!selected&&Object.values(counts).every(v=>v===0)&&ground?.portErrors===0,sha=path=>createHash('sha256').update(fs.readFileSync(path)).digest('hex')
const report={input:{path:input,sha256:sha(input)},name,index,minimumOffsetRadians:minimumOffset,originalPoint:p,selectedPoint:selected,beforeMm,afterMm:ddrRouteLength(t.route),attempts,counts,ground,passed,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false}
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');fs.copyFileSync('scripts/reshape-g350-ddr-ground-neck.mjs',root+'/planner.executed.mjs');fs.copyFileSync(model,root+'/model.executed.py');console.log(JSON.stringify(report));process.exitCode=passed?0:1
