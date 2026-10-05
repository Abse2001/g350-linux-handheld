import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readStagedCasnAndRepairedCsn0} from './lib/am3352-staged-casn-csn0.mjs'
import {diagnoseOuterCorridor} from './lib/am3352-outer-corridor-topology.mjs'

const [prefixDirectory,directory,signal='DDR_D10']=process.argv.slice(2)
assert(prefixDirectory&&directory&&!existsSync(`${directory}/result.json`));assert(['DDR_D10','DDR_DQM1'].includes(signal))
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const {source,input,prefix,opened,registration}=readStagedCasnAndRepairedCsn0(prefixDirectory)
const st=source.find(e=>e.type==='source_trace'&&e.name===signal);assert(st);assert(opened.some(o=>o.sourceTraceId===st.source_trace_id))
const endpoints=st.connected_source_port_ids.map(id=>{const p=source.find(e=>e.type==='pcb_port'&&e.source_port_id===id);assert(p);return{x:p.x,y:p.y,layer:'top'}})
const c={name:st.source_trace_id,source_trace_id:st.source_trace_id,width:.1016,pointsToConnect:endpoints},layers=['top','bottom'],shapes=[]
const netName=id=>source.find(e=>e.type==='source_trace'&&e.source_trace_id===id)?.name??id
for(const o of input.obstacles){const owners=o.connectedTo?.filter(id=>/^source_trace_\d+$/.test(id))??[],names=owners.map(netName).filter(n=>/^DDR_(D\d+|DQM[01]|DQS[01]|DQSn[01]|CKn?|CSn0|CASn|RASn|A\d+|BA\d+|ODT|WEn|CKE|RESETn)$/.test(n));shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers.filter(l=>layers.includes(l)),pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:owners.includes(c.name)?c.name:undefined,names:names.length?names:['POWER_REFERENCE_OR_OTHER_PAD'],label:o.circuitJsonMetadata?.pcb_smtpad_id??o.circuitJsonMetadata?.pcb_via_id??'fixed_obstacle'})}
for(const t of input.traces){const owner=t.source_trace_id??t.connection_name,names=[netName(owner)];for(let i=0;i<t.route.length;i++){const p=t.route[i];if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,hole:p.via_hole_diameter,layers,owner,names,label:`${t.pcb_trace_id}:via`});if(i){const a=t.route[i-1],b=p;if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:Math.max(a.width??.1016,b.width??.1016),layers:[a.route_type==='wire'?a.layer:b.layer],owner,names,label:t.pcb_trace_id})}}}
for(const v of source.filter(e=>e.type==='pcb_via')){const t=input.traces.find(t=>t.route.some(p=>p.route_type==='via'&&Math.hypot(p.x-v.x,p.y-v.y)<1e-8));shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers,names:[t?netName(t.source_trace_id):'POWER_REFERENCE_HOLE'],label:v.pcb_via_id})}
const bounds={minX:-17.5,maxX:17.5,minY:-38.5,maxY:9.5},result=diagnoseOuterCorridor({connection:c,shapes,bounds})
mkdirSync(directory,{recursive:true});const walk=result.unqualifiedRasterWalk;delete result.unqualifiedRasterWalk
const report={status:'STAGED_DATA_OUTER_CORRIDOR_TOPOLOGY_DIAGNOSTIC',source:prefix.source,checkedSourceSummary:prefix.checkedSourceSummary,nativeCsn0Prefix:artifact(`${prefixDirectory}/result.json`),nativeCasn:prefix.priorNativeCasn,
 signal,sourceTraceId:c.name,actualEndpoints:endpoints,searchBounds:bounds,gridMm:.02,wireSamplingGuardMm:.02*Math.SQRT1_2+1e-4,...result,retainedSourceThroughVias:registration.holes,retainedRepairedCsn0Vias:2,physicalHolesRemoved:0,pendingDataWireRepairs:2,pendingCommandPrefixRepairs:0,
 topologyOnly:true,viaMutualSpacingQualified:false,nativePlanarLegsQualified:false,newCompleteReplaySignals:0,copperLayers:4,referenceLayersReserved:['inner1','inner2'],exportable:false,defaultChanged:false,fabricationReady:false,executionHelpers:['scripts/diagnose-am3352-staged-data-corridor.mjs','scripts/lib/am3352-outer-corridor-topology.mjs','scripts/lib/am3352-staged-casn-csn0.mjs'].map(artifact)}
if(walk.length){const p=`${directory}/unqualified-raster-walk.json`;writeFileSync(p,JSON.stringify(walk)+'\n');report.rasterWalk=artifact(p)}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,signal,minimumLayerTransitions:report.minimumLayerTransitions,startReachableFromGoal:report.startReachableFromGoal,goalReachableComponents:report.goalReachableComponents.map(c=>({layer:c.layer,cells:c.cells,bounds:c.bounds,boundary:c.boundaryCopper.slice(0,5)})),newCompleteReplaySignals:0,exportable:false,fabricationReady:false}))
