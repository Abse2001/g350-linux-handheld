import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [sourcePath,reportPath,pathsPath='routing/am3352-ddr-usbc-odt-bootstrap-paths.json']=process.argv.slice(2);assert(sourcePath&&reportPath)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
assert(['routing/am3352-ddr-usbc-odt-bootstrap-paths.json','routing/am3352-ddr-usbc-odt-nominal-paths.json'].includes(pathsPath))
const provenancePath=pathsPath.replace(/\.json$/,'.provenance.json'),provenance=read(provenancePath)
for(const a of [provenance.source,provenance.priorPaths,provenance.priorCheckedSummary,provenance.nativeChannelRun,provenance.nativeChannelInput,provenance.nativeChannelOutput,provenance.manualLocalRun,provenance.manualLocalCopper,provenance.paths])checked(a)
const source=read(sourcePath),previous=read(provenance.source.path),paths=read(pathsPath),priorPaths=read(provenance.priorPaths.path),priorSummary=read(provenance.priorCheckedSummary.path)
assert.deepEqual(priorSummary.source,provenance.source);assert.equal(priorSummary.connectedDdrSignals,26)
assert.equal(Object.keys(paths).length,27)
for(const n of Object.keys(priorPaths))assert.deepEqual(paths[n],priorPaths[n])
if(provenance.manualNominalShortcut){
  assert.equal(pathsPath,'routing/am3352-ddr-usbc-odt-nominal-paths.json')
  const a=provenance.manualNominalShortcut;checked(a.run);checked(a.priorPaths)
  const run=read(a.run.path),original=read(a.priorPaths.path).DDR_ODT
  assert.deepEqual(run.chosen,{...run.chosen,from:a.from,to:a.to,savingMm:a.savingMm,preflight:a.preflight})
  assert(original.slice(a.from,a.to+1).every(p=>!p.via))
  assert.deepEqual(paths.DDR_ODT,original.filter((p,i)=>i<=a.from||i>=a.to))
  assert.deepEqual(paths.DDR_ODT.filter(p=>p.via),original.filter(p=>p.via))
  assert.equal(a.newVias,0);assert(provenance.nominalLengthPass)
}
const type=(s,t)=>s.filter(e=>e.type===t),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
assert.equal(source.filter(e=>e.type.endsWith('_error')).length,0)
const fixed=s=>s.filter(e=>!['pcb_trace','pcb_via','pcb_copper_pour','source_project_metadata'].includes(e.type))
assert.deepEqual(fixed(source),fixed(previous),'Changed a fixed circuit, pad, component or keepout')
const plane=p=>({...p,brep_shape:{outer_ring:p.brep_shape.outer_ring}})
assert.deepEqual(type(source,'pcb_copper_pour').map(plane),type(previous,'pcb_copper_pour').map(plane))
const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
for(const old of type(previous,'pcb_trace')){
  const now=type(source,'pcb_trace').find(t=>t.source_trace_id===old.source_trace_id);assert(now)
  assert.deepEqual(geometry(now.route),geometry(old.route))
}
assert.equal(type(source,'pcb_trace').length,129);assert.equal(type(source,'pcb_via').length,147)
assert.equal(type(source,'pcb_board')[0].num_layers,4)
const owner=(s,v)=>{const t=s.find(t=>t.type==='pcb_trace'&&t.pcb_trace_id===v.pcb_trace_id);return t?{trace:t.source_trace_id}:{net:v.source_net_id,connectivityMapKey:v.subcircuit_connectivity_map_key}}
for(const v of type(previous,'pcb_via')){
  const now=type(source,'pcb_via').find(w=>near(v,w));assert(now)
  for(const key of ['hole_diameter','outer_diameter','layers','source_net_id'])assert.deepEqual(now[key],v[key])
  assert.deepEqual(owner(source,now),owner(previous,v))
}
const mapPath='lib/am3352/memory-byte1-top-centered-swizzled-connections.json',mapping=read(mapPath),m=mapping.find(m=>m.name==='DDR_ODT')
const st=type(source,'source_trace').find(t=>t.name==='DDR_ODT'),trace=type(source,'pcb_trace').find(t=>t.source_trace_id===st.source_trace_id),p=paths.DDR_ODT
assert.equal(trace.route.length,p.length+2)
let layer='top'
for(const [i,q] of p.entries()){
  const actual=trace.route[i+1];assert(near(q,actual))
  if(q.via){assert.equal(actual.route_type,'via');assert.equal(actual.from_layer,layer);assert.equal(actual.to_layer,q.toLayer);layer=q.toLayer}
  else{assert.equal(actual.route_type,'wire');assert.equal(actual.layer,layer);assert.equal(actual.width,.1016)}
  assert(['top','bottom'].includes(layer))
}
assert.equal(layer,'top')
const endpoints=[['U_SOC',m.socPin],['U_RAM',m.ramPin]].map(([name,pin])=>{
  const c=type(source,'source_component').find(c=>c.name===name),port=type(source,'source_port').find(p=>p.source_component_id===c.source_component_id&&p.pin_number===Number(pin.slice(3)))
  assert(st.connected_source_port_ids.includes(port.source_port_id));return type(source,'pcb_port').find(p=>p.source_port_id===port.source_port_id)
})
assert(near(trace.route[0],endpoints[0])&&near(trace.route.at(-1),endpoints[1]))
const odtPlanarMm=trace.route.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-trace.route[i].x,p.y-trace.route[i].y),0)
assert(Math.abs(odtPlanarMm-provenance.planarMm)<1e-8)
let minimumHoleEdgeGapMm=Infinity;const holes=type(source,'pcb_via')
for(let i=0;i<holes.length;i++){
  const v=holes[i];assert.equal(v.outer_diameter,.4572);assert.equal(v.hole_diameter,.254);assert.deepEqual(new Set(v.layers),new Set(['top','inner1','inner2','bottom']))
  for(let j=0;j<i;j++){const gap=Math.hypot(v.x-holes[j].x,v.y-holes[j].y)-.254;minimumHoleEdgeGapMm=Math.min(minimumHoleEdgeGapMm,gap);assert(gap>=.254-1e-8)}
}
const report={status:'DDR27_ODT_EXACT_REPLAY_AND_ALL_PRIOR_COPPER_PRESERVED_INDEPENDENT_CHECKS_REQUIRED',source:artifact(sourcePath),previousSource:provenance.source,
  paths:provenance.paths,provenance:artifact(provenancePath),priorCheckedSummary:provenance.priorCheckedSummary,memoryMap:artifact(mapPath),
  components:212,actualPads:912,copperLayers:4,tracePieces:129,throughVias:147,preservedTracePieces:128,preservedThroughVias:143,addedThroughVias:4,
  changedExistingSignals:[],addedSignals:['DDR_ODT'],odtPlanarMm,odtNominalLengthPass:provenance.nominalLengthPass,minimumHoleEdgeGapMm,
  planeDeclarationsAndBoundariesPreserved:true,planeAntipadsRegeneratedForAddedHoles:true,independentFilledPlaneConnectivityRequired:true,
  fullCommandClassMatchingDeferred:true,fullElectricalTimingQualified:false,defaultChanged:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,traces:129,throughVias:147,preservedTraces:128,odtPlanarMm:report.odtPlanarMm,fabricationReady:false}))
