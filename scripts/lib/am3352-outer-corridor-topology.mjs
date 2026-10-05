import assert from 'node:assert/strict'

// Read-only guarded-raster reachability, without a fixed via-count cap.
// This does not qualify new-via mutual spacing or a manufacturing route.
export function diagnoseOuterCorridor({connection,shapes,bounds,gridMm=.02}){
const c=connection,layers=['top','bottom'],width=.1016,clearance=.1016,land=.4572,drill=.254,step=gridMm,guard=step*Math.SQRT1_2+1e-4
assert.equal(step,.02);assert.equal(c.pointsToConnect.length,2);assert(c.pointsToConnect.every(p=>p.layer==='top'))
const nx=Math.round((bounds.maxX-bounds.minX)/step)+1,ny=Math.round((bounds.maxY-bounds.minY)/step)+1,N=nx*ny
const xy=i=>({x:bounds.minX+(i%nx)*step,y:bounds.minY+Math.floor(i/nx)*step}),index=p=>Math.round((p.x-bounds.minX)/step)+nx*Math.round((p.y-bounds.minY)/step)
const endpoints=c.pointsToConnect
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
const walk=[];if(dist[cpu]!==65535)for(let id=cpu;id>=0;id=parents[id])walk.push({...xy(id%N),layer:layers[Math.floor(id/N)]})
return {expanded,minimumLayerTransitions:dist[cpu]===65535?null:dist[cpu],startReachableFromGoal:dist[cpu]!==65535,goalReachableComponents:reachable,unqualifiedRasterWalk:walk}
}
