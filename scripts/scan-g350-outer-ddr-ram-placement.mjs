// Authorized placement exploration using public BusLanesPipelineSolver.step().
// RAM reference endpoints removed for planning must be rebuilt before any board promotion.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {spawn} from 'node:child_process'
const args=process.argv.slice(2),worker=args[0]==='--worker';if(worker)args.shift()
const [input,phaseInput,root,placementText]=args
assert(input&&phaseInput&&root)
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
if(worker){
 const {SOLVERS}=await import('@tscircuit/core')
 assert.equal(JSON.parse(fs.readFileSync('node_modules/@tscircuit/core/package.json')).version,'0.0.2107')
 assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
 const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),srj=JSON.parse(fs.readFileSync(phaseInput)),placement=JSON.parse(placementText)
 assert(Number.isFinite(placement.x)&&Number.isFinite(placement.y)&&[0,90,180,270].includes(placement.rotation))
 const ram=base.find(e=>e.type==='pcb_component'&&base.some(s=>s.type==='source_component'&&s.name==='U_RAM'&&s.source_component_id===e.source_component_id));assert(ram)
 const ports=new Set(base.filter(e=>e.type==='pcb_port'&&e.pcb_component_id===ram.pcb_component_id).map(e=>e.pcb_port_id))
 const rotate=p=>{let x=p.x-ram.center.x,y=p.y-ram.center.y;for(let k=0;k<(placement.rotation-ram.rotation+360)%360/90;k++)[x,y]=[-y,x];return {...p,x:x+placement.x,y:y+placement.y}}
 const swapped=(placement.rotation-ram.rotation+360)%180!==0,w=swapped?ram.height:ram.width,h=swapped?ram.width:ram.height
 const bodyCollisions=base.filter(e=>e.type==='pcb_component'&&e.pcb_component_id!==ram.pcb_component_id&&e.layer===ram.layer&&!e.do_not_place&&!e.is_allowed_to_be_off_board&&Math.abs(e.center.x-placement.x)<(w+e.width)/2&&Math.abs(e.center.y-placement.y)<(h+e.height)/2).map(e=>({pcb_component_id:e.pcb_component_id,name:base.find(s=>s.type==='source_component'&&s.source_component_id===e.source_component_id)?.name}))
 const ids=new Set(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>e.source_trace_id));assert.equal(ids.size,49)
 const originals=base.filter(e=>e.type==='pcb_trace'&&ids.has(e.source_trace_id));assert.equal(originals.length,49)
 const ramPads=base.filter(e=>e.type==='pcb_smtpad'&&e.pcb_component_id===ram.pcb_component_id)
 const references=base.filter(e=>e.type==='pcb_trace'&&!ids.has(e.source_trace_id)&&e.route.some(p=>p.route_type==='wire'&&p.layer==='top'&&ramPads.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<1e-8)))
 assert.equal(references.length,36)
 const removeTraceIds=new Set([...originals,...references].map(t=>t.pcb_trace_id)),removed=base.filter(e=>e.type==='pcb_via'&&removeTraceIds.has(e.pcb_trace_id))
 const fixed=base.filter(e=>e.type==='pcb_trace'&&!removeTraceIds.has(e.pcb_trace_id)),owners=new Map(fixed.map(t=>[t.pcb_trace_id,t.source_trace_id]))
 const buses=base.filter(e=>e.type==='source_bus'&&e.name?.startsWith('DDR_'))
 const problem={...srj,allowedLayers:['top','bottom'],connections:originals.map(t=>{
  const prior=srj.connections.find(c=>c.name===t.source_trace_id);assert(prior)
  return {...prior,pointsToConnect:prior.pointsToConnect.map(p=>ports.has(p.pcb_port_id)?rotate(p):p)}
 }),obstacles:[...srj.obstacles.map(o=>o.componentId===ram.pcb_component_id?{...o,center:rotate(o.center),ccwRotationDegrees:(o.ccwRotationDegrees??0)+(placement.rotation-ram.rotation+360)%360}:o),...base.filter(e=>e.type==='pcb_via'&&!removed.includes(e)).map(v=>({type:'obstacle',shape:'circle',center:{x:v.x,y:v.y},width:v.outer_diameter,height:v.outer_diameter,layers:['top','inner1','inner2','bottom'],connectedTo:[owners.get(v.pcb_trace_id)??'FIXED_HOLE']}))],traces:fixed.map(t=>({...t,connection_name:t.source_trace_id})),buses:buses.map(b=>({busId:b.name,connectionNames:b.source_trace_ids,traceWidth:.1016,allowedLayers:['top','bottom'],preferredLayers:['bottom','top']})),differentialPairs:srj.differentialPairs}
 assert(problem.connections.every(c=>c.pointsToConnect.some(p=>ports.has(p.pcb_port_id))))
 fs.writeFileSync(root+'/input.simple-route.json',JSON.stringify(problem)+'\n')
 fs.writeFileSync(root+'/scope.json',JSON.stringify({placement,bodyCollisions,removedDdrCarriers:49,removedRamReferenceTraceIds:references.map(t=>t.pcb_trace_id),removedOnlyOwnedViaIds:removed.map(v=>v.pcb_via_id),outsideTraceIdsPreserved:fixed.map(t=>t.pcb_trace_id),ramReferenceConnectionsNeedRebuild:true,planningOnly:true,fabricationReady:false},null,2)+'\n')
 if(bodyCollisions.length){fs.writeFileSync(root+'/solver-report.json',JSON.stringify({placement,rejected:true,reason:'component_body_overlap',bodyCollisions,fabricationReady:false},null,2)+'\n');process.exitCode=3}
 else{
  const solver=new SOLVERS.BusLanesPipelineSolver(problem,{maxSearchIterations:200000,maxLaneIterations:20000})
  let steps=0,exception=null
  try{while(!solver.solved&&!solver.failed&&['resolve_layers','retry_layers'].includes(solver.phase)&&steps<16){solver.step();steps++}}catch(e){exception=e.message}
  const packagePreparationPassed=!exception&&!solver.failed&&(solver.phase.startsWith('lanes_')||['route_shared_layers','route_backward_packages','solved'].includes(solver.phase))
  fs.writeFileSync(root+'/solver-report.json',JSON.stringify({placement,steps,phase:solver.phase,solved:solver.solved,failed:solver.failed,error:exception??solver.error??null,failureCode:solver.failureCode??null,packagePreparationPassed,publicStats:solver.stats,onlyPublicStepUsed:true,completeRoutesNotClaimed:true,ramReferencesNeedRebuild:true,fabricationReady:false},null,2)+'\n')
  process.exitCode=packagePreparationPassed?0:2
 }
}else{
 assert(!fs.existsSync(root));fs.mkdirSync(root);fs.copyFileSync('scripts/scan-g350-outer-ddr-ram-placement.mjs',root+'/helper.executed.mjs')
 const sourceSha=hash(input),phaseSha=hash(phaseInput),results=[]
 const placements=placementText?JSON.parse(placementText):[{x:0,y:4,rotation:90},{x:0,y:6,rotation:90},{x:0,y:8,rotation:90},{x:-8,y:6,rotation:90},{x:8,y:6,rotation:90},{x:0,y:5,rotation:270},{x:0,y:4,rotation:0},{x:0,y:4,rotation:180}]
 assert(Array.isArray(placements)&&placements.length>0&&placements.length<=16)
 for(const [index,placement] of placements.entries()){
  const dir=root+'/placement-'+index;fs.mkdirSync(dir);const fd=fs.openSync(dir+'/execution.log','wx'),start=performance.now()
  const child=spawn(process.execPath,['scripts/scan-g350-outer-ddr-ram-placement.mjs','--worker',input,phaseInput,dir,JSON.stringify(placement)],{stdio:['ignore',fd,fd]})
  let deadlineExceeded=false;const timer=setTimeout(()=>{deadlineExceeded=true;child.kill('SIGTERM')},45000)
  const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}))});clearTimeout(timer);fs.closeSync(fd)
  const record={placement,...result,deadlineExceeded,elapsedSeconds:(performance.now()-start)/1000};results.push(record)
  fs.writeFileSync(dir+'/execution.json',JSON.stringify(record,null,2)+'\n');fs.writeFileSync(root+'/progress.json',JSON.stringify({results,planningOnly:true,fabricationReady:false},null,2)+'\n');console.log(JSON.stringify(record))
 }
 assert.equal(hash(input),sourceSha);assert.equal(hash(phaseInput),phaseSha)
 fs.writeFileSync(root+'/report.json',JSON.stringify({source:{path:input,sha256:sourceSha},phaseInput:{path:phaseInput,sha256:phaseSha},results,sourceAndPhaseInputBytesUnchanged:true,noCandidatePromoted:true,ramReferenceRebuildAndCompleteQualificationRequired:true,fabricationReady:false},null,2)+'\n')
 process.exitCode=results.some(r=>r.code===0)?0:2
}
