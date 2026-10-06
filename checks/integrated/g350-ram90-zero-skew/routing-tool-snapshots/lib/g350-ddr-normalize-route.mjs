import assert from 'node:assert/strict'
const width=.1016,reach=(.4572+width)/2
const sq=p=>p.x*p.x+p.y*p.y,sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y}),dot=(a,b)=>a.x*b.x+a.y*b.y
const project=(p,a,b)=>{const v=sub(b,a),t=Math.max(0,Math.min(1,dot(sub(p,a),v)/sq(v)));return {x:a.x+t*v.x,y:a.y+t*v.y}}
function closest(a,b,c,d){
 const u=sub(b,a),v=sub(d,c),w=sub(c,a),den=u.x*v.y-u.y*v.x
 if(Math.abs(den)>1e-12){const t=(w.x*v.y-w.y*v.x)/den,s=(w.x*u.y-w.y*u.x)/den;if(t>=0&&t<=1&&s>=0&&s<=1){const p={x:a.x+t*u.x,y:a.y+t*u.y};return [p,p,0]}}
 const pairs=[[a,project(a,c,d)],[b,project(b,c,d)],[project(c,a,b),c],[project(d,a,b),d]]
 return pairs.map(([p,q])=>[p,q,Math.hypot(p.x-q.x,p.y-q.y)]).sort((a,b)=>a[2]-b[2])[0]
}
const wire=(p,layer)=>({route_type:'wire',x:p.x,y:p.y,layer,width})
function event(route){
 const segments=[],distances=[];let distance=0,run=0
 for(let i=0;i<route.length-1;i++){
  distances[i]=distance;const a=route[i],b=route[i+1]
  if(a.route_type!=='wire'||b.route_type!=='wire'||a.layer!==b.layer){run++;continue}
  const len=Math.hypot(a.x-b.x,a.y-b.y);if(!len)continue
  segments.push({a,b,i,run,start:distance,end:distance+len});distance+=len
 }
 distances[route.length-1]=distance
 for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){
  const a=segments[i],b=segments[j];if(a.a.layer!==b.a.layer)continue
  const u=sub(a.b,a.a),v=sub(b.b,b.a),product=Math.sqrt(sq(u)*sq(v)),dp=dot(u,v),cross=u.x*v.y-u.y*v.x
  const adjacent=a.run===b.run&&b.start===a.end
  if(adjacent){if(dp<0&&Math.abs(cross)<1e-9)return {kind:'reverse',a,b};continue}
  if(!adjacent&&a.run===b.run&&b.start-a.end<=Math.SQRT2*width&&dp>=-1e-9*product)continue
  const [p,q,gap]=closest(a.a,a.b,b.a,b.b)
  if(gap<=width+1e-9)return {kind:'segment',a,b,p,q}
 }
 for(let i=0;i<route.length;i++)if(route[i].route_type==='via')for(const s of segments){
  if(Math.max(s.start-distances[i],distances[i]-s.end,0)<=reach+1e-9)continue
  const p=project(route[i],s.a,s.b)
  if(Math.hypot(p.x-route[i].x,p.y-route[i].y)<=reach+1e-9)return {kind:'via',i,s,p}
 }
 return null
}

export function normalizeG350DdrRoute(route){
 const t={route,pcb_trace_id:'single_repair'};
 t.route=t.route.filter((p,i,r)=>!(p.route_type==='via'&&r[i-1]?.route_type==='wire'&&r[i+1]?.route_type==='wire'&&r[i-1].layer===r[i+1].layer))
 let count=0
 for(;count<1000;count++){
  const e=event(t.route);if(!e)break
  const before=JSON.stringify(t.route)


  const r=t.route
  if(e.kind==='reverse')t.route=[...r.slice(0,e.a.i+1),...r.slice(e.b.i+1)]
  else if(e.kind==='segment')t.route=[...r.slice(0,e.a.i+1),wire(e.p,e.a.a.layer),wire(e.q,e.a.a.layer),...r.slice(e.b.i+1)]
  else if(e.i<e.s.i){const via={...r[e.i],to_layer:e.s.a.layer};t.route=[...r.slice(0,e.i),via,wire(via,e.s.a.layer),wire(e.p,e.s.a.layer),...r.slice(e.s.i+1)]}
  else {const via={...r[e.i],from_layer:e.s.a.layer};t.route=[...r.slice(0,e.s.i+1),wire(e.p,e.s.a.layer),wire(via,e.s.a.layer),via,...r.slice(e.i+1)]}
  if(e.kind==='segment'&&JSON.stringify(t.route)===before)t.route=[...r.slice(0,e.a.i+1),...r.slice(e.b.i+1)]
  t.route=t.route.filter((p,i,r)=>!(p.route_type==='via'&&r[i-1]?.route_type==='wire'&&r[i+1]?.route_type==='wire'&&r[i-1].layer===r[i+1].layer))
  t.route=t.route.filter((p,i,a)=>!(i&&p.route_type==='wire'&&a[i-1].route_type==='wire'&&p.layer===a[i-1].layer&&Math.hypot(p.x-a[i-1].x,p.y-a[i-1].y)<1e-10))
 }
 assert(count<1000,'Route normalization did not converge: '+t.pcb_trace_id)
 return t.route
}
