import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'

const [sourcePath,reportPath,pathsPath]=process.argv.slice(2);assert(sourcePath&&reportPath&&pathsPath)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const provenancePath=pathsPath.replace(/\.json$/,'.provenance.json'),provenance=read(provenancePath)
const {summary,registration}=readCheckedCommandSummary(provenance.priorCheckedSummary)
for(const a of [provenance.source,provenance.priorPaths,provenance.nativeChannelRun,provenance.nativeChannelInput,provenance.nativeChannelOutput,provenance.manualLocalRun,provenance.manualLocalCopper,provenance.nativeBootstrap,provenance.paths])checked(a)
if(provenance.manualNominalTuning){
  const t=provenance.manualNominalTuning;checked(t.priorPaths);checked(t.priorProvenance)
  const original=read(t.priorPaths.path),oldProvenance=read(t.priorProvenance.path)
  assert.deepEqual(oldProvenance.priorCheckedSummary,provenance.priorCheckedSummary)
  for(const key of ['source','priorPaths','nativeChannelRun','nativeChannelInput','nativeChannelOutput','manualLocalRun','manualLocalCopper','nativeBootstrap'])assert.deepEqual(oldProvenance[key],provenance[key])
  assert.deepEqual(provenance.newSignals,[t.signal]);assert.equal(t.newVias,0)
  const expected=structuredClone(original);expected[t.signal].splice(t.afterIndex+1,0,...t.insertedPoints)
  assert.deepEqual(read(pathsPath),expected,'Nominal repair may only insert the declared wire jog')
  let layer='top';for(const p of original[t.signal].slice(0,t.afterIndex+1))if(p.via)layer=p.toLayer
  assert.equal(layer,t.layer);assert(!original[t.signal][t.afterIndex].via&&!original[t.signal][t.afterIndex+1].via)
  assert.equal(t.targetPlanarMm,summary.placementNominalReview.nominalMm)
  assert(Math.abs(t.priorPlanarMm+t.addedPlanarMm-t.targetPlanarMm)<1e-8)
}
assert.deepEqual(summary.source,provenance.source);assert.deepEqual(provenance.priorPaths,{...summary.paths,signals:registration.signals})
assert.equal(provenance.newSignals.length,1)
const name=provenance.newSignals[0],paths=read(pathsPath),priorPaths=read(provenance.priorPaths.path),source=read(sourcePath),previous=read(provenance.source.path)
assert(summary.remainingDdrSignalNames.includes(name));assert.equal(Object.keys(paths).length,registration.signals+1)
for(const n of Object.keys(priorPaths))assert.deepEqual(paths[n],priorPaths[n])
const type=(s,t)=>s.filter(e=>e.type===t),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
// Reconstruct the original native carrier and both exact manual package
// fanouts before applying any hash-bound via-free nominal tuning insertion.
const originalPaths=provenance.manualNominalTuning?read(provenance.manualNominalTuning.priorPaths.path):paths
const input=read(provenance.nativeChannelInput.path),output=read(provenance.nativeChannelOutput.path),local=read(provenance.manualLocalCopper.path)
assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces);assert.equal(output.traces.length,input.traces.length+1)
if(provenance.carrierReferenceSearchBounds){
  const b=provenance.carrierReferenceSearchBounds
  assert.deepEqual(input.bounds,b)
  const authored=read(provenance.manualLocalRun.path.replace(/result\.json$/,'channel.input.simple-route.json'))
  const normalized=authored.obstacles.map(o=>{
    if(!['U_SOC','U_RAM'].includes(o.circuitJsonMetadata?.source_component_name))return o
    const {componentId,...fixedPad}=o;return fixedPad
  })
  assert.deepEqual(input.obstacles,normalized,'Only completed package fanout associations may change; every physical obstacle and owner remains')
  assert.deepEqual(input.traces,authored.traces)
  const plane=source.find(e=>e.type==='pcb_copper_pour'&&e.layer==='inner2'),v=plane.brep_shape.outer_ring.vertices
  assert.equal(v.length,4)
  assert.deepEqual(b,{minX:Math.min(...v.map(p=>p.x))+.3,maxX:Math.max(...v.map(p=>p.x))-.3,minY:Math.min(...v.map(p=>p.y))+.3,maxY:Math.max(...v.map(p=>p.y))-.3})
  assert(paths[name].every(p=>p.x>=b.minX&&p.x<=b.maxX&&p.y>=b.minY&&p.y<=b.maxY),'New command copper leaves the declared reference-region envelope')
}
const reverse=r=>r.toReversed().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:{...p})
const cpu=local.find(t=>t.source_trace_id===provenance.sourceTraceId&&t.route[0].y>-15),ram=local.find(t=>t.source_trace_id===provenance.sourceTraceId&&t.route[0].y<-15)
assert(cpu&&ram);let carrier=output.traces.at(-1).route;if(!near(cpu.route.at(-1),carrier[0]))carrier=reverse(carrier)
assert(near(cpu.route.at(-1),carrier[0])&&near(carrier.at(-1),ram.route.at(-1)))
const clean=[]
for(const p of [...cpu.route,...carrier,...reverse(ram.route)]){const q=clean.at(-1);if(q&&p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer&&near(p,q))continue;clean.push(p)}
const derived=clean.map(p=>p.route_type==='via'?{x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}:{x:p.x,y:p.y})
assert.deepEqual(originalPaths[name],derived)
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
assert.equal(type(source,'pcb_trace').length,registration.traces+1)
assert.equal(type(source,'pcb_via').length,registration.holes+provenance.throughVias)
assert.equal(type(source,'pcb_board')[0].num_layers,4)
const owner=(s,v)=>{const t=s.find(t=>t.type==='pcb_trace'&&t.pcb_trace_id===v.pcb_trace_id);return t?{trace:t.source_trace_id}:{net:v.source_net_id,connectivityMapKey:v.subcircuit_connectivity_map_key}}
for(const v of type(previous,'pcb_via')){
  const now=type(source,'pcb_via').find(w=>near(v,w));assert(now)
  for(const key of ['hole_diameter','outer_diameter','layers','source_net_id'])assert.deepEqual(now[key],v[key])
  assert.deepEqual(owner(source,now),owner(previous,v))
}
const mapPath='lib/am3352/memory-byte1-top-centered-swizzled-connections.json',mapping=read(mapPath),m=mapping.find(m=>m.name===name)
const st=type(source,'source_trace').find(t=>t.name===name),trace=type(source,'pcb_trace').find(t=>t.source_trace_id===st.source_trace_id),p=paths[name]
assert.equal(st.source_trace_id,provenance.sourceTraceId);assert.equal(trace.route.length,p.length+2)
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
const planarMm=trace.route.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-trace.route[i].x,p.y-trace.route[i].y),0)
assert(Math.abs(planarMm-provenance.planarMm)<1e-8)
let minimumHoleEdgeGapMm=Infinity;const holes=type(source,'pcb_via')
for(let i=0;i<holes.length;i++){
  const v=holes[i];assert.equal(v.outer_diameter,.4572);assert.equal(v.hole_diameter,.254);assert.deepEqual(new Set(v.layers),new Set(['top','inner1','inner2','bottom']))
  for(let j=0;j<i;j++){const gap=Math.hypot(v.x-holes[j].x,v.y-holes[j].y)-.254;minimumHoleEdgeGapMm=Math.min(minimumHoleEdgeGapMm,gap);assert(gap>=.254-1e-8)}
}
const report={status:`DDR${registration.signals+1}_${name}_EXACT_REPLAY_AND_PRIOR_COPPER_PRESERVED_INDEPENDENT_CHECKS_REQUIRED`,source:artifact(sourcePath),previousSource:provenance.source,
  paths:provenance.paths,provenance:artifact(provenancePath),priorCheckedSummary:provenance.priorCheckedSummary,memoryMap:artifact(mapPath),
  components:212,actualPads:912,copperLayers:4,tracePieces:registration.traces+1,throughVias:holes.length,preservedTracePieces:registration.traces,preservedThroughVias:registration.holes,addedThroughVias:provenance.throughVias,
  changedExistingSignals:[],addedSignals:[name],addedSignalPlanarMm:planarMm,addedSignalNominalLengthPass:provenance.nominalLengthPass,minimumHoleEdgeGapMm,carrierReferenceSearchBounds:provenance.carrierReferenceSearchBounds,manualNominalTuning:provenance.manualNominalTuning,
  planeDeclarationsAndBoundariesPreserved:true,planeAntipadsRegeneratedForAddedHoles:true,independentFilledPlaneConnectivityRequired:true,
  fullCommandClassMatchingDeferred:true,fullElectricalTimingQualified:false,defaultChanged:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,addedSignal:name,planarMm,throughVias:holes.length,fabricationReady:false}))
