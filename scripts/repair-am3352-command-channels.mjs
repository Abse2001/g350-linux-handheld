import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Repair the failed native bus_lanes bootstrap on the two outer layers.
// Every physical pad, reserved fanout, supply piece and drilled hole stays
// an obstacle. These paths require independent continuity/DRC and timing.
const [bootstrap,directory,secondsArg='30',stepArg='.04',priorityNamesArg='',maxViasArg='4',mode='sequential',resumePath,viaGridArg='.2',maxPassesArg='20']=process.argv.slice(2)
assert(bootstrap&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),input=read(prior.channel.input.path)
assert.equal(hash(prior.channel.input.path),prior.channel.input.sha256)
assert(prior.partialBootstrap);assert.equal(hash(prior.partialBootstrap.path),prior.partialBootstrap.sha256)
const partial=read(prior.partialBootstrap.path),prefixCount=input.traces.length
assert.equal(prefixCount,217);assert.equal(input.connections.length,26);assert.equal(input.layerCount,4)
for(let i=0;i<prefixCount;i++)assert.deepEqual(partial.traces[i],input.traces[i])
const traces=partial.traces.slice(prefixCount),seedNames=new Set(traces.map(t=>t.connection_name??t.source_trace_id))
assert.equal(seedNames.size,traces.length)
const source=read(prior.source.path);assert.equal(hash(prior.source.path),prior.source.sha256)
const layers=['top','bottom'],width=.1016,clearance=.1016,land=.4572,drill=.254
const step=Number(stepArg),seconds=Number(secondsArg),guard=step*Math.SQRT1_2+1e-4,maxVias=Number(maxViasArg),viaCost=2
const viaGrid=Number(viaGridArg)
const maxPasses=Number(maxPassesArg)
assert([.02,.04].includes(step));assert(seconds>0&&seconds<=60)
assert([.02,.04,.1,.2].includes(viaGrid))
assert(Number.isInteger(maxPasses)&&maxPasses>=1&&maxPasses<=30)
assert(Number.isInteger(maxVias)&&maxVias>=4&&maxVias<=6)
assert(['sequential','negotiated'].includes(mode))
const priorityNames=priorityNamesArg.split(',').filter(Boolean),rank=c=>priorityNames.includes(c.name)?priorityNames.indexOf(c.name):priorityNames.length
const names=new Set(input.connections.map(c=>c.name)),shapes=[]
for(const o of input.obstacles)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,
 w:o.width,h:o.height,layers:o.layers.filter(l=>layers.includes(l)),pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,
 owner:o.connectedTo?.find(n=>names.has(n))})
