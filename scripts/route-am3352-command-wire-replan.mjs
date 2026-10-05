import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenDataWires} from './lib/am3352-open-data-wires.mjs'

const [preparation,directory,duration='120']=process.argv.slice(2)
assert(preparation&&directory&&!existsSync(`${directory}/result.json`));assert(Number(duration)>0&&Number(duration)<=120)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const prior=read(`${preparation}/result.json`),{summary,registration}=readCheckedCommandSummary(prior.checkedSourceSummary)
assert.equal(prior.status,'STAGED_CASN_NEIGHBOR_DATA_WIRES_OPEN_NOT_EXPORTABLE');assert.equal(hash(prior.input.path),prior.input.sha256)
assert.equal(hash(prior.source.path),prior.source.sha256);assert.deepEqual(summary.source,prior.source)
const source=read(prior.source.path),input=read(prior.input.path),{opened,prefixes}=assertOpenDataWires(prior,input,source)
assert.equal(input.layerCount,4);assert.equal(input.connections.length,1);assert.equal(input.connections[0].name,'source_trace_19')
assert.equal(input.traces.length,registration.traces);assert.equal(source.filter(e=>e.type==='pcb_via').length,registration.holes)
const st=source.find(e=>e.type==='source_trace'&&e.source_trace_id==='source_trace_19')
const actualEndpoints=st.connected_source_port_ids.map(id=>{const p=source.find(e=>e.type==='pcb_port'&&e.source_port_id===id);assert(p);return{x:p.x,y:p.y,layer:'top',pointId:p.pcb_port_id,pcb_port_id:p.pcb_port_id}})
assert.deepEqual(input.connections[0].pointsToConnect,actualEndpoints)
assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254);assert.equal(input.allowBlindAndBuriedVias,false)
assert.deepEqual(input.buses[0].allowedLayers,['top']);assert.equal(input.buses[0].maxLengthSkew,.635)
input.bounds={minX:-17.5,maxX:17.5,minY:-38.5,maxY:9.5}
mkdirSync(directory,{recursive:true});const inputPath=`${directory}/input.simple-route.json`;writeFileSync(inputPath,JSON.stringify(input)+'\n')
const helperSnapshot=`${directory}/native-helper.executed.mjs`;writeFileSync(helperSnapshot,readFileSync('scripts/route-am3352-command-wire-replan.mjs'))
const solver=new SOLVERS.BusLanesPipelineSolver(input),start=performance.now();let steps=0,next=start+10000,error=null
try{while(!solver.solved&&!solver.failed&&performance.now()-start<Number(duration)*1000){solver.step();steps++;if(performance.now()>next){console.log(JSON.stringify({steps,phase:solver.phase,elapsedSeconds:(performance.now()-start)/1000}));next=performance.now()+10000}}}catch(e){error=String(e);solver.failed=true}
const stats=solver.stats
const report={...prior,status:solver.solved?'STAGED_CASN_NATIVE_BUS_LANES_ROUTED_NEIGHBOR_REPAIRS_REQUIRED':solver.failed?'STAGED_CASN_NATIVE_BUS_LANES_FAILED':'STAGED_CASN_NATIVE_BUS_LANES_TIMEOUT',priorPreparation:artifact(`${preparation}/result.json`),input:artifact(inputPath),actualEndpoints,
 solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',coreVersion:read('node_modules/@tscircuit/core/package.json').version,capacityAutorouterVersion:read('node_modules/@tscircuit/capacity-autorouter/package.json').version,
 steps,elapsedSeconds:(performance.now()-start)/1000,phase:solver.phase,error:error??solver.error??null,failureCode:solver.failureCode??null,stats,
 pendingDataWireRepairs:opened.length,pendingCommandPrefixRepairs:prefixes.length,stagedPreviouslyConnectedSignals:registration.signals-opened.length-prefixes.length,stagedDdrSignalsAfterPhase:registration.signals-opened.length-prefixes.length+(solver.solved?1:0),
 newCompleteReplaySignals:0,referenceLayersReserved:['inner1','inner2'],copperLayers:4,retainedSourceThroughVias:registration.holes,physicalHolesRemoved:0,exportable:false,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false,executionHelper:artifact(helperSnapshot)}
if(solver.solved){const output=solver.getOutput();assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces);assert.equal(output.traces.length,input.traces.length+1);const p=`${directory}/output.simple-route.json`;writeFileSync(p,JSON.stringify(output)+'\n');report.output=artifact(p)}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,elapsedSeconds:report.elapsedSeconds,pendingDataWireRepairs:opened.length,pendingCommandPrefixRepairs:prefixes.length,stagedDdrSignalsAfterPhase:report.stagedDdrSignalsAfterPhase,newCompleteReplaySignals:0,exportable:false,fabricationReady:false}))
process.exitCode=solver.solved?0:1
