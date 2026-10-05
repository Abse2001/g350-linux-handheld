import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {routeSegments,capsuleIntervals} from './lib/am3352-ddr-spacing-geometry.mjs'
import {routeGuardedOuterBridge} from './lib/am3352-command-terminal-bridge.mjs'

// Manual repairs of a latest-core native phase bootstrap. Keep every checked
// physical fanout, byte/reset channel and host/reference/USB copper item hard.
const [directory,secondsArg='8',selection='all',priorStatePath,mode='negotiate',maxStepsArg='60',penaltyArg='.6',gridArg='.04',maxViasArg='6']=process.argv.slice(2)
assert(directory&&!existsSync(`${directory}/result.json`))
assert.equal(mode,'negotiate');const maxSteps=Number(maxStepsArg),penalty=Number(penaltyArg);assert(Number.isInteger(maxSteps)&&maxSteps>0&&maxSteps<=100);assert(penalty>0&&penalty<=10)
const gridMm=Number(gridArg),maxVias=Number(maxViasArg);assert([.02,.04].includes(gridMm));assert(Number.isInteger(maxVias)&&maxVias>=2&&maxVias<=6)
const seconds=Number(secondsArg);assert(seconds>0&&seconds<=30)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const summaryPath='checks/integrated/am3352-command-replan-check-summary.json',summary=read(summaryPath)
for(const a of [summary.source,summary.board,summary.manualFanoutPlan])assert.equal(hash(a.path),a.sha256)
assert.equal(summary.cpuManualFanoutsConnected,26);assert.equal(summary.ramManualFanoutsConnected,26)
const originalAudit=read('checks/integrated/am3352-command-replan-input-preservation.json')
const sourceRef=mode!=='fixed'?originalAudit.source:summary.source
assert.equal(hash(sourceRef.path),sourceRef.sha256)
const source=read(sourceRef.path)
const inputPath=mode!=='fixed'?'dist/am3352-ddr23-command-replan-manual-bootstrap-input/input.simple-route.json':'dist/am3352-ddr23-command-replan-manual-fanouts-attempt-763/input.simple-route.json',input=read(inputPath)
assert.equal(input.connections.length,26);assert.equal(input.layerCount,4)
const alignedBounds={minX:Math.ceil(input.bounds.minX/gridMm)*gridMm,maxX:Math.floor(input.bounds.maxX/gridMm)*gridMm,minY:Math.ceil(input.bounds.minY/gridMm)*gridMm,maxY:Math.floor(input.bounds.maxY/gridMm)*gridMm}
const traceById=new Map(source.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e]))
const signalIds=new Set(source.filter(e=>e.type==='source_trace'&&/^DDR_/.test(e.name)).map(e=>e.source_trace_id))
const connectivityOwner=new Map([...traceById.values()].filter(t=>signalIds.has(t.source_trace_id)).map(t=>[t.subcircuit_connectivity_map_key,t.source_trace_id]))
const priorState=priorStatePath?read(priorStatePath):{};const initialCarriers=priorState.carriers??[],hardCarrierIds=new Set(priorState.hardCarrierIds??[]),ripupCounts=new Map(priorState.ripupCounts??[])
const carriers=structuredClone(initialCarriers),attempts=[]
const definitions=input.connections.map(c=>({connection:c,name:traceById.get(c.name).name}))
const selected=selection==='all'?definitions:selection.split(',').map(name=>{const d=definitions.find(d=>d.name===name);assert(d);return d})
// Closely spaced clock signals are left together for native paired routing.
const priority=['DDR_A1','DDR_ODT','DDR_CASn','DDR_CSn0','DDR_BA1','DDR_BA2','DDR_A7','DDR_A11','DDR_A3','DDR_A5','DDR_A4','DDR_A6','DDR_BA0','DDR_A0','DDR_A2','DDR_A9','DDR_A13','DDR_A10','DDR_A12','DDR_A14','DDR_A8','DDR_WEn','DDR_RASn','DDR_CKE','DDR_CK','DDR_CKn']
selected.sort((a,b)=>priority.indexOf(a.name)-priority.indexOf(b.name))
const layers=['top','bottom'],shapes=[]
for(const o of input.obstacles){
 const ls=o.layers.filter(l=>layers.includes(l));if(!ls.length)continue
 const v=source.find(v=>v.type==='pcb_via'&&v.pcb_via_id===o.circuitJsonMetadata?.pcb_via_id)
 shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:ls,pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,hole:v?.hole_diameter,owner:v?connectivityOwner.get(v.subcircuit_connectivity_map_key):o.connectedTo?.find(n=>signalIds.has(n))})
}
for(const v of source.filter(e=>e.type==='pcb_via'||e.type==='pcb_plated_hole'))if(v.x!==undefined)shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter??v.outer_width,h:v.outer_diameter??v.outer_height,hole:v.hole_diameter,layers,owner:connectivityOwner.get(v.subcircuit_connectivity_map_key)})
const addTrace=(t,soft=false)=>{
 const owner=t.source_trace_id??t.connection_name
 for(let k=0;k<t.route.length;k++){
  const p=t.route[k]
  if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter??p.outer_diameter,h:p.via_diameter??p.outer_diameter,hole:p.via_hole_diameter??p.hole_diameter,layers,owner,soft,softWeight:1+(ripupCounts.get(owner)??0)})
  if(k){const a=t.route[k-1];if(Math.hypot(a.x-p.x,a.y-p.y)>1e-8){const layer=a.route_type==='wire'?a.layer:p.layer;if(layers.includes(layer))shapes.push({kind:'segment',a,b:p,w:Math.max(a.width??.1016,p.width??.1016),layers:[layer],owner,soft,softWeight:1+(ripupCounts.get(owner)??0)})}}
 }
}
for(const t of input.traces)addTrace(t)
for(const t of carriers)if(hardCarrierIds.has(t.source_trace_id))addTrace(t)
const hardShapeCount=shapes.length
mkdirSync(directory,{recursive:true})
const snapshot=`${directory}/manual-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/route-am3352-command-adaptive-carriers.mjs'))
const guardSnapshot=`${directory}/guard-helper.executed.mjs`;writeFileSync(guardSnapshot,readFileSync('scripts/lib/am3352-command-terminal-bridge.mjs'))
const report={status:'COMMAND_MANUAL_CARRIERS_PLANNING_IN_PROGRESS',mode,checkedBootstrap:artifact(summaryPath),source:sourceRef,input:artifact(inputPath),priorState:priorStatePath?artifact(priorStatePath):null,executionHelper:artifact(snapshot),guardHelper:artifact(guardSnapshot),secondsPerConnection:seconds,maxSteps,gridMm,maxVias,overlapPenalty:penalty,hardCarrierIds:[...hardCarrierIds],originalFixedTracesRetained:125,checkedManualFanoutsRetained:mode==='fixed'?52:0,checkedThroughViasRetained:mode==='fixed'?193:141,unusedUncommittedFanoutsOpenedForReplanning:mode!=='fixed',attempts,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false}
const save=()=>{report.plannedCommandCarriers=carriers.length;report.remainingCommandCarriers=26-carriers.length;writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')};save()
const pointSegment=(p,s)=>{const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,t=Math.max(0,Math.min(1,((p.x-s.a.x)*dx+(p.y-s.a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-s.a.x-t*dx,p.y-s.a.y-t*dy)}
const conflict=(a,b)=>{
 const as=routeSegments('a',a.route),bs=routeSegments('b',b.route),av=a.route.filter(p=>p.route_type==='via'),bv=b.route.filter(p=>p.route_type==='via')
 for(const x of as)for(const y of bs)if(x.layer===y.layer&&capsuleIntervals(x,y,.2032-1e-8).length)return true
 for(const v of av)if(bs.some(s=>pointSegment(v,s)<.381-1e-8))return true
 for(const v of bv)if(as.some(s=>pointSegment(v,s)<.381-1e-8))return true
 for(const v of av)for(const w of bv)if(Math.hypot(v.x-w.x,v.y-w.y)<.5588-1e-8)return true
 return false
}
let best=structuredClone(carriers),bestStep=0;const bestPath=`${directory}/best-carriers.nonexportable.json`;const saveBest=()=>{writeFileSync(bestPath,JSON.stringify({carriers:best,hardCarrierIds:[...hardCarrierIds],ripupCounts:[...ripupCounts],source:sourceRef,mode,bootstrap:artifact(summaryPath),input:report.input,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false})+"\n");report.bestState=artifact(bestPath);report.bestPlannedCommandCarriers=best.length;report.bestStep=bestStep};saveBest();
const queue=selected.filter(d=>!carriers.some(t=>t.source_trace_id===d.connection.name));let consecutiveFailures=0,step=0
while(queue.length&&step<maxSteps){
 const {connection,name}=queue.shift();step++
 if(carriers.some(t=>t.source_trace_id===connection.name))continue
 shapes.length=hardShapeCount;for(const t of carriers)if(!hardCarrierIds.has(t.source_trace_id))addTrace(t,true)
 const result=routeGuardedOuterBridge({connection,shapes,searchBounds:alignedBounds,seconds,gridMm,maxVias,viaGrid:gridMm,overlapPenalty:penalty})
 if(result.route){const vias=result.route.filter(p=>p.route_type==='via');for(let k=0;k<vias.length;k++)for(let j=0;j<k;j++)if(Math.hypot(vias[k].x-vias[j].x,vias[k].y-vias[j].y)<.508-1e-8){delete result.route;result.error='New holes fail mutual drill separation'}}
 const attempt={step,name,sourceTraceId:connection.name,result:{...result,route:undefined}}
 if(result.route){
  const t={type:'pcb_trace',pcb_trace_id:`manual_command_carrier_${connection.name}`,source_trace_id:connection.name,connection_name:connection.name,route:result.route}
  assert(t.route.every(p=>p.route_type==='via'||layers.includes(p.layer)))
  const path=`${directory}/${name.toLowerCase()}.route.json`;writeFileSync(path,JSON.stringify(t)+'\n');attempt.route=artifact(path)
  attempt.openedStagedCommandPaths=[]
  for(let k=carriers.length-1;k>=0;k--)if(!hardCarrierIds.has(carriers[k].source_trace_id)&&conflict(t,carriers[k])){
   const opened=carriers.splice(k,1)[0],path=`${directory}/opened-${connection.name}-${opened.source_trace_id}.json`;writeFileSync(path,JSON.stringify(opened)+'\n');attempt.openedStagedCommandPaths.push({name:traceById.get(opened.source_trace_id).name,path:artifact(path)});ripupCounts.set(opened.source_trace_id,(ripupCounts.get(opened.source_trace_id)??0)+1);const d=definitions.find(d=>d.connection.name===opened.source_trace_id);if(!queue.some(q=>q.connection.name===d.connection.name))queue.push(d)
  }
  carriers.push(t);consecutiveFailures=0
 }else{queue.push({connection,name});consecutiveFailures++}
 attempts.push(attempt);if(carriers.length>best.length){best=structuredClone(carriers);bestStep=step;saveBest()}save();console.log(JSON.stringify({name,found:!!attempt.route,planned:carriers.length,opened:attempt.openedStagedCommandPaths?.map(o=>o.name),expanded:result.expanded,error:result.error??null,qualifiedNewDdrSignals:0}));if(consecutiveFailures>=queue.length)break
}
const statePath=`${directory}/carriers.nonexportable.json`;writeFileSync(statePath,JSON.stringify({carriers,hardCarrierIds:[...hardCarrierIds],ripupCounts:[...ripupCounts],source:sourceRef,mode,bootstrap:artifact(summaryPath),input:report.input,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false})+'\n')
report.finalState=artifact(statePath);report.state=artifact(bestPath);report.finalPlannedCommandCarriers=carriers.length;report.plannedCommandCarriers=best.length;report.remainingCommandCarriers=26-best.length;report.status=carriers.length===26?'ALL_COMMAND_MANUAL_CARRIERS_PLANNED_NATIVE_REPLAY_AND_CHECKS_REQUIRED':'PARTIAL_COMMAND_MANUAL_CARRIERS_PLANNED_REPLAY_AND_CHECKS_REQUIRED';save();report.plannedCommandCarriers=best.length;report.remainingCommandCarriers=26-best.length;writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
process.exitCode=best.length===26?0:1
