import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync,mkdirSync,existsSync,openSync,closeSync} from 'node:fs'
import {withG350FixedCopperObstacles} from './lib/g350-fixed-copper-obstacles.mjs'

const [mode,root,budgetText='90',strobeCachePath,escapesPath,fixedCarriersPath]=process.argv.slice(2),budget=Number(budgetText)
assert(['dogbone','pipeline','lanes'].includes(mode));assert(root&&!existsSync(root)&&budget>0&&budget<=120)
const source='dist/g350-byte0-after-dqs0-through-vias/phase-2.input.simple-route.json'
const original=JSON.parse(readFileSync(source,'utf8'))
assert.equal(original.connections.length,9)
if(strobeCachePath){
 const paths=JSON.parse(readFileSync(strobeCachePath,'utf8'))
 assert.deepEqual(paths.map(p=>p.connection),['U_SOC.pin14','U_SOC.pin32'])
 const names=['source_trace_15','source_trace_16']
 assert.equal(original.traces.filter(t=>names.includes(t.connection_name)).length,2)
 original.traces=original.traces.filter(t=>!names.includes(t.connection_name)).concat(paths.map((p,i)=>({type:'pcb_trace',pcb_trace_id:`diagnostic_center_strobe_${i}`,connection_name:names[i],source_trace_id:names[i],route:p.route})))
 // Routing region inside the continuous DDR power reference. Retain all
 // placed obstacles; this changes the search domain, not the PCB outline.
 original.bounds={minX:-17.5,maxX:17.5,minY:-9.5,maxY:32.5}
}
if(mode==='lanes'){
 assert(escapesPath)
 const escapes=JSON.parse(readFileSync(escapesPath,'utf8'))
 assert.equal(escapes.length,18)
 for(const c of original.connections){
  c.pointsToConnect=c.pointsToConnect.map(p=>{
   const trace=escapes.find(t=>t.connectsTo.includes(p.pcb_port_id))
   assert(trace&&trace.source_trace_id===c.source_trace_id)
   assert(Math.hypot(trace.route[0].x-p.x,trace.route[0].y-p.y)<1e-8)
   const exit=trace.route.at(-1)
   assert.equal(exit.layer,'bottom')
   return {x:exit.x,y:exit.y,layer:'bottom',pointId:`native_exit_${p.pcb_port_id}`}
  })
 }
 original.traces.push(...escapes.map(t=>({...t,connection_name:t.source_trace_id})))
 if(fixedCarriersPath){
  const fixed=JSON.parse(readFileSync(fixedCarriersPath,'utf8'))
  assert.equal(fixed.length,7)
  assert(fixed.every(t=>t.route.every(p=>p.route_type==='wire'&&p.layer==='bottom')))
  const fixedIds=new Set(fixed.map(t=>t.source_trace_id))
  assert.equal(fixedIds.size,7)
  assert([...fixedIds].every(id=>original.connections.some(c=>c.source_trace_id===id)))
  original.traces.push(...fixed)
  original.connections=original.connections.filter(c=>!fixedIds.has(c.source_trace_id))
  assert.equal(original.connections.length,2)
  const remaining=new Set(original.connections.map(c=>c.name))
  original.buses=original.buses.map(b=>({...b,connectionNames:b.connectionNames.filter(n=>remaining.has(n))})).filter(b=>b.connectionNames.length)
 }
}
const prepared=withG350FixedCopperObstacles(original,{reserveWireCapsules:mode==='dogbone',expectedThroughVias:mode==='lanes'?119:101}),input=prepared.input
if(mode==='dogbone'){
 input.connections=original.connections.flatMap(c=>c.pointsToConnect.map((p,i)=>({...c,name:`${c.name}_${i===0?'cpu':'ram'}`,pointsToConnect:[p]})))
 input.buses=[];input.differentialPairs=[]
}
const options={smoothTuning:false,denseSearch:false,maxSearchIterations:50000}
mkdirSync(root,{recursive:true})
writeFileSync(`${root}/solver-input.json`,JSON.stringify(input,null,2)+'\n')
writeFileSync(`${root}/solver-options.json`,JSON.stringify(options,null,2)+'\n')
const worker=`${root}/worker.executed.mjs`;writeFileSync(worker,readFileSync('scripts/g350-native-routing-worker.mjs'))
const adapter=`${root}/adapter.executed.mjs`;writeFileSync(adapter,readFileSync('scripts/lib/g350-fixed-copper-obstacles.mjs'))
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const execution={mode,budgetSeconds:budget,originalInput:artifact(source),strobeOverride:strobeCachePath?artifact(strobeCachePath):null,escapes:escapesPath?artifact(escapesPath):null,fixedCarriers:fixedCarriersPath?artifact(fixedCarriersPath):null,input:artifact(`${root}/solver-input.json`),options:artifact(`${root}/solver-options.json`),worker:artifact(worker),adapter:artifact(adapter),core:artifact('node_modules/@tscircuit/core/dist/index.js'),checks:artifact('node_modules/@tscircuit/checks/dist/index.js'),addedThroughViaObstacles:prepared.addedThroughViaObstacles,addedWireCapsuleObstacles:prepared.addedWireCapsuleObstacles,componentObstaclesPreserved:true,fixedPowerCopperPreserved:true,strobeCandidateRequiresActualSourceChecks:!!strobeCachePath}
writeFileSync(`${root}/execution.json`,JSON.stringify(execution,null,2)+'\n')
const fd=openSync(`${root}/run.log`,'wx'),start=performance.now()
const child=spawn(process.execPath,[worker,root,mode,String(budget)],{detached:true,stdio:['ignore',fd,fd]})
let forced=false;const timer=setTimeout(()=>{forced=true;try{process.kill(-child.pid,'SIGKILL')}catch(e){if(e.code!=='ESRCH')throw e}},(budget+15)*1000)
const outcome=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}))})
clearTimeout(timer);closeSync(fd)
const report={status:forced?'NATIVE_DIAGNOSTIC_EXTERNAL_TIMEOUT':outcome.code===0?'NATIVE_DIAGNOSTIC_COMPLETE_REPLAY_REQUIRED':'NATIVE_DIAGNOSTIC_FAILED',...outcome,forcedTimeout:forced,elapsedSeconds:(performance.now()-start)/1000,execution:artifact(`${root}/execution.json`),log:artifact(`${root}/run.log`),output:existsSync(`${root}/output.json`)?artifact(`${root}/output.json`):null,solverResult:existsSync(`${root}/solver-result.json`)?artifact(`${root}/solver-result.json`):null,qualifiedNewDdrSignals:0,fabricationReady:false}
writeFileSync(`${root}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));process.exitCode=outcome.code===0?0:1
