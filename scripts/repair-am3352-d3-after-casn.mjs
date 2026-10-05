import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readStagedCasnD3Open} from './lib/am3352-staged-casn-d3-open.mjs'
import {routeGuardedOuterBridge} from './lib/am3352-guarded-outer-bridge.mjs'

const [prefixDirectory,directory,signal='DDR_D3',duration='30']=process.argv.slice(2)
assert(prefixDirectory&&directory&&!existsSync(`${directory}/result.json`));assert.equal(signal,'DDR_D3')
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const {source,input,run:prefix,opened:openedSignal,registration,omittedHoleIds}=readStagedCasnD3Open(prefixDirectory),opened=[openedSignal]
const st=source.find(e=>e.type==='source_trace'&&e.name===signal);assert(st);assert(opened.some(o=>o.sourceTraceId===st.source_trace_id))
const endpoints=st.connected_source_port_ids.map(id=>{const p=source.find(e=>e.type==='pcb_port'&&e.source_port_id===id);assert(p);return{x:p.x,y:p.y,layer:'top'}})
const c={name:st.source_trace_id,source_trace_id:st.source_trace_id,width:.1016,pointsToConnect:endpoints},layers=['top','bottom'],shapes=[]
for(const o of input.obstacles)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers.filter(l=>layers.includes(l)),pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:o.connectedTo?.includes(c.name)?c.name:undefined})
for(const t of input.traces){const owner=t.source_trace_id??t.connection_name;for(let i=0;i<t.route.length;i++){const p=t.route[i];if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,hole:p.via_hole_diameter,layers,owner});if(i){const a=t.route[i-1],b=p;if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:Math.max(a.width??.1016,b.width??.1016),layers:[a.route_type==='wire'?a.layer:b.layer],owner})}}}
for(const v of source.filter(e=>e.type==='pcb_via'&&!omittedHoleIds.has(e.pcb_via_id)))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers})
const searchBounds={minX:-17.5,maxX:17.5,minY:-38.5,maxY:9.5};mkdirSync(directory,{recursive:true})
const inputPath=`${directory}/fixed-copper.simple-route.json`;writeFileSync(inputPath,JSON.stringify(input)+'\n')
const result=routeGuardedOuterBridge({connection:c,shapes,searchBounds,seconds:Number(duration),gridMm:.02,maxVias:6,viaGrid:.02})
if(result.route){const vias=result.route.filter(p=>p.route_type==='via');for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)if(Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)<.508-1e-8){delete result.route;result.error='Candidate new holes fail mutual drill spacing'}}
const helperSnapshot=`${directory}/manual-helper.executed.mjs`;writeFileSync(helperSnapshot,readFileSync('scripts/repair-am3352-d3-after-casn.mjs'))
const report={status:result.route?'STAGED_D3_ACTUAL_PAD_PLAN_FOUND_NATIVE_LEGS_AND_WHOLE_BYTE_MATCHING_REQUIRED':'STAGED_D3_ACTUAL_PAD_PLAN_FAILED',source:prefix.source,checkedSourceSummary:prefix.checkedSourceSummary,nativeCasnRun:artifact(`${prefixDirectory}/result.json`),temporaryOpenD3Signal:prefix.temporaryOpenD3Signal,temporaryOpenCommandPrefixes:prefix.temporaryOpenCommandPrefixes,fixedCopper:artifact(inputPath),
 signal,sourceTraceId:c.name,actualEndpoints:endpoints,searchBounds,gridMm:.02,wireSamplingGuardMm:.02*Math.SQRT1_2+1e-4,maximumNewVias:6,result:{...result,route:undefined},
 frozenSourceThroughVias:163,retainedStageThroughVias:161,stagedSignalHolesOmitted:2,physicalSourceModified:false,pendingD3SignalRepair:1,pendingCommandPrefixRepairs:1,stagedPreviouslyConnectedSignals:31,newCompleteReplaySignals:0,wholeByteMatchingQualified:false,
 copperLayers:4,referenceLayersReserved:['inner1','inner2'],exportable:false,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false,executionHelpers:[helperSnapshot,'scripts/lib/am3352-staged-casn-d3-open.mjs','scripts/lib/am3352-guarded-outer-bridge.mjs'].map(artifact)}
if(result.route){const p=`${directory}/actual-pad-plan.json`;writeFileSync(p,JSON.stringify(result.route,null,2)+'\n');report.actualPadPlan=artifact(p)}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,signal,result:report.result,newCompleteReplaySignals:0,exportable:false,fabricationReady:false}));process.exitCode=result.route?0:1
