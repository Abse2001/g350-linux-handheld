import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Add actual full-depth terminals outside the completed natural fanouts.
// Each channel may then use either outer layer. The original command bus
// timing limit is retained as a release requirement, deferred during this
// connectivity bootstrap. The clock pair retains its native skew limit.
const [bootstrap,directory,reboundSourcePath]=process.argv.slice(2);assert(bootstrap&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),original=read(`${bootstrap}/input.simple-route.json`)
const nativePath=`${bootstrap}/signal-escapes.native.json`,native=read(nativePath),edited=structuredClone(native)
assert.equal(native.length,96);assert.equal(original.traces.length,69);assert.equal(original.layerCount,4)
const source=read(prior.source.path);assert.equal(hash(prior.source.path),prior.source.sha256)
let observedSource=prior.source
if(reboundSourcePath){
 const next=read(reboundSourcePath)
 assert.deepEqual(next.filter(e=>e.type!=='source_project_metadata'),source.filter(e=>e.type!=='source_project_metadata'))
 observedSource={...prior.source,path:reboundSourcePath,sha256:hash(reboundSourcePath)}
}
const bus=original.buses.find(b=>b.name==='DDR_COMMAND_CLOCK'),ids=new Set(bus.connectionNames)
assert.equal(ids.size,26);assert.equal(bus.maxLengthSkew,.635)
assert.equal(source.find(e=>e.type==='source_bus'&&e.name===bus.name).max_length_skew,.635)
const pair=original.differentialPairs.find(p=>p.connectionNames.every(n=>ids.has(n)))
assert.equal(pair.lengthTolerance,.127)
const width=.1016,clearance=.1016,guard=.0145,land=.4572,drill=.254,layers=['top','bottom']
const shapes=[]
for(const o of original.obstacles)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,
 layers:o.layers,pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owners:o.connectedTo??[]})
const append=t=>{
 const owner=t.source_trace_id??t.connection_name
 for(let i=0;i<t.route.length;i++){
  const p=t.route[i]
  if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,hole:p.via_hole_diameter,layers,owners:[owner]})
  if(i){const a=t.route[i-1],b=p
   if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8&&!(a.route_type==='wire'&&b.route_type==='wire'&&a.layer!==b.layer))
    shapes.push({kind:'segment',a,b,w:Math.max(a.width??width,b.width??width),layers:[a.route_type==='wire'?a.layer:b.layer],owners:[owner]})
  }
 }
}
original.traces.forEach(append);native.forEach(append)
for(const v of source.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers,owners:[]})
const distance=(s,p)=>{
 if(s.kind==='circle')return Math.hypot(p.x-s.x,p.y-s.y)-s.w/2
 if(s.kind==='rect')return Math.hypot(Math.max(0,Math.abs(p.x-s.x)-s.w/2),Math.max(0,Math.abs(p.y-s.y)-s.h/2))
 const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,f=Math.max(0,Math.min(1,((p.x-s.a.x)*dx+(p.y-s.a.y)*dy)/(dx*dx+dy*dy)))
 return Math.hypot(p.x-s.a.x-f*dx,p.y-s.a.y-f*dy)-s.w/2
}
const holeAllowed=(p,name)=>shapes.every(s=>
 !(s.layers.some(l=>layers.includes(l))&&!s.owners.includes(name)&&distance(s,p)<land/2+clearance+guard)&&
 !(s.pad&&distance(s,p)<drill/2+.2+1e-9)&&
 !(s.hole&&Math.hypot(p.x-s.x,p.y-s.y)<drill/2+s.hole/2+.254+1e-9))
