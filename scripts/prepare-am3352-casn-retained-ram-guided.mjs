import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenDataWires} from './lib/am3352-open-data-wires.mjs'
import {routeGuardedOuterBridge} from './lib/am3352-guarded-outer-bridge.mjs'

const [preparation,ramLocalDirectory,directory,duration='30',cpuHandoffArg='0.12,-10.5']=process.argv.slice(2)
assert(preparation&&ramLocalDirectory&&directory&&!existsSync(`${directory}/result.json`))
const [cpuX,cpuY]=cpuHandoffArg.split(',').map(Number);assert(Number.isFinite(cpuX)&&Number.isFinite(cpuY)&&cpuX>=-17.5&&cpuX<=17.5&&cpuY>=-17&&cpuY<=-3)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const prior=read(`${preparation}/result.json`),{summary,registration}=readCheckedCommandSummary(prior.checkedSourceSummary)
assert.equal(prior.status,'STAGED_CASN_NEIGHBOR_DATA_WIRES_OPEN_NOT_EXPORTABLE');verify(prior.source);verify(prior.input);assert.deepEqual(summary.source,prior.source)
const source=read(prior.source.path),input=read(prior.input.path),{opened,prefixes}=assertOpenDataWires(prior,input,source);assert(opened.every(o=>o.retainedRouteMode==='RAM_TAIL'))
const ramRun=read(`${ramLocalDirectory}/result.json`);assert.deepEqual(ramRun.source,prior.source)
const ramPath=`${ramLocalDirectory}/local-escapes.json`,ram=read(ramPath).find(t=>t.source_trace_id==='source_trace_19'&&t.route[0].y<-15);assert(ram)
const st=source.find(e=>e.type==='source_trace'&&e.source_trace_id==='source_trace_19'),pads=st.connected_source_port_ids.map(id=>source.find(e=>e.type==='pcb_port'&&e.source_port_id===id));assert(pads.every(Boolean))
assert(Math.hypot(ram.route[0].x-pads[1].x,ram.route[0].y-pads[1].y)<1e-8)
const ramEnd=ram.route.at(-1);assert(['top','bottom'].includes(ramEnd.layer));assert(Math.hypot(ramEnd.x-.12,ramEnd.y+18)<1e-8)
input.traces.push(ram)
const c={name:st.source_trace_id,source_trace_id:st.source_trace_id,width:.1016,pointsToConnect:[{x:pads[0].x,y:pads[0].y,layer:'top'},{x:cpuX,y:cpuY,layer:ramEnd.layer}]},layers=['top','bottom'],shapes=[]
for(const o of input.obstacles)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers.filter(l=>layers.includes(l)),pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:o.connectedTo?.includes(c.name)?c.name:undefined})
for(const t of input.traces){const owner=t.source_trace_id??t.connection_name;for(let i=0;i<t.route.length;i++){const p=t.route[i];if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,hole:p.via_hole_diameter,layers,owner});if(i){const a=t.route[i-1],b=p;if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:Math.max(a.width??.1016,b.width??.1016),layers:[a.route_type==='wire'?a.layer:b.layer],owner})}}}
for(const v of source.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers})
mkdirSync(directory,{recursive:true});const result=routeGuardedOuterBridge({connection:c,shapes,searchBounds:{minX:-17.5,maxX:17.5,minY:-17,maxY:9.5},seconds:Number(duration),gridMm:.02,maxVias:6,viaGrid:.02})
if(result.route){const vias=result.route.filter(p=>p.route_type==='via');for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)if(Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)<.508-1e-8){delete result.route;result.error='New CPU holes fail mutual drill spacing'}}
const helperSnapshot=`${directory}/local-helper.executed.mjs`;writeFileSync(helperSnapshot,readFileSync('scripts/prepare-am3352-casn-retained-ram-guided.mjs'))
const report={...prior,status:result.route?'STAGED_CASN_RETAINED_RAM_FANOUTS_READY_FOR_NATIVE_CARRIER':'STAGED_CASN_RETAINED_RAM_CPU_FANOUT_FAILED',priorPreparation:artifact(`${preparation}/result.json`),reusedRamRun:artifact(`${ramLocalDirectory}/result.json`),reusedRamFanouts:artifact(ramPath),cpuActualEndpoints:c.pointsToConnect,result:{...result,route:undefined},pendingDataWireRepairs:opened.length,pendingCommandPrefixRepairs:prefixes.length,stagedPreviouslyConnectedSignals:registration.signals-opened.length-prefixes.length,
 newCompleteReplaySignals:0,physicalHolesRemoved:0,copperLayers:4,referenceLayersReserved:['inner1','inner2'],exportable:false,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false,
 executionHelpers:[artifact(helperSnapshot),artifact('scripts/lib/am3352-guarded-outer-bridge.mjs')]}
if(result.route){
 const cpu={pcb_trace_id:'manual_casn_retained_ram_cpu',source_trace_id:c.name,connection_name:c.name,route:result.route};input.traces.push(cpu)
 input.connections[0].pointsToConnect=[cpu.route.at(-1),ram.route.at(-1)].map(({x,y,layer})=>({x,y,layer}));input.buses[0].allowedLayers=[ramEnd.layer];input.bounds={minX:-17.5,maxX:17.5,minY:-38.5,maxY:9.5}
 const localPath=`${directory}/local-escapes.json`;writeFileSync(localPath,JSON.stringify([cpu,ram],null,2)+'\n');report.localCopper=artifact(localPath)
 const p=`${directory}/channel.input.simple-route.json`;writeFileSync(p,JSON.stringify(input)+'\n');report.channelInput=artifact(p)
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,result:report.result,newCompleteReplaySignals:0,exportable:false,fabricationReady:false}));process.exitCode=result.route?0:1
