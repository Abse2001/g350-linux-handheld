// Rebuild DDR package approaches with the public pinned BusLanes pipeline.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {spawn} from 'node:child_process'
const args=process.argv.slice(2),worker=args[0]==='--worker';if(worker)args.shift()
const [input,phaseInput,root,mode='connectivity']=args
assert(input&&phaseInput&&root&&['prepare','connectivity','matched'].includes(mode))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
if(!worker){
 assert(!fs.existsSync(root));fs.mkdirSync(root);fs.copyFileSync('scripts/try-g350-outer-ddr-pad-first-bus-lanes.mjs',root+'/helper.executed.mjs')
 const sha=hash(input),fd=fs.openSync(root+'/execution.log','wx'),started=performance.now()
 const child=spawn(process.execPath,['scripts/try-g350-outer-ddr-pad-first-bus-lanes.mjs','--worker',...args],{stdio:['ignore',fd,fd]})
 let deadlineExceeded=false;const timer=setTimeout(()=>{deadlineExceeded=true;child.kill('SIGTERM')},150000)
 const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}))})
 clearTimeout(timer);fs.closeSync(fd);assert.equal(hash(input),sha)
 fs.writeFileSync(root+'/execution.json',JSON.stringify({...result,deadlineExceeded,elapsedSeconds:(performance.now()-started)/1000,inputSha256:sha,sourceBytesUnchanged:true,fabricationReady:false},null,2)+'\n');process.exitCode=result.code??1
}else{
 const {SOLVERS}=await import('@tscircuit/core'),checks=await import('@tscircuit/checks')
 const {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance}=await import('./lib/g350-ddr-physical-checks.mjs')
 const {ddrRouteLength}=await import('./lib/g350-full-board-length-tuning.mjs')
 assert.equal(JSON.parse(fs.readFileSync('node_modules/@tscircuit/core/package.json')).version,'0.0.2107')
 assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
 const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),srj=JSON.parse(fs.readFileSync(phaseInput))
 const ids=new Set(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>e.source_trace_id));assert.equal(ids.size,49)
 const selected=base.filter(e=>e.type==='pcb_trace'&&ids.has(e.source_trace_id));assert.equal(selected.length,49)
 const traceIds=new Set(selected.map(t=>t.pcb_trace_id)),removedIds=new Set(base.filter(e=>e.type==='pcb_via'&&traceIds.has(e.pcb_trace_id)).map(e=>e.pcb_via_id))
 const owners=new Map(base.filter(e=>e.type==='pcb_trace').map(t=>[t.pcb_trace_id,t.source_trace_id]))
 const buses=base.filter(e=>e.type==='source_bus'&&['DDR_RESET','DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(e.name))
 const problem={...srj,allowedLayers:['top','bottom'],connections:selected.map(t=>({name:t.source_trace_id,source_trace_id:t.source_trace_id,nominalTraceWidth:.1016,pointsToConnect:[t.route[0],t.route.at(-1)].map(p=>({x:p.x,y:p.y,layer:'top'}))})),obstacles:[...srj.obstacles,...base.filter(e=>e.type==='pcb_via'&&!removedIds.has(e.pcb_via_id)).map(v=>({type:'obstacle',shape:'circle',center:{x:v.x,y:v.y},width:v.outer_diameter,height:v.outer_diameter,layers:['top','inner1','inner2','bottom'],connectedTo:[owners.get(v.pcb_trace_id)??'FIXED_HOLE']}))],traces:base.filter(e=>e.type==='pcb_trace'&&!ids.has(e.source_trace_id)).map(t=>({...t,connection_name:t.source_trace_id})),buses:buses.map(b=>({busId:'g350_outer_pad_'+b.name,connectionNames:b.source_trace_ids,traceWidth:.1016,allowedLayers:['top','bottom'],preferredLayers:['bottom','top'],...(mode==='matched'&&b.max_length_skew?{maxLengthSkew:b.max_length_skew}:{})})),differentialPairs:srj.differentialPairs}
 // The physical outline and all pads/foreign vias/foreign copper remain hard.
 fs.writeFileSync(root+'/input.simple-route.json',JSON.stringify(problem)+'\n')
 fs.writeFileSync(root+'/inputs.json',JSON.stringify({input:{path:input,sha256:hash(input)},phaseInput:{path:phaseInput,sha256:hash(phaseInput)},mode,signalLayers:['top','bottom'],coreVersion:'0.0.2107',removedOnlyOwnedDdrViaIds:[...removedIds],allActualPadEndpointsAndForeignCopperPreserved:true,planningOnly:true,fabricationReady:false},null,2)+'\n')
 const solver=new SOLVERS.BusLanesPipelineSolver(problem,{maxSearchIterations:200000,maxLaneIterations:20000})
 let preparationError=null,iterations=0
 if(mode==='prepare'){try{solver.prepare()}catch(e){preparationError=e.message}}
 else while(!solver.solved&&!solver.failed&&iterations<200000){solver.step();iterations++}
 const report={mode,iterations,solved:solver.solved,failed:solver.failed,error:preparationError??solver.error??null,failureCode:preparationError?'preparation_exception':solver.failureCode??null,phase:solver.phase,preparedEscapes:solver.escapes?.length??0,stats:solver.stats,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false}
 if(solver.escapes?.length)fs.writeFileSync(root+'/prepared-escapes.json',JSON.stringify(solver.escapes,null,2)+'\n')
 fs.writeFileSync(root+'/solver-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
 if(mode==='prepare'){process.exitCode=preparationError?2:0}
 else if(!solver.solved){process.exitCode=2}
 else{
  const output=solver.getOutput().traces,c=structuredClone(base).filter(e=>!(e.type==='pcb_trace'&&ids.has(e.source_trace_id))&&!(e.type==='pcb_via'&&removedIds.has(e.pcb_via_id))),added=[]
  for(const old of selected){
   const carrier=output.findLast(t=>t.connection_name===old.source_trace_id);assert(carrier?.route.length>1)
   const r=structuredClone(carrier.route)
   assert(r.every(p=>p.route_type==='wire'?['top','bottom'].includes(p.layer):p.route_type==='via'&&['top','bottom'].includes(p.from_layer)&&['top','bottom'].includes(p.to_layer)&&p.from_layer!==p.to_layer))
   assert(Math.hypot(r[0].x-old.route[0].x,r[0].y-old.route[0].y)<1e-8&&Math.hypot(r.at(-1).x-old.route.at(-1).x,r.at(-1).y-old.route.at(-1).y)<1e-8)
   r[0]={...old.route[0]};r[r.length-1]={...old.route.at(-1)}
   for(const [i,p] of r.filter(p=>p.route_type==='via').entries()){
    assert.equal(p.via_diameter??srj.minViaPadDiameter,.4572);assert.equal(p.via_hole_diameter??srj.minViaHoleDiameter,.254)
    p.via_diameter=.4572;p.via_hole_diameter=.254
    const id='g350_outer_pad_'+old.pcb_trace_id+'_'+i;assert(!base.some(e=>e.pcb_via_id===id));added.push(id)
    c.push({type:'pcb_via',pcb_via_id:id,pcb_trace_id:old.pcb_trace_id,x:p.x,y:p.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:old.subcircuit_id})
   }
   const t={...structuredClone(old),route:r};delete t.trace_length;c.push(t)
  }
  const foreign=j=>j.filter(e=>!(e.type==='pcb_trace'&&ids.has(e.source_trace_id))&&!(e.type==='pcb_via'&&(removedIds.has(e.pcb_via_id)||added.includes(e.pcb_via_id))))
  assert.deepEqual(foreign(c),foreign(base))
  const counts=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](c).length]));counts.manufacturing=checkG350ViaTrackManufacturingClearance(c).length
  const groups=base.filter(e=>e.type==='source_bus'&&e.name?.startsWith('DDR_')&&e.source_trace_ids.length>1).map(b=>{const lengths=c.filter(e=>e.type==='pcb_trace'&&b.source_trace_ids.includes(e.source_trace_id)).map(t=>ddrRouteLength(t.route));return {name:b.name,skewMm:Math.max(...lengths)-Math.min(...lengths),limitMm:b.max_length_skew}})
  const physicalPassed=Object.values(counts).every(n=>n===0)
  fs.writeFileSync(root+'/'+(physicalPassed?'candidate':'rejected')+'.circuit.json',JSON.stringify(c,null,2)+'\n')
  fs.writeFileSync(root+'/native-report.json',JSON.stringify({counts,groups,all49DdrSignalsOuterOnly:true,removedIds:[...removedIds],addedIds:added,allForeignCopperPadsHolesPlacementsAndLogicExactlyPreserved:true,physicalPassed,timingPassed:groups.every(g=>g.skewMm<=g.limitMm+1e-7),sourceGroundAndIndependentCadUnqualified:true,fabricationReady:false},null,2)+'\n');process.exitCode=physicalPassed?0:3
 }
}