const append=(t,soft=false)=>{
 const owner=t.source_trace_id??t.connection_name
 for(let i=0;i<t.route.length;i++){
  const p=t.route[i]
  if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,hole:p.via_hole_diameter,layers,owner,soft})
  if(i){const a=t.route[i-1],b=p
   if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8&&!(a.route_type==='wire'&&b.route_type==='wire'&&a.layer!==b.layer))
    shapes.push({kind:'segment',a,b,w:Math.max(a.width??width,b.width??width),layers:[a.route_type==='wire'?a.layer:b.layer],owner,soft})
  }
 }
}
partial.traces.forEach(t=>append(t))
for(const v of source.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers})
const distance=(s,p)=>{
 if(s.kind==='circle')return Math.hypot(p.x-s.x,p.y-s.y)-s.w/2
 if(s.kind==='rect')return Math.hypot(Math.max(0,Math.abs(p.x-s.x)-s.w/2),Math.max(0,Math.abs(p.y-s.y)-s.h/2))
 const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,f=Math.max(0,Math.min(1,((p.x-s.a.x)*dx+(p.y-s.a.y)*dy)/(dx*dx+dy*dy)))
 return Math.hypot(p.x-s.a.x-f*dx,p.y-s.a.y-f*dy)-s.w/2
}
class Heap {
 a=[]
 push(id,f,g){const a=this.a,v={id,f,g};let i=a.length;a.push(v);while(i){let p=(i-1)>>1;if(a[p].f<=f)break;a[i]=a[p];i=p}a[i]=v}
 pop(){const a=this.a,v=a[0],last=a.pop();if(a.length){let i=0;while(true){let c=2*i+1;if(c>=a.length)break;if(c+1<a.length&&a[c+1].f<a[c].f)c++;if(a[c].f>=last.f)break;a[i]=a[c];i=c}a[i]=last}return v}
}
const wire=(p,layer)=>({route_type:'wire',x:p.x,y:p.y,layer,width})
function routeConnection(c,step,penalty=0){
 const guard=step*Math.SQRT1_2+1e-4
 const [start,goal]=c.pointsToConnect
 const bounds={minX:Math.ceil(input.bounds.minX/step)*step,maxX:Math.floor(input.bounds.maxX/step)*step,
  minY:Math.ceil(input.bounds.minY/step)*step,maxY:Math.floor(-9.8/step)*step}
 const nx=Math.round((bounds.maxX-bounds.minX)/step)+1,ny=Math.round((bounds.maxY-bounds.minY)/step)+1,N=nx*ny
 const xy=i=>({x:bounds.minX+(i%nx)*step,y:bounds.minY+Math.floor(i/nx)*step})
 const index=p=>Math.round((p.x-bounds.minX)/step)+nx*Math.round((p.y-bounds.minY)/step)
 const si=index(start),gi=index(goal)
 assert(Math.hypot(xy(si).x-start.x,xy(si).y-start.y)<1e-6)
 assert(Math.hypot(xy(gi).x-goal.x,xy(gi).y-goal.y)<1e-6)
 const blocked=[new Uint8Array(N),new Uint8Array(N)],viaBlocked=new Uint8Array(N)
 const softCost=[new Float32Array(N),new Float32Array(N)],softViaCost=new Float32Array(N)
 for(const s of shapes){
  const r=land/2+clearance+guard+(s.kind==='segment'?s.w/2:0)
  const x0=Math.max(0,Math.floor(((s.kind==='segment'?Math.min(s.a.x,s.b.x):s.x-s.w/2)-r-bounds.minX)/step))
  const x1=Math.min(nx-1,Math.ceil(((s.kind==='segment'?Math.max(s.a.x,s.b.x):s.x+s.w/2)+r-bounds.minX)/step))
  const y0=Math.max(0,Math.floor(((s.kind==='segment'?Math.min(s.a.y,s.b.y):s.y-s.h/2)-r-bounds.minY)/step))
  const y1=Math.min(ny-1,Math.ceil(((s.kind==='segment'?Math.max(s.a.y,s.b.y):s.y+s.h/2)+r-bounds.minY)/step))
  for(let iy=y0;iy<=y1;iy++)for(let ix=x0;ix<=x1;ix++){
   const i=ix+iy*nx,p=xy(i),d=distance(s,p)
   if(s.owner!==c.name&&d<width/2+clearance+guard)for(const l of s.layers){
    if(s.soft)softCost[layers.indexOf(l)][i]+=penalty
    else blocked[layers.indexOf(l)][i]=1
   }
   if((s.owner!==c.name&&d<land/2+clearance+1e-9)||(s.pad&&d<drill/2+.2+1e-9)||
    (s.hole&&Math.hypot(p.x-s.x,p.y-s.y)<drill/2+s.hole/2+.254+1e-9)){
    if(s.soft)softViaCost[i]+=penalty*16
    else viaBlocked[i]=1
   }
  }
 }
 const physicalTerminal=p=>shapes.some(s=>s.hole&&s.owner===c.name&&Math.hypot(p.x-s.x,p.y-s.y)<1e-6)
 const startLayers=physicalTerminal(start)?layers:[start.layer],goalLayers=physicalTerminal(goal)?layers:[goal.layer]
 assert(startLayers.every(l=>layers.includes(l))&&goalLayers.every(l=>layers.includes(l)))
 const distances=new Float64Array(N*2*(maxVias+1));distances.fill(Infinity)
 const parents=new Int32Array(distances.length);parents.fill(-1)
 const heuristic=i=>{const p=xy(i);return Math.hypot(p.x-goal.x,p.y-goal.y)}
 const heap=new Heap();for(let l=0;l<2;l++)if(startLayers.includes(layers[l])&&!blocked[l][si]){distances[l*N+si]=0;heap.push(l*N+si,heuristic(si),0)}
 let finish=-1,expanded=0;const begun=performance.now()
 while(heap.a.length){
  const item=heap.pop(),id=item.id;if(item.g!==distances[id])continue
  const state=Math.floor(id/N),i=id%N,l=state%2,count=Math.floor(state/2),ix=i%nx,iy=Math.floor(i/nx)
  if(i===gi&&goalLayers.includes(layers[l])){finish=id;break}
  if(++expanded%50000===0&&performance.now()-begun>seconds*1000)return {error:'manual bridge timeout',expanded}
  const relax=(next,cost)=>{const g=item.g+cost;if(g+1e-9<distances[next]){distances[next]=g;parents[next]=id;heap.push(next,g+heuristic(next%N),g)}}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   if(ix+dx<0||ix+dx>=nx||iy+dy<0||iy+dy>=ny)continue
   const next=i+dx+dy*nx;if(!blocked[l][next])relax(state*N+next,step*(dx&&dy?Math.SQRT2:1)+softCost[l][next])
  }
  const p=xy(i),site=Math.abs(p.x/viaGrid-Math.round(p.x/viaGrid))<1e-6&&Math.abs(p.y/viaGrid-Math.round(p.y/viaGrid))<1e-6
  if(count<maxVias&&site&&!viaBlocked[i]&&!blocked[1-l][i])relax(((count+1)*2+1-l)*N+i,viaCost+softViaCost[i])
 }
 if(finish<0)return {error:'no clearance-preserving bridge',expanded,startBlocked:blocked.map(b=>!!b[si]),goalBlocked:blocked.map(b=>!!b[gi])}
 const ids=[];for(let id=finish;id>=0;id=parents[id])ids.push(id);ids.reverse()
 const route=[]
 for(let k=0;k<ids.length;k++){
  const id=ids[k],p=xy(id%N),state=Math.floor(id/N),l=layers[state%2]
  if(k&&Math.floor(ids[k-1]/N)!==state)route.push({route_type:'via',...p,from_layer:layers[Math.floor(ids[k-1]/N)%2],to_layer:l,
   layers:['top','inner1','inner2','bottom'],via_diameter:land,via_hole_diameter:drill})
  const prev=k?xy(ids[k-1]%N):null,next=k+1<ids.length?xy(ids[k+1]%N):null
  if(!prev||!next||Math.floor(ids[k-1]/N)!==state||Math.floor(ids[k+1]/N)!==state||
   Math.abs((p.x-prev.x)*(next.y-p.y)-(p.y-prev.y)*(next.x-p.x))>1e-8)route.push(wire(p,l))
 }
 const newVias=route.filter(p=>p.route_type==='via').length
 const lengthMm=route.reduce((sum,p,i)=>sum+(i?Math.hypot(p.x-route[i-1].x,p.y-route[i-1].y):0),0)
 return {route,expanded,newVias,lengthMm,overlapCost:Math.max(0,distances[finish]-newVias*viaCost-lengthMm),
  startBlocked:blocked.map(b=>!!b[si]),goalBlocked:blocked.map(b=>!!b[gi]),elapsedSeconds:(performance.now()-begun)/1000}
}
mkdirSync(directory,{recursive:true})
const report={...prior,status:'MANUAL_COMMAND_BRIDGES_IN_PROGRESS',completedSignals:0,
 priorNativeBootstrap:{path:`${bootstrap}/result.json`,sha256:hash(`${bootstrap}/result.json`)},
 manualModification:{gridMm:step,viaPlacementGridMm:viaGrid,maximumNegotiationPasses:maxPasses,wireSamplingGuardMm:guard,maxNewViasPerChannel:maxVias,viaSearchPenaltyMm:viaCost,
  retainedNativeChannels:seedNames.size,channels:[],originalCommandSkewLimitMm:.635,clockSkewLimitMm:.127},
 timingQualified:false,fabricationReady:false}
