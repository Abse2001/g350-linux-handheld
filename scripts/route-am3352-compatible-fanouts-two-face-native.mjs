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
writeFileSync(frozen,JSON.stringify(input)+'\n');writeFileSync(snapshot,readFileSync('scripts/route-am3352-compatible-fanouts-two-face-native.mjs'))
const options={smoothTuning:true,denseSearch:true,maxSearchIterations:800000}
const solver=new SOLVERS.BusLanesSolver(input,options,terminalLayers),start=performance.now();let steps=0,next=start+10000,error
try{while(!solver.solved&&!solver.failed&&performance.now()-start<seconds*1000){solver.step();steps++;if(performance.now()>next){console.log(JSON.stringify({steps,phase:solver.phase,elapsedSeconds:(performance.now()-start)/1000}));next=performance.now()+10000}}}catch(e){error=String(e)}
const report={status:solver.solved?'COMPATIBLE_FANOUTS_TWO_FACE_NATIVE_SOLVED_REPLAY_AND_CHECKS_REQUIRED':solver.failed||error?'COMPATIBLE_FANOUTS_TWO_FACE_NATIVE_FAILED':'COMPATIBLE_FANOUTS_TWO_FACE_NATIVE_TIMEOUT',planResult:artifact(planResultPath),input:artifact(frozen),originalInput:result.input,source:result.source,executionHelper:artifact(snapshot),coreVersion:read('node_modules/@tscircuit/core/package.json').version,mode,solverOptions:options,terminalLayers:terminals,steps,elapsedSeconds:(performance.now()-start)/1000,error:error??solver.error??null,phase:solver.phase,allFixedInputCopperRetained:true,allActualPadsRetained:true,fullCommandClassMatchingDeferred:true,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false}
if(solver.solved){const output=solver.getOutput();assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces);assert.equal(output.traces.length,input.traces.length+input.connections.length);const path=`${directory}/output.simple-route.json`;writeFileSync(path,JSON.stringify(output)+'\n');report.output=artifact(path)}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,seconds:report.elapsedSeconds,error:report.error,qualifiedNewDdrSignals:0}));process.exitCode=solver.solved?0:1
