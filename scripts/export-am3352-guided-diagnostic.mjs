import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {any_circuit_element} from 'circuit-json'
import {CopperPourPipelineSolver,convertCircuitJsonToInputProblem,initializeManifoldGeometry} from '@tscircuit/copper-pour-solver'
import {readRoutingSourceSnapshot} from './lib/am3352-routing-source-snapshot.mjs'
import {assertSourceCopper} from './lib/am3352-source-copper.mjs'
import {assertSavedDdrCopper} from './lib/am3352-saved-ddr-copper.mjs'

// Assemble local routing evidence without importing a finished board. Every
// source footprint, rule, keepout, reference region and existing copper item
// stays intact. Added paths retain their actual source-net identities.
const [runDirectory,outDirectory,scope]=process.argv.slice(2)
assert(runDirectory&&outDirectory)
assert(scope===undefined||scope==='native-only')
const nativeOnly=scope==='native-only'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const report=read(`${runDirectory}/result.json`),snapshot=readRoutingSourceSnapshot(report.source),base=snapshot.circuit
const board=base.find(e=>e.type==='pcb_board')
assert.equal(board.num_layers,4);assert.equal(board.min_via_pad_diameter,.4572);assert.equal(board.min_via_hole_diameter,.254)
const existing=base.filter(e=>e.type==='pcb_trace')
const nativeBootstrap=report.nativeBootstrap??{path:`${runDirectory}/signal-escapes.native.json`,sha256:hash(`${runDirectory}/signal-escapes.native.json`),dogbones:report.preparedLocalEscapes}
const native=read(nativeBootstrap.path)
assert.equal(hash(nativeBootstrap.path),nativeBootstrap.sha256)
assert.equal(native.length,nativeBootstrap.dogbones)
const local=nativeOnly||report.output?[]:read(`${runDirectory}/local-escapes.json`)
const output=!nativeOnly&&report.output?read(report.output.path):{traces:[...existing,...native,...local]}
const retainedSourceCount=report.sourceTracesRetained??report.sourceCopper?.totalSourceTraces??report.sourceCopper?.traces??69
assert.equal(existing.length,retainedSourceCount)
assert([69,70,81,95].includes(retainedSourceCount))
const savedBridgeByte=retainedSourceCount===81
if(savedBridgeByte){
 assert.equal(report.preservedSavedDdr.signals,11)
 assert.equal(hash(report.preservedSavedDdr.path),report.preservedSavedDdr.sha256)
 const audited=assertSavedDdrCopper(base,read(report.preservedSavedDdr.path),{ramRotation:180,rotatedD2PowerBridge:true,
  ramReferenceEscapes:read('lib/am3352/ram-reference-escapes-rotated-180.json')})
 assert.equal(audited.traces,70);assert.equal(audited.savedDdrSignals,11)
}
if(retainedSourceCount===70)assertSourceCopper(base,{ramRotation:180,rotatedD2PowerBridge:true,
  ramReferenceEscapes:read('lib/am3352/ram-reference-escapes-rotated-180.json')})
if(retainedSourceCount===95)assert.equal(report.preservedSavedDdr.signals,26)
assert(output.traces.length>=existing.length+native.length)
if(!nativeOnly&&report.output){
  const phase=base.find(e=>e.type==='source_bus'&&e.name===report.bus);assert(phase)
  assert.equal(output.traces.length,existing.length+native.length+3*phase.source_trace_ids.length)
}
if(nativeOnly)assert.equal(output.traces.length,existing.length+native.length)
for(let i=0;i<existing.length;i++){
  const geometry=r=>r.map(({route_type,x,y,layer,width})=>({route_type,x,y,layer,width}))
  assert.equal(output.traces[i].pcb_trace_id,existing[i].pcb_trace_id)
  assert.deepEqual(geometry(output.traces[i].route),geometry(existing[i].route))
}
const traces=[],vias=[],layers=['top','inner1','inner2','bottom']
const physicalSites=new Map(base.filter(e=>e.type==='pcb_via').map(v=>[`${v.x.toFixed(6)},${v.y.toFixed(6)}`,v]))
for(const saved of output.traces.slice(existing.length)){
  const source=base.find(e=>e.type==='source_trace'&&e.source_trace_id===saved.source_trace_id);assert(source?.name.startsWith('DDR_'))
  const traceId=`guided_diagnostic_${saved.pcb_trace_id}`
  const route=saved.route.map(p=>{
    assert(p.x>=-17.5-1e-6&&p.x<=17.5+1e-6&&p.y>=-38.5-1e-6&&p.y<=9.5+1e-6)
    if(p.route_type==='wire'){assert(['top','bottom'].includes(p.layer));assert(p.width>=.1016);return p}
    assert.equal(p.route_type,'via');assert.deepEqual(p.layers,layers)
    assert.equal(p.via_diameter,.4572);assert.equal(p.via_hole_diameter,.254)
    const key=`${p.x.toFixed(6)},${p.y.toFixed(6)}`
    assert(!physicalSites.has(key),'No coincident new physical holes')
    const v=any_circuit_element.parse({type:'pcb_via',pcb_via_id:`guided_diagnostic_via_${vias.length}`,
      x:p.x,y:p.y,outer_diameter:.4572,hole_diameter:.254,layers,from_layer:'top',to_layer:'bottom',
      pcb_trace_id:traceId,subcircuit_id:source.subcircuit_id,subcircuit_connectivity_map_key:source.subcircuit_connectivity_map_key})
    physicalSites.set(key,v);vias.push(v)
    return {...p,outer_diameter:.4572,hole_diameter:.254}
  })
  traces.push(any_circuit_element.parse({...saved,pcb_trace_id:traceId,source_trace_id:source.source_trace_id,
    subcircuit_id:source.subcircuit_id,subcircuit_connectivity_map_key:source.subcircuit_connectivity_map_key,route}))
}
const result=[...base,...traces,...vias]
// Source pours were filled before the new signal vias existed. Refill their
// existing boundaries with the native pour solver, retaining the 0.2 mm
// clearance. Otherwise Gerbers would short new vias to the old filled planes.
await initializeManifoldGeometry()
const pours=result.filter(e=>e.type==='pcb_copper_pour')
const problem=convertCircuitJsonToInputProblem(result,pours.map(p=>({layer:p.layer,subcircuit_id:p.subcircuit_id,
  source_net_id:p.source_net_id,outline:p.brep_shape.outer_ring.vertices,
  pad_margin:.2,trace_margin:.2,pour_margin:.2,board_edge_margin:0})))