const save=()=>writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
save()
const ordered=input.connections.filter(c=>!seedNames.has(c.name)).sort((a,b)=>
 rank(a)-rank(b)||a.pointsToConnect[1].y-b.pointsToConnect[1].y||a.pointsToConnect[0].x-b.pointsToConnect[0].x)
const fixedShapeCount=shapes.length,repaired=new Map()
if(resumePath){
 assert.equal(mode,'negotiated')
 const resume=read(resumePath)
 assert.equal(resume.layerCount,4);assert.equal(resume.traces.length,prefixCount+26)
 // Resume only temporary authored bridges. Actual source copper, package
 // fanouts and the two native clock channels must still match this input.
 for(let i=0;i<prefixCount;i++){
  const a=structuredClone(resume.traces[i]),b=structuredClone(input.traces[i])
  if(a.pcb_trace_id.startsWith('guided_local_dogbone_')){assert([1,2].includes(a.route.length));assert(layers.includes(a.route[0].layer));a.route[0].layer=b.route[0].layer}
  assert.deepEqual(a,b)
 }
 for(const t of resume.traces.slice(prefixCount)){
  assert(names.has(t.source_trace_id))
  if(seedNames.has(t.source_trace_id))assert.deepEqual(t,traces.find(s=>s.source_trace_id===t.source_trace_id))
  else {assert(t.pcb_trace_id.startsWith('manual_command_bridge_'));assert(!repaired.has(t.source_trace_id));repaired.set(t.source_trace_id,t)}
 }
 assert.equal(repaired.size,26-seedNames.size)
 report.manualModification.resumedUnqualifiedCandidate={path:resumePath,sha256:hash(resumePath),accepted:false}
 save()
}
const conflicts=()=>{
 const names=new Set()
 for(const t of repaired.values()){
  const others=shapes.filter(s=>s.soft&&s.owner!==t.source_trace_id)
  for(let i=0;i<t.route.length;i++){
   const p=t.route[i]
   if(p.route_type==='via'){
    if(others.some(s=>distance(s,p)<land/2+clearance+1e-9||s.hole&&Math.hypot(s.x-p.x,s.y-p.y)<(s.hole+drill)/2+.254+1e-9))names.add(t.source_trace_id)
   }
   if(i){const a=t.route[i-1],b=p,len=Math.hypot(b.x-a.x,b.y-a.y),layer=a.route_type==='wire'?a.layer:b.layer
    if(len>1e-8){const count=Math.ceil(len/.01)
     for(let k=0;k<=count;k++){
      const point={x:a.x+(b.x-a.x)*k/count,y:a.y+(b.y-a.y)*k/count}
      if(others.some(s=>s.layers.includes(layer)&&distance(s,point)<width/2+clearance+.0072)){
       names.add(t.source_trace_id);break
      }
     }
    }
   }
  }
 }
 return [...names]
}
let finished=false
report.manualModification.mode=mode;report.manualModification.negotiationRounds=[]
for(let pass=0;pass<(mode==='negotiated'?maxPasses:1);pass++){
 const penalty=mode==='negotiated'?Math.min(4096,2**(pass+(resumePath?6:0)))*.4:0
 for(const c of ordered){
 if(mode==='negotiated'){
  shapes.length=fixedShapeCount
  for(const t of repaired.values())if(t.source_trace_id!==c.name)append(t,true)
 }
 let result=routeConnection(c,step,penalty),grid=step
 if(step===.04&&(result.error||mode==='negotiated'&&result.overlapCost>1e-5)){
  console.log(JSON.stringify({name:c.name,coarseGridTrial:{...result,route:undefined}}))
  const fine=routeConnection(c,.02,penalty/2)
  const fineMetric={...fine,route:undefined,gridMm:.02}
  if(!fine.error&&(result.error||fine.overlapCost<result.overlapCost-1e-5)){
   grid=.02;result={...fine,coarseGridTrial:{...result,route:undefined}}
  }else result={...result,fineGridTrial:fineMetric}
 }
 result.gridMm=grid
 report.manualModification.channels.push({name:c.name,pass,penalty,...result,route:undefined});save()
 console.log(JSON.stringify({name:c.name,pass,penalty,...result,route:undefined}))
 if(result.error){
  report.status='MANUAL_COMMAND_BRIDGES_INCOMPLETE';report.failedConnection=c.name
  const path=`${directory}/partial-repaired-bootstrap.simple-route.json`
  writeFileSync(path,JSON.stringify({...input,traces:[...input.traces,...traces]})+'\n')
  report.partialRepairBootstrap={path,sha256:hash(path),nativeChannels:seedNames.size,manualChannels:traces.length-seedNames.size,accepted:false}
  save();process.exit(1)
 }
 const trace={pcb_trace_id:`manual_command_bridge_${c.name}`,source_trace_id:c.name,connection_name:c.name,route:result.route}
 if(mode==='negotiated')repaired.set(c.name,trace)
 else {traces.push(trace);append(trace)}
 // Single-point local descriptors select the actual terminal land used.
 // The retained native fanout is trimmed only by the ordinary path saver.
 for(const i of [0,1]){
  const local=input.traces.find(t=>t.pcb_trace_id===`guided_local_dogbone_${c.name}_${i}`)
  local.route[0].layer=result.route[i?result.route.length-1:0].layer
 }
 }
 if(mode==='sequential'){finished=true;break}
 shapes.length=fixedShapeCount;for(const t of repaired.values())append(t,true)
 const conflictNames=conflicts()
 const candidatePath=`${directory}/latest-unqualified-repair.simple-route.json`
 writeFileSync(candidatePath,JSON.stringify({...input,traces:[...input.traces,...traces,...repaired.values()]})+'\n')
 report.latestUnqualifiedCandidate={path:candidatePath,sha256:hash(candidatePath),accepted:false,conflictingChannels:conflictNames.length}
 report.manualModification.negotiationRounds.push({pass,penalty,conflictingChannels:conflictNames.length,conflictNames});save()
 console.log(JSON.stringify({negotiationPass:pass,conflictingChannels:conflictNames.length,conflictNames}))
 if(!conflictNames.length){traces.push(...repaired.values());finished=true;break}
 ordered.sort((a,b)=>Number(conflictNames.includes(b.name))-Number(conflictNames.includes(a.name))||rank(a)-rank(b))
}
if(!finished){
 const path=`${directory}/conflicted-repair-bootstrap.simple-route.json`
 writeFileSync(path,JSON.stringify({...input,traces:[...input.traces,...traces,...repaired.values()]})+'\n')
 report.status='NEGOTIATED_COMMAND_REPAIR_RETAINS_CONFLICTS';report.conflictedRepair={path,sha256:hash(path),accepted:false}
 save();process.exit(1)
}
assert.equal(traces.length,26);assert.equal(new Set(traces.map(t=>t.source_trace_id)).size,26)
const inputPath=`${directory}/channel.input.simple-route.json`;writeFileSync(inputPath,JSON.stringify(input)+'\n')
const path=`${directory}/output.simple-route.json`;writeFileSync(path,JSON.stringify({...input,traces:[...input.traces,...traces]})+'\n')
report.status='COMMAND_CHANNELS_MANUALLY_REPAIRED_UNQUALIFIED';report.completedSignals=26
report.channel={...prior.channel,input:{path:inputPath,sha256:hash(inputPath)},nativeCompleted:false,manuallyCompleted:true}
report.output={path,sha256:hash(path)};save()
console.log(JSON.stringify({status:report.status,nativeChannels:seedNames.size,manualChannels:26-seedNames.size,timingQualified:false,fabricationReady:false}))
