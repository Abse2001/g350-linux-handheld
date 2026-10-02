import type {SimpleRouteJson} from "@tscircuit/capacity-autorouter"
import {isMemoryEscapeVia,distanceToCopper} from "./auditMemoryThroughVias"
import {pointSegment,segmentToCopper,segments} from "./repairMemoryViaSites"
import {auditMemoryWires} from "./auditMemoryWires"
type Point={x:number;y:number}
type Trace=NonNullable<SimpleRouteJson["traces"]>[number]

// Supplementary grid-routing experiment. It proposes a continuous trace on
// a single signal layer between existing full-depth escape vias. No holes,
// pad deletion, clearance relaxation or layer jumps are allowed. Proposed
// geometry must still pass actual exported Gerber and independent DRC.
export function gridMemoryCandidate(input:SimpleRouteJson,onlyLayers?:string[],diagnostic?:(value:unknown)=>void):Trace|undefined {
  if(input.connections.length!==1)throw new Error("Grid experiment routes one signal at a time")
  const c=input.connections[0],net=c.name
  const [from,to]=c.pointsToConnect
  if(c.pointsToConnect.length!==2)throw new Error("Expected two memory terminals")
  for(const p of [from,to])if(!input.obstacles.some(o=>isMemoryEscapeVia(o)&&o.connectedTo.includes(net)&&Math.hypot(p.x-o.center.x,p.y-o.center.y)<1e-5))
    throw new Error("Grid terminals must be physically accessible full-depth vias")
  // Search margin supplements, and never changes, the physical 0.09mm
  // copper / 0.20mm drill rules. A larger raster margin closed the real
  // narrow corridors between RAM vias. Validate every final segment below
  // rather than treating a raster path as a clearance certificate.
  const step=.025,width=.09,margin=.003
  const minX=input.bounds.minX+.3,maxX=input.bounds.maxX-.3
  const minY=input.bounds.minY+.3,maxY=input.bounds.maxY-.3
  const nx=Math.ceil((maxX-minX)/step)+1,ny=Math.ceil((maxY-minY)/step)+1,size=nx*ny
  const point=(i:number):Point=>({x:minX+(i%nx)*step,y:minY+Math.floor(i/nx)*step})
  const index=(p:Point)=>Math.round((p.y-minY)/step)*nx+Math.round((p.x-minX)/step)
  const start=index(from),end=index(to)
  const manual=input.obstacles.filter(isMemoryEscapeVia)
  const drills=manual.map(o=>({center:o.center,hole:.15,diameter:o.width,net:o.connectedTo}))
  const wires:{p:Point;q:Point;layer:string;width:number;net:string}[]=[]
  for(const t of input.traces??[])for(let i=0;i<t.route.length;i++) {
    const p=t.route[i],q=t.route[i+1]
    if(p.route_type==="via")drills.push({center:p,hole:p.via_hole_diameter??.15,diameter:p.via_diameter??.3,net:[t.connection_name]})
    if(p.route_type==="wire"&&q?.route_type==="wire"&&p.layer===q.layer)wires.push({p,q,layer:p.layer,width:Math.max(p.width,q.width),net:t.connection_name})
  }
  const preferred=onlyLayers??(from.layer==="inner3"?["inner2","inner3","bottom"]:["inner3","inner2","bottom"])
  for(const layer of preferred) {
    const blocked=new Uint8Array(size)
    const copper=input.obstacles.map(o=>isMemoryEscapeVia(o)?{...o,shape:"circle" as const,layers:["top","inner1","inner2","inner3","inner4","bottom"]}:o)
      .filter(o=>o.layers.includes(layer)&&!o.connectedTo.includes(net))
    const foreignDrills=drills.filter(d=>!d.net.includes(net))
    const foreignWires=wires.filter(w=>w.layer===layer&&w.net!==net)
    const raster=(lo:Point,hi:Point,inside:(p:Point)=>boolean)=>{
      const a=Math.max(0,Math.ceil((lo.x-minX)/step)),b=Math.min(nx-1,Math.floor((hi.x-minX)/step))
      const d=Math.max(0,Math.ceil((lo.y-minY)/step)),e=Math.min(ny-1,Math.floor((hi.y-minY)/step))
      for(let y=d;y<=e;y++)for(let x=a;x<=b;x++){
        const i=y*nx+x;if(!blocked[i]&&inside(point(i)))blocked[i]=1
      }
    }
    for(const o of copper) {
      const r=Math.hypot(o.width,o.height)/2+.09+width/2+margin
      raster({x:o.center.x-r,y:o.center.y-r},{x:o.center.x+r,y:o.center.y+r},p=>distanceToCopper(p,o)<.09+width/2+margin)
    }
    for(const d of foreignDrills) {
      const r=Math.max(d.hole/2+.2,d.diameter/2+.09)+width/2+margin
      raster({x:d.center.x-r,y:d.center.y-r},{x:d.center.x+r,y:d.center.y+r},p=>Math.hypot(p.x-d.center.x,p.y-d.center.y)<r)
    }
    for(const w of foreignWires) {
      const r=(width+w.width)/2+.09+margin
      raster({x:Math.min(w.p.x,w.q.x)-r,y:Math.min(w.p.y,w.q.y)-r},{x:Math.max(w.p.x,w.q.x)+r,y:Math.max(w.p.y,w.q.y)+r},p=>pointSegment(p,w.p,w.q)<r)
    }
    if(blocked[start]||blocked[end]){diagnostic?.({layer,startBlocked:!!blocked[start],endBlocked:!!blocked[end]});continue}
    const queue=new Int32Array(size),prev=new Int32Array(size).fill(-1)
    let head=0,tail=1;queue[0]=start;prev[start]=start
    while(head<tail&&prev[end]===-1) {
      const i=queue[head++],x=i%nx,y=Math.floor(i/nx)
      for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
        const a=x+dx,b=y+dy;if(a<0||a>=nx||b<0||b>=ny)continue
        const j=b*nx+a;if(blocked[j]||prev[j]!==-1)continue
        prev[j]=i;queue[tail++]=j
      }
    }
    if(prev[end]===-1){
      let lx=Infinity,hx=-Infinity,ly=Infinity,hy=-Infinity
      for(let i=0;i<tail;i++){const p=point(queue[i]);lx=Math.min(lx,p.x);hx=Math.max(hx,p.x);ly=Math.min(ly,p.y);hy=Math.max(hy,p.y)}
      diagnostic?.({layer,reachableCells:tail,bounds:{lx,hx,ly,hy}})
      continue
    }
    const points:Point[]=[to]
    for(let i=end;i!==start;i=prev[i])points.push(point(i))
    points.push(from);points.reverse()
    const clear=(a:Point,b:Point)=>
      copper.every(o=>segmentToCopper(a,b,o)>=.09+width/2-1e-6)&&
      foreignDrills.every(d=>pointSegment(d.center,a,b)>=Math.max(d.hole/2+.2,d.diameter/2+.09)+width/2-1e-6)&&
      foreignWires.every(w=>segments(a,b,w.p,w.q)>=(width+w.width)/2+.09-1e-6)
    const simple=[points[0]]
    for(let i=0;i<points.length-1;) {
      let j=points.length-1;while(j>i+1&&!clear(points[i],points[j]))j--
      simple.push(points[j]);i=j
    }
    const trace:Trace={type:"pcb_trace",pcb_trace_id:`${net}_grid_candidate`,connection_name:net,
      connectsTo:c.pointsToConnect.map(p=>p.pointId!),
      route:simple.map(p=>({x:p.x,y:p.y,width,layer,route_type:"wire"}))}
    const audit=auditMemoryWires(input,[trace])
    if(!audit.issues.length)return trace
    diagnostic?.({layer,candidatePoints:trace.route.length,wireIssues:audit.issues})
  }
  return undefined
}
