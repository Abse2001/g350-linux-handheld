import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync} from 'node:fs'
import {withG350FixedCopperObstacles} from './lib/g350-fixed-copper-obstacles.mjs'

const [root,budgetText='90']=process.argv.slice(2),budget=Number(budgetText)
assert(root&&!existsSync(root)&&budget>0&&budget<=120)
const source='dist/g350-byte1-bootstrap-core2088/phase-3.input.simple-route.json'
const original=JSON.parse(readFileSync(source,'utf8'))
assert.equal(original.connections.length,11)
assert.equal(original.traces.length,112)
const fixedD3=original.traces.find(t=>t.connection_name==='source_trace_42')
assert(fixedD3)
// Same physical site; remove a floating-point handoff segment that the
// complete-bus replay's self-short check identified independently.
for(const p of fixedD3.route)if(Math.abs(p.y)<1e-12)p.y=0
const prepared=withG350FixedCopperObstacles(original,{reserveWireCapsules:true,expectedThroughVias:119})
const input=prepared.input
input.bounds={minX:-17.5,maxX:17.5,minY:-9.5,maxY:32.5}
input.connections=original.connections.flatMap(c=>c.pointsToConnect.map((p,i)=>({...c,
 name:`${c.name}_${i===0?'cpu':'ram'}`,pointsToConnect:[p]})))
assert.equal(input.connections.length,22)
input.buses=[];input.differentialPairs=[]
const options={smoothTuning:false,denseSearch:false,maxSearchIterations:50000}
mkdirSync(root,{recursive:true})
writeFileSync(`${root}/solver-input.json`,JSON.stringify(input,null,2)+'\n')
writeFileSync(`${root}/solver-options.json`,JSON.stringify(options,null,2)+'\n')
const worker=`${root}/worker.executed.mjs`;writeFileSync(worker,readFileSync('scripts/g350-native-routing-worker.mjs'))
const adapter=`${root}/adapter.executed.mjs`;writeFileSync(adapter,readFileSync('scripts/lib/g350-fixed-copper-obstacles.mjs'))
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
writeFileSync(`${root}/execution.json`,JSON.stringify({mode:'dogbone',budgetSeconds:budget,
 originalInput:artifact(source),input:artifact(`${root}/solver-input.json`),worker:artifact(worker),adapter:artifact(adapter),
 core:artifact('node_modules/@tscircuit/core/dist/index.js'),checks:artifact('node_modules/@tscircuit/checks/dist/index.js'),
 addedThroughViaObstacles:prepared.addedThroughViaObstacles,addedWireCapsuleObstacles:prepared.addedWireCapsuleObstacles,
 allPlacedComponentObstaclesPreserved:true,all112FixedTracesPreserved:true,onlyD3RoundoffNormalized:true,
 physicalSiteChangeBelowMm:1e-12,requiresActualShapedReplay:true},null,2)+'\n')
const fd=openSync(`${root}/run.log`,'wx'),start=performance.now()
const child=spawn(process.execPath,[worker,root,'dogbone',String(budget)],{detached:true,stdio:['ignore',fd,fd]})
let forced=false
const timer=setTimeout(()=>{forced=true;try{process.kill(-child.pid,'SIGKILL')}catch(e){if(e.code!=='ESRCH')throw e}},(budget+15)*1000)
const outcome=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}))})
clearTimeout(timer);closeSync(fd)
const report={status:forced?'NATIVE_ESCAPE_DIAGNOSTIC_EXTERNAL_TIMEOUT':outcome.code===0?'NATIVE_ESCAPE_DIAGNOSTIC_COMPLETE_REPLAY_REQUIRED':'NATIVE_ESCAPE_DIAGNOSTIC_FAILED',
 ...outcome,forcedTimeout:forced,elapsedSeconds:(performance.now()-start)/1000,
 execution:artifact(`${root}/execution.json`),
 output:existsSync(`${root}/output.json`)?artifact(`${root}/output.json`):null,
 solverResult:existsSync(`${root}/solver-result.json`)?artifact(`${root}/solver-result.json`):null,
 qualifiedNewDdrSignals:0,fabricationReady:false}
writeFileSync(`${root}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report));process.exitCode=outcome.code===0?0:1
