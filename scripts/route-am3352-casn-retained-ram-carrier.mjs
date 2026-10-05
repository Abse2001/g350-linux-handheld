import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenDataWires} from './lib/am3352-open-data-wires.mjs'

const [localDirectory,directory,duration='120']=process.argv.slice(2)
assert(localDirectory&&directory&&!existsSync(`${directory}/result.json`))
assert(Number(duration)>0&&Number(duration)<=120)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const prior=read(`${localDirectory}/result.json`),{summary,registration}=readCheckedCommandSummary(prior.checkedSourceSummary)
assert.equal(prior.status,'STAGED_CASN_RETAINED_RAM_FANOUTS_READY_FOR_NATIVE_CARRIER')
for(const a of [prior.source,prior.channelInput,prior.localCopper,prior.priorPreparation,prior.reusedRamRun,prior.reusedRamFanouts,...prior.executionHelpers])verify(a)
assert.deepEqual(summary.source,prior.source)
const source=read(prior.source.path),input=read(prior.channelInput.path),local=read(prior.localCopper.path)
const {opened,prefixes}=assertOpenDataWires(prior,{...input,traces:input.traces.slice(0,registration.traces)},source)
assert(opened.every(o=>o.retainedRouteMode==='RAM_TAIL'))
assert.equal(input.traces.length,registration.traces+2);assert.equal(local.length,2)
assert.deepEqual(input.traces.slice(registration.traces),[local[1],local[0]])
assert.equal(input.connections.length,1);const c=input.connections[0];assert.equal(c.name,'source_trace_19')
const st=source.find(e=>e.type==='source_trace'&&e.source_trace_id===c.name)
const actualPads=st.connected_source_port_ids.map(id=>{const p=source.find(e=>e.type==='pcb_port'&&e.source_port_id===id);assert(p);return{x:p.x,y:p.y,layer:'top'}})
local.forEach((t,i)=>{assert.equal(t.source_trace_id,c.name);assert(Math.hypot(t.route[0].x-actualPads[i].x,t.route[0].y-actualPads[i].y)<1e-8);assert.equal(t.route[0].layer,'top')})
const handoffs=local.map(t=>{const p=t.route.at(-1);return{x:p.x,y:p.y,layer:p.layer}})
assert.deepEqual(c.pointsToConnect,handoffs);assert.equal(handoffs[0].layer,handoffs[1].layer)
assert(['top','bottom'].includes(handoffs[0].layer));assert.deepEqual(input.buses[0].allowedLayers,[handoffs[0].layer])
assert.equal(input.buses[0].maxLengthSkew,.635);assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false)
assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254)
assert.equal(source.filter(e=>e.type==='pcb_via').length,registration.holes)
const localVias=local.flatMap(t=>t.route.filter(p=>p.route_type==='via'))
for(const p of localVias){assert.equal(p.via_diameter,.4572);assert.equal(p.via_hole_diameter,.254);assert.deepEqual(p.layers,['top','inner1','inner2','bottom'])}
for(let i=0;i<localVias.length;i++)for(let j=0;j<i;j++)assert(Math.hypot(localVias[i].x-localVias[j].x,localVias[i].y-localVias[j].y)>=.508-1e-8)
mkdirSync(directory,{recursive:true})
const inputPath=`${directory}/input.simple-route.json`;writeFileSync(inputPath,JSON.stringify(input)+'\n')
const snapshot=`${directory}/native-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/route-am3352-casn-retained-ram-carrier.mjs'))
const options={fanout:'none',smoothTuning:true},solver=new SOLVERS.BusLanesPipelineSolver(input,options),start=performance.now();let steps=0,next=start+10000,error=null
try{while(!solver.solved&&!solver.failed&&performance.now()-start<Number(duration)*1000){solver.step();steps++;if(performance.now()>next){console.log(JSON.stringify({steps,phase:solver.phase,elapsedSeconds:(performance.now()-start)/1000}));next=performance.now()+10000}}}catch(e){error=String(e);solver.failed=true}
const length=route=>route.reduce((sum,p,i)=>sum+(i?Math.hypot(p.x-route[i-1].x,p.y-route[i-1].y):0),0)
const report={...prior,status:solver.solved?'STAGED_CASN_RETAINED_RAM_NATIVE_CARRIER_ROUTED_NEIGHBOR_REPAIRS_REQUIRED':solver.failed?'STAGED_CASN_RETAINED_RAM_NATIVE_CARRIER_FAILED':'STAGED_CASN_RETAINED_RAM_NATIVE_CARRIER_TIMEOUT',
 priorLocalRun:artifact(`${localDirectory}/result.json`),input:artifact(inputPath),actualPads,actualHandoffs:handoffs,solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',solverOptions:options,
 coreVersion:read('node_modules/@tscircuit/core/package.json').version,capacityAutorouterVersion:read('node_modules/@tscircuit/capacity-autorouter/package.json').version,
 steps,elapsedSeconds:(performance.now()-start)/1000,phase:solver.phase,error:error??solver.error??null,failureCode:solver.failureCode??null,stats:solver.stats,
 pendingDataWireRepairs:opened.length,pendingCommandPrefixRepairs:prefixes.length,stagedPreviouslyConnectedSignals:registration.signals-opened.length-prefixes.length,
 stagedDdrSignalsAfterPhase:registration.signals-opened.length-prefixes.length+(solver.solved?1:0),newCompleteReplaySignals:0,
 retainedSourceThroughVias:registration.holes,plannedNewThroughVias:localVias.length,physicalHolesRemoved:0,referenceLayersReserved:['inner1','inner2'],copperLayers:4,
 exportable:false,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false,executionHelper:artifact(snapshot)}
if(solver.solved){
 const output=solver.getOutput();assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces);assert.deepEqual(output.obstacles,input.obstacles)
 assert.equal(output.traces.length,input.traces.length+1);const carrier=output.traces.at(-1)
 assert.equal(carrier.source_trace_id,c.name);assert(carrier.route.every(p=>p.route_type==='wire'&&p.layer===handoffs[0].layer&&p.width===.1016))
 for(const [p,end] of [[carrier.route[0],handoffs[0]],[carrier.route.at(-1),handoffs[1]]])assert(Math.hypot(p.x-end.x,p.y-end.y)<1e-8)
 report.fullCasnPlanarMm=local.reduce((sum,t)=>sum+length(t.route),0)+length(carrier.route)
 report.placementNominalRangeMm=summary.placementNominalReview.rangeMm;report.placementNominalLengthPass=report.fullCasnPlanarMm>=report.placementNominalRangeMm[0]&&report.fullCasnPlanarMm<=report.placementNominalRangeMm[1]
 const p=`${directory}/output.simple-route.json`;writeFileSync(p,JSON.stringify(output)+'\n');report.output=artifact(p)
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,elapsedSeconds:report.elapsedSeconds,fullCasnPlanarMm:report.fullCasnPlanarMm,stagedDdrSignalsAfterPhase:report.stagedDdrSignalsAfterPhase,pendingDataWireRepairs:opened.length,pendingCommandPrefixRepairs:prefixes.length,exportable:false,fabricationReady:false}))
process.exitCode=solver.solved?0:1
