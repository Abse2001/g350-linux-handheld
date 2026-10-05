import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Local modifications that depart on top reuse the native pad-to-via stub
// without needing its original drill. Remove only those unused branches.
// The native global channels and every used transition remain unchanged.
const [inputDirectory,directory]=process.argv.slice(2);assert(inputDirectory&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${inputDirectory}/result.json`),output=read(prior.output.path),removed=[]
assert.equal(output.layerCount,4);assert.equal(output.traces.length,146)
for(const local of output.traces.filter(t=>t.pcb_trace_id.startsWith('guided_local_dogbone_')&&t.route[0].layer==='top')){
  const id=local.pcb_trace_id.replace(/^guided_/,'')
  const native=output.traces.find(t=>t.pcb_trace_id===id);assert(native)
  assert.equal(native.route.length,4);assert.equal(native.route[2].route_type,'via')
  assert(Math.hypot(native.route[2].x-local.route[0].x,native.route[2].y-local.route[0].y)<1e-6)
  removed.push({nativeTrace:id,sourceTrace:native.source_trace_id,x:native.route[2].x,y:native.route[2].y})
  native.route=native.route.slice(0,2)
}
assert.equal(removed.length,7)
mkdirSync(directory,{recursive:true})
const path=`${directory}/output.simple-route.json`;writeFileSync(path,JSON.stringify(output)+'\n')
const report={...prior,status:'GUIDED_NATIVE_BYTE0_BRANCHES_REMOVED_PENDING_RECHECK',
  priorNativeRun:{path:`${inputDirectory}/result.json`,sha256:hash(`${inputDirectory}/result.json`)},
  manualModification:{unusedThroughViasRemoved:removed.length,removed},output:{path,sha256:hash(path)},
  completedSignals:11,fabricationReady:false,timingQualified:false}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.manualModification))
