import {spawn} from 'node:child_process'
import {readFileSync,writeFileSync,mkdirSync,openSync,closeSync,readdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {Circuit} from 'tscircuit'
import {Circuit as CoreCircuit} from '@tscircuit/core'

const [entry,directory,phase='DDR_COMMAND_CLOCK_BUS_LANES',duration='120']=process.argv.slice(2)
assert(entry&&directory&&!existsSync(`${directory}/result.json`));const seconds=Number(duration);assert(seconds>0&&seconds<=180)
assert.equal(Circuit,CoreCircuit,'tsci/eval must use the same latest core as the direct native solver')
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
mkdirSync(directory,{recursive:true})
const snapshot=`${directory}/phase-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/run-am3352-latest-ddr-phase.mjs'))
const definitionDirectory=`${directory}/execution-inputs`;mkdirSync(definitionDirectory)
const definitions=['package.json','package-lock.json','bun.lock',entry,'experiments/am3352-powered-host.circuit.tsx','lib/am3352/FourLayerDdrConstraints.tsx'].map(originalPath=>{
  const path=`${definitionDirectory}/${originalPath.replaceAll('/','__')}`
  writeFileSync(path,readFileSync(originalPath));return {...artifact(path),originalPath}
})
const versions=Object.fromEntries(['tscircuit','@tscircuit/cli','@tscircuit/core','@tscircuit/capacity-autorouter'].map(p=>[p,read(`node_modules/${p}/package.json`).version]))
assert.equal(versions['@tscircuit/core'],'0.0.2080')
const args=['build',entry,'--disable-parts-engine','--autorouter-debug','--autorouter-phase',phase,'--autorouter-debug-dir',directory,'--autorouter-dump-srj','all','--autorouter-timeout',`${seconds}s`]
writeFileSync(`${directory}/execution.json`,JSON.stringify({definitions,versions,sameCoreExports:true,command:'node_modules/.bin/tsci',args,executionHelper:artifact(snapshot)},null,2)+'\n')
const logPath=`${directory}/build.log`,fd=openSync(logPath,'wx'),start=performance.now()
const child=spawn('node_modules/.bin/tsci',args,{detached:true,stdio:['ignore',fd,fd]})
let forcedTimeout=false,forceTimer
const stop=()=>{try{process.kill(-child.pid,'SIGTERM')}catch(e){if(e.code!=='ESRCH')throw e}forceTimer=setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL')}catch(e){if(e.code!=='ESRCH')throw e}},5000)}
const timer=setTimeout(()=>{forcedTimeout=true;stop()},(seconds+90)*1000)
const outcome=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}))})
clearTimeout(timer);clearTimeout(forceTimer);closeSync(fd)
const artifacts=readdirSync(directory).filter(p=>/phase-.*\.(input\.simple-route|error|timeout|output\.traces)\.json$|board\.meta\.json$|board\.source-and-pcb\.circuit\.json$/.test(p)).map(p=>artifact(`${directory}/${p}`))
const phases=artifacts.filter(a=>a.path.endsWith('.input.simple-route.json')).map(a=>{const input=read(a.path);assert.equal(input.layerCount,4);for(const bus of input.buses??[])assert((bus.allowedLayers??[]).every(l=>['top','bottom'].includes(l)));return {input:a,connections:input.connections.length,fixedTraces:input.traces?.length??0,physicalPads:input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,innerPlanesReserved:true}})
const sourceDefinitionsUnchanged=definitions.every(d=>hash(d.originalPath)===d.sha256)
const report={status:forcedTimeout?'NATIVE_TSCI_PHASE_EXTERNAL_TIMEOUT':outcome.code===0?'NATIVE_TSCI_PHASE_BUILD_FINISHED_CHECKS_REQUIRED':'NATIVE_TSCI_PHASE_BUILD_FAILED',...outcome,forcedTimeout,sourceDefinitionsUnchanged,elapsedSeconds:(performance.now()-start)/1000,execution:artifact(`${directory}/execution.json`),log:artifact(logPath),artifacts,phases,qualifiedNewDdrSignals:0,fabricationReady:false,defaultChanged:false}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,phases,qualifiedNewDdrSignals:0}));process.exitCode=outcome.code===0?0:1
