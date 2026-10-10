// Actual-board negative controls for the incremental planning validator.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {createG350PlanarPlanningValidator} from './lib/g350-ddr-planar-planning-validator.mjs'
const [input,output]=process.argv.slice(2)
assert(input&&output&&!fs.existsSync(output))
const circuit=JSON.parse(fs.readFileSync(input)).filter(e=>!e.type.includes('error'))
const validator=createG350PlanarPlanningValidator(circuit)
const source=circuit.find(e=>e.type==='source_trace'&&e.name==='DDR_D6')
const original=circuit.find(e=>e.type==='pcb_trace'&&e.source_trace_id===source.source_trace_id)
assert(validator.validate(circuit,original),'Valid baseline must be accepted')
const controls=[]
for(const kind of ['via','pad','foreign-trace']){
 const c=structuredClone(circuit),t=c.find(e=>e.pcb_trace_id===original.pcb_trace_id)
 let x,y,layer
 if(kind==='via'){
  const v=c.find(e=>e.type==='pcb_via'&&e.pcb_trace_id!==t.pcb_trace_id)
  ;({x,y}=v);layer='inner1'
 }else if(kind==='pad'){
  const p=c.find(e=>e.type==='pcb_smtpad'&&e.pcb_component_id!==c.find(e=>e.type==='pcb_port'&&e.source_port_id===source.connected_source_port_ids[0])?.pcb_component_id&&Number.isFinite(e.x)&&Number.isFinite(e.y))
  assert(p);({x,y}=p);layer=p.layer
 }else{
  const foreign=c.find(e=>e.type==='pcb_trace'&&e.source_trace_id!==t.source_trace_id&&e.route.some((p,i,r)=>i>0&&p.route_type==='wire'&&r[i-1].route_type==='wire'&&p.layer===r[i-1].layer&&Math.hypot(p.x-r[i-1].x,p.y-r[i-1].y)>.5))
  const i=foreign.route.findIndex((p,i,r)=>i>0&&p.route_type==='wire'&&r[i-1].route_type==='wire'&&p.layer===r[i-1].layer&&Math.hypot(p.x-r[i-1].x,p.y-r[i-1].y)>.5)
  const a=foreign.route[i-1],b=foreign.route[i];x=(a.x+b.x)/2;y=(a.y+b.y)/2;layer=b.layer
 }
 assert(Number.isFinite(x)&&Number.isFinite(y)&&layer)
 t.route=[{route_type:'wire',x:x-.2,y:y-.2,layer,width:.1016},{route_type:'wire',x:x+.2,y:y+.2,layer,width:.1016}]
 const accepted=validator.validate(c,t),counts=validator.complete(c)
 assert.equal(accepted,false,`${kind} collision must be rejected`)
 assert(Object.values(counts).some(n=>n>0),'Full native checks must independently reject bad geometry')
 controls.push({kind,incrementalAccepted:accepted,completeCounts:counts})
}
for(const type of ['pcb_via','pcb_smtpad','pcb_component']){
 const c=structuredClone(circuit),element=c.find(e=>e.type===type)
 const position=type==='pcb_component'?element.center:element
 assert(Number.isFinite(position.x));position.x+=.001
 assert.throws(()=>validator.assertImmutable(c))
 controls.push({kind:`immutable-${type}`,mutationRejected:true})
}
fs.writeFileSync(output,JSON.stringify({input,inputSha256:createHash('sha256').update(fs.readFileSync(input)).digest('hex'),baselineAccepted:true,controls,passed:true},null,2)+'\n')
console.log(JSON.stringify({passed:true,controls:controls.length,output}))
