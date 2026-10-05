import assert from 'node:assert/strict'

export const ddrClass=n=>/^DDR_DQS[n]?0$/.test(n)?'DQS0':/^DDR_DQS[n]?1$/.test(n)?'DQS1':/^DDR_CKn?$/.test(n)?'CK':/^DDR_D[0-7]$|^DDR_DQM0$/.test(n)?'DQ0':/^DDR_D(8|9|1[0-5])$|^DDR_DQM1$/.test(n)?'DQ1':n==='DDR_RESETn'?'ASYNC':'ADDR_CTRL'
const dot=(a,b)=>a.x*b.x+a.y*b.y,sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y})
const intersect=(a,b)=>{const lo=Math.max(a[0],b[0]),hi=Math.min(a[1],b[1]);return hi>lo+1e-12?[lo,hi]:null}
const linearRange=(constant,slope,lo,hi)=>{if(Math.abs(slope)<1e-14)return constant>=lo&&constant<=hi?[0,1]:null;const a=(lo-constant)/slope,b=(hi-constant)/slope;return intersect([Math.min(a,b),Math.max(a,b)],[0,1])}
const quadraticRange=(a,b,c)=>{if(Math.abs(a)<1e-14){if(Math.abs(b)<1e-14)return c<=0?[0,1]:null;return intersect(b>0?[-Infinity,-c/b]:[-c/b,Infinity],[0,1])}const d=b*b-4*a*c;if(d<0)return null;const s=Math.sqrt(Math.max(0,d));return intersect([(-b-s)/(2*a),(-b+s)/(2*a)],[0,1])}
export function capsuleIntervals(s,t,r){
 const v=sub(s.b,s.a),u=sub(t.b,t.a),p=sub(s.a,t.a),u2=dot(u,u),out=[];assert(u2>0)
 const q0=dot(p,u)/u2,q1=dot(v,u)/u2,interior=linearRange(q0,q1,0,1)
 if(interior){const c0=p.x*u.y-p.y*u.x,c1=v.x*u.y-v.y*u.x,close=quadraticRange(c1*c1,2*c0*c1,c0*c0-r*r*u2);if(close){const x=intersect(interior,close);if(x)out.push(x)}}
 for(const [e,projection] of [[t.a,linearRange(q0,q1,-Infinity,0)],[t.b,linearRange(q0,q1,1,Infinity)]])if(projection){const z=sub(s.a,e),close=quadraticRange(dot(v,v),2*dot(z,v),dot(z,z)-r*r);if(close){const x=intersect(close,projection);if(x)out.push(x)}}return out
}
export const intervalUnion=intervals=>{const out=[];for(const r of intervals.sort((a,b)=>a[0]-b[0])){const last=out.at(-1);if(last&&r[0]<=last[1]+1e-10)last[1]=Math.max(last[1],r[1]);else out.push([...r])}return out}
export function routeSegments(name,route){
 const result=[]
 for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],length=Math.hypot(b.x-a.x,b.y-a.y);if(length<1e-10)continue;const layer=a.route_type==='wire'?a.layer:a.to_layer;assert.equal(layer,b.route_type==='wire'?b.layer:b.from_layer);result.push({name,netClass:ddrClass(name),a:{x:a.x,y:a.y},b:{x:b.x,y:b.y},layer,length,width:.1016,routeIndex:i-1})}return result
}
export function measureSegmentExposure(s,segments){
 const intervals=[],byNeighbor={}
 for(const t of segments){if(s.name===t.name||s.layer!==t.layer)continue;if(['CK','DQS0','DQS1'].includes(s.netClass)&&s.netClass===t.netClass)continue
  const multiplier=s.netClass===t.netClass&&['DQ0','DQ1','ADDR_CTRL'].includes(s.netClass)?3:4,r=multiplier*Math.max(s.width,t.width)
  if(Math.max(s.a.x,s.b.x)+r<Math.min(t.a.x,t.b.x)||Math.max(t.a.x,t.b.x)+r<Math.min(s.a.x,s.b.x)||Math.max(s.a.y,s.b.y)+r<Math.min(t.a.y,t.b.y)||Math.max(t.a.y,t.b.y)+r<Math.min(s.a.y,s.b.y))continue
  const close=capsuleIntervals(s,t,r-1e-9);if(close.length){intervals.push(...close);(byNeighbor[t.name]??=[]).push(...close)}
 }
 const joined=intervalUnion(intervals);return{exposureMm:joined.reduce((n,[lo,hi])=>n+(hi-lo)*s.length,0),intervals:joined,neighbors:Object.fromEntries(Object.entries(byNeighbor).map(([n,r])=>[n,intervalUnion(r).reduce((v,[lo,hi])=>v+(hi-lo)*s.length,0)]))}
}
export function measureRouteExposure(name,route,segments){const rows=routeSegments(name,route).map(s=>({...s,...measureSegmentExposure(s,segments)}));return{planarMm:rows.reduce((v,r)=>v+r.length,0),exposureMm:rows.reduce((v,r)=>v+r.exposureMm,0),segments:rows}}
