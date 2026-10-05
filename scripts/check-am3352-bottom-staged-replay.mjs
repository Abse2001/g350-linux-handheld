import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [sourcePath,pathsPath,reportPath]=process.argv.slice(2);assert(sourcePath&&pathsPath&&reportPath)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const provenancePath=pathsPath.replace(/\.json$/,'.provenance.json'),p=read(provenancePath)
for(const a of [p.entry,p.paths,p.stageRun,p.stageState,p.source,p.checkedPlacementSummary,p.nativeBootstrapRun,p.nativePartialSeed,...p.manualRuns])verify(a)
const s=read(sourcePath),old=read(p.source.path),state=read(p.stageState.path),types=(a,t)=>a.filter(e=>e.type===t),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
const unchanged=['source_component','source_port','source_net','source_trace','source_manually_placed_via','pcb_component','pcb_board','pcb_smtpad','pcb_port','pcb_plated_hole','pcb_hole','pcb_keepout']
for(const t of unchanged)assert.deepEqual(types(s,t),types(old,t),`Changed fixed ${t} records`)
assert.equal(s.filter(e=>e.type.endsWith('_error')).length,0)
const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
for(const t of types(old,'pcb_trace')){const now=types(s,'pcb_trace').find(n=>n.source_trace_id===t.source_trace_id);assert(now);assert.deepEqual(geometry(now.route),geometry(t.route),'Changed existing host/reference/USB trace')}
const named=types(s,'source_trace'),results=[]
for(const d of state.definitions){
 const planned=state.fullPaths[d.sourceTraceId],actual=types(s,'pcb_trace').filter(t=>t.source_trace_id===d.sourceTraceId)
 assert.equal(actual.length,planned?1:0)
 if(!planned)continue
 assert.equal(named.find(t=>t.source_trace_id===d.sourceTraceId).name,d.name)
 assert.equal(actual[0].route.length,planned.route.length,`Changed ${d.name} point count`)
 for(const [i,q] of actual[0].route.entries()){
  const expected=planned.route[i];assert(near(q,expected),`Changed ${d.name} point ${i}`)
  assert.deepEqual(geometry([q]).map(({x,y,...rest})=>rest),geometry([expected]).map(({x,y,...rest})=>rest),`Changed ${d.name} primitive ${i}`)
 }
 assert(near(actual[0].route[0],d.endpoints[0])&&near(actual[0].route.at(-1),d.endpoints[1]))
 results.push({name:d.name,sourceTraceId:d.sourceTraceId,trace:actual[0].pcb_trace_id,planarMm:actual[0].route.reduce((sum,q,i)=>sum+(i?Math.hypot(q.x-actual[0].route[i-1].x,q.y-actual[0].route[i-1].y):0),0),vias:actual[0].route.filter(q=>q.route_type==='via').length,nativeBootstrapRetained:state.nativeCarrierIds.includes(d.sourceTraceId)})
}
const holes=types(s,'pcb_via'),originalHoles=types(old,'pcb_via')
assert.equal(originalHoles.length,89)
for(const h of originalHoles){const matches=holes.filter(v=>near(v,h));assert.equal(matches.length,1);const v=matches[0];assert.equal(v.outer_diameter,h.outer_diameter);assert.equal(v.hole_diameter,h.hole_diameter);assert.deepEqual(v.layers,h.layers);assert.equal(v.source_trace_id,h.source_trace_id);assert.equal(v.source_net_id,h.source_net_id)}
for(const v of holes){assert.equal(v.outer_diameter,.4572);assert.equal(v.hole_diameter,.254);assert.deepEqual(new Set(v.layers),new Set(['top','inner1','inner2','bottom']))}
const plannedHoles=Object.values(state.fullPaths).flatMap(t=>t.route.filter(q=>q.route_type==='via').map(q=>({...q,source_trace_id:t.source_trace_id})))
assert.equal(holes.length,89+plannedHoles.length)
for(const v of plannedHoles){const h=holes.filter(h=>near(h,v));assert.equal(h.length,1);const trace=types(s,'pcb_trace').find(t=>t.pcb_trace_id===h[0].pcb_trace_id);assert.equal(trace?.source_trace_id,v.source_trace_id)}
for(const pour of types(old,'pcb_copper_pour')){const now=types(s,'pcb_copper_pour').find(q=>q.layer===pour.layer);assert.equal(now.source_net_id,pour.source_net_id);assert.equal(now.clearance,pour.clearance);assert.deepEqual(now.brep_shape.outer_ring,pour.brep_shape.outer_ring)}
assert.equal(types(s,'pcb_trace').length,102+results.length);assert.equal(types(s,'source_component').length,212);assert.equal(types(s,'pcb_smtpad').length,912)
const report={status:'BOTTOM_RAM_NATIVE_AND_MANUAL_PATHS_EXACT_SOURCE_REPLAY_VERIFIED_PHYSICAL_CHECKS_PENDING',source:artifact(sourcePath),paths:artifact(pathsPath),provenance:artifact(provenancePath),priorSource:p.source,stageState:p.stageState,actualDdrPaths:results,stagedDdrRoutes:results.length,remainingDdrSignals:49-results.length,nativeCarriersRetained:state.nativeCarrierIds.length,manualRoutes:state.manualSteps.length,original89SourceHolesPreserved:true,original102SourcePiecesPreserved:true,allFixedPhysicalAndLogicalRecordsPreserved:true,components:212,actualPads:912,copperLayers:4,physicalVias:holes.length,tracePieces:102+results.length,completeHostRouting:false,fullElectricalTimingQualified:false,originalShellFitVerified:false,defaultChanged:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,staged:results.length,native:state.nativeCarrierIds.length,manual:state.manualSteps.length,holes:holes.length,fabricationReady:false}))
