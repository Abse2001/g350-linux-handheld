// Joint byte1 topology planning with pinned public Core BusLanes. No source promotion.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {spawn,execFileSync} from 'node:child_process'
const args=process.argv.slice(2),worker=args[0]==='--worker';if(worker)args.shift()
const [input,phaseInput,root,terminalLayersText='inner1,inner2']=args;assert(input&&phaseInput&&root)
const requestedLayers=terminalLayersText.split(',');assert(requestedLayers.length&&new Set(requestedLayers).size===requestedLayers.length&&requestedLayers.every(l=>['inner1','inner2','bottom'].includes(l)))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
if(!worker){
 assert(!fs.existsSync(root));fs.mkdirSync(root);fs.copyFileSync('scripts/try-g350-byte1-joint-bus-lanes.mjs',root+'/helper.executed.mjs')
 const inputHash=hash(input),started=performance.now(),log=fs.openSync(root+'/execution.log','wx')
 const child=spawn(process.execPath,['scripts/try-g350-byte1-joint-bus-lanes.mjs','--worker',...args],{stdio:['ignore',log,log]})
 let deadlineExceeded=false;const timer=setTimeout(()=>{deadlineExceeded=true;child.kill('SIGTERM')},150000)
 const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve({code,signal}))})
 clearTimeout(timer);fs.closeSync(log);assert.equal(hash(input),inputHash)
 fs.writeFileSync(root+'/execution.json',JSON.stringify({...result,deadlineExceeded,elapsedSeconds:(performance.now()-started)/1000,inputSha256:inputHash,sourceBytesUnchanged:true,fabricationReady:false},null,2)+'\n')
 console.log(JSON.stringify({root,...result,deadlineExceeded}));process.exitCode=result.code??1
}else{
 const {SOLVERS}=await import('@tscircuit/core'),checks=await import('@tscircuit/checks')
 const {ddrRouteLength}=await import('./lib/g350-full-board-length-tuning.mjs')
 const {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance}=await import('./lib/g350-ddr-physical-checks.mjs')
 const {fillG350LockedGround}=await import('./lib/g350-locked-ground-fill.mjs')
 assert.equal(JSON.parse(fs.readFileSync('node_modules/@tscircuit/core/package.json')).version,'0.0.2107')
 assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
 const base=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error')),srj=JSON.parse(fs.readFileSync(phaseInput)),bus=base.find(e=>e.type==='source_bus'&&e.name==='DDR_BYTE1');assert(bus&&bus.source_trace_ids.length===11)
 const ids=new Set(bus.source_trace_ids),selected=base.filter(e=>e.type==='pcb_trace'&&ids.has(e.source_trace_id));assert.equal(selected.length,11)
 const names=new Map(base.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e.name])),removedIds=new Set(),ends=new Map(),fixed=[]
 for(const t of selected){
  const r=t.route,indexes=r.flatMap((p,i)=>p.route_type==='via'?[i]:[]);assert(indexes.length>=2)
  const first=indexes[0],last=indexes.at(-1),a=r[first],b=r[last];assert(a.from_layer==='top'&&b.to_layer==='top')
  const middle=indexes.slice(1,-1).map(i=>r[i])
  for(const p of middle){const matches=base.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id&&Math.hypot(e.x-p.x,e.y-p.y)<1e-8);assert.equal(matches.length,1);removedIds.add(matches[0].pcb_via_id)}
  ends.set(t.source_trace_id,{first,last,a,b})
  fixed.push({type:'pcb_trace',pcb_trace_id:t.pcb_trace_id+'_cpu_escape',connection_name:t.source_trace_id,source_trace_id:t.source_trace_id,route:r.slice(0,first)},{type:'pcb_trace',pcb_trace_id:t.pcb_trace_id+'_ram_escape',connection_name:t.source_trace_id,source_trace_id:t.source_trace_id,route:r.slice(last+1)})
 }
 const owners=new Map(base.filter(e=>e.type==='pcb_trace').map(t=>[t.pcb_trace_id,t.source_trace_id])),holes=base.filter(e=>e.type==='pcb_via'&&!removedIds.has(e.pcb_via_id))
 const obstacles=[...srj.obstacles,...holes.map(v=>({type:'obstacle',shape:'circle',center:{x:v.x,y:v.y},width:v.outer_diameter,height:v.outer_diameter,layers:['top','inner1','inner2','bottom'],connectedTo:[owners.get(v.pcb_trace_id)??'FIXED_HOLE']}))]
 const connections=selected.map(t=>{const {a,b}=ends.get(t.source_trace_id);return {name:t.source_trace_id,source_trace_id:t.source_trace_id,nominalTraceWidth:.1016,pointsToConnect:[a,b].map(p=>({x:p.x,y:p.y,layer:requestedLayers.includes(a.to_layer)?a.to_layer:requestedLayers[0]}))}})
 const problem={...srj,bounds:{minX:-20,maxX:20,minY:-8,maxY:34},outline:undefined,allowedLayers:['top','inner1','inner2','bottom'],connections,obstacles,traces:[...base.filter(e=>e.type==='pcb_trace'&&!ids.has(e.source_trace_id)).map(t=>({...t,connection_name:t.source_trace_id})),...fixed],buses:[{busId:'g350_joint_byte1_trial',connectionNames:[...ids],minLength:36,maxLength:36.5,maxLengthSkew:.5,traceWidth:.1016,allowedLayers:requestedLayers}],differentialPairs:srj.differentialPairs.filter(p=>p.connectionNames.every(id=>ids.has(id)))}
 execFileSync('python3',['-c',"import json,sys;sys.path.insert(0,'.cloud-tools/python-routing');from shapely.geometry import Polygon,box;d=json.load(sys.stdin);assert Polygon([(p['x'],p['y']) for p in d['outline']]).contains(box(-20,-8,20,34))"],{input:JSON.stringify(base.find(e=>e.type==='pcb_board'))})
 for(const n of g350DdrPhysicalChecks)assert.equal(checks[n](base).length,0,'Baseline '+n)
 fs.writeFileSync(root+'/input.simple-route.json',JSON.stringify(problem)+'\n')
 fs.writeFileSync(root+'/inputs.json',JSON.stringify({input:{path:input,sha256:hash(input)},phaseInput:{path:phaseInput,sha256:hash(phaseInput)},coreVersion:'0.0.2107',coreSha256:hash('node_modules/@tscircuit/core/dist/index.js'),removedOnlyOwnedMiddleViaIds:[...removedIds],terminalFullDepthHolesAndCpuRamPadEscapesFixed:true,requestedTerminalLayers:requestedLayers,allOriginalNativeBusDefinitionsUnchanged:true,fabricationReady:false},null,2)+'\n')
 const terminalLayers=new Map([...ids].map(id=>[id,requestedLayers])),solver=new SOLVERS.BusLanesSolver(problem,{denseSearch:true,maxSearchIterations:200000,maxLaneIterations:20000},terminalLayers)
 let iterations=0;while(!solver.solved&&!solver.failed&&iterations<200000){solver.step();iterations++}
 const report={iterations,solved:solver.solved,failed:solver.failed,error:solver.error??null,failureCode:solver.failureCode??null,stats:solver.stats,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false}
 fs.writeFileSync(root+'/solver-report.json',JSON.stringify(report,null,2)+'\n')
 if(!solver.solved){console.log(JSON.stringify(report));process.exitCode=2}
 else{
  const output=solver.getOutput().traces,c=structuredClone(base).filter(e=>e.type!=='pcb_via'||!removedIds.has(e.pcb_via_id)),addedIds=[]
  for(const old of selected){
   const carrier=output.findLast(t=>t.connection_name===old.source_trace_id);assert(carrier?.route.length>1)
   const {first,last,a,b}=ends.get(old.source_trace_id),r=carrier.route;assert(Math.hypot(r[0].x-a.x,r[0].y-a.y)<1e-8&&Math.hypot(r.at(-1).x-b.x,r.at(-1).y-b.y)<1e-8)
   assert(requestedLayers.includes(r[0].layer)&&requestedLayers.includes(r.at(-1).layer))
   const head=structuredClone(old.route.slice(0,first+1)),tail=structuredClone(old.route.slice(last));head.at(-1).to_layer=r[0].layer;tail[0].from_layer=r.at(-1).layer
   for(const p of r.filter(p=>p.route_type==='via')){
    assert((p.via_diameter??srj.minViaPadDiameter)===.4572&&(p.via_hole_diameter??srj.minViaHoleDiameter)===.254);p.via_diameter=.4572;p.via_hole_diameter=.254
    const id='g350_joint_'+old.pcb_trace_id+'_'+addedIds.length;assert(!base.some(e=>e.type==='pcb_via'&&e.pcb_via_id===id));addedIds.push(id)
    c.push({type:'pcb_via',pcb_via_id:id,pcb_trace_id:old.pcb_trace_id,x:p.x,y:p.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:old.subcircuit_id})
   }
   const t=c.find(e=>e.type==='pcb_trace'&&e.pcb_trace_id===old.pcb_trace_id);t.route=[...head,...r,...tail];delete t.trace_length
  }
  const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
  for(const s of c.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
  const counts=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkPcbTraceViaCounts','checkTracesAreContiguous','checkPcbRoutingConstraints','checkSourceTracesMatchPcbTraceThickness'].map(n=>[n,checks[n](c).length]));counts.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length
  const rows=c.filter(e=>e.type==='pcb_trace'&&ids.has(e.source_trace_id)).map(t=>({name:names.get(t.source_trace_id),lengthMm:ddrRouteLength(t.route)})),before=selected.map(t=>ddrRouteLength(t.route)),skew=Math.max(...rows.map(r=>r.lengthMm))-Math.min(...rows.map(r=>r.lengthMm));let ground=null
  const scope=j=>j.filter(e=>!(e.type==='pcb_trace'&&ids.has(e.source_trace_id))&&!(e.type==='pcb_via'&&(removedIds.has(e.pcb_via_id)||addedIds.includes(e.pcb_via_id))))
  assert.deepEqual(scope(c),scope(base))
  const busSkews=j=>j.filter(e=>e.type==='source_bus'&&e.name?.startsWith('DDR_')&&e.source_trace_ids.length>=2).map(b=>{const lengths=j.filter(e=>e.type==='pcb_trace'&&b.source_trace_ids.includes(e.source_trace_id)).map(t=>ddrRouteLength(t.route));return {name:b.name,skewMm:Math.max(...lengths)-Math.min(...lengths),limitMm:b.max_length_skew}})
  const beforeGroups=busSkews(base),groups=busSkews(c),allGroupsNonregressing=groups.every((g,i)=>g.skewMm<=Math.max(beforeGroups[i].skewMm,g.limitMm)+1e-7)
  if(allGroupsNonregressing&&Object.values(counts).every(n=>n===0)&&skew<=Math.max(...before)-Math.min(...before)+1e-7){const g=await fillG350LockedGround(c);ground={portErrors:g.portErrors,elapsedSeconds:g.elapsedSeconds};if(g.portErrors===0)fs.writeFileSync(root+'/fresh-filled.circuit.json',JSON.stringify(g.circuit,null,2)+'\n')}
  const retained=ground?.portErrors===0
  fs.writeFileSync(root+'/'+(retained?'candidate':'rejected')+'.circuit.json',JSON.stringify(c,null,2)+'\n');fs.writeFileSync(root+'/native-report.json',JSON.stringify({counts,rows,skewMm:skew,beforeGroups,groups,allGroupsNonregressing,ground,retained,physicalViaCount:c.filter(e=>e.type==='pcb_via').length,removedIds:[...removedIds],addedIds,allForeignCopperAndPhysicalHolesExactlyPreserved:true,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n');process.exitCode=retained?0:1
 }
}
