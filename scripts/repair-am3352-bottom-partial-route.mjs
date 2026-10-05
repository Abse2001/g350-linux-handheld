import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {routeGuardedOuterBridge} from './lib/am3352-guarded-outer-bridge.mjs'

// Manual additions to an explicitly unsolved native bootstrap. All physical
// holes/copper of the checked host source remain fixed. Uncommitted local
// native dogbones may be pruned only for the selected net, with provenance.
const [priorPath,directory,signal,secondsArg='15',reservations='retain']=process.argv.slice(2);assert(priorPath&&directory&&signal&&!existsSync(`${directory}/result.json`));const seconds=Number(secondsArg);assert(seconds>0&&seconds<=60);assert(['retain','replan-unrouted'].includes(reservations))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
const prior=read(priorPath);let state
const reversed=route=>route.toReversed().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:{...p})
const join=(carrier,escapes,endpoints)=>{
 const prefix=escapes.find(t=>near(t.route[0],endpoints[0])&&near(t.route.at(-1),carrier.route[0])),suffix=escapes.find(t=>t!==prefix&&near(t.route[0],endpoints[1])&&near(t.route.at(-1),carrier.route.at(-1)))
 const route=[...(prefix?.route.slice(0,-1)??[]),...carrier.route,...(suffix?reversed(suffix.route).slice(1):[])]
 assert(near(route[0],endpoints[0])&&route[0].layer===endpoints[0].layer);assert(near(route.at(-1),endpoints[1])&&route.at(-1).layer===endpoints[1].layer)
 return{type:'pcb_trace',pcb_trace_id:`staged_full_${carrier.source_trace_id}`,source_trace_id:carrier.source_trace_id,connection_name:carrier.source_trace_id,route}
}
if(prior.partialSeed){
 for(const a of [prior.source,prior.checkedPlacementSummary,prior.sourceValidation,prior.input,prior.partialSeed])verify(a)
 const seed=read(prior.partialSeed.path),validation=read(prior.sourceValidation.path),original=read(prior.input.path);assert.equal(seed.status,'UNSOLVED_NATIVE_PARTIAL_SEED_MANUAL_REPAIR_AND_ALL_CHECKS_REQUIRED');assert(!seed.exportable&&!seed.fabricationReady);assert.deepEqual(seed.source,prior.source);assert.equal(seed.escapes.length,49);assert.equal(original.traces.length,102)
 assert.deepEqual(seed.childInput.traces.slice(0,102),original.traces);assert.deepEqual(seed.childInput.traces.slice(102),seed.escapes);assert.deepEqual(seed.childInput.obstacles,original.obstacles)
 const fullPaths=Object.fromEntries(seed.carriers.map(t=>{const d=validation.ddrEndpoints.find(d=>d.sourceTraceId===t.source_trace_id);assert(d);return[t.source_trace_id,join(t,seed.escapes,d.endpoints)]}))
 assert.equal(Object.keys(fullPaths).length,seed.carriers.length)
 state={status:'BOTTOM_RAM_NATIVE_AND_MANUAL_STAGED_DDR_COPPER_UNCHECKED',source:prior.source,checkedPlacementSummary:prior.checkedPlacementSummary,sourceValidation:prior.sourceValidation,nativeBootstrapRun:artifact(priorPath),nativePartialSeed:prior.partialSeed,nativeOriginalInput:prior.input,originalFixedTraces:original.traces,originalObstacles:original.obstacles,originalEscapes:seed.escapes,nativeCarrierIds:seed.carriers.map(t=>t.source_trace_id),fullPaths,definitions:validation.ddrEndpoints,connections:seed.childInput.connections,manualSteps:[],prunedUncommittedNativeDogbones:[],originalSourcePhysicalHolesPreserved:89,qualifiedNewDdrSignals:0,exportable:false,fullElectricalTimingQualified:false,originalShellFitVerified:false,defaultChanged:false,fabricationReady:false}
}else{
 assert.equal(prior.status,'BOTTOM_RAM_MANUAL_ROUTE_PLAN_FOUND_REPLAY_AND_ALL_CHECKS_REQUIRED');verify(prior.state);state=read(prior.state.path)
}
for(const a of [state.source,state.checkedPlacementSummary,state.sourceValidation,state.nativeBootstrapRun,state.nativePartialSeed,state.nativeOriginalInput])verify(a)
assert.equal(state.status,'BOTTOM_RAM_NATIVE_AND_MANUAL_STAGED_DDR_COPPER_UNCHECKED');assert.equal(state.originalFixedTraces.length,102);assert.equal(state.definitions.length,49);assert(!state.exportable&&!state.fabricationReady)
const definition=state.definitions.find(d=>d.name===signal);assert(definition&&!state.fullPaths[definition.sourceTraceId]);const owner=definition.sourceTraceId,connection=structuredClone(state.connections.find(c=>c.name===owner));assert(connection)
if(reservations==='replan-unrouted')connection.pointsToConnect=definition.endpoints.map(p=>({...p}))
const traces=[...state.originalFixedTraces,...(reservations==='retain'?state.originalEscapes.filter(t=>!state.fullPaths[t.source_trace_id]):[]),...Object.values(state.fullPaths)]
const signalIds=new Set(state.definitions.map(d=>d.sourceTraceId)),shapes=[]
for(const o of state.originalObstacles){const layers=o.layers.filter(l=>['top','bottom'].includes(l));if(!layers.length)continue;shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers,pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:o.connectedTo?.find(n=>signalIds.has(n))})}
const addTrace=t=>{const owner=t.source_trace_id??t.connection_name;for(let i=0;i<t.route.length;i++){const p=t.route[i];if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,hole:p.via_hole_diameter,layers:['top','bottom'],owner});if(i){const a=t.route[i-1];if(Math.hypot(a.x-p.x,a.y-p.y)>1e-8){const layer=a.route_type==='wire'?a.layer:p.layer;if(['top','bottom'].includes(layer))shapes.push({kind:'segment',a,b:p,w:Math.max(a.width??.1016,p.width??.1016),layers:[layer],owner})}}}}
for(const t of traces)addTrace(t)
const source=read(state.source.path);assert.equal(source.filter(t=>t.type==='pcb_via').length,89);for(const v of source.filter(t=>t.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers:['top','bottom']})
const searchBounds={minX:-12,maxX:12,minY:-38.5,maxY:9.5};assert(connection.pointsToConnect.every(p=>p.x>=searchBounds.minX&&p.x<=searchBounds.maxX&&p.y>=searchBounds.minY&&p.y<=searchBounds.maxY))
mkdirSync(directory,{recursive:true});const snapshot=`${directory}/manual-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/repair-am3352-bottom-partial-route.mjs'))
console.log(JSON.stringify({signal,stage:'MANUAL_WHOLE_CHANNEL_SEARCH',nativeCarriersRetained:state.nativeCarrierIds.length,stagedFullRoutes:Object.keys(state.fullPaths).length,remaining:49-Object.keys(state.fullPaths).length,exportable:false}))
const result=routeGuardedOuterBridge({connection,shapes,searchBounds,seconds,gridMm:.02,maxVias:6,viaGrid:.02})
if(result.route){const vias=result.route.filter(p=>p.route_type==='via');for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)if(Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)<.508-1e-8){delete result.route;result.error='Planned new holes violate mutual drill clearance'}}
const report={status:result.route?'BOTTOM_RAM_MANUAL_ROUTE_PLAN_FOUND_REPLAY_AND_ALL_CHECKS_REQUIRED':'BOTTOM_RAM_MANUAL_ROUTE_PLAN_FAILED',source:state.source,checkedPlacementSummary:state.checkedPlacementSummary,nativeBootstrapRun:state.nativeBootstrapRun,nativePartialSeed:state.nativePartialSeed,priorStage:artifact(priorPath),executionHelper:artifact(snapshot),guardHelper:artifact('scripts/lib/am3352-guarded-outer-bridge.mjs'),signal,sourceTraceId:owner,result:{...result,route:undefined},reservations,openedUncommittedUnroutedDogbones:reservations==='replan-unrouted'?state.originalEscapes.filter(t=>!state.fullPaths[t.source_trace_id]).map(t=>t.pcb_trace_id):[],actualPadEndpointsUsed:reservations==='replan-unrouted',searchBounds,gridMm:.02,maximumNewVias:6,original89SourceHolesRetained:true,original102SourcePiecesRetained:true,nativeCarriersRetained:state.nativeCarrierIds.length,qualifiedNewDdrSignals:0,exportable:false,fullElectricalTimingQualified:false,originalShellFitVerified:false,defaultChanged:false,fabricationReady:false}
if(result.route){
 const pruned=[]
 const local=reservations==='replan-unrouted'?[]:state.originalEscapes.filter(t=>t.source_trace_id===owner).map(t=>{const endpoint=definition.endpoints.find(p=>near(p,t.route[0])),terminal=result.route.find(p=>near(p,t.route.at(-1))&&p.route_type==='wire');assert(endpoint&&terminal)
  if(terminal.layer===endpoint.layer){pruned.push(t.pcb_trace_id);return{...t,route:t.route.filter(p=>p.route_type==='wire'&&p.layer===endpoint.layer)}}
  assert(t.route.some(p=>p.route_type==='via'&&p.to_layer===terminal.layer));return t
 })
 const carrier={source_trace_id:owner,route:result.route},full=join(carrier,local,definition.endpoints)
 state.fullPaths[owner]=full;state.prunedUncommittedNativeDogbones.push(...pruned);state.manualSteps.push({run:`${directory}/result.json`,signal,sourceTraceId:owner,lengthMm:result.lengthMm,newVias:result.newVias,prunedNativeDogbones:pruned,reservations,openedUncommittedUnroutedDogbones:report.openedUncommittedUnroutedDogbones})
 for(const id of state.nativeCarrierIds)assert(state.fullPaths[id]);assert.equal(Object.keys(state.fullPaths).length+state.definitions.filter(d=>!state.fullPaths[d.sourceTraceId]).length,49)
 const routePath=`${directory}/manual-carrier-plan.json`,statePath=`${directory}/staged-state.nonexportable.json`;writeFileSync(routePath,JSON.stringify(result.route,null,2)+'\n');writeFileSync(statePath,JSON.stringify(state)+'\n');report.manualCarrierPlan=artifact(routePath);report.state=artifact(statePath);report.prunedUncommittedNativeDogbones=pruned;report.stagedFullRoutes=Object.keys(state.fullPaths).length;report.remainingDdrSignals=49-report.stagedFullRoutes
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,signal,result:report.result,stagedFullRoutes:report.stagedFullRoutes,remaining:report.remainingDdrSignals,exportable:false,fabricationReady:false}));process.exitCode=result.route?0:1
