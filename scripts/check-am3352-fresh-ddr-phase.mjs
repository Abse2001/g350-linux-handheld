import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [sourcePath,nativeDirectory,pathsPath,reportPath]=process.argv.slice(2);assert(sourcePath&&nativeDirectory&&pathsPath&&reportPath)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const run=read(`${nativeDirectory}/result.json`),source=read(sourcePath),previous=read(run.source.path)
for(const a of [run.source,run.input,run.output,run.connectionMap])assert.equal(hash(a.path),a.sha256)
assert.equal(run.status,'NATIVE_DDR_PHASE_ROUTED_PENDING_PHYSICAL_CHECKS');assert.equal(run.mode,'full')
assert.equal(source.filter(e=>e.type.endsWith('_error')).length,0)
const type=(c,t)=>c.filter(e=>e.type===t),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
assert.equal(type(source,'pcb_board')[0].num_layers,4)
for(const t of ['source_component','source_port','source_net','source_trace','source_bus','pcb_component','pcb_smtpad','pcb_plated_hole','pcb_keepout'])
  assert.deepEqual(type(source,t),type(previous,t),`Preserve every ${t}`)
const geometry=t=>t.route.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
for(const old of type(previous,'pcb_trace')){
  const current=type(source,'pcb_trace').find(t=>t.source_trace_id===old.source_trace_id);assert(current)
  assert.deepEqual(geometry(current),geometry(old),`Changed existing copper: ${old.source_trace_id}`)
}
for(const old of type(previous,'pcb_via')){
  const current=type(source,'pcb_via').find(v=>near(v,old));assert(current,'Missing prior drill')
  for(const key of ['outer_diameter','hole_diameter','source_net_id'])assert.equal(current[key],old[key])
  assert.deepEqual(new Set(current.layers),new Set(old.layers))
}
const input=read(run.input.path),output=read(run.output.path),paths=read(pathsPath),lengths=[]
assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces)
for(const d of run.definitions){
  const native=output.traces.slice(input.traces.length).find(t=>t.source_trace_id===d.sourceTraceId);assert(native)
  const current=type(source,'pcb_trace').find(t=>t.source_trace_id===d.sourceTraceId);assert(current)
  assert.equal(current.route.length,native.route.length+2)
  assert(near(current.route[0],d.pointsToConnect[0])&&near(current.route.at(-1),d.pointsToConnect[1]))
  assert.equal(paths[d.name].length,native.route.length)
  for(const [i,p] of native.route.entries()){
    const q=current.route[i+1];assert(near(p,q));assert.equal(p.route_type,q.route_type)
    if(p.route_type==='via'){
      assert.equal(q.from_layer,p.from_layer);assert.equal(q.to_layer,p.to_layer)
    }else{
      assert.equal(q.layer,p.layer);assert.equal(q.width,.1016);assert(['top','bottom'].includes(q.layer))
    }
  }
  const planar=current.route.reduce((s,p,i,a)=>i?s+Math.hypot(p.x-a[i-1].x,p.y-a[i-1].y):s,0)
  lengths.push({name:d.name,planarMm:planar,throughVias:current.route.filter(p=>p.route_type==='via').length})
}
assert.equal(type(source,'pcb_trace').length,type(previous,'pcb_trace').length+run.definitions.length)
const newVias=lengths.reduce((s,l)=>s+l.throughVias,0)
assert.equal(type(source,'pcb_via').length,type(previous,'pcb_via').length+newVias)
let minimumHoleEdgeGapMm=Infinity
const vias=type(source,'pcb_via')
for(const [i,v] of vias.entries()){
  assert.equal(v.outer_diameter,.4572);assert.equal(v.hole_diameter,.254)
  assert.deepEqual(new Set(v.layers),new Set(['top','inner1','inner2','bottom']))
  for(const w of vias.slice(0,i)){
    const gap=Math.hypot(v.x-w.x,v.y-w.y)-.254;minimumHoleEdgeGapMm=Math.min(minimumHoleEdgeGapMm,gap)
    assert(gap>=.254-1e-8,'Duplicate or too-close holes')
  }
}
const skewMm=Math.max(...lengths.map(l=>l.planarMm))-Math.min(...lengths.map(l=>l.planarMm))
if(['clock','strobe'].includes(run.selection))assert(skewMm<=.127+1e-6)
const report={status:'FRESH_NATIVE_DDR_PHASE_SOURCE_GEOMETRY_AND_PLANAR_MATCH_PASS_PHYSICAL_CHECKS_REQUIRED',
  source:{path:sourcePath,sha256:hash(sourcePath)},previousSource:run.source,
  nativeRun:{path:`${nativeDirectory}/result.json`,sha256:hash(`${nativeDirectory}/result.json`)},
  paths:{path:pathsPath,sha256:hash(pathsPath)},selection:run.selection,copperLayers:4,
  components:type(source,'source_component').length,actualPads:type(source,'pcb_smtpad').length,
  sourceTracePieces:type(source,'pcb_trace').length,sourceThroughVias:vias.length,
  priorTracePiecesPreserved:type(previous,'pcb_trace').length,priorThroughViasPreserved:type(previous,'pcb_via').length,
  addedSignals:run.definitions.map(d=>d.name),addedFullDepthVias:newVias,lengths,skewMm,minimumHoleEdgeGapMm,
  fullElectricalTimingQualified:false,defaultChanged:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
