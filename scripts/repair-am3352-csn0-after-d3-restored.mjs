import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readStagedCasnD3Restored} from './lib/am3352-staged-casn-d3-restored.mjs'
import {routeGuardedOuterBridge} from './lib/am3352-guarded-outer-bridge.mjs'
import {assertOpenCommandPrefixes} from './lib/am3352-open-command-prefixes.mjs'

const [preparation,directory,duration='30',cutIndexArg='26',region='local',resetCutArg='none']=process.argv.slice(2);assert(preparation&&directory&&!existsSync(`${directory}/result.json`));assert(['local','cpu'].includes(region))
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const {source,input,run,prefixes,opened,omittedHoleIds,summary}=readStagedCasnD3Restored(preparation);assert.equal(prefixes.length,1)
const cutIndex=Number(cutIndexArg);assert(Number.isInteger(cutIndex)&&cutIndex>=26)
const prefix={...prefixes[0],cutIndex,retainedTail:prefixes[0].originalRoute.slice(cutIndex)}
input.traces.find(t=>t.source_trace_id===prefix.sourceTraceId).route=prefix.retainedTail
const declaredPrefixes=[prefix]
if(resetCutArg!=='none'){
 const resetCut=Number(resetCutArg);assert(Number.isInteger(resetCut))
 const reset=source.find(t=>t.type==='pcb_trace'&&t.source_trace_id==='source_trace_10'),originalRoute=reset.route
 const openedReset={name:'DDR_RESETn',sourceTraceId:'source_trace_10',originalRoute,cutIndex:resetCut,retainedTail:originalRoute.slice(resetCut)}
 input.traces.find(t=>t.source_trace_id==='source_trace_10').route=openedReset.retainedTail;declaredPrefixes.push(openedReset)
}
mkdirSync(directory,{recursive:true})
const prefixPath=`${directory}/temporarily-open-command-prefixes.json`;writeFileSync(prefixPath,JSON.stringify(declaredPrefixes,null,2)+'\n')
const temporaryOpenCommandPrefixes={...run.temporaryOpenCommandPrefixes,...artifact(prefixPath),names:declaredPrefixes.map(p=>p.name)}
const validation={...input,traces:input.traces.slice(0,134).map(t=>t.source_trace_id===opened.sourceTraceId?opened.originalTrace:t)}
assertOpenCommandPrefixes({...run,temporaryOpenCommandPrefixes},validation,source)
const st=source.find(e=>e.type==='source_trace'&&e.source_trace_id===prefix.sourceTraceId),pad=source.find(e=>e.type==='pcb_port'&&e.source_port_id===st.connected_source_port_ids[0]),tail=prefix.retainedTail[0]
const c={name:st.source_trace_id,source_trace_id:st.source_trace_id,width:.1016,pointsToConnect:[{x:pad.x,y:pad.y,layer:'top'},{x:tail.x,y:tail.y,layer:'top'}]},layers=['top','bottom'],shapes=[]
for(const o of input.obstacles)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers.filter(l=>layers.includes(l)),pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:o.connectedTo?.includes(c.name)?c.name:undefined})
for(const t of input.traces){const owner=t.source_trace_id??t.connection_name;for(let i=0;i<t.route.length;i++){const p=t.route[i];if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,hole:p.via_hole_diameter,layers,owner});if(i){const a=t.route[i-1],b=p;if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:Math.max(a.width??.1016,b.width??.1016),layers:[a.route_type==='wire'?a.layer:b.layer],owner})}}}
for(const v of source.filter(e=>e.type==='pcb_via'&&!omittedHoleIds.has(e.pcb_via_id)))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers})
mkdirSync(directory,{recursive:true});const fixedPath=`${directory}/fixed-copper.simple-route.json`;writeFileSync(fixedPath,JSON.stringify(input)+'\n')
const searchBounds=region==='local'?{minX:-12,maxX:4,minY:-12,maxY:-3}:{minX:-17.5,maxX:17.5,minY:-17,maxY:9.5},result=routeGuardedOuterBridge({connection:c,shapes,searchBounds,seconds:Number(duration),gridMm:.02,maxVias:6,viaGrid:.02})
if(result.route){const vias=result.route.filter(p=>p.route_type==='via');for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)if(Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)<.508-1e-8){delete result.route;result.error='New CSn0 holes fail mutual drill spacing'}}
const snapshot=`${directory}/manual-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/repair-am3352-csn0-after-d3-restored.mjs'))
const report={status:result.route?'STAGED_CSN0_AFTER_D3_MANUAL_PREFIX_PLAN_FOUND':'STAGED_CSN0_AFTER_D3_MANUAL_PREFIX_PLAN_FAILED',source:run.source,checkedSourceSummary:run.checkedSourceSummary,nativeD3Run:artifact(`${preparation}/result.json`),fixedCopper:artifact(fixedPath),temporaryOpenD3Signal:run.temporaryOpenD3Signal,temporaryOpenCommandPrefixes,prefixCutIndex:cutIndex,
 actualEndpoints:c.pointsToConnect,searchBounds,gridMm:.02,wireSamplingGuardMm:.02*Math.SQRT1_2+1e-4,result:{...result,route:undefined},pendingD3SignalRepair:0,pendingCommandPrefixRepairs:declaredPrefixes.length,stagedPreviouslyConnectedSignals:33-declaredPrefixes.length,newCompleteReplaySignals:0,wholeByteMatchingQualified:false,
 frozenSourceThroughVias:163,retainedStageThroughVias:161,stagedSignalHolesOmitted:2,physicalSourceModified:false,copperLayers:4,referenceLayersReserved:['inner1','inner2'],executionHelpers:[artifact(snapshot),artifact('scripts/lib/am3352-guarded-outer-bridge.mjs')],exportable:false,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false}
if(result.route){const p=`${directory}/manual-prefix-plan.json`;writeFileSync(p,JSON.stringify(result.route,null,2)+'\n');report.manualPrefixPlan=artifact(p);const full=[...result.route,...prefix.retainedTail.slice(1)];report.fullCsn0PlanarMm=full.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-full[i].x,p.y-full[i].y),0);report.placementNominalRangeMm=summary.placementNominalReview.rangeMm;report.placementNominalLengthPass=report.fullCsn0PlanarMm>=report.placementNominalRangeMm[0]&&report.fullCsn0PlanarMm<=report.placementNominalRangeMm[1]}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,result:report.result,fullCsn0PlanarMm:report.fullCsn0PlanarMm,nominalPass:report.placementNominalLengthPass,exportable:false,fabricationReady:false}));process.exitCode=result.route?0:1