const fill=new CopperPourPipelineSolver(problem).getOutput()
const inside=(point,ring)=>{
  const v=ring.vertices;let found=false
  for(let i=0,j=v.length-1;i<v.length;j=i++)if((v[i].y>point.y)!==(v[j].y>point.y)&&
    point.x<(v[j].x-v[i].x)*(point.y-v[i].y)/(v[j].y-v[i].y)+v[i].x)found=!found
  return found
}
const contains=(shape,p)=>inside(p,shape.outer_ring)&&!shape.inner_rings.some(r=>inside(p,r))
const bridgeSource=retainedSourceCount===70||savedBridgeByte?base.find(e=>e.type==='source_trace'&&e.name==='RAM_D2_B2_INNER2_POWER_BRIDGE'):undefined
const powerBridge=bridgeSource?base.find(e=>e.type==='pcb_trace'&&e.source_trace_id===bridgeSource.source_trace_id):undefined
const refillEvidence=[]
for(let i=0;i<pours.length;i++){
  const boundary=pours[i].brep_shape.outer_ring.vertices
  const matches=fill.brep_shapes_by_region[i].filter(s=>s.outer_ring.vertices.length===boundary.length&&
    s.outer_ring.vertices.every(p=>boundary.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<1e-6)))
  assert.equal(matches.length,1,'Keep the existing continuous reference boundary')
  const retained=matches[0]
  // Discard only disconnected copper islands. No actual connected source
  // supply/ground via may be stranded or removed by this refill.
  const referenceVias=base.filter(v=>v.type==='pcb_via'&&v.source_net_id===pours[i].source_net_id)
  let explicitlyBridgedSourceVias=0
  for(const v of referenceVias){
    if(contains(retained,v))continue
    // The opt-in, independently audited D2/B2 trace connects D2 directly to
    // B2 in the continuous plane. Never accept an arbitrary stranded via.
    assert(powerBridge&&pours[i].layer==='inner2'&&bridgeSource.connected_source_net_ids.includes(v.source_net_id)&&
      Math.hypot(v.x-powerBridge.route[0].x,v.y-powerBridge.route[0].y)<1e-6&&
      contains(retained,powerBridge.route.at(-1)),`Refill stranded source reference via ${v.pcb_via_id}`)
    explicitlyBridgedSourceVias++
  }
  assert(explicitlyBridgedSourceVias<=1)
  refillEvidence.push({layer:pours[i].layer,connectedSourceReferenceVias:referenceVias.length,
    directlyContainedSourceReferenceVias:referenceVias.length-explicitlyBridgedSourceVias,
    ...(explicitlyBridgedSourceVias?{explicitlyBridgedSourceVias,bridgeTraceId:powerBridge.pcb_trace_id,independentPhysicalConnectivityRequired:true}:{}),
    disconnectedIslandsRemoved:fill.brep_shapes_by_region[i].length-1})
  pours[i].brep_shape=retained
}
// The new signal holes invalidate the earlier "inside pour" annotations.
// Preserve the explicit bridge when converters emit its independent copper.
if(powerBridge)for(const p of powerBridge.route){delete p.is_inside_copper_pour;delete p.copper_pour_id}
result.find(e=>e.type==='pcb_board').title='AM3352 guided DDR routing diagnostic — NOT FOR FABRICATION'
mkdirSync(outDirectory,{recursive:true})
const path=`${outDirectory}/circuit.json`;writeFileSync(path,JSON.stringify(result,null,2)+'\n')
const evidence={status:'GUIDED_NATIVE_ROUTING_DIAGNOSTIC_EXPORTED',source:snapshot.source,
  route:nativeOnly?{...nativeBootstrap,channelIncomplete:true,fixedBootstrapOnly:true,
    nativeReservationsOnly:!report.manualNativeEscapeCorrection?.naturalFanouts}:report.output?{path:report.output.path,sha256:hash(report.output.path)}:
    {path:`${runDirectory}/local-escapes.json`,sha256:hash(`${runDirectory}/local-escapes.json`),channelIncomplete:true},
  circuit:{path,sha256:hash(path)},
  sourceComponents:base.filter(e=>e.type==='source_component').length,sourceCopperRetained:retainedSourceCount,
  ...(report.preservedSavedDdr?{preservedSavedDdr:report.preservedSavedDdr}:{}),
  manualNativeEscapeCorrection:report.manualNativeEscapeCorrection,
  addedTracePieces:traces.length,addedPhysicalVias:vias.length,copperLayers:4,
  referencePoursRefilled:true,pourClearanceMm:.2,refillEvidence,
  bus:report.bus,claimedSignalsPendingIndependentContinuity:nativeOnly?0:report.completedSignals,
  fabricationReady:false}
writeFileSync(`${outDirectory}/export.json`,JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence))
