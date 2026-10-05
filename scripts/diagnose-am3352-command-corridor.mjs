import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenCommandPrefixes} from './lib/am3352-open-command-prefixes.mjs'

// A read-only topology diagnostic: minimum layer transitions on a guarded
// raster and the fixed copper bounding the RAM-side component. This is not
// an autorouter result or qualified new copper. New-via mutual spacing,
// electrical timing and native planar legs still need independent checks.
const [preparation,directory]=process.argv.slice(2)
assert(preparation&&directory&&!existsSync(`${directory}/result.json`))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const prior=read(`${preparation}/result.json`),{summary,registration}=readCheckedCommandSummary(prior.checkedSourceSummary)
assert.equal(prior.status,'STAGED_COMMAND_CPU_PREFIXES_OPEN_NOT_EXPORTABLE')
assert.equal(hash(prior.input.path),prior.input.sha256);assert.equal(hash(prior.source.path),prior.source.sha256)
assert.deepEqual(summary.source,prior.source)
const source=read(prior.source.path),input=read(prior.input.path),prefixes=assertOpenCommandPrefixes(prior,input,source)
assert.equal(input.layerCount,4);assert.equal(input.connections.length,1)
const c=input.connections[0],st=source.find(e=>e.type==='source_trace'&&e.source_trace_id===c.name)
assert(st);assert.equal(st.name,'DDR_CASn')
const layers=['top','bottom'],width=.1016,clearance=.1016,land=.4572,drill=.254,step=.02,guard=step*Math.SQRT1_2+1e-4
const bounds={minX:-17.5,maxX:17.5,minY:-38.5,maxY:9.5},nx=Math.round((bounds.maxX-bounds.minX)/step)+1,ny=Math.round((bounds.maxY-bounds.minY)/step)+1,N=nx*ny
const xy=i=>({x:bounds.minX+(i%nx)*step,y:bounds.minY+Math.floor(i/nx)*step}),index=p=>Math.round((p.x-bounds.minX)/step)+nx*Math.round((p.y-bounds.minY)/step)
const endpoints=st.connected_source_port_ids.map(id=>{const p=source.find(e=>e.type==='pcb_port'&&e.source_port_id===id);assert(p);return{x:p.x,y:p.y,layer:'top'}})
assert.deepEqual(c.pointsToConnect.map(({x,y})=>({x,y})),endpoints.map(({x,y})=>({x,y})))
const shapes=[],netName=id=>source.find(e=>e.type==='source_trace'&&e.source_trace_id===id)?.name??id
for(const o of input.obstacles){
 const owners=o.connectedTo?.filter(id=>/^source_trace_\d+$/.test(id))??[]
 const v=o.circuitJsonMetadata?.pcb_via_id&&source.find(e=>e.type==='pcb_via'&&e.pcb_via_id===o.circuitJsonMetadata.pcb_via_id)
 const label=o.circuitJsonMetadata?.pcb_smtpad_id??o.circuitJsonMetadata?.pcb_plated_hole_id??o.circuitJsonMetadata?.pcb_via_id??'fixed_obstacle'
 const power=v?.source_net_id&&source.find(e=>e.type==='source_net'&&e.source_net_id===v.source_net_id)?.name
 shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers.filter(l=>layers.includes(l)),pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,label,names:power?[power]:owners.map(netName),owner:owners.includes(c.name)?c.name:undefined})
}
for(const t of input.traces){
 const owner=t.source_trace_id??t.connection_name,names=[netName(owner)]
 for(let i=0;i<t.route.length;i++){
  const p=t.route[i]
  if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,hole:p.via_hole_diameter,layers,owner,names,label:`${t.pcb_trace_id}:via`})
  if(i){const a=t.route[i-1],b=p;if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:Math.max(a.width??width,b.width??width),layers:[a.route_type==='wire'?a.layer:b.layer],owner,names,label:t.pcb_trace_id})}
 }
}
for(const v of source.filter(e=>e.type==='pcb_via')){
 const t=source.find(e=>e.type==='pcb_trace'&&e.pcb_trace_id===v.pcb_trace_id),power=v.source_net_id&&source.find(e=>e.type==='source_net'&&e.source_net_id===v.source_net_id)?.name
 const trace=t??input.traces.find(t=>t.route.some(p=>p.route_type==='via'&&Math.hypot(p.x-v.x,p.y-v.y)<1e-8))
 shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers,names:power?[power]:[netName(trace?.source_trace_id??v.pcb_via_id)],label:v.pcb_via_id})
}
assert(shapes.length<65534)
const distance=(s,p)=>{
 if(s.kind==='circle')return Math.hypot(p.x-s.x,p.y-s.y)-s.w/2
 if(s.kind==='rect')return Math.hypot(Math.max(0,Math.abs(p.x-s.x)-s.w/2),Math.max(0,Math.abs(p.y-s.y)-s.h/2))
 const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,f=Math.max(0,Math.min(1,((p.x-s.a.x)*dx+(p.y-s.a.y)*dy)/(dx*dx+dy*dy)))
 return Math.hypot(p.x-s.a.x-f*dx,p.y-s.a.y-f*dy)-s.w/2
}
const blocked=[new Uint16Array(N),new Uint16Array(N)],viaBlocked=new Uint16Array(N)
for(let shapeIndex=0;shapeIndex<shapes.length;shapeIndex++){
 const s=shapes[shapeIndex],r=land/2+clearance+guard+(s.kind==='segment'?s.w/2:0)
 const x0=Math.max(0,Math.floor(((s.kind==='segment'?Math.min(s.a.x,s.b.x):s.x-s.w/2)-r-bounds.minX)/step)),x1=Math.min(nx-1,Math.ceil(((s.kind==='segment'?Math.max(s.a.x,s.b.x):s.x+s.w/2)+r-bounds.minX)/step))
 const y0=Math.max(0,Math.floor(((s.kind==='segment'?Math.min(s.a.y,s.b.y):s.y-s.h/2)-r-bounds.minY)/step)),y1=Math.min(ny-1,Math.ceil(((s.kind==='segment'?Math.max(s.a.y,s.b.y):s.y+s.h/2)+r-bounds.minY)/step))
 const terminalPad=s.pad&&s.owner===c.name&&endpoints.some(p=>Math.hypot(s.x-p.x,s.y-p.y)<1e-8)
 for(let iy=y0;iy<=y1;iy++)for(let ix=x0;ix<=x1;ix++){
  const i=ix+iy*nx,p=xy(i),d=distance(s,p),terminalContact=s.owner===c.name&&(terminalPad||endpoints.some(e=>Math.hypot(p.x-e.x,p.y-e.y)<.32))
  if(!terminalContact&&d<width/2+clearance+guard)for(const l of s.layers){const li=layers.indexOf(l);if(!blocked[li][i])blocked[li][i]=shapeIndex+1}
  if((s.owner!==c.name&&d<land/2+clearance+1e-9)||(s.pad&&d<drill/2+.2+1e-9)||(s.hole&&Math.hypot(p.x-s.x,p.y-s.y)<drill/2+s.hole/2+.254+1e-9))if(!viaBlocked[i])viaBlocked[i]=shapeIndex+1
 }
}
// 0-1 BFS: moving along wire costs zero; a new outer-layer transition costs
// one. Unlike the earlier six-via trial this finds the minimum unconstrained
// transition count, without multiplying the raster by a via-count state.
const dist=new Uint16Array(2*N);dist.fill(65535)
const parents=new Int32Array(2*N);parents.fill(-1)
let q=new Int32Array(2*N+1),head=0,tail=0
const push=(id,front)=>{const nextTail=(tail+1)%q.length;if(nextTail===head){const bigger=new Int32Array(q.length*2);let k=0;for(let i=head;i!==tail;i=(i+1)%q.length)bigger[k++]=q[i];q=bigger;head=0;tail=k}if(front){head=(head-1+q.length)%q.length;q[head]=id}else{q[tail]=id;tail=(tail+1)%q.length}}
const ram=index(endpoints[1]),cpu=index(endpoints[0]);assert(!blocked[0][ram]&&!blocked[0][cpu])
dist[ram]=0;push(ram,false)
let expanded=0
while(head!==tail){
 const id=q[head];head=(head+1)%q.length;const i=id%N,l=Math.floor(id/N),ix=i%nx,iy=Math.floor(i/nx),cost=dist[id];expanded++
 const relax=(next,newCost,front)=>{if(newCost<dist[next]){dist[next]=newCost;parents[next]=id;push(next,front)}}
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){if(ix+dx<0||ix+dx>=nx||iy+dy<0||iy+dy>=ny)continue;const next=i+dx+dy*nx;if(!blocked[l][next])relax(l*N+next,cost,true)}
 if(!viaBlocked[i]&&!blocked[1-l][i])relax((1-l)*N+i,cost+1,false)
}
const reachable=layers.map((layer,l)=>{
 let cells=0,minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;const frontier=new Map()
 const add=shapeIndex=>{if(!shapeIndex)return;frontier.set(shapeIndex,(frontier.get(shapeIndex)??0)+1)}
 for(let i=0;i<N;i++)if(dist[l*N+i]!==65535){cells++;const p=xy(i);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);const ix=i%nx,iy=Math.floor(i/nx)
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){if(ix+dx<0||ix+dx>=nx||iy+dy<0||iy+dy>=ny)continue;add(blocked[l][i+dx+dy*nx])}
  if(!blocked[1-l][i])add(viaBlocked[i])
 }
 const named=new Map();for(const [idx,count] of frontier){const shape=shapes[idx-1],key=shape.names.join(',')||shape.label;const r=named.get(key)??{names:shape.names,boundarySamples:0,exampleShapes:[]};r.boundarySamples+=count;if(!r.exampleShapes.includes(shape.label)&&r.exampleShapes.length<12)r.exampleShapes.push(shape.label);named.set(key,r)}
 return{layer,cells,bounds:cells?{minX,maxX,minY,maxY}:null,boundaryCopper:[...named.values()].sort((a,b)=>b.boundarySamples-a.boundarySamples).slice(0,18)}
})
mkdirSync(directory,{recursive:true})
const report={status:'CASN_GUARDED_CORRIDOR_TOPOLOGY_DIAGNOSTIC',source:prior.source,checkedSourceSummary:prior.checkedSourceSummary,preparation:artifact(`${preparation}/result.json`),input:prior.input,temporaryOpenCommandPrefixes:prior.temporaryOpenCommandPrefixes,
 actualEndpoints:endpoints,searchBounds:bounds,gridMm:step,wireSamplingGuardMm:guard,copperLayers:4,signalLayers:layers,expanded,minimumLayerTransitions:dist[cpu]===65535?null:dist[cpu],cpuReachableFromRam:dist[cpu]!==65535,ramReachableComponents:reachable,
 retainedSourceTraces:registration.traces,retainedSourceHoles:registration.holes,pendingCommandPrefixRepairs:prefixes.length,qualifiedNewDdrSignals:0,viaMutualSpacingQualified:false,nativePlanarLegsQualified:false,topologyOnly:true,exportable:false,fabricationReady:false,defaultChanged:false,executionHelper:artifact('scripts/diagnose-am3352-command-corridor.mjs')}
if(dist[cpu]!==65535){
 const ids=[];for(let id=cpu;id>=0;id=parents[id])ids.push(id)
 const path=ids.map(id=>({...xy(id%N),layer:layers[Math.floor(id/N)]})),p=`${directory}/unqualified-raster-walk.json`;writeFileSync(p,JSON.stringify(path)+'\n');report.rasterWalk=artifact(p)
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,cpuReachable:report.cpuReachableFromRam,minimumLayerTransitions:report.minimumLayerTransitions,reachable:reachable.map(r=>({layer:r.layer,cells:r.cells,bounds:r.bounds,boundaryCopper:r.boundaryCopper.slice(0,5)})),exportable:false,fabricationReady:false}))
