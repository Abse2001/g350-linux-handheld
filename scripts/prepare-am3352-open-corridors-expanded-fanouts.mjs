import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const [directory,inputPath='dist/am3352-latest-bus-lanes-ddr33-fixed-pairs-attempt-754/phase-3.input.simple-route.json',sourcePath='dist/diagnostics/am3352-ddr-usbc-d12-spacing-repaired-candidate/circuit.json']=process.argv.slice(2);assert(directory&&!existsSync(`${directory}/result.json`));const oldPath='routing/am3352-command-unmatched-pruned-paths.json'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),input=read(inputPath),source=read(sourcePath),old=read(oldPath),width=.1016,gap=.1016,land=.4572,drill=.254
assert.equal(input.layerCount,4);assert.equal(input.traces.length,source.filter(e=>e.type==='pcb_trace').length);assert(input.connections.length>0&&input.connections.length<=26);const ids=new Set(input.connections.map(c=>c.name));const shapes=[]
for(const o of input.obstacles){const layers=o.layers.filter(l=>['top','bottom'].includes(l));if(!layers.length)continue;shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers,pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:o.connectedTo?.find(n=>ids.has(n))})}
for(const v of source.filter(e=>e.type==='pcb_via'||e.type==='pcb_plated_hole'))if(v.x!==undefined)shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter??v.outer_width,h:v.outer_diameter??v.outer_height,hole:v.hole_diameter,layers:['top','bottom']})
for(const t of input.traces)for(let k=1;k<t.route.length;k++){const a=t.route[k-1],b=t.route[k];if(Math.hypot(a.x-b.x,a.y-b.y)<1e-8)continue;const layer=a.route_type==='wire'?a.layer:b.layer;if(['top','bottom'].includes(layer))shapes.push({kind:'segment',a,b,w:Math.max(a.width??width,b.width??width),layers:[layer],owner:t.source_trace_id})}
const pointSegment=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}
const cross=(a,b,p)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x)
const segmentSegment=(a,b,c,d)=>{const q=[cross(a,b,c),cross(a,b,d),cross(c,d,a),cross(c,d,b)];if(q[0]*q[1]<=0&&q[2]*q[3]<=0&&Math.max(Math.min(a.x,b.x),Math.min(c.x,d.x))<=Math.min(Math.max(a.x,b.x),Math.max(c.x,d.x))+1e-9&&Math.max(Math.min(a.y,b.y),Math.min(c.y,d.y))<=Math.min(Math.max(a.y,b.y),Math.max(c.y,d.y))+1e-9)return 0;return Math.min(pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b))}
const corners=s=>[{x:s.x-s.w/2,y:s.y-s.h/2},{x:s.x+s.w/2,y:s.y-s.h/2},{x:s.x+s.w/2,y:s.y+s.h/2},{x:s.x-s.w/2,y:s.y+s.h/2}]
const pointDistance=(p,s)=>s.kind==='circle'?Math.hypot(p.x-s.x,p.y-s.y)-s.w/2:s.kind==='rect'?Math.hypot(Math.max(0,Math.abs(p.x-s.x)-s.w/2),Math.max(0,Math.abs(p.y-s.y)-s.h/2)):pointSegment(p,s.a,s.b)-s.w/2
const segmentDistance=(a,b,s)=>{if(s.kind==='circle')return pointSegment(s,a,b)-s.w/2;if(s.kind==='segment')return segmentSegment(a,b,s.a,s.b)-s.w/2;const p=corners(s);return Math.min(pointDistance(a,s),pointDistance(b,s),...p.map((c,i)=>segmentSegment(a,b,c,p[(i+1)%4])))}
const bins=new Map(),cell=.8;for(let n=0;n<shapes.length;n++){const s=shapes[n],r=s.kind==='segment'?s.w/2:.0,minX=s.kind==='segment'?Math.min(s.a.x,s.b.x)-r:s.x-s.w/2,maxX=s.kind==='segment'?Math.max(s.a.x,s.b.x)+r:s.x+s.w/2,minY=s.kind==='segment'?Math.min(s.a.y,s.b.y)-r:s.y-s.h/2,maxY=s.kind==='segment'?Math.max(s.a.y,s.b.y)+r:s.y+s.h/2;for(let x=Math.floor((minX-.6)/cell);x<=Math.floor((maxX+.6)/cell);x++)for(let y=Math.floor((minY-.6)/cell);y<=Math.floor((maxY+.6)/cell);y++){const key=`${x},${y}`;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(n)}}
const nearby=(a,b=a)=>{const ns=new Set();for(let x=Math.floor(Math.min(a.x,b.x)/cell);x<=Math.floor(Math.max(a.x,b.x)/cell);x++)for(let y=Math.floor(Math.min(a.y,b.y)/cell);y<=Math.floor(Math.max(a.y,b.y)/cell);y++)for(const n of bins.get(`${x},${y}`)??[])ns.add(n);return [...ns].map(n=>shapes[n])}
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
const legalVia=(p,owner)=>nearby(p).every(s=>!(s.hole&&Math.hypot(p.x-s.x,p.y-s.y)<drill/2+s.hole/2+.254-1e-8)&&!(s.pad&&pointDistance(p,s)<drill/2+.2-1e-8)&&!(s.owner!==owner&&pointDistance(p,s)<land/2+gap-1e-8))
const legalPath=(points,endpoint,owner)=>points.slice(1).every((b,k)=>nearby(points[k],b).every(s=>!s.layers.includes(endpoint.layer)||(s.pad&&s.owner===owner&&near(s,endpoint))||segmentDistance(points[k],b,s)>=width/2+gap-1e-8))
const length=p=>p.slice(1).reduce((sum,b,k)=>sum+Math.hypot(b.x-p[k].x,b.y-p[k].y),0)
// Search a surface-only prefix to a farther legal through-via. The shortest
// paths are verified again with exact capsule/rectangle distances below.
const distantCandidates=d=>{
 const step=.02,radius=4,n=401,N=n*n,center=200,minX=d.endpoint.x-radius,minY=d.endpoint.y-radius,start=center+center*n
 const point=i=>({x:Number((minX+(i%n)*step).toFixed(8)),y:Number((minY+Math.floor(i/n)*step).toFixed(8))})
 const blocked=new Uint8Array(N),viaStatus=new Uint8Array(N),distance=new Float64Array(N);distance.fill(Infinity);const parent=new Int32Array(N);parent.fill(-1)
 const allowed=i=>{if(!blocked[i]){const p=point(i);blocked[i]=nearby(p).every(s=>!s.layers.includes(d.endpoint.layer)||(s.pad&&s.owner===d.owner&&near(s,d.endpoint))||pointDistance(p,s)>=width/2+gap+step*Math.SQRT1_2+1e-4)?1:2}return blocked[i]===1}
 const isVia=i=>{if(!viaStatus[i])viaStatus[i]=legalVia(point(i),d.owner)?1:2;return viaStatus[i]===1}
 const heap=[];const push=(i,cost)=>{const item={i,cost};let k=heap.length;heap.push(item);while(k){const p=(k-1)>>1;if(heap[p].cost<=cost)break;heap[k]=heap[p];k=p}heap[k]=item}
 const pop=()=>{const result=heap[0],last=heap.pop();if(heap.length){let k=0;while(true){let c=2*k+1;if(c>=heap.length)break;if(c+1<heap.length&&heap[c+1].cost<heap[c].cost)c++;if(heap[c].cost>=last.cost)break;heap[k]=heap[c];k=c}heap[k]=last}return result}
 if(!allowed(start))return []
 distance[start]=0;push(start,0);const candidates=[];let expanded=0
 while(heap.length&&expanded<100000){const item=pop();if(item.cost!==distance[item.i])continue;expanded++;const p=point(item.i),ix=item.i%n,iy=Math.floor(item.i/n)
  if(item.i!==start&&isVia(item.i)&&candidates.every(c=>Math.hypot(c.via.x-p.x,c.via.y-p.y)>=.08)){
   const indices=[];for(let i=item.i;i>=0;i=parent[i])indices.push(i);indices.reverse();const points=indices.map(point).filter((p,k,array)=>!k||k===array.length-1||Math.abs(cross(array[k-1],array[k+1],p))>1e-10)
   if(legalPath(points,d.endpoint,d.owner))candidates.push({points,via:p,length:length(points),fromOldGuide:false,distantSurfacePrefix:true})
   if(candidates.length>=24)break
  }
  if(item.cost>8)continue
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){if(ix+dx<0||ix+dx>=n||iy+dy<0||iy+dy>=n)continue;const next=item.i+dx+dy*n;if(!allowed(next))continue;const q=point(next);if(!legalPath([p,q],d.endpoint,d.owner))continue;const cost=item.cost+step*(dx&&dy?Math.SQRT2:1);if(cost+1e-9<distance[next]){distance[next]=cost;parent[next]=item.i;push(next,cost)}}
 }
 console.log(JSON.stringify({stage:'DISTANT_SURFACE_FANOUT',name:d.name,side:d.side,expanded,candidates:candidates.length}))
 return candidates
}
const definitions=input.connections.flatMap(c=>{const name=source.find(e=>e.type==='source_trace'&&e.source_trace_id===c.source_trace_id).name;return c.pointsToConnect.map((p,k)=>({owner:c.name,name,endpoint:p,side:k===0?'cpu':'ram'}))})
for(const d of definitions){const candidates=[];for(const sx of [-1,1])for(const sy of [-1,1])for(let ix=18;ix<=24;ix++)for(let iy=18;iy<=24;iy++){const p={x:Number((d.endpoint.x+sx*ix*.02).toFixed(8)),y:Number((d.endpoint.y+sy*iy*.02).toFixed(8))};if(!legalVia(p,d.owner))continue;const dx=p.x-d.endpoint.x,dy=p.y-d.endpoint.y,delta=Math.min(Math.abs(dx),Math.abs(dy)),mid={x:d.endpoint.x+Math.sign(dx)*delta,y:d.endpoint.y+Math.sign(dy)*delta};const points=[d.endpoint,...(!near(mid,p)?[mid]:[]),p];if(legalPath(points,d.endpoint,d.owner))candidates.push({points,via:p,length:length(points),fromOldGuide:false})}
 const prior=old[d.name],vIndex=d.side==='cpu'?prior.findIndex(p=>p.via):prior.findLastIndex(p=>p.via);let points=d.side==='cpu'?prior.slice(0,vIndex).map(p=>({x:p.x,y:p.y})):prior.slice(vIndex+1).toReversed().map(p=>({x:p.x,y:p.y}));if(points.length&&near(points[0],d.endpoint)){const via=prior[vIndex];if(!near(points.at(-1),via))points.push({x:via.x,y:via.y});if(length(points)<=15&&legalVia(via,d.owner)&&legalPath(points,d.endpoint,d.owner))candidates.push({points,via:{x:via.x,y:via.y},length:length(points),fromOldGuide:true})}
 // Sparse immediate choices can mutually block. Add guarded surface alternatives
 // before simultaneous assignment; physical rules stay unchanged.
 if(candidates.length<12)candidates.push(...distantCandidates(d));candidates.sort((a,b)=>a.length-b.length)
 // Preserve alternatives from every legal corner. A length-only truncation
 // spends its domain on nearly identical holes in the same inter-pad cell.
 const unique=[...new Map(candidates.map(c=>[`${c.via.x},${c.via.y}`,c])).values()],groups=new Map()
 for(const c of unique){const key=c.distantSurfacePrefix?'distant':`${Math.sign(c.via.x-d.endpoint.x)},${Math.sign(c.via.y-d.endpoint.y)}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c)}
 const diversified=[];for(const c of unique.filter(c=>c.fromOldGuide))diversified.push(c)
 for(const group of groups.values()){
  const available=group.filter(c=>!diversified.includes(c)),picked=[]
  while(available.length&&picked.length<24){let next=0;if(picked.length){let best=-Infinity;for(let k=0;k<available.length;k++){const c=available[k],score=Math.min(...picked.map(a=>Math.hypot(a.via.x-c.via.x,a.via.y-c.via.y)));if(score>best+1e-9){best=score;next=k}}}picked.push(available.splice(next,1)[0])}
  diversified.push(...picked)
 }
 d.candidates=diversified;d.rawCandidateCount=unique.length
}
const compatible=(a,b)=>{const separation=Math.hypot(a.via.x-b.via.x,a.via.y-b.via.y);if(separation<drill+.254-1e-8)return false;if(a.definition.owner===b.definition.owner)return true;if(separation<land+gap-1e-8)return false;for(let i=1;i<a.points.length;i++)for(let j=1;j<b.points.length;j++)if(segmentSegment(a.points[i-1],a.points[i],b.points[j-1],b.points[j])<width+gap-1e-8)return false;for(const [x,y] of [[a,b],[b,a]])for(let k=1;k<y.points.length;k++)if(pointSegment(x.via,y.points[k-1],y.points[k])<land/2+width/2+gap-1e-8)return false;return true}
// Forward checking chooses the most constrained live domain at each step.
// Compatibility caching keeps identical failed prefix combinations bounded.
const selected=[],compatibilityCache=new Map();let attempts=0,pruned=0,bestSelected=[],searchLimitReached=false
const searchStarted=performance.now(),maxAttempts=400000,maxSeconds=60,domainConflicts=new Map()
for(let k=0;k<definitions.length;k++){definitions[k].index=k;definitions[k].candidates=definitions[k].candidates.map((c,i)=>({...c,index:i,definition:definitions[k]}))}
const cachedCompatible=(a,b)=>{
 const lower=a.definition.index<b.definition.index?a:b,upper=lower===a?b:a,key=`${lower.definition.index}:${lower.index}/${upper.definition.index}:${upper.index}`
 if(!compatibilityCache.has(key))compatibilityCache.set(key,compatible(a,b));return compatibilityCache.get(key)
}
const assign=domains=>{
 if(!domains.length)return true
 if(attempts>=maxAttempts||(performance.now()-searchStarted)/1000>maxSeconds){searchLimitReached=true;return false}
 let chosen=0;for(let k=1;k<domains.length;k++)if(domains[k].values.length<domains[chosen].values.length)chosen=k
 const d=domains[chosen];if(!d.values.length)return false
 const remaining=domains.filter((_,k)=>k!==chosen)
 for(const c of d.values){
  if(searchLimitReached)return false;attempts++
  const next=[];let valid=true
  for(const other of remaining){const values=other.values.filter(x=>cachedCompatible(c,x));pruned+=other.values.length-values.length;if(!values.length){const key=`${c.definition.name}:${c.definition.side}/${other.definition.name}:${other.definition.side}`;domainConflicts.set(key,(domainConflicts.get(key)??0)+1);valid=false;break}next.push({...other,values})}
  if(!valid)continue
  selected.push(c);if(selected.length>bestSelected.length)bestSelected=[...selected]
  if(assign(next))return true;selected.pop()
 }
 return false
}
const solved=assign(definitions.map(d=>({definition:d,values:d.candidates})));
mkdirSync(directory,{recursive:true});writeFileSync(`${directory}/manual-helper.executed.mjs`,readFileSync('scripts/prepare-am3352-open-corridors-expanded-fanouts.mjs'))
writeFileSync(`${directory}/candidates.nonexportable.json`,JSON.stringify(definitions.map(d=>({...d,candidates:d.candidates.map(({definition,...c})=>c)})))+'\n')
const diagnostics=definitions.map(d=>({name:d.name,side:d.side,endpoint:d.endpoint,candidates:d.candidates.length,rawCandidates:d.rawCandidateCount,nearestMm:d.candidates[0]?.length??null,oldGuideCandidate:d.candidates.some(c=>c.fromOldGuide)}))
const report={status:solved?'ALL_MANUAL_FANOUTS_PLANNED_NATIVE_ROUTE_AND_ALL_CHECKS_REQUIRED':'MANUAL_FANOUT_ASSIGNMENT_INCOMPLETE',originalInput:artifact(inputPath),source:artifact(sourcePath),oldCommandGuide:artifact(oldPath),executionHelper:artifact(`${directory}/manual-helper.executed.mjs`),diagnostics,assignmentAttempts:attempts,searchLimitReached,searchSeconds:(performance.now()-searchStarted)/1000,prunedCandidates:pruned,compatibilityCacheEntries:compatibilityCache.size,bestPartialFanouts:bestSelected.map(c=>({name:c.definition.name,side:c.definition.side,via:c.via})),domainConflicts:[...domainConflicts.entries()].toSorted((a,b)=>b[1]-a[1]).slice(0,20).map(([endpoints,count])=>({endpoints,count})),selectedFanouts:selected.length,expectedFanouts:definitions.length,surfaceOnlyPrefixSearchRadius:4,gridMm:.02,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false}
if(solved){const staged=structuredClone(input),escapes=[];for(const s of selected){const toLayer='bottom';assert.equal(s.definition.endpoint.layer,'top');const route=[...s.points.map(p=>({route_type:'wire',x:p.x,y:p.y,layer:'top',width})),{route_type:'via',...s.via,from_layer:'top',to_layer:toLayer,layers:['top','inner1','inner2','bottom'],via_diameter:land,via_hole_diameter:drill},{route_type:'wire',...s.via,layer:toLayer,width}],trace={type:'pcb_trace',pcb_trace_id:`manual_${s.definition.owner}_${s.definition.side}`,source_trace_id:s.definition.owner,connection_name:s.definition.owner,route};escapes.push(trace);const connection=staged.connections.find(c=>c.name===s.definition.owner);connection.pointsToConnect[s.definition.side==='cpu'?0:1]={...s.via,layer:toLayer,pointId:trace.pcb_trace_id,sourcePcbPortId:s.definition.endpoint.pcb_port_id}}
 staged.traces.push(...escapes);const path=`${directory}/input.simple-route.json`;writeFileSync(path,JSON.stringify(staged)+'\n');report.input=artifact(path);const plan=`${directory}/manual-fanouts.nonexportable.json`;writeFileSync(plan,JSON.stringify({escapes,definitions:definitions.map(d=>({...d,candidates:d.candidates.map(({definition,...c})=>c)})),source:report.source,originalInput:report.originalInput,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false})+'\n');report.plan=artifact(plan)}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,attempts,diagnostics:diagnostics.map(d=>({name:d.name,side:d.side,candidates:d.candidates})),qualifiedNewDdrSignals:0}));process.exitCode=solved?0:1
