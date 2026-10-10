// Planar BusLanes proposals only. Never promotes an entry or qualifies fabrication.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {spawn,execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'

const argv=process.argv.slice(2),worker=argv[0]==='--worker'
if(worker)argv.shift()
const [input,phaseInput,root,signal,deltaText,mode='refine',spanFirst='auto',targetLayer='same',endStubText='',startStubText='']=argv
assert(input&&phaseInput&&root&&signal&&deltaText)
const delta=Number(deltaText)
assert(['DDR_D9','DDR_A13','DDR_D12','DDR_D15','DDR_A0','DDR_A6','DDR_CSn0'].includes(signal))
assert(Number.isFinite(delta)&&delta!==0&&Math.abs(delta)<=8)
assert(spanFirst==='auto'||/^\d+(?::\d+)?$/.test(spanFirst))
assert(['same','inner1','inner2','bottom','top-remove-boundary-vias'].includes(targetLayer))
assert(['refine','route'].includes(mode))
const endStubCoordinates=endStubText?endStubText.split(',').map(Number):null
if(endStubCoordinates){assert.equal(endStubCoordinates.length,2);assert(endStubCoordinates.every(Number.isFinite));assert(mode==='route'&&targetLayer!=='top-remove-boundary-vias');assert(endStubCoordinates[0]>=-20&&endStubCoordinates[0]<=20&&endStubCoordinates[1]>=-8&&endStubCoordinates[1]<=34)}
const startStubCoordinates=startStubText?startStubText.split(',').map(Number):null
if(startStubCoordinates){assert.equal(startStubCoordinates.length,2);assert(startStubCoordinates.every(Number.isFinite));assert(mode==='route'&&targetLayer!=='top-remove-boundary-vias');assert(startStubCoordinates[0]>=-20&&startStubCoordinates[0]<=20&&startStubCoordinates[1]>=-8&&startStubCoordinates[1]<=34)}
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
if(!worker){
 assert(!fs.existsSync(root));fs.mkdirSync(root,{recursive:true})
 fs.copyFileSync(fileURLToPath(import.meta.url),root+'/helper.executed.mjs')
 const log=fs.openSync(root+'/execution.log','wx'),started=performance.now()
 const child=spawn(process.execPath,[fileURLToPath(import.meta.url),'--worker',...argv],{stdio:['ignore',log,log]})
 let deadlineExceeded=false
 const timer=setTimeout(()=>{deadlineExceeded=true;child.kill('SIGTERM')},150000)
 const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}))})
 clearTimeout(timer);fs.closeSync(log)
 assert.equal(hash(input),JSON.parse(fs.readFileSync(root+'/inputs.json')).inputSha256,'Planning must not modify its source')
 fs.writeFileSync(root+'/execution.json',JSON.stringify({signal,deltaMm:delta,mode,spanFirst,targetLayer,endStubText,startStubText,...result,deadlineExceeded,elapsedSeconds:(performance.now()-started)/1000,sourceBytesUnchanged:true,fabricationReady:false},null,2)+'\n')
 console.log(JSON.stringify({root,...result,deadlineExceeded}));process.exitCode=result.code??1
}else{
 const {SOLVERS}=await import('@tscircuit/core')
 const {createG350PlanarPlanningValidator}=await import('./lib/g350-ddr-planar-planning-validator.mjs')
 const {ddrRouteLength}=await import('./lib/g350-full-board-length-tuning.mjs')
 const {fillG350LockedGround}=await import('./lib/g350-locked-ground-fill.mjs')
 const checks=await import('@tscircuit/checks')
 const patch='1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc'
 assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),patch)
 assert.equal(JSON.parse(fs.readFileSync('node_modules/@tscircuit/core/package.json')).version,'0.0.2107')
 fs.writeFileSync(root+'/inputs.json',JSON.stringify({input,inputSha256:hash(input),phaseInput,phaseInputSha256:hash(phaseInput),checksSha256:patch,coreVersion:'0.0.2107',coreSha256:hash('node_modules/@tscircuit/core/dist/index.js'),signal,deltaMm:delta,mode,spanFirst,targetLayer,endStubText,startStubText,fabricationReady:false},null,2)+'\n')
 let circuit=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
 const source=circuit.find(e=>e.type==='source_trace'&&e.name===signal)
 const trace=circuit.find(e=>e.type==='pcb_trace'&&e.source_trace_id===source.source_trace_id)
 const original=structuredClone(trace.route)
 let first,last
 if(spanFirst==='auto'){
  const wireIndices=original.flatMap((p,i)=>p.route_type==='wire'&&p.layer==='inner2'?[i]:[])
  assert(wireIndices.length>2);first=wireIndices[0];last=wireIndices.at(-1)
  assert.equal(last-first+1,wireIndices.length,'Require one contiguous Inner2 span')
 }else{
  const indices=spanFirst.split(':').map(Number);first=indices[0]
  assert(first<original.length&&original[first].route_type==='wire')
  if(indices.length===2){last=indices[1];assert(last>first&&last<original.length)}
  else{
   assert(first===0||original[first-1].route_type!=='wire'||original[first-1].layer!==original[first].layer)
   last=first;while(last+1<original.length&&original[last+1].route_type==='wire'&&original[last+1].layer===original[first].layer)last++
  }
 }
 const removeBoundaryVias=targetLayer==='top-remove-boundary-vias'
 const originalLayer=original[first].layer,layer=removeBoundaryVias?'top':targetLayer==='same'?originalLayer:targetLayer
 const removedBoundaryViaIds=new Set()
 assert(['inner1','inner2'].includes(originalLayer))
 const span=original.slice(first,last+1),width=span[0].width
 assert(span.every(p=>p.route_type==='wire'&&p.layer===originalLayer&&p.width===width))
 const endStub=endStubCoordinates?{route_type:'wire',x:endStubCoordinates[0],y:endStubCoordinates[1],layer,width}:null
 const startStub=startStubCoordinates?{route_type:'wire',x:startStubCoordinates[0],y:startStubCoordinates[1],layer,width}:null
 const endStubLength=endStub?Math.hypot(endStub.x-span.at(-1).x,endStub.y-span.at(-1).y):0
 const startStubLength=startStub?Math.hypot(startStub.x-span[0].x,startStub.y-span[0].y):0
 if(endStub)assert(endStubLength>=.2&&endStubLength<=2,'A real portal escape must be 0.2–2 mm long')
 if(startStub)assert(startStubLength>=.2&&startStubLength<=2,'A real portal escape must be 0.2–2 mm long')
 const stubLength=endStubLength+startStubLength
 if(layer!==originalLayer){
  assert(first>0&&last+1<original.length)
  for(const [via,wire] of [[original[first-1],span[0]],[original[last+1],span.at(-1)]]){
   assert(via.route_type==='via'&&Math.hypot(via.x-wire.x,via.y-wire.y)<1e-8)
   const physical=circuit.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===trace.pcb_trace_id&&Math.hypot(e.x-via.x,e.y-via.y)<1e-8)
   assert.equal(physical.length,1);assert.deepEqual(new Set(physical[0].layers),new Set(['top','inner1','inner2','bottom']))
   assert(Math.abs(physical[0].outer_diameter-.4572)<1e-8&&Math.abs(physical[0].hole_diameter-.254)<1e-8)
   if(removeBoundaryVias)removedBoundaryViaIds.add(physical[0].pcb_via_id)
  }
 }
 if(removeBoundaryVias){
  assert.equal(removedBoundaryViaIds.size,2)
  assert(first>=2&&last+2<original.length)
  assert.equal(original[first-1].from_layer,'top');assert.equal(original[last+1].to_layer,'top')
  for(const [wire,end] of [[original[first-2],span[0]],[original[last+2],span.at(-1)]])assert(wire.route_type==='wire'&&wire.layer==='top'&&Math.hypot(wire.x-end.x,wire.y-end.y)<1e-8)
 }
 const srj=JSON.parse(fs.readFileSync(phaseInput)),sid=source.source_trace_id
 // The rectangular computational bounds lie wholly inside the unchanged board.
 // Keep its physical outline and all original constraints in the actual circuit.
 const bounds={minX:-20,maxX:20,minY:-8,maxY:34}
 execFileSync('python3',['-c',"import json,sys;sys.path.insert(0,'.cloud-tools/python-routing');from shapely.geometry import Polygon,box;d=json.load(sys.stdin);assert Polygon([(p['x'],p['y']) for p in d['outline']]).contains(box(-20,-8,20,34))"],{input:JSON.stringify(circuit.find(e=>e.type==='pcb_board'))})
 assert(span.every(p=>p.x>=bounds.minX&&p.x<=bounds.maxX&&p.y>=bounds.minY&&p.y<=bounds.maxY))
 const owners=new Map(circuit.filter(e=>e.type==='pcb_trace').map(t=>[t.pcb_trace_id,t.source_trace_id]))
 const obstacles=srj.obstacles.map(o=>({...o,connectedTo:o.connectedTo.includes(sid)?[sid]:[]}))
 for(const v of circuit.filter(e=>e.type==='pcb_via'))obstacles.push({type:'obstacle',shape:'circle',center:{x:v.x,y:v.y},width:v.outer_diameter,height:v.outer_diameter,layers:['top','inner1','inner2','bottom'],connectedTo:[owners.get(v.pcb_trace_id)??'FIXED_HOLE']})
 const connection={name:sid,source_trace_id:sid,nominalTraceWidth:width,pointsToConnect:[startStub??span[0],endStub??span.at(-1)].map(p=>({x:p.x,y:p.y,layer}))}
 const planarLength=r=>r.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-r[i].x,p.y-r[i].y),0)
 const spanGoal=planarLength(span)+delta
 assert(spanGoal>0)
 const ownFixed=[]
 for(let i=1;i<original.length;i++){
  const a=original[i-1],b=original[i]
  if(i>first&&i<=last||a.route_type!=='wire'||b.route_type!=='wire'||a.layer!==b.layer)continue
  if(Math.hypot(a.x-b.x,a.y-b.y)<1e-10)continue
  const touchesTerminal=[a,b].some(p=>[span[0],span.at(-1)].some(q=>Math.hypot(p.x-q.x,p.y-q.y)<1e-8))
  const owner=touchesTerminal?sid:'FIXED_SELF'
  ownFixed.push({type:'pcb_trace',pcb_trace_id:'own_fixed_'+i,connection_name:owner,source_trace_id:owner,route:[a,b]})
 }
 const fixedLength=ownFixed.filter(t=>t.connection_name===sid).reduce((sum,t)=>sum+planarLength(t.route),0)
 if(endStub)ownFixed.push({type:'pcb_trace',pcb_trace_id:'g350_real_portal_escape',connection_name:sid,source_trace_id:sid,route:[endStub,{...span.at(-1),layer}]})
 if(startStub)ownFixed.push({type:'pcb_trace',pcb_trace_id:'g350_real_start_portal_escape',connection_name:sid,source_trace_id:sid,route:[{...span[0],layer},startStub]})
 const carrierGoal=spanGoal-stubLength;assert(carrierGoal>0)
 const problem={...srj,bounds,outline:undefined,connections:[connection],obstacles,
  allowedLayers:[layer],differentialPairs:[],
  buses:[{busId:'g350_inner_span_target',connectionNames:[sid],minLength:spanGoal+fixedLength,maxLength:spanGoal+fixedLength+.001,maxLengthSkew:.001,traceWidth:width,allowedLayers:[layer]}],
  traces:[...circuit.filter(e=>e.type==='pcb_trace'&&e!==trace).map(t=>({...t,connection_name:t.source_trace_id})),...ownFixed],
 }
 fs.writeFileSync(root+'/input.simple-route.json',JSON.stringify(problem)+'\n')
 const options={smoothTuning:mode==='refine',maxSearchIterations:200000,maxLaneIterations:20000}
 const solver=mode==='refine'?SOLVERS.BusLanesSolver.forRefinement(problem,[{...trace,connection_name:sid,route:span.map(p=>({...p,layer}))}],options):new SOLVERS.BusLanesSolver(problem,options)
 let iterations=0
 while(!solver.solved&&!solver.failed&&iterations<200000){solver.step();iterations++}
 const report={signal,deltaMm:delta,mode,first,last,originalLayer,layer,removedBoundaryViaIds:[...removedBoundaryViaIds],iterations,solved:solver.solved,failed:solver.failed,error:solver.error??null,failureCode:solver.failureCode??null,stats:solver.stats,spanBeforeMm:planarLength(span),spanGoalMm:spanGoal,fixedPortalContributionMm:fixedLength+stubLength,externalPortalContributionMm:fixedLength,realPortalEscapeMm:stubLength,carrierGoalMm:carrierGoal,endStub,startStub,endStubLengthMm:endStubLength,startStubLengthMm:startStubLength,planningRectangleInsidePhysicalOutline:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false}
 fs.writeFileSync(root+'/solver-report.json',JSON.stringify(report,null,2)+'\n')
 if(!solver.solved){console.log(JSON.stringify(report));process.exitCode=2}else{
  const output=solver.getOutput().traces.findLast(t=>t.connection_name===sid)
  assert(output?.route.length>1)
  const carrierStart=startStub??span[0]
  assert(Math.hypot(output.route[0].x-carrierStart.x,output.route[0].y-carrierStart.y)<1e-8)
  const carrierEnd=endStub??span.at(-1)
  assert(Math.hypot(output.route.at(-1).x-carrierEnd.x,output.route.at(-1).y-carrierEnd.y)<1e-8)
  assert(Math.abs(planarLength(output.route)-carrierGoal)<1e-6,'Carrier plus the real escape must satisfy the exact requested span length')
  fs.writeFileSync(root+'/output.span.json',JSON.stringify(output,null,2)+'\n')
  const replacement=output.route.map(p=>({route_type:'wire',x:p.x,y:p.y,layer,width}))
  if(startStub)replacement.unshift({...original[first],layer})
  else replacement[0]={...original[first],layer}
  if(endStub)replacement.push({...original[last],layer})
  else replacement[replacement.length-1]={...original[last],layer}
  trace.route=[...original.slice(0,first),...replacement,...original.slice(last+1)]
  const expected=structuredClone(original)
  if(removeBoundaryVias){
   trace.route=[...original.slice(0,first-1),...replacement,...original.slice(last+2)]
   circuit=circuit.filter(e=>e.type!=='pcb_via'||!removedBoundaryViaIds.has(e.pcb_via_id))
   assert.deepEqual(trace.route.filter(p=>p.route_type==='via'),original.filter((p,i)=>p.route_type==='via'&&i!==first-1&&i!==last+1))
   assert.deepEqual(trace.route.slice(0,first-1),original.slice(0,first-1))
   assert.deepEqual(trace.route.slice(first-1+replacement.length),original.slice(last+2))
  }else if(layer!==originalLayer){
   assert.equal(expected[first-1].to_layer,originalLayer);assert.equal(expected[last+1].from_layer,originalLayer)
   expected[first-1].to_layer=layer;expected[last+1].from_layer=layer
   trace.route[first-1]={...expected[first-1]};trace.route[first+replacement.length]={...expected[last+1]}
  }
  delete trace.trace_length
  if(!removeBoundaryVias){
   assert.equal(JSON.stringify(trace.route.filter(p=>p.route_type==='via')),JSON.stringify(expected.filter(p=>p.route_type==='via')))
   assert.equal(JSON.stringify(trace.route.slice(0,first)),JSON.stringify(expected.slice(0,first)))
   assert.equal(JSON.stringify(trace.route.slice(first+replacement.length)),JSON.stringify(expected.slice(last+1)))
  }
  assert.equal(JSON.stringify([trace.route[0],trace.route.at(-1)]),JSON.stringify([original[0],original.at(-1)]))
  const baseline=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
  const retainedBaseline=baseline.filter(e=>e.type!=='pcb_via'||!removedBoundaryViaIds.has(e.pcb_via_id))
  assert.deepEqual(circuit.filter(e=>e!==trace),retainedBaseline.filter(e=>e.type!=='pcb_trace'||e.pcb_trace_id!==trace.pcb_trace_id),'Every foreign record must remain exact; only two explicitly owned boundary holes may be removed')
  const validator=createG350PlanarPlanningValidator(retainedBaseline)
  report.counts=validator.complete(circuit);report.nativeBeforeMm=ddrRouteLength(original);report.nativeAfterMm=ddrRouteLength(trace.route)
  for(const n of ['checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'])report.counts[n]=checks[n](circuit).length
  assert(Math.abs(report.nativeAfterMm-report.nativeBeforeMm-delta+(removeBoundaryVias?3.2:0))<1e-6)
  report.originalPhysicalViaCount=baseline.filter(e=>e.type==='pcb_via').length
  report.proposedPhysicalViaCount=circuit.filter(e=>e.type==='pcb_via').length
  assert.equal(report.originalPhysicalViaCount-report.proposedPhysicalViaCount,removeBoundaryVias?2:0)
  report.physicalPassed=Object.values(report.counts).every(n=>n===0)
  if(report.physicalPassed){const g=await fillG350LockedGround(circuit);report.groundPortErrors=g.portErrors;report.groundErrors=g.errors;fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')}
  const bus=baseline.find(e=>e.type==='source_bus'&&e.source_trace_ids.includes(sid)&&e.name.startsWith('DDR_')&&e.source_trace_ids.length>2)
  assert(bus)
  const busLengths=c=>c.filter(e=>e.type==='pcb_trace'&&bus.source_trace_ids.includes(e.source_trace_id)).map(t=>ddrRouteLength(t.route))
  const before=busLengths(baseline),after=busLengths(circuit),skew=r=>Math.max(...r)-Math.min(...r)
  report.bus=bus.name;report.busSkewBeforeMm=skew(before);report.busSkewAfterMm=skew(after)
  report.retained=report.physicalPassed&&report.groundPortErrors===0&&report.busSkewAfterMm<=report.busSkewBeforeMm+1e-7&&Math.abs(report.nativeAfterMm-report.nativeBeforeMm)>.005
  fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(circuit,null,2)+'\n')
  fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));process.exitCode=report.retained?0:3
 }
}
