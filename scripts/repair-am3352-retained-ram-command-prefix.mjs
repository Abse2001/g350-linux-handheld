import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenDataWires} from './lib/am3352-open-data-wires.mjs'
import {routeGuardedOuterBridge} from './lib/am3352-guarded-outer-bridge.mjs'

const [casnDirectory,directory,duration='30']=process.argv.slice(2)
assert(casnDirectory&&directory&&!existsSync(`${directory}/result.json`))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const prior=read(`${casnDirectory}/result.json`),{summary,registration}=readCheckedCommandSummary(prior.checkedSourceSummary)
assert.equal(prior.status,'STAGED_CASN_RETAINED_RAM_NATIVE_CARRIER_ROUTED_NEIGHBOR_REPAIRS_REQUIRED');for(const a of [prior.source,prior.input,prior.output])verify(a);assert.deepEqual(summary.source,prior.source)
const source=read(prior.source.path),fixed=read(prior.input.path),input=read(prior.output.path),{opened,prefixes}=assertOpenDataWires(prior,{...fixed,traces:fixed.traces.slice(0,registration.traces)},source)
assert.equal(prefixes.length,1);assert.equal(prefixes[0].name,'DDR_CSn0');assert.equal(input.traces.length,registration.traces+3)
assert.equal(JSON.stringify(input.traces.slice(0,registration.traces)),JSON.stringify(fixed.traces.slice(0,registration.traces)));assert.equal(JSON.stringify(input.obstacles),JSON.stringify(fixed.obstacles))
const casn=input.traces.at(-1);assert.equal(casn.source_trace_id,'source_trace_19');assert(casn.route.every(p=>p.route_type==='wire'&&p.layer===prior.actualHandoffs[0].layer&&p.width===.1016))
const prefix=prefixes[0],st=source.find(e=>e.type==='source_trace'&&e.source_trace_id===prefix.sourceTraceId),pad=source.find(e=>e.type==='pcb_port'&&e.source_port_id===st.connected_source_port_ids[0]),tail=prefix.retainedTail[0]
const c={name:st.source_trace_id,source_trace_id:st.source_trace_id,width:.1016,pointsToConnect:[{x:pad.x,y:pad.y,layer:'top'},{x:tail.x,y:tail.y,layer:'top'}]},layers=['top','bottom'],shapes=[]
for(const o of input.obstacles)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers.filter(l=>layers.includes(l)),pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:o.connectedTo?.includes(c.name)?c.name:undefined})
for(const t of input.traces){const owner=t.source_trace_id??t.connection_name;for(let i=0;i<t.route.length;i++){const p=t.route[i];if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,hole:p.via_hole_diameter,layers,owner});if(i){const a=t.route[i-1],b=p;if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:Math.max(a.width??.1016,b.width??.1016),layers:[a.route_type==='wire'?a.layer:b.layer],owner})}}}
for(const v of source.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers})
const searchBounds={minX:-12,maxX:4,minY:-12,maxY:-3};mkdirSync(directory,{recursive:true})
const result=routeGuardedOuterBridge({connection:c,shapes,searchBounds,seconds:Number(duration),gridMm:.02,maxVias:4,viaGrid:.02})
const helperSnapshot=`${directory}/manual-helper.executed.mjs`;writeFileSync(helperSnapshot,readFileSync('scripts/repair-am3352-retained-ram-command-prefix.mjs'))
const report={status:result.route?'STAGED_CSN0_MANUAL_PREFIX_PLAN_FOUND_REPLAY_AND_TIMING_CHECKS_REQUIRED':'STAGED_CSN0_MANUAL_PREFIX_PLAN_FAILED',source:prior.source,checkedSourceSummary:prior.checkedSourceSummary,priorNativeCasn:artifact(`${casnDirectory}/result.json`),priorOutput:prior.output,
 temporaryOpenCommandPrefixes:prior.temporaryOpenCommandPrefixes,temporaryOpenDataWires:prior.temporaryOpenDataWires,signal:prefix.name,sourceTraceId:c.name,actualEndpoints:c.pointsToConnect,searchBounds,gridMm:.02,wireSamplingGuardMm:.02*Math.SQRT1_2+1e-4,maximumNewVias:4,result:{...result,route:undefined},
 retainedSourceThroughVias:registration.holes,physicalHolesRemoved:0,pendingDataWireRepairs:opened.length,pendingCommandPrefixRepairs:1,newCompleteReplaySignals:0,copperLayers:4,referenceLayersReserved:['inner1','inner2'],exportable:false,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false,
 executionHelpers:[helperSnapshot,'scripts/lib/am3352-guarded-outer-bridge.mjs'].map(artifact)}
if(result.route){
 const vias=result.route.filter(p=>p.route_type==='via');for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)assert(Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)>=.508-1e-8,'New prefix holes must satisfy mutual drill spacing')
 const p=`${directory}/manual-prefix-plan.json`;writeFileSync(p,JSON.stringify(result.route,null,2)+'\n');report.manualPrefixPlan=artifact(p)
 const full=[...result.route,...prefix.retainedTail.slice(1)];report.newFullCsn0PlanarMm=full.reduce((sum,p,i)=>sum+(i?Math.hypot(p.x-full[i-1].x,p.y-full[i-1].y):0),0)
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,result:report.result,newFullCsn0PlanarMm:report.newFullCsn0PlanarMm,newCompleteReplaySignals:0,exportable:false,fabricationReady:false}));process.exitCode=result.route?0:1
