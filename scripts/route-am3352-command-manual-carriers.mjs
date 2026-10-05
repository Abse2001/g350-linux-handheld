import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {routeGuardedOuterBridge} from './lib/am3352-command-terminal-bridge.mjs'

// Manual repairs of a latest-core native phase bootstrap. Keep every checked
// physical fanout, byte/reset channel and host/reference/USB copper item hard.
const [directory,secondsArg='8',selection='all',priorStatePath,mode='fixed',maxViasArg='4']=process.argv.slice(2)
assert(directory&&!existsSync(`${directory}/result.json`))
assert(['fixed','flexible'].includes(mode));const maxVias=Number(maxViasArg);assert(Number.isInteger(maxVias)&&maxVias>=2&&maxVias<=6)
const seconds=Number(secondsArg);assert(seconds>0&&seconds<=30)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const summaryPath='checks/integrated/am3352-command-replan-check-summary.json',summary=read(summaryPath)
for(const a of [summary.source,summary.board,summary.manualFanoutPlan])assert.equal(hash(a.path),a.sha256)
assert.equal(summary.cpuManualFanoutsConnected,26);assert.equal(summary.ramManualFanoutsConnected,26)
const originalAudit=read('checks/integrated/am3352-command-replan-input-preservation.json')
const sourceRef=mode==='flexible'?originalAudit.source:summary.source
assert.equal(hash(sourceRef.path),sourceRef.sha256)
const source=read(sourceRef.path)
const inputPath=mode==='flexible'?'dist/am3352-ddr23-command-replan-manual-bootstrap-input/input.simple-route.json':'dist/am3352-ddr23-command-replan-manual-fanouts-attempt-763/input.simple-route.json',input=read(inputPath)
assert.equal(input.connections.length,26);assert.equal(input.layerCount,4)
const traceById=new Map(source.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e]))
const signalIds=new Set(source.filter(e=>e.type==='source_trace'&&/^DDR_/.test(e.name)).map(e=>e.source_trace_id))
const connectivityOwner=new Map([...traceById.values()].filter(t=>signalIds.has(t.source_trace_id)).map(t=>[t.subcircuit_connectivity_map_key,t.source_trace_id]))
const initialCarriers=priorStatePath?read(priorStatePath).carriers:[]
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
const addTrace=t=>{
 const owner=t.source_trace_id??t.connection_name
 for(let k=0;k<t.route.length;k++){
  const p=t.route[k]
  if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter??p.outer_diameter,h:p.via_diameter??p.outer_diameter,hole:p.via_hole_diameter??p.hole_diameter,layers,owner})
  if(k){const a=t.route[k-1];if(Math.hypot(a.x-p.x,a.y-p.y)>1e-8){const layer=a.route_type==='wire'?a.layer:p.layer;if(layers.includes(layer))shapes.push({kind:'segment',a,b:p,w:Math.max(a.width??.1016,p.width??.1016),layers:[layer],owner})}}
 }
}
for(const t of input.traces)addTrace(t)
for(const t of carriers)addTrace(t)
mkdirSync(directory,{recursive:true})
const snapshot=`${directory}/manual-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/route-am3352-command-manual-carriers.mjs'))
const guardSnapshot=`${directory}/guard-helper.executed.mjs`;writeFileSync(guardSnapshot,readFileSync('scripts/lib/am3352-command-terminal-bridge.mjs'))
const report={status:'COMMAND_MANUAL_CARRIERS_PLANNING_IN_PROGRESS',mode,checkedBootstrap:artifact(summaryPath),source:sourceRef,input:artifact(inputPath),priorState:priorStatePath?artifact(priorStatePath):null,executionHelper:artifact(snapshot),guardHelper:artifact(guardSnapshot),secondsPerConnection:seconds,maxVias,originalFixedTracesRetained:125,checkedManualFanoutsRetained:mode==='fixed'?52:0,checkedThroughViasRetained:mode==='fixed'?193:141,unusedUncommittedFanoutsOpenedForReplanning:mode==='flexible',attempts,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false}
const save=()=>{report.plannedCommandCarriers=carriers.length;report.remainingCommandCarriers=26-carriers.length;writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')};save()
for(const {connection,name} of selected){
 if(carriers.some(t=>t.source_trace_id===connection.name))continue
 const result=routeGuardedOuterBridge({connection,shapes,searchBounds:input.bounds,seconds,gridMm:.02,maxVias,viaGrid:.02})
 if(result.route){const vias=result.route.filter(p=>p.route_type==='via');for(let k=0;k<vias.length;k++)for(let j=0;j<k;j++)if(Math.hypot(vias[k].x-vias[j].x,vias[k].y-vias[j].y)<.508-1e-8){delete result.route;result.error='New holes fail mutual drill separation'}}
 const attempt={name,sourceTraceId:connection.name,result:{...result,route:undefined}}
 if(result.route){
  const t={type:'pcb_trace',pcb_trace_id:`manual_command_carrier_${connection.name}`,source_trace_id:connection.name,connection_name:connection.name,route:result.route}
  assert(t.route.every(p=>p.route_type==='via'||layers.includes(p.layer)))
  const path=`${directory}/${name.toLowerCase()}.route.json`;writeFileSync(path,JSON.stringify(t)+'\n');attempt.route=artifact(path)
  carriers.push(t);addTrace(t)
 }
 attempts.push(attempt);save();console.log(JSON.stringify({name,found:!!attempt.route,planned:carriers.length,expanded:result.expanded,error:result.error??null,qualifiedNewDdrSignals:0}))
}
const statePath=`${directory}/carriers.nonexportable.json`;writeFileSync(statePath,JSON.stringify({carriers,source:sourceRef,mode,bootstrap:artifact(summaryPath),input:report.input,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false})+'\n')
report.state=artifact(statePath);report.status=carriers.length===26?'ALL_COMMAND_MANUAL_CARRIERS_PLANNED_NATIVE_REPLAY_AND_CHECKS_REQUIRED':'PARTIAL_COMMAND_MANUAL_CARRIERS_PLANNED_REPLAY_AND_CHECKS_REQUIRED';save()
process.exitCode=carriers.length===26?0:1
