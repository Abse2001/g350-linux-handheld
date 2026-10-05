import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'

const [priorPath,directory,firstArg,signalsArg,secondsArg='15']=process.argv.slice(2);assert(priorPath&&directory&&signalsArg&&!existsSync(`${directory}/result.json`));const first=Number(firstArg),seconds=Number(secondsArg),signals=signalsArg.split(',');assert(Number.isInteger(first)&&first>=715);assert(seconds>0&&seconds<=60);assert(signals.length<=30&&signals.every(s=>/^DDR_(D\d+|DQM[01]|A\d+|BA\d+|ODT|CKE|RASn|CASn|WEn|CSn0|RESETn)$/.test(s)))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),initial=read(priorPath)
assert.equal(initial.status,'BOTTOM_RAM_MANUAL_ROUTE_PLAN_FOUND_REPLAY_AND_ALL_CHECKS_REQUIRED');assert(!initial.exportable&&!initial.fabricationReady)
mkdirSync(directory,{recursive:true});const snapshot=`${directory}/continuation-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/continue-am3352-bottom-manual-routes.mjs'))
const report={status:'BOTTOM_RAM_MANUAL_CONTINUATION_IN_PROGRESS',initialStage:artifact(priorPath),executionHelper:artifact(snapshot),requestedSignals:signals,firstAttempt:first,secondsPerRoute:seconds,steps:[],qualifiedNewDdrSignals:0,exportable:false,defaultChanged:false,fabricationReady:false},finish=()=>writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
let current=priorPath,failures=0;finish()
for(let i=0;i<signals.length;i++){
 const signal=signals[i],attempt=first+i,stage=`dist/am3352-ram-bottom-partial-${signal.toLowerCase()}-manual-attempt-${attempt}`,logPath=`checks/integrated/am3352-ram-bottom-partial-${signal.toLowerCase()}-manual-attempt-${attempt}.log`;assert(!existsSync(`${stage}/result.json`))
 const result=spawnSync(process.execPath,['scripts/repair-am3352-bottom-partial-route.mjs',current,stage,signal,String(seconds),'replan-unrouted'],{encoding:'utf8',maxBuffer:1024*1024});writeFileSync(logPath,(result.stdout??'')+(result.stderr??''))
 if(!existsSync(`${stage}/result.json`)){report.steps.push({attempt,signal,status:'HELPER_REJECTED_BEFORE_TERMINAL_REPORT',exitCode:result.status,log:artifact(logPath)});report.status='BOTTOM_RAM_MANUAL_CONTINUATION_HELPER_REJECTED';finish();process.exitCode=1;break}
 const path=`${stage}/result.json`,run=read(path);assert(!run.exportable&&!run.fabricationReady);report.steps.push({...artifact(path),attempt,signal,status:run.status,log:artifact(logPath),exitCode:result.status})
 if(run.state){assert.equal(result.status,0);current=path;failures=0}else{assert.equal(result.status,1);failures++}
 report.latestSuccessfulStage=artifact(current);const state=read(read(current).state.path);report.stagedFullRoutes=Object.keys(state.fullPaths).length;report.remainingDdrSignals=49-report.stagedFullRoutes;finish()
 console.log(JSON.stringify({attempt,signal,status:run.status,stagedFullRoutes:report.stagedFullRoutes,remainingDdrSignals:report.remainingDdrSignals,qualifiedNewDdrSignals:0,exportable:false}))
 if(failures>=3){report.status='BOTTOM_RAM_MANUAL_CONTINUATION_STOPPED_AFTER_THREE_UNFINISHED_ROUTES';finish();process.exitCode=1;break}
}
if(report.status==='BOTTOM_RAM_MANUAL_CONTINUATION_IN_PROGRESS'){report.status=report.steps.every(s=>s.status==='BOTTOM_RAM_MANUAL_ROUTE_PLAN_FOUND_REPLAY_AND_ALL_CHECKS_REQUIRED')?'BOTTOM_RAM_MANUAL_CONTINUATION_PATHS_FOUND_REPLAY_AND_ALL_CHECKS_REQUIRED':'BOTTOM_RAM_MANUAL_CONTINUATION_PATHS_INCOMPLETE';finish();process.exitCode=report.status.includes('PATHS_FOUND')?0:1}
console.log(JSON.stringify({status:report.status,attempts:report.steps.length,stagedFullRoutes:report.stagedFullRoutes,remainingDdrSignals:report.remainingDdrSignals,exportable:false,fabricationReady:false}))
