// Cheap conservative geometry rejection before the complete native checks.
// Passing this filter never qualifies a candidate: all native and KiCad checks
// remain required. Index only unchanged, different-net obstacles.
const pointSegment=(p,a,b)=>{
 const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy
 const f=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)):0
 return Math.hypot(p.x-a.x-f*dx,p.y-a.y-f*dy)
}
const segmentsDistance=(a,b,c,d)=>{
 const ux=b.x-a.x,uy=b.y-a.y,vx=d.x-c.x,vy=d.y-c.y,den=ux*vy-uy*vx
 if(Math.abs(den)>1e-12){const wx=c.x-a.x,wy=c.y-a.y,t=(wx*vy-wy*vx)/den,s=(wx*uy-wy*ux)/den;if(t>=0&&t<=1&&s>=0&&s<=1)return 0}
 return Math.min(pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b))
}
export function createG350LocalGuard(circuit,target){
 const buckets=new Map(),step=1,margin=.5
 const put=(s,box,layers)=>{for(const l of layers)for(let x=Math.floor((box.minX-margin)/step);x<=Math.floor((box.maxX+margin)/step);x++)for(let y=Math.floor((box.minY-margin)/step);y<=Math.floor((box.maxY+margin)/step);y++){
  const key=`${l}:${x}:${y}`;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(s)
 }}
 const ports=new Map(circuit.filter(r=>r.type==='pcb_port').map(r=>[r.pcb_port_id,r.source_port_id]))
 const source=circuit.find(r=>r.type==='source_trace'&&r.source_trace_id===target.source_trace_id)
 const ownPorts=new Set(source.connected_source_port_ids)
 for(const p of circuit.filter(r=>r.type==='pcb_smtpad'&&'x' in r)){
  if(ownPorts.has(ports.get(p.pcb_port_id)))continue
  const w=p.width??2*p.radius,h=p.height??w
  if(!Number.isFinite(w)||!Number.isFinite(h))continue
  const s=p.shape==='circle'?{kind:'circle',x:p.x,y:p.y,r:w/2}:{kind:'rect',x:p.x,y:p.y,w,h}
  s.owner='FIXED_PAD'
  put(s,{minX:p.x-w/2,maxX:p.x+w/2,minY:p.y-h/2,maxY:p.y+h/2},[p.layer])
 }
 const owners=new Map(circuit.filter(r=>r.type==='pcb_trace').map(t=>[t.pcb_trace_id,t.source_trace_id]))
 for(const v of circuit.filter(r=>r.type==='pcb_via')){
  if(owners.get(v.pcb_trace_id)===target.source_trace_id)continue
  put({kind:'circle',x:v.x,y:v.y,r:v.outer_diameter/2,owner:owners.get(v.pcb_trace_id)??'FIXED_HOLE'},{minX:v.x,maxX:v.x,minY:v.y,maxY:v.y},['top','inner1','inner2','bottom'])
 }
 for(const t of circuit.filter(r=>r.type==='pcb_trace'&&r.source_trace_id!==target.source_trace_id))for(let i=1;i<t.route.length;i++){
  const a=t.route[i-1],b=t.route[i]
  if(a.route_type!=='wire'||b.route_type!=='wire'||a.layer!==b.layer)continue
  put({kind:'segment',a,b,r:(b.width??.1016)/2,owner:t.source_trace_id},{minX:Math.min(a.x,b.x),maxX:Math.max(a.x,b.x),minY:Math.min(a.y,b.y),maxY:Math.max(a.y,b.y)},[a.layer])
 }
 const inspect=(route,collect=false)=>{
  const blockers=new Set()
  for(let i=1;i<route.length;i++){
   const a=route[i-1],b=route[i];if(a.route_type!=='wire'||b.route_type!=='wire'||a.layer!==b.layer)continue
   const shapes=new Set()
   for(let x=Math.floor(Math.min(a.x,b.x)/step);x<=Math.floor(Math.max(a.x,b.x)/step);x++)for(let y=Math.floor(Math.min(a.y,b.y)/step);y<=Math.floor(Math.max(a.y,b.y)/step);y++)for(const s of buckets.get(`${a.layer}:${x}:${y}`)??[])shapes.add(s)
   const clearance=(b.width??.1016)/2+.1016
   for(const s of shapes){
    let hit=s.kind==='segment'&&segmentsDistance(a,b,s.a,s.b)<clearance+s.r-1e-6
    hit ||= s.kind==='circle'&&pointSegment(s,a,b)<clearance+s.r-1e-6
    if(s.kind==='rect'){
     const corners=[{x:s.x-s.w/2,y:s.y-s.h/2},{x:s.x+s.w/2,y:s.y-s.h/2},{x:s.x+s.w/2,y:s.y+s.h/2},{x:s.x-s.w/2,y:s.y+s.h/2}]
     hit ||= [a,b].some(p=>Math.abs(p.x-s.x)<s.w/2&&Math.abs(p.y-s.y)<s.h/2)
     hit ||= corners.some((p,j)=>segmentsDistance(a,b,p,corners[(j+1)%4])<clearance-1e-6)
    }
    if(hit){if(!collect)return false;blockers.add(s.owner??'FIXED_COPPER')}
   }
  }
  return collect?[...blockers]:true
 }
 const guard=route=>inspect(route)
 guard.blockingOwners=route=>inspect(route,true)
 return guard
}
