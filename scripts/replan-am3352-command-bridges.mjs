import {readFileSync,writeFileSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'

// Reorder the blocked channels, retaining the same immutable native seed
// and every copper/drill constraint. No incomplete run is accepted.
const [bootstrap,startArg='163',countArg='12']=process.argv.slice(2)
assert(bootstrap)
const start=Number(startArg),count=Number(countArg);assert(count>=1&&count<=16)
let priority=['source_trace_8','source_trace_25','source_trace_44']
const seen=new Set(),attempts=[]
for(let i=0;i<count;i++){
 const attempt=start+i,grid=seen.has(priority.join(','))?'.02':'.04'
 seen.add(priority.join(','))
 const directory=`dist/am3352-dual-layer-command-bridges-attempt-${attempt}`
 const log=`checks/integrated/am3352-dual-layer-command-bridges-attempt-${attempt}.log`
 const r=spawnSync('bun',['scripts/repair-am3352-command-channels.mjs',bootstrap,directory,'30',grid,priority.join(','),'6'],{encoding:'utf8',maxBuffer:4*1024*1024})
 writeFileSync(log,r.stdout+(r.stderr??''))
 const result=JSON.parse(readFileSync(`${directory}/result.json`))
 const brief={attempt,status:result.status,failed:result.failedConnection,native:result.partialRepairBootstrap?.nativeChannels,
  manual:result.partialRepairBootstrap?.manualChannels,priority,grid,exitCode:r.status}
 attempts.push(brief);console.log(JSON.stringify(brief))
 writeFileSync(`checks/integrated/am3352-command-bridge-replans-${start}.json`,JSON.stringify({bootstrap,attempts,fabricationReady:false},null,2)+'\n')
 if(result.output&&result.completedSignals===26){console.log(JSON.stringify({completedDirectory:directory}));process.exit(0)}
 if(!result.failedConnection||r.status===null){process.exit(1)}
 const failed=result.failedConnection
 priority=[failed,...priority.filter(n=>n!==failed)]
}
process.exitCode=1
