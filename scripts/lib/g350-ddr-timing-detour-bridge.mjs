// A full-depth physical terminal via can be entered from either outer layer.
// Its drill still forbids adding another physical hole at that position.
// Weighted A* reduces planning time. This makes no optimality or CAD claim.
// Negotiated, unqualified planning only. Soft staged paths may be opened;
// all source copper, pads and source holes remain hard obstacles.
import assert from 'node:assert/strict'

// Conservative two-to-four-layer search for manual handoffs. Native planar
// phases and independent physical/source checks remain required.
export function routeGuardedOuterBridge({connection,shapes,searchBounds,seconds=30,gridMm=.02,maxVias=4,viaGrid=.02,overlapPenalty=2,routingLayers=['top','bottom'],viaCopperClearance=.1016,primaryTerminalLayer=false,rasterGuardMm}){
assert(Number.isFinite(overlapPenalty)&&overlapPenalty>0&&overlapPenalty<=100)
assert(viaCopperClearance>=.1016&&viaCopperClearance<=.2)
assert(routingLayers.length>=2&&routingLayers.length<=4&&new Set(routingLayers).size===routingLayers.length&&routingLayers.every(l=>['top','inner1','inner2','bottom'].includes(l)))
const layers=routingLayers,layerCount=layers.length,width=.1016,clearance=.1016,land=.4572,drill=.254,viaCost=2
assert([.02,.025,.04].includes(gridMm));assert(seconds>0&&seconds<=60)
assert(Number.isInteger(maxVias)&&maxVias>=2&&maxVias<=6)
assert([.02,.04,.1,.2].includes(viaGrid))
assert(rasterGuardMm===undefined||(Number.isFinite(rasterGuardMm)&&rasterGuardMm>=0&&rasterGuardMm<=gridMm*Math.SQRT1_2+1e-4))
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
 // Optional planning raster margin. This never changes the actual clearance
 // rules; full native and independent CAD checks must accept a saved route.
 const guard=rasterGuardMm??(step*Math.SQRT1_2+1e-4)
 const [start,goal]=c.pointsToConnect
 const bounds=searchBounds
 const nx=Math.round((bounds.maxX-bounds.minX)/step)+1,ny=Math.round((bounds.maxY-bounds.minY)/step)+1,N=nx*ny
 const xy=i=>({x:bounds.minX+(i%nx)*step,y:bounds.minY+Math.floor(i/nx)*step})
 const index=p=>Math.round((p.x-bounds.minX)/step)+nx*Math.round((p.y-bounds.minY)/step)
 const si=index(start),gi=index(goal)
 assert(Math.hypot(xy(si).x-start.x,xy(si).y-start.y)<1e-6)
 assert(Math.hypot(xy(gi).x-goal.x,xy(gi).y-goal.y)<1e-6)
 const blocked=Array.from({length:layerCount},()=>new Uint8Array(N)),viaBlocked=new Uint8Array(N)
 const softCost=Array.from({length:layerCount},()=>new Float32Array(N)),softViaCost=new Float32Array(N)
 for(const s of shapes){
  const r=land/2+Math.max(clearance,s.hole?viaCopperClearance:clearance)+guard+(s.kind==='segment'?s.w/2:0)
  const x0=Math.max(0,Math.floor(((s.kind==='segment'?Math.min(s.a.x,s.b.x):s.x-s.w/2)-r-bounds.minX)/step))
  const x1=Math.min(nx-1,Math.ceil(((s.kind==='segment'?Math.max(s.a.x,s.b.x):s.x+s.w/2)+r-bounds.minX)/step))
  const y0=Math.max(0,Math.floor(((s.kind==='segment'?Math.min(s.a.y,s.b.y):s.y-s.h/2)-r-bounds.minY)/step))
  const y1=Math.min(ny-1,Math.ceil(((s.kind==='segment'?Math.max(s.a.y,s.b.y):s.y+s.h/2)+r-bounds.minY)/step))
  for(let iy=y0;iy<=y1;iy++)for(let ix=x0;ix<=x1;ix++){
   const i=ix+iy*nx,p=xy(i),d=distance(s,p)
   const actualTerminalPad=s.pad&&s.owner===c.name&&(
    Math.hypot(s.x-start.x,s.y-start.y)<1e-8||Math.hypot(s.x-goal.x,s.y-goal.y)<1e-8)
   const actualTerminalVia=s.hole&&s.owner===c.name&&(Math.hypot(s.x-start.x,s.y-start.y)<1e-8||Math.hypot(s.x-goal.x,s.y-goal.y)<1e-8)
   const terminalContact=s.owner===c.name // Same-net prefixes are electrical copper; drilling remains forbidden.
   if(!s.viaOnly&&!terminalContact&&d<width/2+clearance+guard)for(const l of s.layers){
    if(s.soft)softCost[layers.indexOf(l)][i]+=penalty*(s.softWeight??1)
    else blocked[layers.indexOf(l)][i]=1
   }
   if((s.owner!==c.name&&d<land/2+(s.hole?viaCopperClearance:clearance)+1e-9)||(s.pad&&d<drill/2+.2+1e-9)||
    (s.hole&&Math.hypot(p.x-s.x,p.y-s.y)<drill/2+s.hole/2+.254+1e-9)){
    if(s.soft)softViaCost[i]+=penalty*16*(s.softWeight??1)
    else viaBlocked[i]=1
   }
  }
 }
 const physicalTerminal=p=>shapes.some(s=>s.hole&&s.owner===c.name&&Math.hypot(p.x-s.x,p.y-s.y)<1e-6)
 const startLayers=!primaryTerminalLayer&&physicalTerminal(start)?layers:[start.layer],goalLayers=!primaryTerminalLayer&&physicalTerminal(goal)?layers:[goal.layer]
 assert(startLayers.every(l=>layers.includes(l))&&goalLayers.every(l=>layers.includes(l)))
 const distances=new Float64Array(N*layerCount*(maxVias+1));distances.fill(Infinity)
 const parents=new Int32Array(distances.length);parents.fill(-1)
 const heuristic=i=>{const p=xy(i);return Math.hypot(p.x-goal.x,p.y-goal.y)}
 const heap=new Heap();for(let l=0;l<layerCount;l++)if(startLayers.includes(layers[l])&&!blocked[l][si]){distances[l*N+si]=0;heap.push(l*N+si,1.5*heuristic(si),0)}
 let finish=-1,expanded=0;const begun=performance.now()
 while(heap.a.length){
  const item=heap.pop(),id=item.id;if(item.g!==distances[id])continue
  const state=Math.floor(id/N),i=id%N,l=state%layerCount,count=Math.floor(state/layerCount),ix=i%nx,iy=Math.floor(i/nx)
  if(i===gi&&goalLayers.includes(layers[l])){finish=id;break}
  if(++expanded%50000===0&&performance.now()-begun>seconds*1000)return {error:'manual bridge timeout',expanded}
  const relax=(next,cost)=>{const g=item.g+cost;if(g+1e-9<distances[next]){distances[next]=g;parents[next]=id;heap.push(next,g+1.5*heuristic(next%N),g)}}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   if(ix+dx<0||ix+dx>=nx||iy+dy<0||iy+dy>=ny)continue
   const next=i+dx+dy*nx;if(!blocked[l][next])relax(state*N+next,step*(dx&&dy?Math.SQRT2:1)+softCost[l][next])
  }
  const p=xy(i),site=Math.abs(p.x/viaGrid-Math.round(p.x/viaGrid))<1e-6&&Math.abs(p.y/viaGrid-Math.round(p.y/viaGrid))<1e-6
  if(count<maxVias&&site&&!viaBlocked[i])for(let nextLayer=0;nextLayer<layerCount;nextLayer++)if(nextLayer!==l&&!blocked[nextLayer][i])relax(((count+1)*layerCount+nextLayer)*N+i,viaCost+softViaCost[i])
 }
 if(finish<0)return {error:'no clearance-preserving bridge',expanded,startBlocked:blocked.map(b=>!!b[si]),goalBlocked:blocked.map(b=>!!b[gi])}
 const ids=[];for(let id=finish;id>=0;id=parents[id])ids.push(id);ids.reverse()
 const route=[]
 for(let k=0;k<ids.length;k++){
  const id=ids[k],p=xy(id%N),state=Math.floor(id/N),l=layers[state%layerCount]
  if(k&&Math.floor(ids[k-1]/N)!==state)route.push({route_type:'via',...p,from_layer:layers[Math.floor(ids[k-1]/N)%layerCount],to_layer:l,
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

return routeConnection(connection,gridMm,overlapPenalty)
}
