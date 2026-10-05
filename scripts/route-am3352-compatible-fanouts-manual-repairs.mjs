import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {routeGuardedOuterBridge} from './lib/am3352-command-terminal-bridge.mjs'

const [planResultPath,nativeResultPath,directory,secondsArg='5']=process.argv.slice(2)
assert(planResultPath&&nativeResultPath&&directory&&!existsSync(`${directory}/result.json`))
const seconds=Number(secondsArg);assert(seconds>0&&seconds<=15)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const plan=read(planResultPath),native=read(nativeResultPath)
assert.equal(plan.status,'ALL_MANUAL_FANOUTS_PLANNED_NATIVE_ROUTE_AND_ALL_CHECKS_REQUIRED')
assert.equal(plan.expectedFanouts,48);assert.equal(plan.selectedFanouts,48)
for(const a of [plan.input,plan.source,plan.plan,native.state,native.input,native.executionHelper])verify(a)
assert.equal(native.source.sha256,plan.source.sha256)
const input=read(plan.input.path),source=read(plan.source.path),carriers=read(native.state.path).carriers
assert.equal(input.connections.length,24);assert.equal(carriers.length,native.plannedNativeCarriers)
assert.equal(input.layerCount,4);assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254)
const logical=new Map(source.filter(e=>e.type==='source_trace').map(t=>[t.source_trace_id,t]))
const owners=new Map(source.filter(e=>e.type==='source_trace'&&/^DDR_/.test(e.name)).map(t=>[t.subcircuit_connectivity_map_key,t.source_trace_id]))
const signalIds=new Set([...owners.values()]),layers=['top','bottom'],shapes=[]
for(const o of input.obstacles){
 const ls=o.layers.filter(l=>layers.includes(l));if(!ls.length)continue
 const v=source.find(v=>v.type==='pcb_via'&&v.pcb_via_id===o.circuitJsonMetadata?.pcb_via_id)
 shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:ls,pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,hole:v?.hole_diameter,owner:v?owners.get(v.subcircuit_connectivity_map_key):o.connectedTo?.find(n=>signalIds.has(n))})
}
for(const v of source.filter(e=>e.type==='pcb_via'||e.type==='pcb_plated_hole'))if(v.x!==undefined)shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter??v.outer_width,h:v.outer_diameter??v.outer_height,hole:v.hole_diameter,layers,owner:owners.get(v.subcircuit_connectivity_map_key)})
const addTrace=t=>{
 const owner=t.source_trace_id??t.connection_name
 for(let k=0;k<t.route.length;k++){
  const p=t.route[k]
  if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter??p.outer_diameter,h:p.via_diameter??p.outer_diameter,hole:p.via_hole_diameter??p.hole_diameter,layers,owner})
  if(k){const a=t.route[k-1];if(Math.hypot(a.x-p.x,a.y-p.y)>1e-8){const layer=a.route_type==='wire'?a.layer:p.layer;if(layers.includes(layer))shapes.push({kind:'segment',a,b:p,w:Math.max(a.width??.1016,p.width??.1016),layers:[layer],owner})}}
 }
}
for(const t of [...input.traces,...carriers])addTrace(t)
const originalNative=structuredClone(carriers),attempts=[],gridMm=.02,maxVias=6
const bounds={minX:Math.ceil(input.bounds.minX/gridMm)*gridMm,maxX:Math.floor(input.bounds.maxX/gridMm)*gridMm,minY:Math.ceil(input.bounds.minY/gridMm)*gridMm,maxY:Math.floor(input.bounds.maxY/gridMm)*gridMm}
// The bridge solver requires actual terminal centers on its lattice.
for(const c of input.connections)for(const p of c.pointsToConnect)assert(Math.abs(p.x/gridMm-Math.round(p.x/gridMm))<1e-6&&Math.abs(p.y/gridMm-Math.round(p.y/gridMm))<1e-6)
mkdirSync(directory,{recursive:true})
const helper=`${directory}/manual-helper.executed.mjs`,guard=`${directory}/guard-helper.executed.mjs`
writeFileSync(helper,readFileSync('scripts/route-am3352-compatible-fanouts-manual-repairs.mjs'));writeFileSync(guard,readFileSync('scripts/lib/am3352-command-terminal-bridge.mjs'))
const priority=['DDR_WEn','DDR_CKE','DDR_A1','DDR_ODT','DDR_CASn','DDR_A3','DDR_A12','DDR_A4','DDR_BA0','DDR_BA1','DDR_BA2','DDR_A0','DDR_A10','DDR_A5','DDR_A9','DDR_A13','DDR_A8','DDR_CSn0']
const queue=input.connections.filter(c=>!carriers.some(t=>t.source_trace_id===c.source_trace_id)).sort((a,b)=>priority.indexOf(logical.get(a.source_trace_id).name)-priority.indexOf(logical.get(b.source_trace_id).name))
const start=performance.now(),report={status:'COMPATIBLE_FANOUT_MANUAL_REPAIRS_IN_PROGRESS',planResult:artifact(planResultPath),nativeResult:artifact(nativeResultPath),input:plan.input,source:plan.source,executionHelper:artifact(helper),guardHelper:artifact(guard),retainedNativeCarriers:originalNative.length,manualCarriers:0,plannedCommandCarriers:carriers.length,remainingCommandCarriers:24-carriers.length,secondsPerVariant:seconds,gridMm,maxVias,allCheckedDataResetClockReferenceUsbCopperRetained:true,all48PackageReservationsHard:true,attempts,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false}
const save=()=>{report.plannedCommandCarriers=carriers.length;report.remainingCommandCarriers=24-carriers.length;report.manualCarriers=carriers.length-originalNative.length;writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')};save()
for(const connection of queue){
 const name=logical.get(connection.source_trace_id).name
 for(const [variant,[from,to]] of [['bottom','bottom']].entries()){
  const c={...connection,pointsToConnect:connection.pointsToConnect.map((p,k)=>({...p,layer:k?to:from}))}
  const result=routeGuardedOuterBridge({connection:c,shapes,searchBounds:bounds,seconds,gridMm,maxVias,viaGrid:gridMm})
  if(result.route){const vias=result.route.filter(p=>p.route_type==='via');for(let k=0;k<vias.length;k++)for(let j=0;j<k;j++)if(Math.hypot(vias[k].x-vias[j].x,vias[k].y-vias[j].y)<.508-1e-8){delete result.route;result.error='New holes fail mutual drill separation'}}
  const attempt={name,sourceTraceId:connection.source_trace_id,variant:variant+1,startLayer:from,endLayer:to,result:{...result,route:undefined}}
  if(result.route){
   const t={type:'pcb_trace',pcb_trace_id:`manual_fixed_fanout_carrier_${connection.source_trace_id}`,source_trace_id:connection.source_trace_id,connection_name:connection.name,route:result.route}
   // Existing full-depth terminal vias legitimately expose both outer faces.
   assert(['top','bottom'].includes(t.route[0].layer)&&['top','bottom'].includes(t.route.at(-1).layer));attempt.startLayer=t.route[0].layer;attempt.endLayer=t.route.at(-1).layer;attempt.terminalLayersChosenByPhysicalVia=true
   const path=`${directory}/${name.toLowerCase()}-variant-${variant+1}.carrier.nonexportable.json`;writeFileSync(path,JSON.stringify(t)+'\n');attempt.carrier=artifact(path)
   carriers.push(t);addTrace(t)
  }
  attempts.push(attempt);save();console.log(JSON.stringify({name,variant:variant+1,found:!!attempt.carrier,planned:carriers.length,expanded:result.expanded,error:result.error??null,qualifiedNewDdrSignals:0}))
  if(attempt.carrier)break
 }
}
assert.deepEqual(carriers.slice(0,originalNative.length),originalNative)
const statePath=`${directory}/command-carriers.nonexportable.json`;writeFileSync(statePath,JSON.stringify({carriers,source:plan.source,manualFanoutPlan:plan.plan,retainedNativeCarriers:originalNative.length,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false})+'\n')
report.state=artifact(statePath);report.status=carriers.length===24?'ALL_COMPATIBLE_FANOUT_COMMAND_CARRIERS_PLANNED_REPLAY_AND_CHECKS_REQUIRED':'PARTIAL_COMPATIBLE_FANOUT_COMMAND_CARRIERS_PLANNED_REPLAY_AND_CHECKS_REQUIRED';report.elapsedSeconds=(performance.now()-start)/1000;save()
console.log(JSON.stringify({status:report.status,planned:carriers.length,remaining:24-carriers.length,seconds:report.elapsedSeconds,qualifiedNewDdrSignals:0}));process.exitCode=carriers.length===24?0:1
