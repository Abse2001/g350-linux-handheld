import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'

const [directory,secondsArg='60',mode='matching']=process.argv.slice(2);assert(directory&&!existsSync(`${directory}/result.json`));const seconds=Number(secondsArg);assert(seconds>0&&seconds<=180);assert(['matching','bootstrap'].includes(mode))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const summaryPath='checks/integrated/am3352-command-replan-check-summary.json',summary=read(summaryPath);for(const a of [summary.source,summary.board,summary.fanoutConnectivity])assert.equal(hash(a.path),a.sha256)
assert.equal(summary.cpuManualFanoutsConnected,26);assert.equal(summary.ramManualFanoutsConnected,26)
const source=read(summary.source.path),inputPath='dist/am3352-ddr23-command-replan-manual-fanouts-attempt-763/input.simple-route.json',input=read(inputPath)
assert.equal(input.connections.length,26);assert.equal(input.traces.length,177);assert.equal(input.layerCount,4);assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254)
const names=new Map(source.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e])),terminalLayers=new Map(),terminals=[]
for(const c of input.connections){
 const logical=names.get(c.name);assert(logical);const vias=[]
 for(const p of c.pointsToConnect){
  const v=source.find(v=>v.type==='pcb_via'&&Math.hypot(v.x-p.x,v.y-p.y)<1e-8);assert(v);assert.equal(v.outer_diameter,.4572);assert.equal(v.hole_diameter,.254);assert.deepEqual(v.layers,['top','inner1','inner2','bottom']);assert.equal(v.subcircuit_connectivity_map_key,logical.subcircuit_connectivity_map_key)
  const actual=source.find(t=>t.type==='pcb_trace'&&(t.source_trace_id===c.name||t.subcircuit_connectivity_map_key===logical.subcircuit_connectivity_map_key)&&t.route.some(n=>n.route_type==='via'&&Math.hypot(n.x-p.x,n.y-p.y)<1e-8));assert(actual)
  const pad=source.find(n=>n.type==='pcb_port'&&n.pcb_port_id===p.sourcePcbPortId);assert(pad);assert(logical.connected_source_port_ids.includes(pad.source_port_id));assert(Math.hypot(actual.route[0].x-pad.x,actual.route[0].y-pad.y)<1e-8)
  vias.push({x:v.x,y:v.y,viaId:v.pcb_via_id,throughLayers:v.layers})
 }
 terminalLayers.set(c.name,['top','bottom']);terminals.push({name:logical.name,sourceTraceId:c.name,viaTerminals:vias,allowedSignalLayers:['top','bottom']})
}
if(mode==='bootstrap')for(const b of input.buses)delete b.maxLengthSkew
for(const b of input.buses)assert.deepEqual(b.allowedLayers,['top','bottom'])
assert.equal(input.differentialPairs.length,1);assert.equal(input.differentialPairs[0].lengthTolerance,.127)
mkdirSync(directory,{recursive:true});const frozen=`${directory}/input.simple-route.json`,snapshot=`${directory}/native-helper.executed.mjs`;writeFileSync(frozen,JSON.stringify(input)+'\n');writeFileSync(snapshot,readFileSync('scripts/route-am3352-command-two-face-native.mjs'))
const options={smoothTuning:true,denseSearch:true,maxSearchIterations:800000},solver=new SOLVERS.BusLanesSolver(input,options,terminalLayers),start=performance.now();let steps=0,next=start+10000,error
try{while(!solver.solved&&!solver.failed&&performance.now()-start<seconds*1000){solver.step();steps++;if(performance.now()>next){console.log(JSON.stringify({steps,phase:solver.phase,elapsedSeconds:(performance.now()-start)/1000,partialInternalPaths:solver.traces.length}));next=performance.now()+10000}}}catch(e){error=String(e)}
const report={status:solver.solved?'TWO_FACE_NATIVE_COMMAND_CARRIERS_SOLVED_REPLAY_AND_CHECKS_REQUIRED':solver.failed||error?'TWO_FACE_NATIVE_COMMAND_CARRIERS_FAILED':'TWO_FACE_NATIVE_COMMAND_CARRIERS_TIMEOUT',input:artifact(frozen),originalInput:artifact(inputPath),checkedBootstrap:artifact(summaryPath),source:summary.source,executionHelper:artifact(snapshot),coreVersion:read('node_modules/@tscircuit/core/package.json').version,mode,busMatchingDeferred:mode==='bootstrap',clockPairConstraintsRetained:input.differentialPairs,terminalLayers:terminals,solverOptions:options,elapsedSeconds:(performance.now()-start)/1000,steps,error:error??solver.error??null,phase:solver.phase,allFixedTracesPreserved:true,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false}
if(solver.solved){const output=solver.getOutput();assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces);assert.equal(output.traces.length,input.traces.length+input.connections.length);const path=`${directory}/output.simple-route.json`;writeFileSync(path,JSON.stringify(output)+'\n');report.output=artifact(path)}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,seconds:report.elapsedSeconds,error:report.error,qualifiedNewDdrSignals:0}));process.exitCode=solver.solved?0:1
