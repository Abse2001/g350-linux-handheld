import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [directory,priorLayoutPath,destination]=process.argv.slice(2);assert(directory&&priorLayoutPath&&destination)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const report=read(`${directory}/result.json`),source=read(report.source.path),output=read(report.output.path),input=read(report.input.path)
for(const a of [report.source,report.output,report.input])assert.equal(hash(a.path),a.sha256)
assert.equal(report.status,'NATIVE_USB_CONTROL_ROUTED_PENDING_PHYSICAL_CHECKS')
assert.equal(output.traces.length,report.sourceTracesRetained+1)
const t=output.traces.at(-1),definition=report.definition,near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
assert(input.connections[0].pointsToConnect.every(p=>[t.route[0],t.route.at(-1)].some(q=>near(p,q)&&p.layer===q.layer)))
const layout=read(priorLayoutPath);assert(!layout.traces.some(t=>t.name===definition.name))
const name=definition.from.startsWith('.')?/^\.([^ >]+)/.exec(definition.from)[1]:definition.from.split('.')[0]
const v=[...layout.groundVias,...layout.powerVias].find(v=>v.name===name)
let center,angle=0
if(v)center={x:v.x,y:v.y}
else{
  const sc=source.find(c=>c.type==='source_component'&&c.name===name);assert(sc)
  const pc=source.find(c=>c.type==='pcb_component'&&c.source_component_id===sc.source_component_id);assert(pc)
  assert.equal(pc.position_mode,'relative_to_group_anchor')
  center={x:pc.display_offset_x,y:pc.display_offset_y};angle=pc.rotation*Math.PI/180
}
const cos=Math.cos(angle),sin=Math.sin(angle)
const globalPoints=t.route.map(p=>{
  if(p.route_type==='via')return {x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}
  assert.equal(p.route_type,'wire');assert(['top','bottom'].includes(p.layer));assert.equal(p.width,definition.width)
  return {x:p.x,y:p.y}
})
const points=globalPoints.map(p=>({...p,x:cos*(p.x-center.x)+sin*(p.y-center.y),y:-sin*(p.x-center.x)+cos*(p.y-center.y)}))
layout.traces.push({name:definition.name,from:definition.from,to:definition.to,width:definition.width,
  points,globalPoints,provenance:'native bus_lanes pipeline control phase'})
const priorProvenancePath=priorLayoutPath.replace(/\.json$/,'.provenance.json')
const previous=read(priorProvenancePath)
writeFileSync(destination,JSON.stringify(layout,null,2)+'\n')
writeFileSync(destination.replace(/\.json$/,'.provenance.json'),JSON.stringify({
  priorLayout:{path:priorLayoutPath,sha256:hash(priorLayoutPath)},priorProvenance:{path:priorProvenancePath,sha256:hash(priorProvenancePath)},
  source:report.source,nativeControlRun:{path:`${directory}/result.json`,sha256:hash(`${directory}/result.json`)},
  nativeCcRun:previous.nativeCcRun,nativePairRun:previous.nativePairRun,
  layout:{path:destination,sha256:hash(destination)},phase:report.phase,signal:definition.name,
  fullPoweredHostQualified:false,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({signal:definition.name,inlineVias:globalPoints.filter(p=>p.via).length,destination}))
