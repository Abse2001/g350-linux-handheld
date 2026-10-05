import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readStagedCasnD3Csn0} from './lib/am3352-staged-casn-d3-csn0.mjs'
import {routeGuardedOuterBridge} from './lib/am3352-guarded-outer-bridge.mjs'

const [preparation,directory,duration='30']=process.argv.slice(2);assert(preparation&&directory&&!existsSync(`${directory}/result.json`))
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const {source,input,run,prefixes,omittedHoleIds}=readStagedCasnD3Csn0(preparation),prefix=prefixes.find(p=>p.name==='DDR_RESETn')
assert(prefix);const st=source.find(e=>e.type==='source_trace'&&e.source_trace_id===prefix.sourceTraceId),pad=source.find(e=>e.type==='pcb_port'&&e.source_port_id===st.connected_source_port_ids[0]),tail=prefix.retainedTail[0]
const c={name:st.source_trace_id,source_trace_id:st.source_trace_id,width:.1016,pointsToConnect:[{x:pad.x,y:pad.y,layer:'top'},{x:tail.x,y:tail.y,layer:'top'}]},layers=['top','bottom'],shapes=[]
for(const o of input.obstacles)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers.filter(l=>layers.includes(l)),pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:o.connectedTo?.includes(c.name)?c.name:undefined})
for(const t of input.traces){const owner=t.source_trace_id??t.connection_name;for(let i=0;i<t.route.length;i++){const p=t.route[i];if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,hole:p.hole_diameter??p.via_hole_diameter,layers,owner});if(i){const a=t.route[i-1],b=p;if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:Math.max(a.width??.1016,b.width??.1016),layers:[a.route_type==='wire'?a.layer:b.layer],owner})}}}
for(const v of source.filter(e=>e.type==='pcb_via'&&!omittedHoleIds.has(e.pcb_via_id)))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers})
mkdirSync(directory,{recursive:true});const fixed=`${directory}/fixed-copper.simple-route.json`;writeFileSync(fixed,JSON.stringify(input)+'\n')
const searchBounds={minX:-17.5,maxX:17.5,minY:-17,maxY:9.5},result=routeGuardedOuterBridge({connection:c,shapes,searchBounds,seconds:Number(duration),gridMm:.02,maxVias:6,viaGrid:.02})
if(result.route){const vias=result.route.filter(p=>p.route_type==='via');for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)if(Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)<.508-1e-8){delete result.route;result.error='New reset holes fail mutual drill spacing'}}
const snapshot=`${directory}/manual-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/repair-am3352-reset-after-csn0.mjs'))
const report={...run,status:result.route?'STAGED_RESET_PREFIX_REPAIR_FOUND_COMPLETE_REPLAY_AND_TIMING_CHECKS_REQUIRED':'STAGED_RESET_PREFIX_REPAIR_FAILED',nativeCsn0Run:artifact(`${preparation}/result.json`),fixedCopper:artifact(fixed),actualEndpoints:c.pointsToConnect,searchBounds,gridMm:.02,wireSamplingGuardMm:.02*Math.SQRT1_2+1e-4,result:{...result,route:undefined},pendingCommandPrefixRepairs:result.route?0:1,stagedDdrSignalsAfterPhase:32+(result.route?1:0),newCompleteReplaySignals:0,wholeByteMatchingQualified:false,executionHelpers:[artifact(snapshot),artifact('scripts/lib/am3352-guarded-outer-bridge.mjs')],exportable:false,fabricationReady:false}
delete report.output
if(result.route){const p=`${directory}/manual-reset-prefix.json`;writeFileSync(p,JSON.stringify(result.route,null,2)+'\n');report.manualResetPrefix=artifact(p);const full=[...result.route,...prefix.retainedTail.slice(1)];report.fullResetPlanarMm=full.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-full[i].x,p.y-full[i].y),0);const out=`${directory}/full-reset.json`;writeFileSync(out,JSON.stringify(full,null,2)+'\n');report.fullReset=artifact(out)}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,result:report.result,stagedDdrSignalsAfterPhase:report.stagedDdrSignalsAfterPhase,qualifiedNewSignals:0,exportable:false,fabricationReady:false}));process.exitCode=result.route?0:1
