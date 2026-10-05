import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenD3Signal} from './lib/am3352-open-d3-signal.mjs'
import {routeGuardedOuterBridge} from './lib/am3352-guarded-outer-bridge.mjs'

const [preparation,directory,duration='30']=process.argv.slice(2);assert(preparation&&directory&&!existsSync(`${directory}/result.json`))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const prior=read(`${preparation}/result.json`),{summary}=readCheckedCommandSummary(prior.checkedSourceSummary)
assert.equal(prior.status,'STAGED_CASN_D3_WIRES_AND_SIGNAL_HOLES_OPEN_NOT_EXPORTABLE');assert.equal(hash(prior.input.path),prior.input.sha256);assert.equal(hash(prior.source.path),prior.source.sha256);assert.deepEqual(summary.source,prior.source)
const source=read(prior.source.path),input=read(prior.input.path),{omittedHoleIds}=assertOpenD3Signal(prior,input,source),c=input.connections[0],layers=['top','bottom'],shapes=[]
assert.equal(c.name,'source_trace_19');assert.deepEqual(c.pointsToConnect.map(({x,y,layer})=>({x,y,layer})),[{x:-2.8,y:-6.8,layer:'top'},{x:-1.6,y:-28.2,layer:'top'}])
for(const o of input.obstacles)shapes.push({kind:o.shape==='circle'?'circle':'rect',x:o.center.x,y:o.center.y,w:o.width,h:o.height,layers:o.layers.filter(l=>layers.includes(l)),pad:!!o.circuitJsonMetadata?.pcb_smtpad_id,owner:o.connectedTo?.includes(c.name)?c.name:undefined})
for(const t of input.traces){const owner=t.source_trace_id??t.connection_name;for(let i=0;i<t.route.length;i++){const p=t.route[i];if(p.route_type==='via')shapes.push({kind:'circle',x:p.x,y:p.y,w:p.via_diameter,h:p.via_diameter,hole:p.via_hole_diameter,layers,owner});if(i){const a=t.route[i-1],b=p;if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:Math.max(a.width??.1016,b.width??.1016),layers:[a.route_type==='wire'?a.layer:b.layer],owner})}}}
for(const v of source.filter(e=>e.type==='pcb_via'&&!omittedHoleIds.has(e.pcb_via_id)))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers})
mkdirSync(directory,{recursive:true});const searchBounds={minX:-17.5,maxX:17.5,minY:-38.5,maxY:9.5},result=routeGuardedOuterBridge({connection:c,shapes,searchBounds,seconds:Number(duration),gridMm:.02,maxVias:6,viaGrid:.02})
if(result.route){const vias=result.route.filter(p=>p.route_type==='via');for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)if(Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)<.508-1e-8){delete result.route;result.error='New CASn holes fail mutual drill spacing'}}
const snapshot=`${directory}/manual-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/repair-am3352-casn-with-d3-open.mjs'))
const report={...prior,status:result.route?'STAGED_CASN_D3_OPEN_ACTUAL_PAD_PLAN_FOUND_NATIVE_LEGS_AND_REPAIRS_REQUIRED':'STAGED_CASN_D3_OPEN_ACTUAL_PAD_PLAN_FAILED',priorPreparation:artifact(`${preparation}/result.json`),actualEndpoints:c.pointsToConnect,searchBounds,gridMm:.02,wireSamplingGuardMm:.02*Math.SQRT1_2+1e-4,maximumNewVias:6,result:{...result,route:undefined},executionHelpers:[artifact(snapshot),artifact('scripts/lib/am3352-guarded-outer-bridge.mjs')],exportable:false,fabricationReady:false}
if(result.route){const p=`${directory}/actual-pad-plan.json`;writeFileSync(p,JSON.stringify(result.route,null,2)+'\n');report.actualPadPlan=artifact(p);report.planarMm=result.lengthMm;report.placementNominalRangeMm=summary.placementNominalReview.rangeMm;report.placementNominalLengthPass=result.lengthMm>=report.placementNominalRangeMm[0]&&result.lengthMm<=report.placementNominalRangeMm[1]}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,result:report.result,nominalPass:report.placementNominalLengthPass,exportable:false,fabricationReady:false}));process.exitCode=result.route?0:1
