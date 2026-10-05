import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {routeGuardedOuterBridge} from './lib/am3352-flexible-fanout-terminal-bridge.mjs'
import {routeSegments,capsuleIntervals} from './lib/am3352-ddr-spacing-geometry.mjs'

const [priorPath,directory,maxStepsArg='60',secondsArg='15',penaltyArg='.05',maxViasArg='4',routingMode='preserve']=process.argv.slice(2)
assert(priorPath&&directory&&!existsSync(`${directory}/result.json`));const maxSteps=Number(maxStepsArg),seconds=Number(secondsArg),overlapPenalty=Number(penaltyArg),maxVias=Number(maxViasArg);assert(Number.isInteger(maxSteps)&&maxSteps>0&&maxSteps<=100);assert(seconds>0&&seconds<=60);assert(overlapPenalty>0&&overlapPenalty<=100);assert(Number.isInteger(maxVias)&&maxVias>=2&&maxVias<=6)
assert(['preserve','negotiate'].includes(routingMode))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const prior=read(priorPath);assert(prior.state);verify(prior.state);const state=read(prior.state.path)
assert.equal(state.status,'BOTTOM_RAM_NATIVE_AND_MANUAL_STAGED_DDR_COPPER_UNCHECKED');assert(!state.exportable&&!state.fabricationReady)
for(const a of [state.source,state.checkedPlacementSummary,state.sourceValidation,state.nativeBootstrapRun,state.nativePartialSeed,state.nativeOriginalInput])verify(a)
assert.equal(state.originalFixedTraces.length,102);assert.equal(state.definitions.length,49)
state.nativeOriginalCarrierIds??=[...state.nativeCarrierIds];state.negotiatedSteps??=[]
const source=read(state.source.path),signalIds=new Set(state.definitions.map(d=>d.sourceTraceId)),originalHoles=source.filter(t=>t.type==='pcb_via');assert.equal(originalHoles.length,89)
const name=id=>state.definitions.find(d=>d.sourceTraceId===id)?.name
const priority=['DDR_D14','DDR_D11','DDR_D13','DDR_D10','DDR_DQM1','DDR_CKE','DDR_ODT','DDR_A6','DDR_A8','DDR_D2','DDR_D15','DDR_A2','DDR_A10','DDR_A14','DDR_RASn','DDR_A13','DDR_D6','DDR_DQM0','DDR_D1','DDR_D7','DDR_D4','DDR_A0','DDR_D0','DDR_A4','DDR_A7','DDR_RESETn','DDR_CSn0','DDR_D3','DDR_A9','DDR_CASn']
let queue=priority.map(n=>state.definitions.find(d=>d.name===n).sourceTraceId).filter(id=>!state.fullPaths[id])
for(const d of state.definitions)if(!state.fullPaths[d.sourceTraceId]&&!queue.includes(d.sourceTraceId))queue.push(d.sourceTraceId)
const pointDistance=(p,s)=>{const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,t=Math.max(0,Math.min(1,((p.x-s.a.x)*dx+(p.y-s.a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-s.a.x-t*dx,p.y-s.a.y-t*dy)}
const conflict=(a,b)=>{
 const as=routeSegments('a',a.route),bs=routeSegments('b',b.route),av=a.route.filter(p=>p.route_type==='via'),bv=b.route.filter(p=>p.route_type==='via'),epsilon=1e-8
 for(const x of as)for(const y of bs)if(x.layer===y.layer&&capsuleIntervals(x,y,.2032-epsilon).length)return true
 for(const v of av)if(bs.some(s=>pointDistance(v,s)<.381-epsilon))return true
 for(const v of bv)if(as.some(s=>pointDistance(v,s)<.381-epsilon))return true
 for(const v of av)for(const w of bv)if(Math.hypot(v.x-w.x,v.y-w.y)<.5588-epsilon)return true
 return false
}
const shapesFor=(owner)=>{
 const shapes=[]
 for(const o of state.originalObstacles){const layers=o.layers.filter(l=>['top','bottom'].includes(l));if(layers.length)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers,pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:o.connectedTo?.find(n=>signalIds.has(n))})}
 const addTrace=(t,soft,weight=1)=>{const owner=t.source_trace_id??t.connection_name;for(let i=0;i<t.route.length;i++){const p=t.route[i];if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,hole:p.via_hole_diameter,layers:['top','bottom'],owner,soft,softWeight:weight});if(i){const a=t.route[i-1];if(Math.hypot(a.x-p.x,a.y-p.y)>1e-8){const layer=a.route_type==='wire'?a.layer:p.layer;if(['top','bottom'].includes(layer))shapes.push({kind:'segment',a,b:p,w:Math.max(a.width??.1016,p.width??.1016),layers:[layer],owner,soft,softWeight:weight})}}}}
 for(const t of state.originalFixedTraces)addTrace(t,false)
 for(const v of originalHoles)shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers:['top','bottom']})
 for(const t of state.originalEscapes)if(!state.prunedUncommittedNativeDogbones.includes(t.pcb_trace_id))addTrace(t,false)
 for(const [id,t] of Object.entries(state.fullPaths))addTrace(t,routingMode==='negotiate',state.nativeCarrierIds.includes(id)?4:1)
 // The native local escapes reserve access for the missing signals without
 // pretending those uncommitted holes already exist on the source board.
 return shapes
}
mkdirSync(directory,{recursive:true});const snapshot=`${directory}/negotiated-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/route-am3352-bottom-flexible-fanout.mjs'))
state.fixedNativeFanoutPlanning=true;state.openedInitialStagedPaths=[]
for(const [id,t] of Object.entries(state.fullPaths)){
 if(state.nativeCarrierIds.includes(id)&&!state.originalEscapes.some(e=>e.source_trace_id!==id&&conflict(t,e)))continue
 const path=`${directory}/initial-opened-${id}.json`;writeFileSync(path,JSON.stringify(t.route)+'\n');state.openedInitialStagedPaths.push({sourceTraceId:id,name:name(id),route:artifact(path),wasRetainedNativeCarrier:state.nativeCarrierIds.includes(id)});delete state.fullPaths[id];state.nativeCarrierIds=state.nativeCarrierIds.filter(n=>n!==id)
}
queue=state.definitions.filter(d=>!state.fullPaths[d.sourceTraceId]).sort((a,b)=>(priority.indexOf(a.name)<0?999:priority.indexOf(a.name))-(priority.indexOf(b.name)<0?999:priority.indexOf(b.name))).map(d=>d.sourceTraceId)
const report={routingMode,fixedNativeFanoutsRetained:49,initialOpenedStagedPaths:state.openedInitialStagedPaths,status:'BOTTOM_RAM_NEGOTIATED_PLANNING_IN_PROGRESS',initialStage:artifact(priorPath),initialState:prior.state,source:state.source,nativeBootstrapRun:state.nativeBootstrapRun,nativePartialSeed:state.nativePartialSeed,executionHelper:artifact(snapshot),guardHelper:artifact('scripts/lib/am3352-flexible-fanout-terminal-bridge.mjs'),geometryHelper:artifact('scripts/lib/am3352-ddr-spacing-geometry.mjs'),maxSteps,secondsPerStep:seconds,overlapPenalty,maxVias,heuristicWeight:1.5,steps:[],original89SourceHolesRetained:true,original102SourcePiecesRetained:true,qualifiedNewDdrSignals:0,exportable:false,defaultChanged:false,fullElectricalTimingQualified:false,originalShellFitVerified:false,fabricationReady:false}
const save=()=>{report.stagedFullRoutes=Object.keys(state.fullPaths).length;report.remainingDdrSignals=49-report.stagedFullRoutes;report.nativeCarriersRetained=state.nativeCarrierIds.length;report.prunedUncommittedNativeDogbones=[...state.prunedUncommittedNativeDogbones];report.pendingQueue=queue.map(name);writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')};save()
let consecutiveFailures=0
for(let step=0;step<maxSteps&&queue.length;step++){
 const owner=queue.shift();if(state.fullPaths[owner])continue
 const d=state.definitions.find(d=>d.sourceTraceId===owner),connection={name:owner,source_trace_id:owner,pointsToConnect:state.connections.find(c=>c.name===owner).pointsToConnect.map(p=>({...p}))}
 const r=routeGuardedOuterBridge({connection,shapes:shapesFor(owner),searchBounds:{minX:-12,maxX:12,minY:-38.5,maxY:9.5},seconds,gridMm:.02,maxVias,viaGrid:.02,overlapPenalty})
 if(r.route){const vias=r.route.filter(p=>p.route_type==='via');for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)if(Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)<.508-1e-8){delete r.route;r.error='Mutual new-hole separation failed'}}
 if(r.route){
  const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8,reverse=route=>route.toReversed().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:{...p}),a=state.originalEscapes.find(t=>t.source_trace_id===owner&&near(t.route[0],d.endpoints[0])&&near(t.route.at(-1),r.route[0])),b=state.originalEscapes.find(t=>t.source_trace_id===owner&&t!==a&&near(t.route[0],d.endpoints[1])&&near(t.route.at(-1),r.route.at(-1)))
  const normalize=(t,endpoint,terminal)=>{if(!t)return undefined;if(t.route.at(-1).layer===terminal.layer)return t;assert.equal(terminal.layer,endpoint.layer);state.prunedUncommittedNativeDogbones.push(t.pcb_trace_id);return{...t,route:t.route.filter(p=>p.route_type==='wire'&&p.layer===endpoint.layer)}}
  const prefix=normalize(a,d.endpoints[0],r.route[0]),suffix=normalize(b,d.endpoints[1],r.route.at(-1))
  r.carrierPlanarMm=r.lengthMm;r.route=[...(prefix?.route.slice(0,-1)??[]),...r.route,...(suffix?reverse(suffix.route).slice(1):[])];r.lengthMm=r.route.reduce((sum,p,i)=>sum+(i?Math.hypot(p.x-r.route[i-1].x,p.y-r.route[i-1].y):0),0)
  assert(near(r.route[0],d.endpoints[0])&&r.route[0].layer===d.endpoints[0].layer);assert(near(r.route.at(-1),d.endpoints[1])&&r.route.at(-1).layer===d.endpoints[1].layer)
 }
 const details={step,signal:d.name,sourceTraceId:owner,result:{...r,route:undefined}}
 if(r.route){
  const full={type:'pcb_trace',pcb_trace_id:`staged_full_${owner}`,source_trace_id:owner,connection_name:owner,route:r.route},opened=[]
  for(const [id,t] of Object.entries(state.fullPaths))if(conflict(full,t)){
   const path=`${directory}/step-${step}-opened-${id}.json`;writeFileSync(path,JSON.stringify(t.route)+'\n');opened.push({sourceTraceId:id,name:name(id),route:artifact(path),wasRetainedNativeCarrier:state.nativeCarrierIds.includes(id)});delete state.fullPaths[id];state.nativeCarrierIds=state.nativeCarrierIds.filter(n=>n!==id);if(!queue.includes(id))queue.push(id)
  }
  const routePath=`${directory}/step-${step}-${d.name.toLowerCase()}-route.json`;writeFileSync(routePath,JSON.stringify(r.route)+'\n');state.fullPaths[owner]=full
  const change={step,signal:d.name,sourceTraceId:owner,route:artifact(routePath),openedStagedPaths:opened,planarMm:r.lengthMm,newVias:r.newVias};state.negotiatedSteps.push(change);details.change=change;consecutiveFailures=0
 }else{queue.push(owner);consecutiveFailures++}
 report.steps.push(details);save();console.log(JSON.stringify({step,signal:d.name,found:!!r.route,opened:details.change?.openedStagedPaths.map(s=>s.name),staged:report.stagedFullRoutes,remaining:report.remainingDdrSignals,retainedNative:state.nativeCarrierIds.length,exportable:false}))
 if(consecutiveFailures>=queue.length){report.status='BOTTOM_RAM_NEGOTIATED_PLANNING_STOPPED_AFTER_ALL_PENDING_ROUTES_UNFINISHED';break}
}
if(report.status==='BOTTOM_RAM_NEGOTIATED_PLANNING_IN_PROGRESS')report.status=queue.length?'BOTTOM_RAM_NEGOTIATED_PLANNING_STEP_LIMIT_DDR_INCOMPLETE':'BOTTOM_RAM_NEGOTIATED_ALL49_PLANNED_REPLAY_AND_ALL_CHECKS_REQUIRED'
const statePath=`${directory}/staged-state.nonexportable.json`;writeFileSync(statePath,JSON.stringify(state)+'\n');report.state=artifact(statePath);save();console.log(JSON.stringify({status:report.status,staged:report.stagedFullRoutes,remaining:report.remainingDdrSignals,retainedNative:report.nativeCarriersRetained,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false}));process.exitCode=queue.length?1:0
