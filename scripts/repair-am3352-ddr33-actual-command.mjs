import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {routeGuardedOuterBridge} from './lib/am3352-guarded-outer-bridge.mjs'

// Search the whole package-to-package path without committing earlier local
// fanouts. A found path is a staged plan, requiring native legs and restoration
// of every opened neighboring prefix before independent copper qualification.
const [preparation,directory,duration='30']=process.argv.slice(2)
assert(preparation&&directory&&!existsSync(`${directory}/result.json`))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const prior=read(`${preparation}/result.json`),{summary,registration}=readCheckedCommandSummary(prior.checkedSourceSummary)
assert(['NATIVE_DDR_PHASE_FAILED','NATIVE_DDR_PHASE_TIMEOUT'].includes(prior.status));assert.equal(registration.signals,33);assert.equal(prior.definitions.length,1)
assert.equal(prior.preparedEscapes,0);assert.equal(hash(prior.input.path),prior.input.sha256)
assert.equal(hash(prior.source.path),prior.source.sha256);assert.deepEqual(summary.source,prior.source)
const source=read(prior.source.path),input=read(prior.input.path),prefixes=[];assert.equal(input.traces.length,135);assert.equal(source.filter(e=>e.type==='pcb_via').length,169)
assert.equal(input.connections.length,1);assert.equal(input.layerCount,4)
const c=structuredClone(input.connections[0]),st=source.find(e=>e.type==='source_trace'&&e.source_trace_id===c.name)
assert(st);assert(!prefixes.some(p=>p.sourceTraceId===c.name))
const endpoints=st.connected_source_port_ids.map(id=>{const p=source.find(e=>e.type==='pcb_port'&&e.source_port_id===id);assert(p);return{x:p.x,y:p.y,layer:'top'}})
assert.equal(endpoints.length,2)
assert.deepEqual(c.pointsToConnect.map(p=>({x:p.x,y:p.y})),endpoints.map(p=>({x:p.x,y:p.y})))
c.pointsToConnect=endpoints
const layers=['top','bottom'],shapes=[]
for(const o of input.obstacles)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers.filter(l=>layers.includes(l)),pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:o.connectedTo?.includes(c.name)?c.name:undefined})
for(const t of input.traces){
 const owner=t.source_trace_id??t.connection_name
 for(let i=0;i<t.route.length;i++){
  const p=t.route[i]
  if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,hole:p.via_hole_diameter,layers,owner})
  if(i){const a=t.route[i-1],b=p;if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:Math.max(a.width??.1016,b.width??.1016),layers:[a.route_type==='wire'?a.layer:b.layer],owner})}
 }
}
for(const v of source.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers})
const searchBounds={minX:-17.5,maxX:17.5,minY:-38.5,maxY:9.5}
assert(endpoints.every(p=>p.x>=searchBounds.minX&&p.x<=searchBounds.maxX&&p.y>=searchBounds.minY&&p.y<=searchBounds.maxY))
mkdirSync(directory,{recursive:true})
const snapshot=directory+'/manual-helper.executed.mjs';writeFileSync(snapshot,readFileSync('scripts/repair-am3352-ddr33-actual-command.mjs'));const executionHelpers=[snapshot,'scripts/lib/am3352-guarded-outer-bridge.mjs'].map(artifact)
const result=routeGuardedOuterBridge({connection:c,shapes,searchBounds,seconds:Number(duration),gridMm:.02,maxVias:6,viaGrid:.02})
if(result.route){const vias=result.route.filter(p=>p.route_type==='via');for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)if(Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)<.508-1e-8){delete result.route;result.error='Planned new vias fail mutual drill separation'}}
const report={status:result.route?'COMMAND_ACTUAL_PAD_HANDOFF_PLAN_FOUND_NATIVE_LEGS_AND_INDEPENDENT_CHECKS_REQUIRED':'COMMAND_ACTUAL_PAD_HANDOFF_PLAN_FAILED',source:prior.source,checkedSourceSummary:prior.checkedSourceSummary,priorPreparation:artifact(`${preparation}/result.json`),input:prior.input,
 temporaryOpenCommandPrefixes:prior.temporaryOpenCommandPrefixes,signal:st.name,sourceTraceId:c.name,actualEndpoints:endpoints,searchBounds,gridMm:.02,wireSamplingGuardMm:.02*Math.SQRT1_2+1e-4,viaPlacementGridMm:.02,maximumNewVias:6,
 result:{...result,route:undefined},executionHelpers,nativeBusLanesBootstrapSource:summary.source,retainedSourceTracePieces:registration.traces,retainedSourceThroughVias:registration.holes,actualPadObstacles:source.filter(e=>e.type==='pcb_smtpad').length,
 pendingCommandPrefixRepairs:prefixes.length,stagedPreviouslyConnectedSignals:registration.signals-prefixes.length,exportable:false,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false}
if(result.route){const p=`${directory}/actual-pad-handoff-plan.json`;writeFileSync(p,JSON.stringify(result.route,null,2)+'\n');report.actualPadHandoffPlan=artifact(p)}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,signal:report.signal,result:report.result,exportable:false,fabricationReady:false}))
process.exitCode=result.route?0:1