const visible=(a,b,name)=>{
 const count=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.01)
 for(let i=0;i<=count;i++){
  const p={x:a.x+(b.x-a.x)*i/count,y:a.y+(b.y-a.y)*i/count}
  if(shapes.some(s=>s.layers.includes('top')&&!s.owners.includes(name)&&distance(s,p)<width/2+clearance+guard))return false
 }
 return true
}
const stubSearch=(a,targets,name,cpu)=>{
 const step=.02,minX=Math.max(-17.5,Math.floor((a.x-2.4)/step)*step),maxX=cpu?Math.ceil((a.x+2.4)/step)*step:Math.min(-4.8,Math.ceil((a.x+2.4)/step)*step)
 const minY=Math.max(-38.5,Math.floor((a.y-2.4)/step)*step),maxY=cpu?a.y:Math.min(9.5,Math.ceil((a.y+2.4)/step)*step)
 const nx=Math.round((maxX-minX)/step)+1,ny=Math.round((maxY-minY)/step)+1,N=nx*ny
 const xy=i=>({x:minX+(i%nx)*step,y:minY+Math.floor(i/nx)*step})
 const index=p=>Math.round((p.x-minX)/step)+nx*Math.round((p.y-minY)/step)
 const blocked=new Uint8Array(N),radius=width/2+clearance+guard
 for(const s of shapes.filter(s=>s.layers.includes('top')&&!s.owners.includes(name))){
  const r=radius+(s.kind==='segment'?s.w/2:0)
  const x0=Math.max(0,Math.floor(((s.kind==='segment'?Math.min(s.a.x,s.b.x):s.x-s.w/2)-r-minX)/step))
  const x1=Math.min(nx-1,Math.ceil(((s.kind==='segment'?Math.max(s.a.x,s.b.x):s.x+s.w/2)+r-minX)/step))
  const y0=Math.max(0,Math.floor(((s.kind==='segment'?Math.min(s.a.y,s.b.y):s.y-s.h/2)-r-minY)/step))
  const y1=Math.min(ny-1,Math.ceil(((s.kind==='segment'?Math.max(s.a.y,s.b.y):s.y+s.h/2)+r-minY)/step))
  for(let iy=y0;iy<=y1;iy++)for(let ix=x0;ix<=x1;ix++){const i=ix+iy*nx;if(distance(s,xy(i))<radius)blocked[i]=1}
 }
 const goals=new Map(targets.filter(p=>p.x>=minX&&p.x<=maxX&&p.y>=minY&&p.y<=maxY).map(p=>[index(p),p]).filter(([i])=>i>=0&&i<N&&!blocked[i]))
 const start=index(a);if(blocked[start]||!goals.size)return
 const ds=new Float64Array(N);ds.fill(Infinity);const parents=new Int32Array(N);parents.fill(-1)
 const heap=[]
 const push=(id,d)=>{let i=heap.length,v={id,d};heap.push(v);while(i){const p=(i-1)>>1;if(heap[p].d<=d)break;heap[i]=heap[p];i=p}heap[i]=v}
 const pop=()=>{const v=heap[0],last=heap.pop();if(heap.length){let i=0;while(true){let c=2*i+1;if(c>=heap.length)break;if(c+1<heap.length&&heap[c+1].d<heap[c].d)c++;if(heap[c].d>=last.d)break;heap[i]=heap[c];i=c}heap[i]=last}return v}
 ds[start]=0;push(start,0);let finish=-1
 while(heap.length){const {id,d}=pop();if(d!==ds[id])continue;if(goals.has(id)){finish=id;break}
  const ix=id%nx,iy=Math.floor(id/nx)
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   if(ix+dx<0||ix+dx>=nx||iy+dy<0||iy+dy>=ny)continue
   const next=id+dx+dy*nx,nd=d+step*(dx&&dy?Math.SQRT2:1)
   if(!blocked[next]&&nd<ds[next]){ds[next]=nd;parents[next]=id;push(next,nd)}
  }
 }
 if(finish<0)return
 const points=[];for(let i=finish;i>=0;i=parents[i])points.push(xy(i));points.reverse()
 const route=points.filter((p,i)=>!i||i===points.length-1||Math.abs((p.x-points[i-1].x)*(points[i+1].y-p.y)-(p.y-points[i-1].y)*(points[i+1].x-p.x))>1e-8)
 return {point:goals.get(finish),route,length:ds[finish]}
}
const terminalMap=new Map(),placements=[]
const ordered=[...edited.filter(t=>ids.has(t.source_trace_id))].sort((a,b)=>
 Number(pair.connectionNames.includes(b.source_trace_id))-Number(pair.connectionNames.includes(a.source_trace_id))||a.route.at(-1).y-b.route.at(-1).y)
