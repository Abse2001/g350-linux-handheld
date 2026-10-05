import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Edit only the two completed native channel carriers. Components, real
// pads, prior DDR/USB copper, local fanouts and all holes stay fixed.
const [priorDirectory,directory]=process.argv.slice(2);assert(priorDirectory&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${priorDirectory}/result.json`)
assert.equal(prior.status,'GUIDED_NATIVE_CHANNEL_ROUTED_UNQUALIFIED');assert.equal(prior.mode,'connectivity-bootstrap')
for(const a of [prior.source,prior.channel.input,prior.output,prior.nativeBootstrap])assert.equal(hash(a.path),a.sha256)
const input=read(prior.channel.input.path),output=read(prior.output.path),source=read(prior.source.path)
assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces)
assert.equal(input.connections.length,2);assert.equal(output.traces.length,input.traces.length+2)
assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false)
const ids=['source_trace_27','source_trace_28']
assert.deepEqual(new Set(input.connections.map(c=>c.name)),new Set(ids))
const length=r=>r.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-r[i].x,p.y-r[i].y),0)
const fixed=n=>input.traces.filter(t=>(t.source_trace_id??t.connection_name)===n).reduce((s,t)=>s+length(t.route),0)
const beforeFixed=ids.map(fixed),delta=beforeFixed[0]-beforeFixed[1];assert(delta>0&&delta<5)
const wire=(x,y)=>({route_type:'wire',x,y,layer:'top',width:.1016})
const carriers=ids.map(n=>{
  const c=input.connections.find(c=>c.name===n),[a,b]=c.pointsToConnect
  assert(a.layer==='top'&&b.layer==='top'&&Math.abs(a.x-b.x)<1e-8)
  assert.equal(a.y,-10.5);assert.equal(b.y,-18)
  return [wire(a.x,a.y),wire(b.x,b.y)]
})
assert(Math.abs(carriers[0][0].x-12.32)<1e-8&&Math.abs(carriers[1][0].x-12)<1e-8)
const teeth=4,height=.32,pitch=.56,chamfer=.04,startY=-12.2
const amplitude=(delta+4*teeth*chamfer*(2-Math.SQRT2))/(2*teeth)
const points=[],x=12
for(let i=0;i<teeth;i++){
  const y=startY-i*pitch,left=x-amplitude
  points.push(wire(x,y+chamfer),wire(x-chamfer,y),wire(left+chamfer,y),wire(left,y-chamfer),
    wire(left,y-height+chamfer),wire(left+chamfer,y-height),wire(x-chamfer,y-height),wire(x,y-height-chamfer))
}
carriers[1]=[carriers[1][0],...points,carriers[1][1]]
const totals=ids.map((n,i)=>fixed(n)+length(carriers[i]));assert(Math.abs(totals[0]-totals[1])<1e-7)
assert(totals.every(l=>l>=50.53587956&&l<=51.17087957))
const shapes=[],clearance=.1016,guard=.008
for(const o of input.obstacles)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,
  w:o.width,h:o.height,layers:o.layers,owners:o.connectedTo??[]})
const addTrace=t=>{
  const owner=t.source_trace_id??t.connection_name
  for(const [i,p] of t.route.entries()){
    if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,layers:['top','bottom'],owners:[owner]})
    if(i){const a=t.route[i-1],b=p
      if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8&&!(a.route_type==='wire'&&b.route_type==='wire'&&a.layer!==b.layer))
        shapes.push({kind:'segment',a,b,w:Math.max(a.width??.1016,b.width??.1016),layers:[a.route_type==='wire'?a.layer:b.layer],owners:[owner]})
    }
  }
}
input.traces.forEach(addTrace)
for(const [i,n] of ids.entries())addTrace({source_trace_id:n,route:carriers[i]})
const distance=(s,p)=>{
  if(s.kind==='circle')return Math.hypot(p.x-s.x,p.y-s.y)-s.w/2
  if(s.kind==='rect')return Math.hypot(Math.max(0,Math.abs(p.x-s.x)-s.w/2),Math.max(0,Math.abs(p.y-s.y)-s.h/2))
  const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,f=Math.max(0,Math.min(1,((p.x-s.a.x)*dx+(p.y-s.a.y)*dy)/(dx*dx+dy*dy)))
  return Math.hypot(p.x-s.a.x-f*dx,p.y-s.a.y-f*dy)-s.w/2
}
let samplesChecked=0
for(const [i,n] of ids.entries())for(let k=1;k<carriers[i].length;k++){
  const a=carriers[i][k-1],b=carriers[i][k],samples=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/.005))
  for(let j=0;j<=samples;j++){
    const p={x:a.x+(b.x-a.x)*j/samples,y:a.y+(b.y-a.y)*j/samples}
    assert(p.x>=-17.5&&p.x<=17.5&&p.y>=-38.5&&p.y<=9.5)
    for(const s of shapes)if(s.layers.includes('top')&&!s.owners.includes(n))
      assert(distance(s,p)>=.1016/2+clearance+guard,`Manual channel clearance: ${n} at ${p.x},${p.y}`)
    samplesChecked++
  }
}
const old=output.traces.slice(input.traces.length).map(t=>({name:t.source_trace_id,lengthMm:length(t.route)}))
for(const [i,n] of ids.entries()){
  const t=output.traces.slice(input.traces.length).find(t=>t.source_trace_id===n);assert(t)
  t.route=carriers[i]
}
mkdirSync(directory,{recursive:true})
const path=`${directory}/output.simple-route.json`;writeFileSync(path,JSON.stringify(output)+'\n')
const report={...prior,status:'GUIDED_NATIVE_CHANNEL_WITH_MANUAL_STROBE_REPAIR_PENDING_SOURCE_CHECKS',
  priorNativeBootstrap:{path:`${priorDirectory}/result.json`,sha256:hash(`${priorDirectory}/result.json`)},
  nativeRoutingBootstrap:prior.output,output:{path,sha256:hash(path)},
  manualModification:{kind:'SHORTENED_NATIVE_STROBE_CARRIERS_AND_TUNED_POSITIVE_CHANNEL',
    sourceTraceIds:ids,unchangedPrefixTracePieces:input.traces.length,newHoles:0,
    oldCarrierLengths:old,newCarrierLengths:ids.map((n,i)=>({name:n,lengthMm:length(carriers[i])})),
    fixedLengths:beforeFixed,totalPlanarLengths:totals,teeth,height,pitch,chamfer,amplitude,samplesChecked,
    sampledClearanceMm:clearance,wireSamplingGuardMm:guard,independentSourceAndPhysicalChecksRequired:true},
  channel:{...prior.channel,manuallyCompleted:true},partialBootstrap:prior.output,
  fabricationReady:false,timingQualified:false,pairGeometryQualified:false}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,totals,skewMm:Math.abs(totals[0]-totals[1]),samplesChecked}))
