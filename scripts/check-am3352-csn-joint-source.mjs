import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'

const [sourcePath,reportPath]=process.argv.slice(2);assert(sourcePath&&reportPath)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const pathsPath='routing/am3352-ddr-usbc-csn-joint-paths.json',provenancePath=pathsPath.replace(/\.json$/,'.provenance.json'),provenance=read(provenancePath)
const {summary,registration}=readCheckedCommandSummary(provenance.priorCheckedSummary);assert.equal(registration.signals,27)
const repair=provenance.cpuPrefixRepair
for(const a of [provenance.source,provenance.priorPaths,provenance.nativeChannelRun,provenance.nativeChannelInput,provenance.nativeChannelOutput,provenance.manualLocalRun,provenance.manualLocalCopper,provenance.nativeBootstrap,provenance.paths,repair.manualRun,repair.manualCopper,repair.preparation,repair.originalTails])checked(a)
assert.deepEqual(summary.source,provenance.source);assert.deepEqual(provenance.priorPaths,{...summary.paths,signals:27})
assert.deepEqual(provenance.newSignals,['DDR_CSn0']);assert.deepEqual(provenance.changedExistingSignals,['DDR_D14'])
assert.equal(repair.sourceTraceId,'source_trace_40');assert.equal(repair.cutIndex,66)
const paths=read(pathsPath),priorPaths=read(provenance.priorPaths.path),source=read(sourcePath),previous=read(provenance.source.path)
assert.equal(Object.keys(paths).length,28)
for(const n of Object.keys(priorPaths))if(n!=='DDR_D14')assert.deepEqual(paths[n],priorPaths[n])
const type=(s,t)=>s.filter(e=>e.type===t),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
assert.equal(source.filter(e=>e.type.endsWith('_error')).length,0)
const fixed=s=>s.filter(e=>!['pcb_trace','pcb_via','pcb_copper_pour','source_project_metadata'].includes(e.type))
assert.deepEqual(fixed(source),fixed(previous),'Changed a fixed circuit, pad, component or keepout')
const plane=p=>({...p,brep_shape:{outer_ring:p.brep_shape.outer_ring}})
assert.deepEqual(type(source,'pcb_copper_pour').map(plane),type(previous,'pcb_copper_pour').map(plane))
const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
for(const old of type(previous,'pcb_trace')){
  if(old.source_trace_id==='source_trace_40')continue
  const now=type(source,'pcb_trace').find(t=>t.source_trace_id===old.source_trace_id);assert(now)
  assert.deepEqual(geometry(now.route),geometry(old.route))
}
assert.equal(type(source,'pcb_trace').length,130);assert.equal(type(source,'pcb_via').length,149)
assert.equal(type(source,'pcb_board')[0].num_layers,4)
assert.equal(type(source,'source_component').length,212);assert.equal(type(source,'pcb_smtpad').length,912);assert.equal(type(source,'pcb_plated_hole').length,8)
const owner=(s,v)=>{const t=s.find(t=>t.type==='pcb_trace'&&t.pcb_trace_id===v.pcb_trace_id);return t?{trace:t.source_trace_id}:{net:v.source_net_id,connectivityMapKey:v.subcircuit_connectivity_map_key}}
for(const v of type(previous,'pcb_via')){
  const now=type(source,'pcb_via').find(w=>near(v,w));assert(now)
  for(const key of ['hole_diameter','outer_diameter','layers','source_net_id'])assert.deepEqual(now[key],v[key])
  assert.deepEqual(owner(source,now),owner(previous,v))
}
const prefix=read(repair.manualCopper.path);assert.equal(prefix.length,1);assert.equal(prefix[0].source_trace_id,repair.sourceTraceId)
const tails=read(repair.originalTails.path),tail=tails.find(t=>t.name==='DDR_D14'),oldD14=type(previous,'pcb_trace').find(t=>t.source_trace_id===repair.sourceTraceId)
assert.equal(tail.cutIndex,repair.cutIndex);assert.deepEqual(geometry(tail.retainedTail),geometry(oldD14.route.slice(repair.cutIndex)))
assert(oldD14.route.slice(0,repair.cutIndex).every(p=>p.route_type==='wire'&&p.layer==='top'))
const asPath=parts=>{
  for(let i=1;i<parts.length;i++)assert(near(parts[i-1].at(-1),parts[i][0]))
  const clean=[]
  for(const p of parts.flat()){const q=clean.at(-1);if(q&&p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer&&near(p,q))continue;clean.push(p)}
  let layer='top'
  const p=clean.map(p=>{if(p.route_type==='via'){assert.equal(p.from_layer,layer);layer=p.to_layer;assert.equal(p.via_diameter,.4572);assert.equal(p.via_hole_diameter,.254);return{x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}}assert.equal(p.layer,layer);assert.equal(p.width,.1016);return{x:p.x,y:p.y}})
  assert.equal(layer,'top');return p
}
assert.deepEqual(paths.DDR_D14,asPath([prefix[0].route,tail.retainedTail]))
const prep=read(repair.preparation.path),manual=read(repair.manualRun.path),native=read(provenance.nativeChannelRun.path)
assert.equal(prep.status,'STAGED_D14_CPU_PREFIX_REPAIR_D10_RESTORED_NOT_EXPORTABLE');assert.deepEqual(manual.restoredCpuPrefixNames,['DDR_D10'])
assert.deepEqual(manual.cpuPrefixRebuild.stagedNativeCommand,provenance.nativeChannelRun)
assert.equal(native.status,'GUIDED_NATIVE_CHANNEL_ROUTED_UNQUALIFIED');assert.equal(native.totalDdrSignalsAfterPhase,26);assert.equal(native.exportable,false)
assert.equal(native.solver,'@tscircuit/core SOLVERS.BusLanesPipelineSolver')
const local=read(provenance.manualLocalCopper.path),input=read(provenance.nativeChannelInput.path),output=read(provenance.nativeChannelOutput.path)
assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces);assert.equal(output.traces.length,input.traces.length+1)
const reverse=r=>r.toReversed().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:{...p})
const cpu=local.find(t=>t.source_trace_id==='source_trace_5'&&t.route[0].y>-15),ram=local.find(t=>t.source_trace_id==='source_trace_5'&&t.route[0].y<-15)
let carrier=output.traces.at(-1).route;if(!near(cpu.route.at(-1),carrier[0]))carrier=reverse(carrier)
assert.deepEqual(paths.DDR_CSn0,asPath([cpu.route,carrier,reverse(ram.route)]))
const mapPath='lib/am3352/memory-byte1-top-centered-swizzled-connections.json',mapping=read(mapPath),lengths={}
for(const name of ['DDR_CSn0','DDR_D14']){
  const m=mapping.find(m=>m.name===name),st=type(source,'source_trace').find(t=>t.name===name),trace=type(source,'pcb_trace').find(t=>t.source_trace_id===st.source_trace_id),p=paths[name]
  assert.equal(trace.route.length,p.length+2);let layer='top'
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
  lengths[name]=trace.route.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-trace.route[i].x,p.y-trace.route[i].y),0)
}
assert(Math.abs(lengths.DDR_CSn0-provenance.planarMm)<1e-8);assert(Math.abs(lengths.DDR_D14-repair.planarMm)<1e-8)
assert.equal(paths.DDR_CSn0.filter(p=>p.via).length,0);assert.equal(prefix[0].route.filter(p=>p.route_type==='via').length,2)
const newHoles=type(source,'pcb_via').filter(v=>!type(previous,'pcb_via').some(w=>near(v,w)))
assert.equal(newHoles.length,2)
for(const v of newHoles){assert.deepEqual(owner(source,v),{trace:'source_trace_40'});assert(prefix[0].route.some(p=>p.route_type==='via'&&near(p,v)))}
let minimumHoleEdgeGapMm=Infinity;const holes=type(source,'pcb_via')
for(let i=0;i<holes.length;i++){
  const v=holes[i];assert.equal(v.outer_diameter,.4572);assert.equal(v.hole_diameter,.254);assert.deepEqual(new Set(v.layers),new Set(['top','inner1','inner2','bottom']))
  for(let j=0;j<i;j++){const gap=Math.hypot(v.x-holes[j].x,v.y-holes[j].y)-.254;minimumHoleEdgeGapMm=Math.min(minimumHoleEdgeGapMm,gap);assert(gap>=.254-1e-8)}
}
const report={status:'DDR28_CSN_EXACT_REPLAY_D14_CPU_PREFIX_REPAIR_AND_ALL_OTHER_COPPER_PRESERVED_INDEPENDENT_CHECKS_REQUIRED',source:artifact(sourcePath),previousSource:provenance.source,
  paths:provenance.paths,provenance:artifact(provenancePath),priorCheckedSummary:provenance.priorCheckedSummary,memoryMap:artifact(mapPath),
  components:212,actualPads:912,copperLayers:4,tracePieces:130,throughVias:149,preservedTracePieces:128,preservedThroughVias:147,addedThroughVias:2,
  changedExistingSignals:['DDR_D14'],addedSignals:['DDR_CSn0'],csnPlanarMm:lengths.DDR_CSn0,csnNominalLengthPass:provenance.csnNominalLengthPass,d14PlanarMm:lengths.DDR_D14,newCpuViaGeometry:newHoles,
  restoredD10Unchanged:true,originalD14RamAndChannelTailPreserved:true,minimumHoleEdgeGapMm,
  planeDeclarationsAndBoundariesPreserved:true,planeAntipadsRegeneratedForAddedHoles:true,independentFilledPlaneConnectivityRequired:true,
  fullCommandClassMatchingDeferred:true,fullElectricalTimingQualified:false,defaultChanged:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,csnPlanarMm:report.csnPlanarMm,d14PlanarMm:report.d14PlanarMm,throughVias:holes.length,fabricationReady:false}))
