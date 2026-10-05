import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
const [inputPath,directory,secondsArg='60',mode='matching',selection='all']=process.argv.slice(2);assert(inputPath&&directory&&!existsSync(`${directory}/result.json`));const seconds=Number(secondsArg);assert(seconds>0&&seconds<=180)
assert(['matching','bootstrap'].includes(mode))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),input=read(inputPath)
assert.equal(input.layerCount,4);assert(input.connections.length>0&&input.connections.length<=26);assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254)
for(const bus of input.buses)assert(bus.allowedLayers.every(l=>['top','bottom'].includes(l)))
assert.equal(read('node_modules/@tscircuit/core/package.json').version,'0.0.2080')
if(selection!=='all'){
 const names=selection.split(',');assert(names.length&&new Set(names).size===names.length&&names.every(n=>input.connections.some(c=>c.name===n)))
 input.connections=input.connections.filter(c=>names.includes(c.name))
 input.buses=input.buses.map(b=>({...b,connectionNames:b.connectionNames.filter(n=>names.includes(n))})).filter(b=>b.connectionNames.length)
 for(const pair of input.differentialPairs??[])assert(pair.connectionNames.every(n=>names.includes(n))||pair.connectionNames.every(n=>!names.includes(n)),'Keep both wires when selecting a pair')
 input.differentialPairs=(input.differentialPairs??[]).filter(p=>p.connectionNames.every(n=>names.includes(n)))
}
if(mode==='bootstrap')for(const bus of input.buses)delete bus.maxLengthSkew
mkdirSync(directory,{recursive:true});const frozen=`${directory}/input.simple-route.json`,snapshot=`${directory}/native-helper.executed.mjs`;writeFileSync(frozen,JSON.stringify(input)+'\n');writeFileSync(snapshot,readFileSync('scripts/route-am3352-ddr33-manual-fanout-native.mjs'))
const options={fanout:'none',smoothTuning:true,denseSearch:true},solver=new SOLVERS.BusLanesPipelineSolver(input,options),start=performance.now();let steps=0,next=start+10000,error
try{while(!solver.solved&&!solver.failed&&performance.now()-start<seconds*1000){solver.step();steps++;if(performance.now()>next){console.log(JSON.stringify({steps,phase:solver.phase,elapsedSeconds:(performance.now()-start)/1000,lane:solver.stats.lane,totalLanes:solver.stats.totalLanes}));next=performance.now()+10000}}}catch(e){error=String(e)}
const report={status:solver.solved?'MANUAL_FANOUT_NATIVE_CARRIERS_SOLVED_REPLAY_AND_CHECKS_REQUIRED':solver.failed||error?'MANUAL_FANOUT_NATIVE_CARRIERS_FAILED':'MANUAL_FANOUT_NATIVE_CARRIERS_TIMEOUT',input:artifact(frozen),originalInput:artifact(inputPath),executionHelper:artifact(snapshot),coreVersion:read('node_modules/@tscircuit/core/package.json').version,mode,selection,fullCommandGroupMatchingDeferred:selection!=='all'||mode==='bootstrap',busMatchingDeferred:mode==='bootstrap',clockPairConstraintsRetained:input.differentialPairs,solverOptions:options,elapsedSeconds:(performance.now()-start)/1000,steps,error:error??solver.error??null,phase:solver.phase,stats:solver.stats,allFixedTracesPreserved:true,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false}
if(solver.solved){const output=solver.getOutput();assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces);assert.equal(output.traces.length,input.traces.length+input.connections.length);const path=`${directory}/output.simple-route.json`;writeFileSync(path,JSON.stringify(output)+'\n');report.output=artifact(path)}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,seconds:report.elapsedSeconds,error:report.error,qualifiedNewDdrSignals:0}));process.exitCode=solver.solved?0:1
