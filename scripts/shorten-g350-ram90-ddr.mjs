import fs from 'node:fs'
import assert from 'node:assert/strict'
import * as checks from '@tscircuit/checks'
import {routeGuardedOuterBridge} from './lib/am3352-command-terminal-bridge.mjs'
import {g350DdrPhysicalChecks} from './lib/g350-ddr-physical-checks.mjs'

const [inputPath,root,signal='DDR_DQS1']=process.argv.slice(2)
assert(inputPath&&root&&!fs.existsSync(root));fs.mkdirSync(root)
const read=p=>JSON.parse(fs.readFileSync(p))
const circuit=read(inputPath),input=read('dist/g350-ram90-float-safe-source-replay-01/phase-0.input.simple-route.json')
// Keep the planner within this already checked DDR region. Actual board-edge
// checks below still use the complete source outline.
input.bounds={minX:-18,maxX:18,minY:-10,maxY:33}
const names=new Map(circuit.filter(r=>r.type==='source_trace').map(r=>[r.source_trace_id,r.name]))
const target=circuit.find(r=>r.type==='pcb_trace'&&names.get(r.source_trace_id)===signal);assert(target)
const original=structuredClone(target.route)
const first=original.findIndex(p=>p.route_type==='via'),last=original.findLastIndex(p=>p.route_type==='via');assert(first>=0&&last>first)
const length=r=>r.slice(1).reduce((n,p,i)=>n+(p.route_type==='via'?1.6:0)+(p.route_type==='wire'&&r[i].route_type==='wire'&&p.layer===r[i].layer?Math.hypot(p.x-r[i].x,p.y-r[i].y):0),0)
const physicalChecks=g350DdrPhysicalChecks
const endpoints=[original[first],original[last]]
const oldVias=circuit.filter(r=>r.type==='pcb_via'&&r.pcb_trace_id===target.pcb_trace_id)
const interior=oldVias.filter(v=>!endpoints.some(p=>Math.hypot(p.x-v.x,p.y-v.y)<1e-8))
for(const v of interior)circuit.splice(circuit.indexOf(v),1)
const attempts=[];let accepted=false
for(const layers of [['inner1','inner2'],['inner1','bottom'],['inner2','bottom'],['inner1','top'],['inner2','top'],['top','bottom']]){
 const connection={name:target.source_trace_id,pointsToConnect:endpoints.map(p=>({x:p.x,y:p.y,layer:layers[0]}))}
 const shapes=input.obstacles.map(o=>({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers.filter(l=>layers.includes(l)),pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:o.connectedTo?.find(n=>n===target.source_trace_id)}))
 for(const t of circuit.filter(r=>r.type==='pcb_trace')){
  const route=t===target?[...original.slice(0,first+1),...original.slice(last)]:t.route
  for(let i=0;i<route.length;i++){
   const p=route[i],q=route[i-1],owner=t.source_trace_id
   if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:.4572,h:.4572,hole:.254,layers,owner})
   // The two separate target escapes must never become a synthetic obstacle segment.
   if(t===target&&i===first+1)continue
   if(q&&p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer&&Math.hypot(p.x-q.x,p.y-q.y)>1e-8)shapes.push({kind:'segment',a:q,b:p,w:.1016,layers:layers.includes(p.layer)?[p.layer]:[],owner})
  }
 }
 const result=routeGuardedOuterBridge({connection,shapes,searchBounds:input.bounds,seconds:30,gridMm:.02,maxVias:4,viaGrid:.04,routingLayers:layers,viaCopperClearance:.15})
 let errors=[],candidateLength=null
 if(result.route){
  const head=structuredClone(original.slice(0,first+1)),tail=structuredClone(original.slice(last))
  head.at(-1).to_layer=result.route[0].layer;tail[0].from_layer=result.route.at(-1).layer
  target.route=[...head,...result.route,...tail]
  // Match exact coordinates at existing barrel landings; the grid planner can
  // otherwise leave a microscopic reversed segment beside a terminal via.
  for(let i=0;i<target.route.length;i++)if(target.route[i].route_type==='via')for(const j of [i-1,i+1]){
   const p=target.route[j],v=target.route[i]
   if(p?.route_type==='wire'&&Math.hypot(p.x-v.x,p.y-v.y)<1e-8){p.x=v.x;p.y=v.y}
  }
  const vias=result.route.filter(p=>p.route_type==='via').map((v,i)=>({type:'pcb_via',pcb_via_id:`shortened_${target.pcb_trace_id}_${i}`,pcb_trace_id:target.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:target.subcircuit_id}))
  circuit.push(...vias);candidateLength=length(target.route)
  errors=physicalChecks.flatMap(n=>checks[n](circuit).map(e=>({check:n,...e})))
  if(errors.length&&errors.every(e=>String(e.pcb_trace_error_id??e.pcb_trace_self_short_error_id??'').includes('self_short')||e.check==='checkPcbTraceSelfShorts'))
   fs.writeFileSync(`${root}/self-short-attempt-${attempts.length}.circuit.json`,JSON.stringify(circuit,null,2)+'\n')
  if(!errors.length&&candidateLength<length(original)-.1)accepted=true
  else {circuit.splice(circuit.length-vias.length,vias.length);target.route=original}
 }
 attempts.push({layers,accepted,originalLengthMm:length(original),candidateLengthMm:candidateLength,error:result.error,physicalErrors:errors});console.log(JSON.stringify({...attempts.at(-1),physicalErrors:errors.length}))
 if(accepted)break
}
if(!accepted)circuit.push(...interior)
assert(physicalChecks.every(n=>checks[n](circuit).length===0))
fs.writeFileSync(`${root}/candidate.circuit.json`,JSON.stringify(circuit,null,2)+'\n')
fs.writeFileSync(`${root}/attempts.json`,JSON.stringify(attempts,null,2)+'\n')
fs.writeFileSync(`${root}/native-skew-errors.json`,JSON.stringify(checks.checkPcbBusLengthSkew(circuit),null,2)+'\n')
fs.writeFileSync(`${root}/shortener.executed.mjs`,fs.readFileSync('scripts/shorten-g350-ram90-ddr.mjs'))
