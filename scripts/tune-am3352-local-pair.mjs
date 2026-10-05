import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Author a conservative local trombone, then let native bus_lanes retry the
// complete channel. Sampling has a guard larger than its half-cell diagonal;
// this candidate must still pass actual-source shorts and independent DRC.
const [inputDirectory,directory]=process.argv.slice(2);assert(inputDirectory&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const inputPath=`${inputDirectory}/channel.input.simple-route.json`,input=read(inputPath),prior=read(`${inputDirectory}/result.json`)
const pair=input.differentialPairs[0];assert.equal(pair.connectionNames.length,2)
const length=r=>r.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-r[i].x,p.y-r[i].y),0)
const fixedLength=n=>input.traces.filter(t=>t.source_trace_id===n||t.connection_name===n).reduce((sum,t)=>sum+length(t.route),0)
const before=pair.connectionNames.map(fixedLength),short=before[0]<before[1]?0:1,name=pair.connectionNames[short]
const delta=Math.abs(before[0]-before[1]);assert(delta>.127&&delta<15)
const width=.1016,clearance=.1016,guard=.0145,shapes=[]
for(const o of input.obstacles)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,
  layers:o.layers,own:o.connectedTo?.includes(name)})
for(const t of input.traces){
 const own=(t.source_trace_id??t.connection_name)===name
 for(let i=0;i<t.route.length;i++){
  const p=t.route[i]
  if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,layers:['top','bottom'],own})
  if(i){const a=t.route[i-1],b=p
   if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8&&!(a.route_type==='wire'&&b.route_type==='wire'&&a.layer!==b.layer))
    shapes.push({kind:'segment',a,b,w:Math.max(a.width??width,b.width??width),layers:[a.route_type==='wire'?a.layer:b.layer],own})
  }
 }
}
const pointDistance=(s,x,y)=>{
 if(s.kind==='circle')return Math.hypot(x-s.x,y-s.y)-s.w/2
 if(s.kind==='rect')return Math.hypot(Math.max(0,Math.abs(x-s.x)-s.w/2),Math.max(0,Math.abs(y-s.y)-s.h/2))
 const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,f=Math.max(0,Math.min(1,((x-s.a.x)*dx+(y-s.a.y)*dy)/(dx*dx+dy*dy)))
 return Math.hypot(x-s.a.x-f*dx,y-s.a.y-f*dy)-s.w/2
}
const samples=route=>{
 const result=[];let arc=0
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],span=Math.hypot(b.x-a.x,b.y-a.y),count=Math.max(1,Math.ceil(span/.01))
  for(let j=0;j<count;j++)result.push({x:a.x+(b.x-a.x)*j/count,y:a.y+(b.y-a.y)*j/count,arc:arc+span*j/count})
  arc+=span
 }
 result.push({...route.at(-1),arc});return result
}
const visible=(route,layer)=>{
 const relevant=shapes.filter(s=>!s.own&&s.layers.includes(layer))
 const points=samples(route)
 for(const p of points){
  if(p.x<-17.5||p.x>17.5||p.y<-38.5||p.y>9.5)return false
  if(relevant.some(s=>pointDistance(s,p.x,p.y)<width/2+clearance+guard))return false
 }
 // Prevent a meander from shorting across its own return legs. Close
 // points on a connected bend are exempt only by their actual arc distance.
 for(let i=0;i<points.length;i++)for(let j=0;j<i;j++)
  if(points[i].arc-points[j].arc>.51&&Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y)<width+clearance+guard)return false
 return true
}
let accepted,tested=0
const traces=input.traces.filter(t=>t.pcb_trace_id.startsWith('guided_')&&(t.source_trace_id??t.connection_name)===name)
for(const trace of traces){
 if(accepted)break
 for(let index=0;index<trace.route.length-1&&!accepted;index++){
  const a=trace.route[index],b=trace.route[index+1]
  if(a.route_type!=='wire'||b.route_type!=='wire'||a.layer!==b.layer)continue
  const span=Math.hypot(b.x-a.x,b.y-a.y);if(span<.8)continue
  const u={x:(b.x-a.x)/span,y:(b.y-a.y)/span}
  for(let teeth=1;teeth<=12&&!accepted;teeth++)for(const height of [.24,.32,.4])for(const phase of [.5,0,1])for(const side of [1,-1]){
   if(accepted)break
   const pitch=height+.24,total=(teeth-1)*pitch+height,chamfer=.04
   if(total>span-.2)continue
   const amplitude=(delta+4*teeth*chamfer*(2-Math.SQRT2))/(2*teeth)
   if(amplitude>5||amplitude<chamfer*2)continue
   const offset=(span-total-.2)*phase+.1,n={x:-u.y*side,y:u.x*side},points=[]
   const wire=(v,w)=>({route_type:'wire',x:a.x+u.x*v+n.x*w,y:a.y+u.y*v+n.y*w,layer:a.layer,width})
   for(let k=0;k<teeth;k++){
    const y=offset+k*pitch
    points.push(wire(y-chamfer,0),wire(y,chamfer),wire(y,amplitude-chamfer),wire(y+chamfer,amplitude),
      wire(y+height-chamfer,amplitude),wire(y+height,amplitude-chamfer),wire(y+height,chamfer),wire(y+height+chamfer,0))
   }
   const bump=[a,...points,b],next=[...trace.route.slice(0,index),...bump,...trace.route.slice(index+2)]
   tested++
   if(!visible(bump,a.layer))continue
   // Test added copper against distant pieces of this same local path.
   const other=trace.route.slice(1).flatMap((p,i)=>i===index?[]:[{kind:'segment',a:trace.route[i],b:p,w:width,
    layers:[trace.route[i].layer??p.layer],near:i===index-1||i===index+1}])
   if(samples(points).some(p=>other.some(s=>!s.near&&s.layers.includes(a.layer)&&pointDistance(s,p.x,p.y)<width/2+clearance+guard)))continue
   assert(Math.abs(length(next)-length(trace.route)-delta)<1e-6)
   accepted={trace,index,route:next,teeth,height,pitch,side,amplitude,layer:a.layer,span,offset};break
  }
 }
}
mkdirSync(directory,{recursive:true})
if(!accepted){
 writeFileSync(`${directory}/result.json`,JSON.stringify({...prior,status:'LOCAL_PAIR_TUNING_NO_CLEAR_CANDIDATE',tested,beforeFixedLengthsMm:before,fabricationReady:false},null,2)+'\n')
 console.log(`No conservative local tuning candidate among ${tested} candidates.`);process.exit(1)
}
accepted.trace.route=accepted.route
const after=pair.connectionNames.map(fixedLength);assert(Math.abs(after[0]-after[1])<1e-6)
const path=`${directory}/channel.input.simple-route.json`;writeFileSync(path,JSON.stringify(input)+'\n')
const {trace,route,...geometry}=accepted
const report={...prior,status:'LOCAL_PAIR_PLANAR_BALANCED_PENDING_INDEPENDENT_CHECKS',
 priorLocalInput:{path:inputPath,sha256:hash(inputPath)},manualPairTuning:{trace:trace.pcb_trace_id,addedLengthMm:delta,
  beforeFixedLengthsMm:before,afterFixedLengthsMm:after,tested,...geometry},
 channel:{input:{path,sha256:hash(path)},solved:false},fabricationReady:false,timingQualified:false}
delete report.output
writeFileSync(`${directory}/local-escapes.json`,JSON.stringify(input.traces.filter(t=>t.pcb_trace_id.startsWith('guided_')),null,2)+'\n')
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.manualPairTuning))
