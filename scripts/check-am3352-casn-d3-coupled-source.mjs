import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {readStagedCasnD3Csn0} from './lib/am3352-staged-casn-d3-csn0.mjs'

const [sourcePath,reportPath,pathsPath]=process.argv.slice(2);assert(sourcePath&&reportPath&&pathsPath)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const provenancePath=pathsPath.replace(/\.json$/,'.provenance.json'),provenance=read(provenancePath)
const {summary,registration}=readCheckedCommandSummary(provenance.priorCheckedSummary);assert.equal(registration.signals,32)
for(const a of [provenance.source,provenance.priorPaths,provenance.nativeCasnRun,provenance.nativeD3Run,provenance.nativeCsn0Run,provenance.nativeResetRun,provenance.nativeResetInput,provenance.nativeResetOutput,provenance.paths])verify(a)
assert.deepEqual(provenance.source,summary.source);assert.deepEqual(provenance.addedSignals,['DDR_CASn']);assert.deepEqual(provenance.changedExistingSignals,['DDR_D3','DDR_CSn0','DDR_RESETn'])
assert.deepEqual(provenance.pendingOpenedSignalRepairs,[])
const source=read(sourcePath),previous=read(summary.source.path),paths=read(pathsPath),priorPaths=read(summary.paths.path)
const type=(s,t)=>s.filter(e=>e.type===t),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
assert.equal(Object.keys(paths).length,33);assert.equal(source.filter(e=>e.type.endsWith('_error')).length,0)
const fixed=s=>s.filter(e=>!['pcb_trace','pcb_via','pcb_copper_pour','source_project_metadata'].includes(e.type))
assert.deepEqual(fixed(source),fixed(previous),'Changed fixed components, pads, keepouts, logical circuit or board rules')
const plane=p=>({...p,brep_shape:{outer_ring:p.brep_shape.outer_ring}})
assert.deepEqual(type(source,'pcb_copper_pour').map(plane),type(previous,'pcb_copper_pour').map(plane))
const changed=new Set(provenance.changedExistingSignals.map(n=>previous.find(e=>e.type==='source_trace'&&e.name===n).source_trace_id))
const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
for(const old of type(previous,'pcb_trace'))if(!changed.has(old.source_trace_id)){
 const now=type(source,'pcb_trace').find(t=>t.source_trace_id===old.source_trace_id);assert(now);assert.deepEqual(geometry(now.route),geometry(old.route))
}
for(const name of Object.keys(priorPaths))if(!provenance.changedExistingSignals.includes(name))assert.deepEqual(paths[name],priorPaths[name])
assert.equal(type(source,'pcb_trace').length,135);assert.equal(type(source,'pcb_via').length,169)
assert.equal(type(source,'source_component').length,212);assert.equal(type(source,'pcb_smtpad').length,912);assert.equal(type(source,'pcb_plated_hole').length,8)
const owner=(s,v)=>{const t=s.find(t=>t.type==='pcb_trace'&&t.pcb_trace_id===v.pcb_trace_id);return t?{trace:t.source_trace_id}:{net:v.source_net_id,connectivityMapKey:v.subcircuit_connectivity_map_key}}
for(const v of type(previous,'pcb_via')){
 if(provenance.replannedOldSignalHoles.includes(v.pcb_via_id)){assert.deepEqual(owner(previous,v),{trace:'source_trace_42'});continue}
 const now=type(source,'pcb_via').find(w=>near(v,w));assert(now)
 for(const key of ['hole_diameter','outer_diameter','layers','source_net_id'])assert.deepEqual(now[key],v[key]);assert.deepEqual(owner(source,now),owner(previous,v))
}
const state=readStagedCasnD3Csn0(provenance.nativeCsn0Run.path.replace(/\/result.json$/,''))
assert.deepEqual(state.run.source,summary.source)
const resetRun=read(provenance.nativeResetRun.path);assert.equal(resetRun.pendingCommandPrefixRepairs,0);verify(resetRun.fullReset)
for(const a of [resetRun.manualPlanRun,resetRun.manualPlan,resetRun.input,resetRun.output,resetRun.executionHelper])verify(a)
const resetPlan=read(resetRun.manualPlan.path),resetIndices=resetPlan.flatMap((p,i)=>p.route_type==='via'?[i]:[]);assert.equal(resetIndices.length,2)
const resetInput=read(resetRun.input.path),resetOutput=read(resetRun.output.path),resetCarrier=resetOutput.traces.at(-1)
assert.deepEqual(resetInput.traces.slice(0,135),state.input.traces);assert.deepEqual(resetOutput.traces.slice(0,137),resetInput.traces);assert.equal(resetOutput.traces.length,138);assert.deepEqual(resetOutput.obstacles,resetInput.obstacles)
assert.deepEqual(resetInput.traces.slice(135).map(t=>t.route),[resetPlan.slice(0,resetIndices[0]),resetPlan.slice(resetIndices[1]+1)])
assert.equal(resetCarrier.source_trace_id,'source_trace_10');assert(resetCarrier.route.every(p=>p.route_type==='wire'&&p.layer==='bottom'&&p.width===.1016))
assert(near(resetCarrier.route[0],resetPlan[resetIndices[0]])&&near(resetCarrier.route.at(-1),resetPlan[resetIndices[1]]))
const resetTail=state.prefixes.find(p=>p.name==='DDR_RESETn').retainedTail
assert.deepEqual(read(resetRun.fullReset.path),[...resetPlan.slice(0,resetIndices[0]),resetPlan[resetIndices[0]],...resetCarrier.route,resetPlan[resetIndices[1]],...resetPlan.slice(resetIndices[1]+1),...resetTail.slice(1)])
const originals={DDR_CASn:read(provenance.nativeCasnRun.path).fullCasn,DDR_D3:read(provenance.nativeD3Run.path).fullD3,DDR_CSn0:read(provenance.nativeCsn0Run.path).fullCsn0,DDR_RESETn:resetRun.fullReset}
for(const [name,a] of Object.entries(originals)){
 verify(a);const clean=[];for(const p of read(a.path)){const q=clean.at(-1);if(q&&p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer&&near(p,q))continue;clean.push(p)}
 let expected=clean.map(p=>p.route_type==='via'?{x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}:{x:p.x,y:p.y})
 const tuning=[provenance.manualWireTuning,...provenance.additionalManualWireTunings??[]].find(t=>t?.signal===name)
 if(tuning){
  for(const a of [tuning.run,tuning.priorReplayPaths,tuning.priorReplayProvenance])verify(a)
  const r=read(tuning.run.path);assert.equal(r.status,'GUARDED_REPLAY_WIRE_LENGTH_ADDED_INDEPENDENT_CHECKS_REQUIRED');assert.equal(r.newPhysicalHoles,0)
  assert.equal(r.signal,name);assert.equal(r.tuning.index,tuning.index);assert.deepEqual(r.tuning.insertedPoints,tuning.insertedPoints)
  assert.deepEqual(read(tuning.priorReplayPaths.path)[name],expected)
  assert.equal(tuning.layer,'bottom');assert.equal(tuning.clearanceMethod,'exact segment-to-circle/rectangle/segment geometry')
  assert(!expected[tuning.index].via&&!expected[tuning.index+1].via);expected.splice(tuning.index+1,0,...tuning.insertedPoints)
  assert.deepEqual(read(r.paths.path)[name],expected);verify(r.paths)
 }
 const shortcut=provenance.manualWireShortcuts?.find(t=>t.signal===name)
 if(shortcut){
  assert.equal(name,'DDR_CSn0');for(const a of [shortcut.run,shortcut.priorReplayPaths,shortcut.priorReplayProvenance,shortcut.priorCheckedSummary])verify(a)
  const r=read(shortcut.run.path),{summary:before}=readCheckedCommandSummary(shortcut.priorCheckedSummary)
  assert.equal(r.status,'COMMAND_NOMINAL_WIRE_SHORTCUT_FOUND_INDEPENDENT_REPLAY_CHECKS_REQUIRED');assert.equal(r.newVias,0);assert.equal(r.signal,name)
  assert.deepEqual(r.cuts,shortcut.cuts);assert.deepEqual(r.priorPaths,shortcut.priorReplayPaths);assert.deepEqual(r.priorCheckedSummary,shortcut.priorCheckedSummary)
  assert.deepEqual(read(shortcut.priorReplayPaths.path)[name],expected);assert.deepEqual(before.paths,shortcut.priorReplayPaths)
  for(const cut of shortcut.cuts){assert.equal(cut.layer,'top');assert(Number.isInteger(cut.from)&&Number.isInteger(cut.to)&&cut.from>=0&&cut.to<expected.length&&cut.to>cut.from+1);assert(expected.slice(cut.from,cut.to+1).every(p=>!p.via));expected=expected.filter((p,i)=>i<=cut.from||i>=cut.to)}
  verify(r.paths);assert.deepEqual(read(r.paths.path)[name],expected);verify(r.executionHelper)
  for(const [other,p] of Object.entries(read(shortcut.priorReplayPaths.path)))if(other!==name)assert.deepEqual(paths[other],p)
 }
 assert.deepEqual(paths[name],expected)
}
const mapPath='lib/am3352/memory-byte1-top-centered-swizzled-connections.json',mapping=read(mapPath),routes={}
for(const [name,path] of Object.entries(paths)){
 const m=mapping.find(m=>m.name===name),st=type(source,'source_trace').find(t=>t.name===name),trace=type(source,'pcb_trace').find(t=>t.source_trace_id===st.source_trace_id);assert(m&&trace)
 assert.equal(trace.route.length,path.length+2);let layer='top'
 for(const [i,p] of path.entries()){const q=trace.route[i+1];assert(near(p,q));if(p.via){assert.equal(q.route_type,'via');assert.equal(q.from_layer,layer);assert.equal(q.to_layer,p.toLayer);layer=p.toLayer}else{assert.equal(q.route_type,'wire');assert.equal(q.layer,layer);assert.equal(q.width,.1016)}assert(['top','bottom'].includes(layer))}
 assert.equal(layer,'top')
 const terminals=[['U_SOC',m.socPin],['U_RAM',m.ramPin]].map(([n,pin])=>{
  const c=type(source,'source_component').find(c=>c.name===n),sp=type(source,'source_port').find(p=>p.source_component_id===c.source_component_id&&p.pin_number===Number(pin.slice(3)));assert(st.connected_source_port_ids.includes(sp.source_port_id));return type(source,'pcb_port').find(p=>p.source_port_id===sp.source_port_id)
 });assert(near(trace.route[0],terminals[0])&&near(trace.route.at(-1),terminals[1]))
 const planarMm=trace.route.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-trace.route[i].x,p.y-trace.route[i].y),0)
 if(provenance.routes[name]){assert(Math.abs(planarMm-provenance.routes[name].planarMm)<1e-8);assert.equal(path.filter(p=>p.via).length,provenance.routes[name].physicalVias);routes[name]={planarMm,physicalVias:path.filter(p=>p.via).length,actualEndpointsMatch:true}}
}
const holes=type(source,'pcb_via');let minimumHoleEdgeGapMm=Infinity
for(let i=0;i<holes.length;i++){const v=holes[i];assert.equal(v.outer_diameter,.4572);assert.equal(v.hole_diameter,.254);assert.deepEqual(new Set(v.layers),new Set(['top','inner1','inner2','bottom']));for(let j=0;j<i;j++){const gap=Math.hypot(v.x-holes[j].x,v.y-holes[j].y)-.254;assert(gap>=.254-1e-8);minimumHoleEdgeGapMm=Math.min(minimumHoleEdgeGapMm,gap)}}
const report={status:'DDR33_COUPLED_REPLAY_EXACT_SOURCE_GEOMETRY_VERIFIED_TIMING_UNQUALIFIED',source:artifact(sourcePath),previousSource:summary.source,paths:artifact(pathsPath),provenance:artifact(provenancePath),priorCheckedSummary:provenance.priorCheckedSummary,memoryMap:artifact(mapPath),
 components:212,actualPads:912,throughHolePads:8,copperLayers:4,tracePieces:135,throughVias:169,preservedTracePieces:131,preservedThroughVias:161,replannedOldSignalHoles:provenance.replannedOldSignalHoles,newThroughVias:8,changedExistingSignals:provenance.changedExistingSignals,addedSignals:provenance.addedSignals,routes,minimumHoleEdgeGapMm,
 allNativeAndManualPathsReconstructed:true,other29DdrPathsUnchanged:true,allOtherCopperUnchanged:true,planeDeclarationsAndBoundariesPreserved:true,planeAntipadsRegenerated:true,wholeByteMatchingQualified:false,commandNominalLengthsQualified:false,...(provenance.manualWireTuning?{manualWireTuning:provenance.manualWireTuning}:{}),...(provenance.additionalManualWireTunings?{additionalManualWireTunings:provenance.additionalManualWireTunings}:{}),
 ...(provenance.manualWireShortcuts?{manualWireShortcuts:provenance.manualWireShortcuts}:{}),defaultChanged:false,originalShellFitVerified:false,fullElectricalTimingQualified:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,signals:33,holes:169,minimumHoleEdgeGapMm,fabricationReady:false}))
