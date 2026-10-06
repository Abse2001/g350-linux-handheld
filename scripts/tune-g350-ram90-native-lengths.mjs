import fs from 'node:fs'
import assert from 'node:assert/strict'
import * as checks from '@tscircuit/checks'
const [root,secondsArg='180']=process.argv.slice(2);assert(root&&!fs.existsSync(root));fs.mkdirSync(root)
const circuit=JSON.parse(fs.readFileSync('dist/g350-ram90-float-safe-source-replay-01/compiled.circuit.json'))
for(let i=circuit.length-1;i>=0;i--)if(circuit[i].type.includes('error'))circuit.splice(i,1)
for(const t of circuit.filter(r=>r.type==='pcb_trace'))delete t.trace_length
const preparation=JSON.parse(fs.readFileSync('dist/g350-ram90-four-layer-manual-02/preparation.json'))
const signals=new Map(circuit.filter(r=>r.type==='source_trace').map(r=>[r.source_trace_id,r.name]))
const traces=circuit.filter(r=>r.type==='pcb_trace')
const length=r=>r.slice(1).reduce((n,p,i)=>n+(p.route_type==='via'?1.6:0)+(p.route_type==='wire'&&r[i].route_type==='wire'&&p.layer===r[i].layer?Math.hypot(p.x-r[i].x,p.y-r[i].y):0),0)
const groups=[{name:'DDR_BYTE0',names:[...Array.from({length:8},(_,i)=>`DDR_D${i}`),'DDR_DQM0','DDR_DQS0','DDR_DQSn0']},{name:'DDR_BYTE1',names:[...Array.from({length:8},(_,i)=>`DDR_D${i+8}`),'DDR_DQM1','DDR_DQS1','DDR_DQSn1']},{name:'DDR_COMMAND_CLOCK',names:[...signals.values()].filter(n=>/^DDR_/.test(n??'')&&!/^DDR_D/.test(n)&&n!=='DDR_RESETn')}]
const deadline=Date.now()+Number(secondsArg)*1000,attempts=[]
for(const group of groups){
 const members=traces.filter(t=>group.names.includes(signals.get(t.source_trace_id)))
 group.target=Math.max(...members.map(t=>length(t.route)))
 members.sort((a,b)=>{const rank=t=>/DQS|DQSn|^DDR_CK[n]?$/.test(signals.get(t.source_trace_id))?-100:0;return rank(a)-rank(b)||length(a.route)-length(b.route)})
 for(const trace of members){
  const original=structuredClone(trace.route),delta=group.target-length(original)
  if(delta<=.05)continue
  let found=false,tries=0
  const segments=original.slice(0,-1).map((a,i)=>({a,b:original[i+1],i})).filter(s=>s.a.route_type==='wire'&&s.b.route_type==='wire'&&s.a.layer===s.b.layer&&Math.hypot(s.a.x-s.b.x,s.a.y-s.b.y)>1).sort((a,b)=>Number(b.a.layer.startsWith('inner'))-Number(a.a.layer.startsWith('inner'))||Math.hypot(b.a.x-b.b.x,b.a.y-b.b.y)-Math.hypot(a.a.x-a.b.x,a.a.y-a.b.y))
  search:for(const {a,b,i}of segments)for(const teeth of [1,2,3,4,6,8])for(const sign of [1,-1]){
   if(Date.now()>deadline)break search
   const span=Math.hypot(b.x-a.x,b.y-a.y),h=delta/(2*teeth),pitch=.8*span/teeth
   if(h<.22||pitch/2<.22)continue
   const ux=(b.x-a.x)/span,uy=(b.y-a.y)/span,nx=-uy*sign,ny=ux*sign
   const point=(d,height=0)=>({route_type:'wire',x:a.x+ux*d+nx*height,y:a.y+uy*d+ny*height,layer:a.layer,width:.1016})
   const replacement=[]
   for(let j=0;j<teeth;j++){const d=.1*span+j*pitch;replacement.push(point(d),point(d,h),point(d+pitch/2,h),point(d+pitch/2))}
   trace.route=[...original.slice(0,i+1),...replacement,...original.slice(i+1)]
   assert(Math.abs(length(trace.route)-group.target)<1e-7)
   tries++
   if(preparation.physicalChecks.every(name=>checks[name](circuit).length===0)){found=true;break search}
  }
  if(!found&&delta>3.65){
   alternate:for(const {a,b,i}of segments)for(const layer of ['inner1','inner2','top','bottom'].filter(l=>l!==a.layer))for(const sign of [1,-1]){
    if(Date.now()>deadline)break alternate
    const span=Math.hypot(b.x-a.x,b.y-a.y),h=(delta-3.2)/2
    const ux=(b.x-a.x)/span,uy=(b.y-a.y)/span,nx=-uy*sign,ny=ux*sign
    const point=(d,height=0,l=layer)=>({route_type:'wire',x:a.x+ux*d+nx*height,y:a.y+uy*d+ny*height,layer:l,width:.1016})
    const v1=point(.1*span),v2=point(.9*span)
    const via=(v,from_layer,to_layer)=>({route_type:'via',x:v.x,y:v.y,from_layer,to_layer,via_diameter:.4572,via_hole_diameter:.254})
    trace.route=[...original.slice(0,i+1),point(.1*span,0,a.layer),via(v1,a.layer,layer),v1,point(.1*span,h),point(.9*span,h),v2,via(v2,layer,a.layer),point(.9*span,0,a.layer),...original.slice(i+1)]
    assert(Math.abs(length(trace.route)-group.target)<1e-7)
    const newVias=[v1,v2].map((v,j)=>({type:'pcb_via',pcb_via_id:`tuned_${trace.pcb_trace_id}_${j}`,pcb_trace_id:trace.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:trace.subcircuit_id}))
    circuit.push(...newVias);tries++
    if(preparation.physicalChecks.every(name=>checks[name](circuit).length===0)){found=true;break alternate}
    circuit.splice(circuit.length-2,2)
   }
  }
  if(!found)trace.route=original
  attempts.push({name:signals.get(trace.source_trace_id),matched:found,targetMm:group.target,actualMm:length(trace.route),tries})
  console.log(JSON.stringify(attempts.at(-1)))
 }
}
const report={groups:groups.map(g=>{const values=traces.filter(t=>g.names.includes(signals.get(t.source_trace_id))).map(t=>({name:signals.get(t.source_trace_id),lengthMm:length(t.route)}));return {...g,values,skewMm:Math.max(...values.map(v=>v.lengthMm))-Math.min(...values.map(v=>v.lengthMm)),limitMm:.635}}),attempts,nativeLengthIncludesFullViaThicknessMm:1.6,fullElectricalTimingQualified:false,fabricationReady:false}
fs.writeFileSync(`${root}/candidate.circuit.json`,JSON.stringify(circuit,null,2)+'\n')
fs.writeFileSync(`${root}/timing-report.json`,JSON.stringify(report,null,2)+'\n')
fs.writeFileSync(`${root}/tuner.executed.mjs`,fs.readFileSync('scripts/tune-g350-ram90-native-lengths.mjs'))
