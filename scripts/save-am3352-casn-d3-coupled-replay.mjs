import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readStagedCasnD3Csn0} from './lib/am3352-staged-casn-d3-csn0.mjs'

// Dedicated diagnostic saver: reconstruct every opened signal, retaining
// actual native carriers. A staged success flag alone cannot authorize it.
const [directory,destination]=process.argv.slice(2);assert(directory&&destination&&!existsSync(destination))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const run=read(`${directory}/result.json`);assert.equal(run.status,'STAGED_ALL_CASN_NEIGHBORS_REPAIRED_COMPLETE_REPLAY_AND_TIMING_CHECKS_REQUIRED');assert.equal(run.pendingCommandPrefixRepairs,0)
for(const a of [run.source,run.nativeCsn0Run,run.manualPlanRun,run.manualPlan,run.input,run.output,run.fullReset,run.executionHelper])verify(a)
const state=readStagedCasnD3Csn0(run.nativeCsn0Run.path.replace(/\/result.json$/,''));assert.deepEqual(state.run.source,run.source)
const manualRun=read(run.manualPlanRun.path);verify(manualRun.fixedCopper);assert.deepEqual(read(manualRun.fixedCopper.path),state.input)
const plan=read(run.manualPlan.path),indices=plan.flatMap((p,i)=>p.route_type==='via'?[i]:[]);assert.equal(indices.length,2)
const input=read(run.input.path),output=read(run.output.path),native=output.traces.at(-1)
assert.deepEqual(input.traces.slice(0,135),state.input.traces);assert.deepEqual(output.traces.slice(0,137),input.traces);assert.equal(output.traces.length,138)
assert.deepEqual(input.traces.slice(135).map(t=>t.route),[plan.slice(0,indices[0]),plan.slice(indices[1]+1)])
assert.deepEqual(input.obstacles.slice(0,state.input.obstacles.length),state.input.obstacles);assert.equal(input.obstacles.length,state.input.obstacles.length+2);assert.deepEqual(output.obstacles,input.obstacles)
assert.equal(native.source_trace_id,'source_trace_10');assert(native.route.every(p=>p.route_type==='wire'&&p.layer==='bottom'&&p.width===.1016))
const resetPrefix=state.prefixes.find(p=>p.name==='DDR_RESETn'),fullReset=[...plan.slice(0,indices[0]),plan[indices[0]],...native.route,plan[indices[1]],...plan.slice(indices[1]+1),...resetPrefix.retainedTail.slice(1)]
assert.deepEqual(read(run.fullReset.path),fullReset);state.input.traces.find(t=>t.source_trace_id==='source_trace_10').route=fullReset
const originalPaths=read(state.summary.paths.path);verify(state.summary.paths);const paths=structuredClone(originalPaths),names=['DDR_CASn','DDR_D3','DDR_CSn0','DDR_RESETn'],routes={}
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
for(const name of names){
 const st=state.source.find(e=>e.type==='source_trace'&&e.name===name),t=state.input.traces.find(t=>t.source_trace_id===st.source_trace_id);assert(t)
 const pads=st.connected_source_port_ids.map(id=>state.source.find(p=>p.type==='pcb_port'&&p.source_port_id===id));assert(near(t.route[0],pads[0])&&near(t.route.at(-1),pads[1]))
 const clean=[];for(const p of t.route){const prev=clean.at(-1);if(prev&&prev.route_type==='wire'&&p.route_type==='wire'&&prev.layer===p.layer&&near(prev,p))continue;clean.push(p)}
 let layer='top';paths[name]=clean.map(p=>{
  if(p.route_type==='via'){assert.equal(p.from_layer,layer);assert.equal(p.via_diameter,.4572);assert.equal(p.via_hole_diameter,.254);assert.deepEqual(p.layers,['top','inner1','inner2','bottom']);layer=p.to_layer;assert(['top','bottom'].includes(layer));return{x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}}
  assert.equal(p.route_type,'wire');assert.equal(p.layer,layer);assert.equal(p.width,.1016);return{x:p.x,y:p.y}
 });assert.equal(layer,'top')
 routes[name]={planarMm:paths[name].slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-paths[name][i].x,p.y-paths[name][i].y),0),physicalVias:paths[name].filter(p=>p.via).length,actualCpuAndRamPadsMatch:true}
}
assert.equal(Object.keys(paths).length,33);for(const name of Object.keys(originalPaths).filter(n=>!names.includes(n)))assert.deepEqual(paths[name],originalPaths[name])
const oldHoles=state.source.filter(v=>v.type==='pcb_via'&&!state.omittedHoleIds.has(v.pcb_via_id)),newHoles=names.flatMap(n=>paths[n].filter(p=>p.via)),holes=[...oldHoles,...newHoles]
assert.equal(oldHoles.length,161);assert.equal(newHoles.length,8);assert.equal(holes.length,169)
let minimumHoleEdgeGapMm=Infinity
for(let i=0;i<holes.length;i++)for(let j=0;j<i;j++){const gap=Math.hypot(holes[i].x-holes[j].x,holes[i].y-holes[j].y)-.254;assert(gap>=.254-1e-8);minimumHoleEdgeGapMm=Math.min(minimumHoleEdgeGapMm,gap)}
writeFileSync(destination,JSON.stringify(paths,null,2)+'\n')
const provenance={status:'DDR33_CASN_D3_CSN0_RESET_COMPLETE_DIAGNOSTIC_REPLAY_INDEPENDENT_CHECKS_REQUIRED',source:run.source,priorPaths:state.summary.paths,priorCheckedSummary:run.checkedSourceSummary,
 nativeCasnRun:state.casnRun?artifact('dist/am3352-ddr32-casn-d3-open-native-bottom-leg-attempt-673/result.json'):null,nativeD3Run:state.run.nativeD3Run,nativeCsn0Run:run.nativeCsn0Run,nativeResetRun:artifact(`${directory}/result.json`),nativeResetInput:run.input,nativeResetOutput:run.output,
 paths:artifact(destination),addedSignals:['DDR_CASn'],changedExistingSignals:['DDR_D3','DDR_CSn0','DDR_RESETn'],fullyReconstructedSignals:names,allActualEndpointsMatch:true,
 preservedExistingSignalPaths:29,connectedCandidateSignals:33,remainingUnroutedDdrSignals:16,oldThroughViasPreserved:161,replannedOldSignalHoles:['pcb_via_145','pcb_via_146'],newThroughVias:8,expectedThroughVias:169,expectedTracePieces:135,minimumHoleEdgeGapMm,routes,
 nativeBusLanesBootstrap:true,manualRepairs:true,pendingOpenedSignalRepairs:[],eligibleForDiagnosticReplay:true,wholeByteMatchingQualified:false,commandNominalLengthsQualified:false,
 copperLayers:4,referenceLayersReserved:['inner1','inner2'],defaultChanged:false,originalShellFitVerified:false,fullElectricalTimingQualified:false,fabricationReady:false}
assert(provenance.nativeCasnRun);writeFileSync(destination.replace(/\.json$/,'.provenance.json'),JSON.stringify(provenance,null,2)+'\n')
console.log(JSON.stringify({status:provenance.status,signals:33,physicalHoles:169,changedSignals:provenance.changedExistingSignals,routes,minimumHoleEdgeGapMm,fabricationReady:false}))
