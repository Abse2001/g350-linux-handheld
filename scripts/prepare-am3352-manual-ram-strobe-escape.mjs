import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Manual RAM repair supplementing the checked native bus_lanes bootstrap.
// This is a conservative geometry preflight, not a physical DRC approval.
const [bootstrap,directory,pattern='long']=process.argv.slice(2)
assert(bootstrap&&directory&&['short','long','cross'].includes(pattern))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const report=read(`${bootstrap}/result.json`),input=read(report.input.path)
assert.equal(hash(report.source.path),report.source.sha256)
assert.equal(hash(report.input.path),report.input.sha256)
assert.equal(hash(report.checkedCpuChannelReuse.sections.path),report.checkedCpuChannelReuse.sections.sha256)
const source=read(report.source.path),native=read(report.checkedCpuChannelReuse.sections.path)
assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false)
assert.equal(input.traces.length,125);assert.equal(native.length,2)
assert.equal(source.filter(e=>e.type==='pcb_via').length,129)
const name='source_trace_28',width=.1016,clearance=.1016,guard=.003,land=.4572,drill=.254
const wire=(x,y,layer)=>({route_type:'wire',x,y,layer,width})
const via=(x,y,from_layer,to_layer)=>({route_type:'via',x,y,from_layer,to_layer,
  layers:['top','inner1','inner2','bottom'],via_diameter:land,via_hole_diameter:drill})
const route=pattern==='short'?[wire(1.6,-22.6,'top'),wire(1,-22.8,'top'),via(1,-22.8,'top','bottom'),wire(1,-22.8,'bottom')]:
  [wire(1.6,-22.6,'top'),wire(1.2,-23,'top'),wire(1.2,-25.4,'top'),via(1.2,-25.4,'top','bottom'),wire(1.2,-25.4,'bottom'),
    ...(pattern==='cross'?[wire(1.2,-25.8,'bottom'),wire(3.8,-25.8,'bottom'),via(3.8,-25.8,'bottom','top'),wire(3.8,-25.8,'top')]:[])]
const actual=input.connections.find(c=>c.name===name).pointsToConnect[1]
assert(Math.hypot(actual.x-route[0].x,actual.y-route[0].y)<1e-8);assert.equal(actual.layer,'top')
const shapes=[]
for(const o of input.obstacles)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,
  layers:o.layers,own:o.connectedTo?.includes(name),pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,
  label:o.circuitJsonMetadata?.source_port_name??o.circuitJsonMetadata?.pcb_via_id??'other'})
for(const t of [...input.traces,...native])for(let i=0;i<t.route.length;i++){
  const p=t.route[i],own=(t.source_trace_id??t.connection_name)===name
  if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,hole:p.via_hole_diameter,
    layers:['top','inner1','inner2','bottom'],own,label:t.pcb_trace_id})
  if(i){const a=t.route[i-1];if(Math.hypot(a.x-p.x,a.y-p.y)>1e-8)shapes.push({kind:'segment',a,b:p,
    w:Math.max(a.width??width,p.width??width),layers:[a.route_type==='wire'?a.layer:p.layer],own,label:t.pcb_trace_id})}
}
for(const v of source.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,
  hole:v.hole_diameter,layers:['top','inner1','inner2','bottom'],own:false,label:v.pcb_via_id})
const pointDistance=(s,x,y)=>{
  if(s.kind==='circle')return Math.hypot(x-s.x,y-s.y)-s.w/2
  if(s.kind==='rect')return Math.hypot(Math.max(0,Math.abs(x-s.x)-s.w/2),Math.max(0,Math.abs(y-s.y)-s.h/2))
  const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,f=Math.max(0,Math.min(1,((x-s.a.x)*dx+(y-s.a.y)*dy)/(dx*dx+dy*dy)))
  return Math.hypot(x-s.a.x-f*dx,y-s.a.y-f*dy)-s.w/2
}
const bounds=s=>s.kind==='segment'?[Math.min(s.a.x,s.b.x)-s.w/2,Math.max(s.a.x,s.b.x)+s.w/2,Math.min(s.a.y,s.b.y)-s.w/2,Math.max(s.a.y,s.b.y)+s.w/2]:
  [s.x-s.w/2,s.x+s.w/2,s.y-s.h/2,s.y+s.h/2]
