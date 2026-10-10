// User-requested Top/Bottom DDR replan. Planning outputs never replace checked copper.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {spawn,execFileSync} from 'node:child_process'
const args=process.argv.slice(2),worker=args[0]==='--worker';if(worker)args.shift()
const [input,phaseInput,root,mode='connectivity',selection='ALL',terminalMode='fixed-bottom']=args
assert(input&&phaseInput&&root&&['connectivity','matched','uncoupled-diagnostic'].includes(mode))
assert(['fixed-bottom','flexible-outer'].includes(terminalMode))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
if(!worker){
 assert(!fs.existsSync(root));fs.mkdirSync(root);fs.copyFileSync('scripts/try-g350-outer-only-ddr-bus-lanes.mjs',root+'/helper.executed.mjs')
 const sha=hash(input),started=performance.now(),fd=fs.openSync(root+'/execution.log','wx')
 const child=spawn(process.execPath,['scripts/try-g350-outer-only-ddr-bus-lanes.mjs','--worker',...args],{stdio:['ignore',fd,fd]})
 let deadlineExceeded=false;const timer=setTimeout(()=>{deadlineExceeded=true;child.kill('SIGTERM')},150000)
 const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}))})
 clearTimeout(timer);fs.closeSync(fd);assert.equal(hash(input),sha)
 fs.writeFileSync(root+'/execution.json',JSON.stringify({...result,deadlineExceeded,elapsedSeconds:(performance.now()-started)/1000,inputSha256:sha,sourceBytesUnchanged:true,fabricationReady:false},null,2)+'\n')
 console.log(JSON.stringify({root,...result,deadlineExceeded}));process.exitCode=result.code??1
}else{
 const {SOLVERS}=await import('@tscircuit/core'),checks=await import('@tscircuit/checks')
 const {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance}=await import('./lib/g350-ddr-physical-checks.mjs')
 const {ddrRouteLength}=await import('./lib/g350-full-board-length-tuning.mjs')
 assert.equal(JSON.parse(fs.readFileSync('node_modules/@tscircuit/core/package.json')).version,'0.0.2107')
 assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
 const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),srj=JSON.parse(fs.readFileSync(phaseInput))
 const allIds=new Set(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>e.source_trace_id));assert.equal(allIds.size,49)
 const buses=base.filter(e=>e.type==='source_bus'&&['DDR_RESET','DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(e.name))
 assert(selection==='ALL'||buses.some(b=>b.name===selection))
 const ids=selection==='ALL'?allIds:new Set(buses.find(b=>b.name===selection).source_trace_ids)
 const selected=base.filter(e=>e.type==='pcb_trace'&&ids.has(e.source_trace_id));assert.equal(selected.length,ids.size)
 const ends=new Map(),removedIds=new Set(),fixed=[]
 for(const t of selected){
  const vi=t.route.flatMap((p,i)=>p.route_type==='via'?[i]:[]);assert(vi.length>=2)
  const first=vi[0],last=vi.at(-1),a=t.route[first],b=t.route[last]
  assert(a.from_layer==='top'&&b.to_layer==='top')
  assert(t.route.slice(0,first).every(p=>p.route_type==='wire'&&p.layer==='top'))
  assert(t.route.slice(last+1).every(p=>p.route_type==='wire'&&p.layer==='top'))
  for(const index of vi.slice(1,-1)){
   const p=t.route[index],matches=base.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id&&Math.hypot(e.x-p.x,e.y-p.y)<1e-8)
   assert.equal(matches.length,1);removedIds.add(matches[0].pcb_via_id)
  }
  ends.set(t.source_trace_id,{first,last,a,b})
  fixed.push(...[t.route.slice(0,first),t.route.slice(last+1)].map((route,i)=>({type:'pcb_trace',pcb_trace_id:t.pcb_trace_id+'_fixed_escape_'+i,source_trace_id:t.source_trace_id,connection_name:t.source_trace_id,route})))
 }
 const owners=new Map(base.filter(e=>e.type==='pcb_trace').map(t=>[t.pcb_trace_id,t.source_trace_id]))
 const holes=base.filter(e=>e.type==='pcb_via'&&!removedIds.has(e.pcb_via_id))
 const obstacles=[...srj.obstacles,...holes.map(v=>({type:'obstacle',shape:'circle',center:{x:v.x,y:v.y},width:v.outer_diameter,height:v.outer_diameter,layers:['top','inner1','inner2','bottom'],connectedTo:[owners.get(v.pcb_trace_id)??'FIXED_HOLE']}))]
 const bounds={minX:-20,maxX:20,minY:-8,maxY:34}
 execFileSync('python3',['-c',"import json,sys;sys.path.insert(0,'.cloud-tools/python-routing');from shapely.geometry import Polygon,box;d=json.load(sys.stdin);assert Polygon([(p['x'],p['y']) for p in d['outline']]).contains(box(-20,-8,20,34))"],{input:JSON.stringify(base.find(e=>e.type==='pcb_board'))})
 const problem={...srj,bounds,outline:undefined,allowedLayers:['top','bottom'],connections:selected.map(t=>({name:t.source_trace_id,source_trace_id:t.source_trace_id,nominalTraceWidth:.1016,pointsToConnect:[ends.get(t.source_trace_id).a,ends.get(t.source_trace_id).b].map(p=>({x:p.x,y:p.y,layer:'bottom'}))})),obstacles,traces:[...base.filter(e=>e.type==='pcb_trace'&&!ids.has(e.source_trace_id)).map(t=>({...t,connection_name:t.source_trace_id})),...fixed],buses:buses.filter(b=>b.source_trace_ids.some(id=>ids.has(id))).map(b=>({busId:'g350_outer_'+b.name,connectionNames:b.source_trace_ids.filter(id=>ids.has(id)),traceWidth:.1016,allowedLayers:['top','bottom'],...(mode==='matched'&&b.max_length_skew?{maxLengthSkew:b.max_length_skew}:{})})),differentialPairs:srj.differentialPairs.filter(p=>p.connectionNames.every(id=>ids.has(id)))}
 // This diagnostic tests single-net access after coupled package-approach
 // failure. Actual source pairs and their mandatory final checks stay intact.
 if(mode==='uncoupled-diagnostic')problem.differentialPairs=[]
 fs.writeFileSync(root+'/input.simple-route.json',JSON.stringify(problem)+'\n')
 fs.writeFileSync(root+'/inputs.json',JSON.stringify({input:{path:input,sha256:hash(input)},phaseInput:{path:phaseInput,sha256:hash(phaseInput)},mode,selection,selectedConnections:ids.size,signalLayers:['top','bottom'],boardLayers:4,coreVersion:'0.0.2107',removedOnlyOwnedMiddleViaIds:[...removedIds],terminalHolesAndTopPadEscapesPreserved:true,planningOnly:true,fabricationReady:false},null,2)+'\n')
 const terminalLayers=new Map([...ids].map(id=>[id,terminalMode==='flexible-outer'?['top','bottom']:['bottom']]))
 const solver=new SOLVERS.BusLanesSolver(problem,{denseSearch:true,maxSearchIterations:200000,maxLaneIterations:20000},terminalLayers)
 let iterations=0;while(!solver.solved&&!solver.failed&&iterations<200000){solver.step();iterations++}
 const report={iterations,solved:solver.solved,failed:solver.failed,error:solver.error??null,failureCode:solver.failureCode??null,stats:solver.stats,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false}
 fs.writeFileSync(root+'/solver-report.json',JSON.stringify(report,null,2)+'\n')
 if(!solver.solved){console.log(JSON.stringify(report));process.exitCode=2}
 else{
  const output=solver.getOutput().traces,c=structuredClone(base).filter(e=>e.type!=='pcb_via'||!removedIds.has(e.pcb_via_id)),addedIds=[]
  for(const old of selected){
   const carrier=output.findLast(t=>t.connection_name===old.source_trace_id);assert(carrier?.route.length>1)
   const {first,last,a,b}=ends.get(old.source_trace_id),r=carrier.route
   assert(Math.hypot(r[0].x-a.x,r[0].y-a.y)<1e-8&&Math.hypot(r.at(-1).x-b.x,r.at(-1).y-b.y)<1e-8)
   if(terminalMode==='fixed-bottom'){assert.equal(r[0].layer,'bottom');assert.equal(r.at(-1).layer,'bottom')}
   assert(r.every(p=>p.route_type==='wire'?['top','bottom'].includes(p.layer):p.route_type==='via'&&['top','bottom'].includes(p.from_layer)&&['top','bottom'].includes(p.to_layer)&&p.from_layer!==p.to_layer))
   const startBottom=r[0].layer==='bottom',endBottom=r.at(-1).layer==='bottom'
   const head=structuredClone(old.route.slice(0,first+(startBottom?1:0))),tail=structuredClone(old.route.slice(last+(endBottom?0:1)))
   if(startBottom)head.at(-1).to_layer='bottom'
   if(endBottom)tail[0].from_layer='bottom'
   for(const p of [!startBottom?a:null,!endBottom?b:null].filter(Boolean)){
    const v=c.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===old.pcb_trace_id&&Math.hypot(e.x-p.x,e.y-p.y)<1e-8);assert.equal(v.length,1)
    removedIds.add(v[0].pcb_via_id);c.splice(c.indexOf(v[0]),1)
   }
   for(const p of r.filter(p=>p.route_type==='via')){
    assert.equal(p.via_diameter??srj.minViaPadDiameter,.4572);assert.equal(p.via_hole_diameter??srj.minViaHoleDiameter,.254)
    p.via_diameter=.4572;p.via_hole_diameter=.254
    const id='g350_outer_'+old.pcb_trace_id+'_'+addedIds.length;assert(!base.some(e=>e.pcb_via_id===id));addedIds.push(id)
    c.push({type:'pcb_via',pcb_via_id:id,pcb_trace_id:old.pcb_trace_id,x:p.x,y:p.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:old.subcircuit_id})
   }
   const t=c.find(e=>e.type==='pcb_trace'&&e.pcb_trace_id===old.pcb_trace_id);t.route=[...head,...r,...tail];delete t.trace_length
  }
  const scope=j=>j.filter(e=>!(e.type==='pcb_trace'&&ids.has(e.source_trace_id))&&!(e.type==='pcb_via'&&(removedIds.has(e.pcb_via_id)||addedIds.includes(e.pcb_via_id))))
  assert.deepEqual(scope(c),scope(base),'Every other connection, pad, component, hole and constraint must remain exact')
  const counts=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](c).length]));counts.manufacturing=checkG350ViaTrackManufacturingClearance(c).length
  const groups=base.filter(e=>e.type==='source_bus'&&e.name?.startsWith('DDR_')&&e.source_trace_ids.length>1).map(b=>{const lengths=c.filter(e=>e.type==='pcb_trace'&&b.source_trace_ids.includes(e.source_trace_id)).map(t=>ddrRouteLength(t.route));return {name:b.name,skewMm:Math.max(...lengths)-Math.min(...lengths),limitMm:b.max_length_skew}})
  const physicallyPassed=Object.values(counts).every(n=>n===0)
  fs.writeFileSync(root+'/'+(physicallyPassed?'candidate':'rejected')+'.circuit.json',JSON.stringify(c,null,2)+'\n')
  fs.writeFileSync(root+'/native-report.json',JSON.stringify({counts,groups,selectedOuterOnly:true,completeDdrOuterOnly:selection==='ALL',removedIds:[...removedIds],addedIds,allForeignCopperPadsHolesPlacementsAndLogicExactlyPreserved:true,physicallyPassed,timingPassed:groups.every(g=>g.skewMm<=g.limitMm+1e-7),sourceAndGroundAndIndependentCadUnqualified:true,fabricationReady:false},null,2)+'\n');process.exitCode=physicallyPassed?0:3
 }
}
