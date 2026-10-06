import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync,existsSync,openSync,closeSync} from 'node:fs'

const [root,mode='lanes',secondsText='120']=process.argv.slice(2),seconds=Number(secondsText)
assert(root&&['lanes','pipeline','dogbone','refine'].includes(mode)&&seconds>0&&seconds<=120)
assert(!existsSync(`${root}/solver-result.json`)&&!existsSync(`${root}/execution.json`),'Use a fresh prepared root')
const artifact=p=>({path:p,sha256:createHash('sha256').update(readFileSync(p)).digest('hex')})
const preparation=JSON.parse(readFileSync(`${root}/preparation.json`))
assert.equal(preparation.physicalErrors,0)
for(const file of preparation.files)assert.equal(artifact(file.path).sha256,file.sha256)
const worker=`${root}/worker.executed.mjs`
writeFileSync(worker,readFileSync('scripts/g350-native-routing-worker.mjs'))
writeFileSync(`${root}/driver.executed.mjs`,readFileSync('scripts/run-g350-native-prepared.mjs'))
writeFileSync(`${root}/execution.json`,JSON.stringify({mode,budgetSeconds:seconds,startedAt:new Date().toISOString(),
 preparation:artifact(`${root}/preparation.json`),input:artifact(`${root}/solver-input.json`),options:artifact(`${root}/solver-options.json`),
 worker:artifact(worker),driver:artifact(`${root}/driver.executed.mjs`),core:artifact('node_modules/@tscircuit/core/dist/index.js'),
 checks:artifact('node_modules/@tscircuit/checks/dist/index.js'),capacity:artifact('node_modules/@tscircuit/capacity-autorouter/dist/index.js'),
 qualifiedNewSignals:0,requiresActualShapedSourceReplay:true,fabricationReady:false},null,2)+'\n')
const fd=openSync(`${root}/run.log`,'wx'),start=performance.now()
const child=spawn(process.execPath,[worker,root,mode,String(seconds)],{detached:true,stdio:['ignore',fd,fd]})
let forced=false
const timer=setTimeout(()=>{forced=true;try{process.kill(-child.pid,'SIGKILL')}catch(e){if(e.code!=='ESRCH')throw e}},(seconds+15)*1000)
const outcome=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}))})
clearTimeout(timer);closeSync(fd)
const result={status:forced?'NATIVE_PREPARED_EXTERNAL_TIMEOUT':outcome.code===0?'NATIVE_PREPARED_SOLVED_REPLAY_REQUIRED':'NATIVE_PREPARED_FAILED',
 ...outcome,forcedTimeout:forced,elapsedSeconds:(performance.now()-start)/1000,execution:artifact(`${root}/execution.json`),
 solverResult:existsSync(`${root}/solver-result.json`)?artifact(`${root}/solver-result.json`):null,
 output:existsSync(`${root}/output.json`)?artifact(`${root}/output.json`):null,qualifiedNewSignals:0,fabricationReady:false}
writeFileSync(`${root}/result.json`,JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify(result));process.exitCode=outcome.code===0?0:1
