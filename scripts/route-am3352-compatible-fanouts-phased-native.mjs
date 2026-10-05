import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'

const [planResultPath,directory,secondsArg='60',mode='bootstrap']=process.argv.slice(2)
assert(planResultPath&&directory&&!existsSync(`${directory}/result.json`))
const seconds=Number(secondsArg);assert(seconds>0&&seconds<=180);assert(['bootstrap','matching'].includes(mode))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const result=read(planResultPath)
assert.equal(result.status,'ALL_MANUAL_FANOUTS_PLANNED_NATIVE_ROUTE_AND_ALL_CHECKS_REQUIRED')
assert.equal(result.qualifiedNewDdrSignals,0)
for(const a of [result.source,result.input,result.originalInput,result.plan,result.executionHelper])verify(a)
const input=read(result.input.path),original=read(result.originalInput.path),source=read(result.source.path),plan=read(result.plan.path)
assert.equal(input.layerCount,4);assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254)
assert.equal(source.filter(e=>e.type==='pcb_smtpad').length,912)
assert.equal(input.traces.length,original.traces.length+result.expectedFanouts)
assert.deepEqual(input.traces.slice(0,original.traces.length),original.traces)
assert.deepEqual(input.obstacles,original.obstacles)
assert.equal(input.connections.length,result.expectedFanouts/2)
assert.equal(plan.escapes.length,result.expectedFanouts)
const terminalLayers=new Map(),terminals=[]
for(const c of input.connections){
 const logical=source.find(t=>t.type==='source_trace'&&t.source_trace_id===c.source_trace_id);assert(logical)
 const raw=original.connections.find(t=>t.name===c.name);assert(raw)
 for(const [index,p] of c.pointsToConnect.entries()){
  const prefix=plan.escapes.find(t=>t.pcb_trace_id===p.pointId);assert(prefix)
  assert.equal(prefix.source_trace_id,c.name)
  const via=prefix.route.find(p=>p.route_type==='via');assert(via)
  assert.equal(via.via_diameter,.4572);assert.equal(via.via_hole_diameter,.254)
  assert.deepEqual(via.layers,['top','inner1','inner2','bottom']);assert.equal(via.from_layer,'top');assert.equal(via.to_layer,'bottom')
  assert(Math.hypot(via.x-p.x,via.y-p.y)<1e-8)
  const actual=source.find(t=>t.type==='pcb_port'&&t.pcb_port_id===p.sourcePcbPortId);assert(actual)
  assert(logical.connected_source_port_ids.includes(actual.source_port_id))
  assert.equal(raw.pointsToConnect[index].pcb_port_id,p.sourcePcbPortId)
  assert(Math.hypot(prefix.route[0].x-actual.x,prefix.route[0].y-actual.y)<1e-8)
 }
 terminalLayers.set(c.name,['top','bottom'])
 terminals.push({name:logical.name,sourceTraceId:c.source_trace_id,viaTerminals:c.pointsToConnect,allowedSignalLayers:['top','bottom']})
}
assert.equal(input.buses.length,1);assert.deepEqual(input.buses[0].allowedLayers,['top','bottom'])
assert.equal(input.buses[0].maxLengthSkew,.635)
if(mode==='bootstrap')delete input.buses[0].maxLengthSkew
assert.equal(input.differentialPairs?.length??0,0)
for(const name of ['DDR_DQS0_PAIR','DDR_DQS1_PAIR','DDR_CK_PAIR']){
 const pair=source.find(e=>e.type==='source_bus'&&e.name===name);assert(pair)
 assert(pair.source_trace_ids.every(id=>source.some(t=>t.type==='pcb_trace'&&t.source_trace_id===id)))
}
mkdirSync(directory,{recursive:true})
const frozen=`${directory}/input.simple-route.json`,snapshot=`${directory}/native-helper.executed.mjs`
writeFileSync(frozen,JSON.stringify(input)+'\n');writeFileSync(snapshot,readFileSync('scripts/route-am3352-compatible-fanouts-phased-native.mjs'))
const options={smoothTuning:true,denseSearch:true,maxSearchIterations:800000},start=performance.now(),carriers=[],attempts=[]
const names=new Map(terminals.map(t=>[t.sourceTraceId,t.name])),priority=['DDR_A1','DDR_ODT','DDR_CASn','DDR_CKE','DDR_A11','DDR_WEn','DDR_RASn','DDR_A3','DDR_A2','DDR_A12','DDR_A4','DDR_BA0','DDR_BA1','DDR_BA2','DDR_A0','DDR_A10','DDR_A5','DDR_A7','DDR_A9','DDR_A13','DDR_A14','DDR_A6','DDR_A8','DDR_CSn0']
const ordered=[...input.connections].sort((a,b)=>priority.indexOf(names.get(a.source_trace_id))-priority.indexOf(names.get(b.source_trace_id)))
for(const [index,connection] of ordered.entries()){
 const current={...input,connections:[connection],traces:[...input.traces,...carriers],buses:input.buses.map(b=>({...b,connectionNames:[connection.name]}))}
 for(const bus of current.buses)delete bus.maxLengthSkew
 const solver=new SOLVERS.BusLanesSolver(current,options,new Map([[connection.name,['top','bottom']]])),phaseStart=performance.now();let steps=0,error
 try{while(!solver.solved&&!solver.failed&&performance.now()-phaseStart<seconds*1000){solver.step();steps++}}catch(e){error=String(e)}
 const item={phase:index+1,name:names.get(connection.source_trace_id),sourceTraceId:connection.source_trace_id,status:solver.solved?'SOLVED_REPLAY_AND_CHECKS_REQUIRED':solver.failed||error?'FAILED':'TIMEOUT',steps,elapsedSeconds:(performance.now()-phaseStart)/1000,error:error??solver.error??null}
 if(solver.solved){
  const output=solver.getOutput();assert.deepEqual(output.traces.slice(0,current.traces.length),current.traces);assert.equal(output.traces.length,current.traces.length+1)
  const trace=output.traces.at(-1);assert(trace.route.every(p=>p.route_type==='wire'&&['top','bottom'].includes(p.layer)));assert(trace.route.every(p=>p.width===.1016))
  const a=trace.route[0],b=trace.route.at(-1),ends=connection.pointsToConnect
  assert(Math.hypot(a.x-ends[0].x,a.y-ends[0].y)<1e-8&&Math.hypot(b.x-ends[1].x,b.y-ends[1].y)<1e-8)
  assert(trace.route.every(p=>p.layer===a.layer));trace.source_trace_id=connection.source_trace_id;trace.connection_name=connection.name
  carriers.push(trace);const path=directory+'/phase-'+(index+1)+'.carrier.nonexportable.json';writeFileSync(path,JSON.stringify(trace)+'\n');item.carrier=artifact(path);item.layer=a.layer
 }
 attempts.push(item);console.log(JSON.stringify({...item,plannedNativeCarriers:carriers.length,qualifiedNewDdrSignals:0}))
}
const statePath=directory+'/native-carriers.nonexportable.json';writeFileSync(statePath,JSON.stringify({carriers,source:result.source,manualFanoutPlan:result.plan,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false})+'\n')
const report={status:carriers.length===input.connections.length?'ALL_PHASED_NATIVE_COMMAND_CARRIERS_PLANNED_REPLAY_AND_CHECKS_REQUIRED':'PARTIAL_PHASED_NATIVE_COMMAND_CARRIERS_PLANNED_REPLAY_AND_CHECKS_REQUIRED',planResult:artifact(planResultPath),input:artifact(frozen),originalInput:result.input,source:result.source,executionHelper:artifact(snapshot),coreVersion:read('node_modules/@tscircuit/core/package.json').version,mode:'connectivity-bootstrap',solverOptions:options,terminalLayers:terminals,attempts,state:artifact(statePath),plannedNativeCarriers:carriers.length,remainingNativeCarriers:input.connections.length-carriers.length,elapsedSeconds:(performance.now()-start)/1000,allFixedInputCopperRetained:true,allActualPadsRetained:true,fullCommandClassMatchingDeferred:true,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false}
writeFileSync(directory+'/result.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,nativeCarriers:carriers.length,remaining:report.remainingNativeCarriers,seconds:report.elapsedSeconds,qualifiedNewDdrSignals:0}));process.exitCode=carriers.length===input.connections.length?0:1
