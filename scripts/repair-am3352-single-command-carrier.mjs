import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenCommandPrefixes} from './lib/am3352-open-command-prefixes.mjs'
import {routeGuardedOuterBridge} from './lib/am3352-guarded-outer-bridge.mjs'

const [nativeDirectory,directory,boundsArg='-13,3,-22,-9.5',duration='30']=process.argv.slice(2)
assert(nativeDirectory&&directory&&!existsSync(`${directory}/result.json`))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const prior=read(`${nativeDirectory}/result.json`),{summary,registration}=readCheckedCommandSummary(prior.checkedSourceSummary)
assert.equal(prior.status,'GUIDED_NATIVE_CHANNEL_FAILED_OR_TIMEOUT');assert.equal(prior.newCandidateChannelCount,0)
assert.equal(prior.channel.stats.failureCode,'no_planar_route')
for(const a of [prior.source,prior.channel.input,prior.priorLocalRun])verify(a)
assert.deepEqual(summary.source,prior.source)
const input=read(prior.channel.input.path),source=read(prior.source.path)
assert.equal(input.connections.length,1);assert.equal(input.layerCount,4)
assert.equal(input.traces.length,registration.traces+2)
const prefixes=assertOpenCommandPrefixes(prior,{...input,traces:input.traces.slice(0,registration.traces)},source)
const c=input.connections[0],localPath=prior.priorLocalRun.path.replace(/result.json$/,'local-escapes.json'),local=read(localPath)
assert.equal(local.length,2)
const terminals=[true,false].map(cpu=>{const t=local.find(t=>(t.route[0].y>-15)===cpu);assert.equal(t.source_trace_id,c.name);const p=t.route.at(-1);return{x:p.x,y:p.y,layer:p.layer}})
assert.deepEqual(c.pointsToConnect,terminals)
const [minX,maxX,minY,maxY]=boundsArg.split(',').map(Number),searchBounds={minX,maxX,minY,maxY}
assert(Object.values(searchBounds).every(Number.isFinite)&&minX<maxX&&minY<maxY)
for(const key of ['minX','minY'])assert(searchBounds[key]>=input.bounds[key])
for(const key of ['maxX','maxY'])assert(searchBounds[key]<=input.bounds[key])
assert(c.pointsToConnect.every(p=>p.x>=minX&&p.x<=maxX&&p.y>=minY&&p.y<=maxY))
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
mkdirSync(directory,{recursive:true})
const result=routeGuardedOuterBridge({connection:c,shapes,searchBounds,seconds:Number(duration),gridMm:.02,maxVias:4,viaGrid:.02})
const report={status:result.route?'SINGLE_COMMAND_MANUAL_CARRIER_HANDOFF_PLAN_FOUND_NATIVE_LEGS_AND_PREFIX_REPAIR_REQUIRED':'SINGLE_COMMAND_MANUAL_CARRIER_HANDOFF_PLAN_FAILED',source:prior.source,checkedSourceSummary:prior.checkedSourceSummary,
 priorNativeFailure:artifact(`${nativeDirectory}/result.json`),nativeInput:prior.channel.input,manualLocalRun:prior.priorLocalRun,manualLocalCopper:artifact(localPath),temporaryOpenCommandPrefixes:prior.temporaryOpenCommandPrefixes,
 signal:prior.manualPartialCommandSelection.signalNames[0],sourceTraceId:c.name,searchBounds,gridMm:.02,wireSamplingGuardMm:.02*Math.SQRT1_2+1e-4,viaPlacementGridMm:.02,maximumNewVias:4,
 endpoints:terminals,result:{...result,route:undefined},nativeBusLanesBootstrapSource:summary.source,retainedSourceTracePieces:registration.traces,retainedSourceThroughVias:registration.holes,actualPadObstacles:912,
 pendingCommandPrefixRepairs:prefixes.length,exportable:false,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false}
if(result.route){
 const path=`${directory}/carrier-handoff-plan.json`;writeFileSync(path,JSON.stringify(result.route,null,2)+'\n');report.carrierHandoffPlan=artifact(path)
 const output={...input,traces:[...input.traces,{pcb_trace_id:`manual_carrier_${c.name}`,source_trace_id:c.name,connection_name:c.name,route:result.route}]}
 const outputPath=`${directory}/manual-carrier.simple-route.json`;writeFileSync(outputPath,JSON.stringify(output)+'\n');report.manualCarrierOutput=artifact(outputPath)
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,signal:report.signal,searchBounds,result:report.result,exportable:false,fabricationReady:false}))
process.exitCode=result.route?0:1