for(const trace of ordered){
 const name=trace.source_trace_id,a=trace.route.at(-1),cpu=trace.route[0].y>-15
 assert.equal(a.layer,'top')
 const candidates=[]
 for(let ix=Math.ceil((a.x-2)/.2);ix<=Math.floor((a.x+2)/.2);ix++)for(let iy=Math.ceil((a.y-2)/.2);iy<=Math.floor((a.y+2)/.2);iy++){
  const p={x:ix*.2,y:iy*.2},d=Math.hypot(p.x-a.x,p.y-a.y)
  if(d<.1||d>2||p.x<-17.5||p.x>17.5||p.y<-38.5||p.y>9.5)continue
  if(cpu?p.y>-10.6:p.x>-4.8)continue
  candidates.push({...p,d})
 }
 candidates.sort((a,b)=>a.d-b.d||a.x-b.x||a.y-b.y)
 const valid=candidates.filter(p=>holeAllowed(p,name)),direct=valid.find(p=>visible(a,p,name))
 const found=direct?{point:direct,route:[a,direct],length:direct.d}:stubSearch(a,valid,name,cpu)
 if(!found){
  const index=trace.route.findLastIndex(p=>p.route_type==='via'&&p.to_layer==='top')
  if(index>=0){
   const p=trace.route[index],oldLength=trace.route.slice(index+1).reduce((sum,p,i)=>sum+Math.hypot(p.x-trace.route[index+i].x,p.y-trace.route[index+i].y),0)
   trace.route=[...trace.route.slice(0,index+1),{route_type:'wire',x:p.x,y:p.y,layer:'top',width}]
   terminalMap.set(trace.pcb_trace_id,p)
   placements.push({name,package:cpu?'U_SOC':'U_RAM',oldEnd:{x:a.x,y:a.y},via:{x:p.x,y:p.y},reusedExistingFullDepthVia:true,unusedTopTailLengthMm:oldLength,stubLengthMm:0})
   continue
  }
  mkdirSync(directory,{recursive:true})
  const diagnostic={...prior,status:'DUAL_LAYER_TERMINAL_VIA_MODIFICATION_FAILED',failedTrace:trace.pcb_trace_id,
   placedTerminalVias:placements.length,placements,
   clearHoleSites:candidates.filter(p=>holeAllowed(p,name)).slice(0,8),
   clearWireSites:candidates.filter(p=>visible(a,p,name)).slice(0,8),
   startBlockers:shapes.filter(s=>s.layers.includes('top')&&!s.owners.includes(name)&&distance(s,a)<width/2+clearance+guard).map(s=>({...s,distanceToStartMm:distance(s,a)})),fabricationReady:false}
  writeFileSync(`${directory}/result.json`,JSON.stringify(diagnostic,null,2)+'\n')
  console.log(JSON.stringify({status:diagnostic.status,failedTrace:trace.pcb_trace_id,placedTerminalVias:placements.length}));process.exit(1)
 }
 const p=found.point
 assert(Math.hypot(found.route.at(-1).x-p.x,found.route.at(-1).y-p.y)<1e-6,'Stub grid goal must equal its actual terminal via')
 const extension=[...found.route.map(p=>({route_type:'wire',x:p.x,y:p.y,layer:'top',width})),
  {route_type:'via',x:p.x,y:p.y,from_layer:'top',to_layer:'bottom',layers:['top','inner1','inner2','bottom'],via_diameter:land,via_hole_diameter:drill},
  {route_type:'wire',x:p.x,y:p.y,layer:'bottom',width}]
 append({source_trace_id:name,route:extension});trace.route.push(...extension.slice(1))
 terminalMap.set(trace.pcb_trace_id,p)
 placements.push({name,package:cpu?'U_SOC':'U_RAM',oldEnd:{x:a.x,y:a.y},via:{x:p.x,y:p.y},stubLengthMm:found.length,stubSegments:found.route.length-1})
}
assert.equal(placements.length,52)
const selected=new Map(pair.connectionNames.map(n=>[n,'bottom']))
const connections=original.connections.filter(c=>ids.has(c.name))
const endpoint=(c,i)=>terminalMap.get(`local_dogbone_${c.name}_${i}`)
const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x)
for(const c of connections.filter(c=>!selected.has(c.name))){
 const [a,b]=[endpoint(c,0),endpoint(c,1)]
 const score=layer=>[...selected].reduce((sum,[name,l])=>{
  if(l!==layer)return sum
  const other=connections.find(c=>c.name===name),p=endpoint(other,0),q=endpoint(other,1)
  return sum+1+(cross(a,b,p)*cross(a,b,q)<0&&cross(p,q,a)*cross(p,q,b)<0?8:0)
 },0)
 selected.set(c.name,score('top')<=score('bottom')?'top':'bottom')
}
const local=[],localEscapes=[]
const channelConnections=connections.map(c=>({...c,pointsToConnect:[0,1].map(i=>{
 const p=endpoint(c,i),layer=selected.get(c.name)
 local.push({pcb_trace_id:`guided_local_dogbone_${c.name}_${i}`,source_trace_id:c.name,connection_name:c.name,
  route:[{route_type:'wire',x:p.x,y:p.y,layer,width}]})
 localEscapes.push({name:c.name,package:i?'U_RAM':'U_SOC',end:{x:p.x,y:p.y},nativeTerminalVia:true,length:0,newVias:0})
 return {x:p.x,y:p.y,layer}
})}))
const channelBuses=connections.filter(c=>!pair.connectionNames.includes(c.name)).map(c=>({name:`${bus.name}_${c.name}`,busId:`${bus.busId}_${c.name}`,connectionNames:[c.name],traceWidth:width,allowedLayers:[selected.get(c.name)]}))
channelBuses.push({name:'DDR_CK_PAIR',busId:'DDR_CK_PAIR',connectionNames:pair.connectionNames,traceWidth:width,maxLengthSkew:.127,allowedLayers:['bottom']})
const input={...original,traces:[...original.traces,...edited,...local],connections:channelConnections,buses:channelBuses,differentialPairs:[pair]}
assert.equal(input.traces.length,217);assert.equal(input.buses.length,25)
mkdirSync(directory,{recursive:true})
writeFileSync(`${directory}/signal-escapes.native.json`,JSON.stringify(edited,null,2)+'\n')
writeFileSync(`${directory}/local-escapes.json`,JSON.stringify(local,null,2)+'\n')
const path=`${directory}/channel.input.simple-route.json`;writeFileSync(path,JSON.stringify(input)+'\n')
const report={...prior,source:observedSource,status:'DUAL_OUTER_LAYER_COMMAND_TERMINALS_READY_UNQUALIFIED',bus:bus.name,sourceTracesRetained:69,
 nativeBootstrap:{path:`${directory}/signal-escapes.native.json`,sha256:hash(`${directory}/signal-escapes.native.json`),dogbones:96},localEscapes,
 manualNativeEscapeCorrection:{...prior.manualNativeEscapeCorrection,outboardTerminalVias:{original:{path:nativePath,sha256:hash(nativePath)},placements,
  addedFullDepthVias:placements.filter(p=>!p.reusedExistingFullDepthVia).length,reusedFullDepthVias:placements.filter(p=>p.reusedExistingFullDepthVia).length,terminalViaCopperGuardMm:guard}},
 ...(reboundSourcePath?{sourceRebinding:{original:prior.source,current:observedSource,allPhysicalAndLogicalRecordsUnchanged:true},
  channelLayerDeclaration:{path:'experiments/am3352-joint-ddr-dual-layer-command-host.circuit.tsx',sha256:hash('experiments/am3352-joint-ddr-dual-layer-command-host.circuit.tsx')}}:{}),
 channel:{input:{path,sha256:hash(path)}},nativeRoutingPhases:channelBuses,
 channelLayerAllocation:Object.fromEntries(selected),deferredCommandClassTimingRequirement:{...bus,maxLengthSkew:.635},
 completedSignals:0,timingQualified:false,fabricationReady:false,
 scope:'Connectivity bootstrap using one native bus_lanes phase per address/control signal and a matched clock pair. The actual source keeps the full .635mm class limit; manual matching and independent full-source checks are required.'}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,newTerminalVias:report.manualNativeEscapeCorrection.outboardTerminalVias.addedFullDepthVias,
 reusedTerminalVias:report.manualNativeEscapeCorrection.outboardTerminalVias.reusedFullDepthVias,layers:Object.fromEntries(layers.map(l=>[l,[...selected.values()].filter(v=>v===l).length]))}))