const rb=[Math.min(...route.map(p=>p.x))-.6,Math.max(...route.map(p=>p.x))+.6,Math.min(...route.map(p=>p.y))-.6,Math.max(...route.map(p=>p.y))+.6]
const relevant=shapes.filter(s=>{const b=bounds(s);return b[0]<rb[1]&&b[1]>rb[0]&&b[2]<rb[3]&&b[3]>rb[2]})
const failures=[];let wireSamples=0
for(const p of route.filter(p=>p.route_type==='via'))for(const s of relevant){
  const d=pointDistance(s,p.x,p.y)
  if(!s.own&&d<land/2+clearance-1e-8)failures.push({kind:'via-copper',site:p,label:s.label})
  if(s.pad&&d<drill/2+.2-1e-8)failures.push({kind:'pad-hole',site:p,label:s.label})
  if(s.hole&&Math.hypot(p.x-s.x,p.y-s.y)<drill/2+s.hole/2+.254-1e-8)failures.push({kind:'hole-hole',site:p,label:s.label})
}
for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],length=Math.hypot(a.x-b.x,a.y-b.y)
  if(length<1e-8)continue
  const layer=a.route_type==='wire'?a.layer:b.layer,n=Math.ceil(length/.005)
  for(let j=0;j<=n;j++){
    const x=a.x+(b.x-a.x)*j/n,y=a.y+(b.y-a.y)*j/n;wireSamples++
    for(const s of relevant)if(!s.own&&s.layers.includes(layer)&&pointDistance(s,x,y)<width/2+clearance+guard-1e-8)
      failures.push({kind:'wire',segment:i,label:s.label})
  }
}
mkdirSync(directory,{recursive:true})
const preflight={status:failures.length?'MANUAL_RAM_ESCAPE_PREFLIGHT_FAIL':'MANUAL_RAM_ESCAPE_PREFLIGHT_PASS_PENDING_EXACT_REPLAY_DRC',
  wireSamplingStepMm:.005,wireSamplingGuardMm:guard,wireSamples,localShapesExamined:relevant.length,totalShapes:shapes.length,
  copperClearanceMm:clearance,padToHoleMm:.2,holeEdgeGapMm:.254,
  failures:[...new Map(failures.map(f=>[JSON.stringify(f),f])).values()]}
if(failures.length){writeFileSync(`${directory}/result.json`,JSON.stringify(preflight,null,2)+'\n');console.log(JSON.stringify(preflight));process.exit(1)}
const escape={type:'pcb_trace',pcb_trace_id:`local_dogbone_${name}_1`,source_trace_id:name,connection_name:name,route}
const inputPath=`${directory}/input.simple-route.json`,escapesPath=`${directory}/signal-escapes.native.json`
writeFileSync(inputPath,JSON.stringify(input)+'\n');writeFileSync(escapesPath,JSON.stringify([...native,escape])+'\n')
const next={...report,status:'CHECKED_CPU_CHANNEL_SECTIONS_WITH_GUARDED_MANUAL_RAM_ESCAPE',input:{path:inputPath,sha256:hash(inputPath)},preparedLocalEscapes:3,
  manualRamEscape:{sourceTraceId:name,pattern,fromActualRamPad:actual,preflight,
    bootstrap:{path:`${bootstrap}/result.json`,sha256:hash(`${bootstrap}/result.json`)},
    escapes:{path:escapesPath,sha256:hash(escapesPath)},authoredManually:true,nativeGenerated:false},fabricationReady:false}
writeFileSync(`${directory}/result.json`,JSON.stringify(next,null,2)+'\n')
console.log(JSON.stringify({status:next.status,manualRamEscape:next.manualRamEscape}))
