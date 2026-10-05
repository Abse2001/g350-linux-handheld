import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [sourcePath,reportPath,pathsPath='routing/am3352-ddr-usbc-cke-joint-unmatched-paths.json',planeRepairEntry]=process.argv.slice(2);assert(sourcePath&&reportPath)
const provenancePath=pathsPath.replace(/\.json$/,'.provenance.json')
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const provenance=read(provenancePath)
for(const a of [provenance.source,provenance.priorPaths,provenance.priorCheckedSummary,provenance.nativeBootstrap,provenance.ramTailRun,provenance.ramTails,provenance.stagedCkeCopper,provenance.temporaryOpenRamTailPreparation,provenance.paths])assert.equal(hash(a.path),a.sha256)
for(const a of [provenance.checkedCpuChannelReuse.sections,provenance.checkedCpuChannelReuse.checkedSummary,provenance.stagedCkeCopper.nativeChannelRun])assert.equal(hash(a.path),a.sha256)
const source=read(sourcePath),previous=read(provenance.source.path),paths=read(pathsPath),type=(s,t)=>s.filter(e=>e.type===t),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
assert.equal(source.filter(e=>e.type.endsWith('_error')).length,0)
const fixed=s=>s.filter(e=>!['pcb_trace','pcb_via','pcb_copper_pour','source_project_metadata'].includes(e.type))
assert.deepEqual(fixed(source),fixed(previous))
// The eight added full-depth signal holes regenerate plane antipads. Preserve
// both plane declarations and outer boundaries; independently refill and audit
// their electrical continuity and clearances before accepting this trial.
const planeDeclaration=p=>({...p,brep_shape:{outer_ring:p.brep_shape.outer_ring}})
assert.deepEqual(type(source,'pcb_copper_pour').map(planeDeclaration),type(previous,'pcb_copper_pour').map(planeDeclaration))
const changed=new Set(['source_trace_27','source_trace_31','source_trace_32'])
const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
for(const old of type(previous,'pcb_trace')){
  const now=type(source,'pcb_trace').find(t=>t.source_trace_id===old.source_trace_id);assert(now)
  if(!changed.has(old.source_trace_id))assert.deepEqual(geometry(now.route),geometry(old.route))
}
assert.equal(type(source,'pcb_trace').length,128);assert.equal(type(source,'pcb_via').length,143)
assert.equal(type(source,'pcb_board')[0].num_layers,4)
for(const v of type(previous,'pcb_via')){
  const now=type(source,'pcb_via').find(w=>near(v,w));assert(now)
  for(const key of ['hole_diameter','outer_diameter','layers','source_net_id'])assert.deepEqual(now[key],v[key])
  const owner=(s,v)=>{const t=s.find(t=>t.type==='pcb_trace'&&t.pcb_trace_id===v.pcb_trace_id);return t?{trace:t.source_trace_id}:{net:v.source_net_id,connectivityMapKey:v.subcircuit_connectivity_map_key}}
  assert.deepEqual(owner(source,now),owner(previous,v))
}
const map=read('lib/am3352/memory-byte1-top-centered-swizzled-connections.json'),lengths=[]
for(const name of ['DDR_DQSn1','DDR_D1','DDR_D7','DDR_CKE']){
  const st=type(source,'source_trace').find(t=>t.name===name),trace=type(source,'pcb_trace').find(t=>t.source_trace_id===st.source_trace_id),p=paths[name]
  assert.equal(trace.route.length,p.length+2)
  let layer='top'
  for(const [i,q] of p.entries()){
    const actual=trace.route[i+1];assert(near(q,actual))
    if(q.via){assert.equal(actual.route_type,'via');assert.equal(actual.from_layer,layer);assert.equal(actual.to_layer,q.toLayer);layer=q.toLayer}
    else{assert.equal(actual.route_type,'wire');assert.equal(actual.layer,layer);assert.equal(actual.width,.1016)}
  }
  assert.equal(layer,'top')
  const m=map.find(m=>m.name===name),endpoints=[['U_SOC',m.socPin],['U_RAM',m.ramPin]].map(([name,pin])=>{
    const c=type(source,'source_component').find(c=>c.name===name),port=type(source,'source_port').find(p=>p.source_component_id===c.source_component_id&&p.pin_number===Number(pin.slice(3)))
    assert(st.connected_source_port_ids.includes(port.source_port_id))
    return type(source,'pcb_port').find(p=>p.source_port_id===port.source_port_id)
  })
  assert(near(trace.route[0],endpoints[0])&&near(trace.route.at(-1),endpoints[1]))
  lengths.push({name,planarMm:trace.route.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-trace.route[i].x,p.y-trace.route[i].y),0),throughVias:trace.route.filter(p=>p.route_type==='via').length})
}
let minimumHoleEdgeGapMm=Infinity
const vias=type(source,'pcb_via')
for(const [i,v] of vias.entries()){
  assert.equal(v.outer_diameter,.4572);assert.equal(v.hole_diameter,.254);assert.deepEqual(new Set(v.layers),new Set(['top','inner1','inner2','bottom']))
  for(const w of vias.slice(0,i)){const gap=Math.hypot(v.x-w.x,v.y-w.y)-.254;minimumHoleEdgeGapMm=Math.min(minimumHoleEdgeGapMm,gap);assert(gap>=.254-1e-8)}
}
const report={status:'CKE_JOINT_DDR26_EXACT_REPLAY_AND_FIXED_COPPER_PASS_TIMING_AND_INDEPENDENT_PHYSICAL_CHECKS_REQUIRED',
  source:{path:sourcePath,sha256:hash(sourcePath)},previousSource:provenance.source,paths:provenance.paths,provenance:{path:provenancePath,sha256:hash(provenancePath)},
  priorCheckedSummary:provenance.priorCheckedSummary,components:212,actualPads:912,copperLayers:4,tracePieces:128,throughVias:143,
  preservedFixedTracePieces:124,changedExistingSignals:['DDR_DQSn1','DDR_D1','DDR_D7'],addedSignals:['DDR_CKE'],preservedThroughVias:135,addedThroughVias:8,
  minimumHoleEdgeGapMm,lengths,planeDeclarationsAndBoundariesPreserved:true,planeAntipadsRegeneratedForEightAddedSignalHoles:true,
  independentFilledPlaneConnectivityRequired:true,byteAndStrobePlanarMatchingQualified:false,fullElectricalTimingQualified:false,defaultChanged:false,fabricationReady:false}
if(planeRepairEntry){
  assert.equal(planeRepairEntry,'experiments/am3352-ddr-usbc-cke-joint-power-plane.circuit.tsx')
  assert(readFileSync(planeRepairEntry,'utf8').includes('ddrPowerPourClearance={.12}'))
  assert.equal(type(source,'pcb_board')[0].min_trace_to_hole_edge_clearance,.2)
  assert.equal(type(source,'pcb_board')[0].min_trace_to_pad_edge_clearance,.1016)
  report.ddrPowerPlaneRepair={entry:{path:planeRepairEntry,sha256:hash(planeRepairEntry)},priorPlaneCopperClearanceMm:.2,planeCopperClearanceMm:.12,
    viaLandMm:.4572,viaDrillMm:.254,nominalPlaneToOtherNetDrillGapMm:.2216,nominalPlaneNeckAtPointEightPitchMm:.1028,
    sourceManufacturingMinimumsUnchanged:true,groundPlaneClearanceUnchanged:true,filledReferenceContinuityCheckRequired:true}
}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
