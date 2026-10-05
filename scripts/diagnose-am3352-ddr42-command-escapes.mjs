import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const inputPath='dist/am3352-command-fine-782-native-phase-attempt-783/phase-3.input.simple-route.json',sourcePath='dist/diagnostics/am3352-command-fine-782-replay-candidate/circuit.json'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),input=read(inputPath),source=read(sourcePath),width=.1016,gap=.1016,land=.4572,drill=.254
assert.equal(input.layerCount,4);assert.equal(input.traces.length,source.filter(e=>e.type==='pcb_trace').length);assert(input.connections.length>0&&input.connections.length<=26);const ids=new Set(source.filter(e=>e.type==='source_trace'&&/^DDR_/.test(e.name)).map(e=>e.source_trace_id)),names=new Map(source.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e.name])),ownerByKey=new Map(source.filter(e=>e.type==='source_trace'&&ids.has(e.source_trace_id)).map(e=>[e.subcircuit_connectivity_map_key,e.source_trace_id]));const shapes=[]
for(const o of input.obstacles){const layers=o.layers.filter(l=>['top','bottom'].includes(l));if(!layers.length)continue;shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers,pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:ownerByKey.get(source.find(v=>v.type==='pcb_via'&&v.pcb_via_id===o.circuitJsonMetadata?.pcb_via_id)?.subcircuit_connectivity_map_key)??o.connectedTo?.find(n=>ids.has(n))})}
for(const v of source.filter(e=>e.type==='pcb_via'||e.type==='pcb_plated_hole'))if(v.x!==undefined)shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter??v.outer_width,h:v.outer_diameter??v.outer_height,hole:v.hole_diameter,layers:['top','bottom'],owner:ownerByKey.get(v.subcircuit_connectivity_map_key)})
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

const staged=new Set(source.filter(e=>e.type==='pcb_trace'&&/^DDR_(A[0-9]+|BA[0-9]+|CASn|RASn|WEn|CSn0|CKE|ODT)$/.test(names.get(e.source_trace_id))).map(t=>t.source_trace_id))
assert.equal(staged.size,17)
const soft=s=>!s.pad&&staged.has(s.owner)
const violations=(points,p,endpoint,owner)=>{
 const rejected=[]
 for(const s of nearby(p))if((s.hole&&Math.hypot(p.x-s.x,p.y-s.y)<drill/2+s.hole/2+.254-1e-8)||(s.pad&&pointDistance(p,s)<drill/2+.2-1e-8)||(s.owner!==owner&&pointDistance(p,s)<land/2+gap-1e-8))rejected.push(s)
 for(let k=1;k<points.length;k++)for(const s of nearby(points[k-1],points[k]))if(s.layers.includes(endpoint.layer)&&!(s.pad&&s.owner===owner&&near(s,endpoint))&&segmentDistance(points[k-1],points[k],s)<width/2+gap-1e-8)rejected.push(s)
 return rejected
}
const diagnostics=[]
for(const c of input.connections)for(const [side,endpoint] of c.pointsToConnect.entries()){
 const options=[];let hardBlockedCorners=0
 for(const sx of [-1,1])for(const sy of [-1,1])for(let ix=18;ix<=24;ix++)for(let iy=18;iy<=24;iy++){
  const p={x:Number((endpoint.x+sx*ix*.02).toFixed(8)),y:Number((endpoint.y+sy*iy*.02).toFixed(8))},delta=Math.min(ix,iy)*.02,mid={x:endpoint.x+sx*delta,y:endpoint.y+sy*delta},points=[endpoint,...(!near(mid,p)?[mid]:[]),p],blocked=violations(points,p,endpoint,c.name)
  if(blocked.some(s=>!soft(s))){hardBlockedCorners++;continue}
  const owners=[...new Set(blocked.map(s=>names.get(s.owner)))].sort();options.push({via:p,stagedPathsToReplan:owners,pathLengthMm:length(points)})
 }
 options.sort((a,b)=>a.stagedPathsToReplan.length-b.stagedPathsToReplan.length||a.pathLengthMm-b.pathLengthMm)
 const unique=[...new Map(options.map(o=>[o.stagedPathsToReplan.join(','),o])).values()].sort((a,b)=>a.stagedPathsToReplan.length-b.stagedPathsToReplan.length||a.pathLengthMm-b.pathLengthMm)
 diagnostics.push({name:names.get(c.name),sourceTraceId:c.name,side:side?'ram':'cpu',endpoint,checkedImmediateSites:196,hardBlockedSites:hardBlockedCorners,minimumStagedPathsToReplan:options[0]?.stagedPathsToReplan.length??null,bestReplanOptions:unique.slice(0,6),exactDistanceDiagnosticOnly:true})
}
const report={status:'DDR42_IMMEDIATE_FANOUT_BLOCKING_PATHS_IDENTIFIED_REPLAN_REQUIRED',source:artifact(sourcePath),phaseInput:artifact(inputPath),executionHelper:artifact('scripts/diagnose-am3352-ddr42-command-escapes.mjs'),copperLayers:4,traceWidthMm:width,clearanceMm:gap,throughViaLandMm:land,throughDrillMm:drill,minimumDrillToPadMm:.2,minimumDrillToDrillMm:.254,hardSourcePadsAndDataClockReferenceCopperRetained:true,diagnostics,scope:'Exact local capsule/rectangle and through-hole clearance. Only already staged, unqualified command paths may be opened; data/reset/clock/reference/USB and all physical pads remain hard. Farther escapes and global routability are not proved.',qualifiedNewDdrSignals:0,fabricationReady:false}
writeFileSync('checks/integrated/am3352-command-fine-782-replay-escape-obstruction.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(diagnostics.map(d=>({name:d.name,side:d.side,minimumMoves:d.minimumStagedPathsToReplan,replanOptions:d.bestReplanOptions.slice(0,2).map(o=>o.stagedPathsToReplan)}))))
