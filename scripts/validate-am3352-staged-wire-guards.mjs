import {readFileSync,writeFileSync,mkdtempSync,existsSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'
import {assertOpenCommandPrefixes} from './lib/am3352-open-command-prefixes.mjs'
import {assertOpenDataWires} from './lib/am3352-open-data-wires.mjs'

const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const dir=mkdtempSync(`${tmpdir()}/g350-staged-wire-guards-`),prefixDir='dist/am3352-ddr32-casn-csn-prefix-open-attempt-614'
const prior=read(`${prefixDir}/result.json`),source=read(prior.source.path),input=read(prior.input.path),clone=structuredClone
assertOpenCommandPrefixes(prior,input,source)
const prefixTests={declaredPrefixAccepted:true}
let changed=clone(input);changed.traces.find(t=>t.source_trace_id!=='source_trace_5').route[0].x+=.01
assert.throws(()=>assertOpenCommandPrefixes(prior,changed,source));prefixTests.undeclaredCopperMutationRejected=true
let changedSource=clone(source);changedSource.splice(changedSource.findIndex(e=>e.type==='pcb_via'),1)
assert.throws(()=>assertOpenCommandPrefixes(prior,input,changedSource));prefixTests.retainedHoleDeletionRejected=true
changed=clone(input);changed.traces[0].source_trace_id='source_trace_9999'
assert.throws(()=>assertOpenCommandPrefixes(prior,changed,source));prefixTests.traceOwnerMutationRejected=true
const save=(run,filename)=>{
 const p=`${dir}/${filename}.json`,r=spawnSync(process.execPath,['scripts/save-am3352-registered-command.mjs',run,p],{encoding:'utf8'})
 assert.equal(r.status,1);assert(r.stderr.includes('Rebuild all temporarily opened signals'));assert(!existsSync(p))
 return{rejected:true,outputAbsent:true}
}
const saved=save(prefixDir,'prefix');prefixTests.stagedReplaySaveRejected=saved.rejected;prefixTests.stagedReplayOutputAbsent=saved.outputAbsent
const prefixReport={status:'PASS',preparation:artifact(`${prefixDir}/result.json`),source:prior.source,input:prior.input,tests:prefixTests,
 helpers:['scripts/lib/am3352-open-command-prefixes.mjs','scripts/save-am3352-registered-command.mjs'].map(artifact),defaultChanged:false,fabricationReady:false}
writeFileSync('checks/integrated/am3352-ddr32-command-prefix-guard-validation.json',JSON.stringify(prefixReport,null,2)+'\n')
const dataTests={},preparations=['dist/am3352-ddr32-casn-dqm1-d10-open-attempt-636','dist/am3352-ddr32-casn-dqm1-d10-ram-tails-retained-attempt-646'].map(d=>{
 const r=read(`${d}/result.json`),i=read(r.input.path);assertOpenDataWires(r,i,source)
 dataTests[d.endsWith('636')?'declaredCpuMarkerOpeningAccepted':'declaredRamTailsAccepted']=true
 for(const [name,mutate] of [
  ['undeclaredCopperMutationRejected',x=>{x.traces.find(t=>!['source_trace_38','source_trace_36'].includes(t.source_trace_id)).route[0].x+=.01}],
  ['padObstacleMutationRejected',x=>{x.obstacles.find(o=>o.circuitJsonMetadata?.pcb_smtpad_id).center.x+=.01}],
  ['obstacleDeletionRejected',x=>{x.obstacles.splice(0,1)}],
  ['traceOwnerMutationRejected',x=>{x.traces[0].source_trace_id='source_trace_9999'}]
 ]){const x=clone(i);mutate(x);assert.throws(()=>assertOpenDataWires(r,x,source));dataTests[name]=true}
 const s=clone(source);s.splice(s.findIndex(e=>e.type==='pcb_via'),1);assert.throws(()=>assertOpenDataWires(r,i,s));dataTests.physicalSourceHoleDeletionRejected=true
 if(d.endsWith('646')){
  const a=read(r.temporaryOpenDataWires.path);a[0].cutIndex++
  const fakePath=`${dir}/wrong-cut.json`;writeFileSync(fakePath,JSON.stringify(a)+'\n')
  const broken={...r,temporaryOpenDataWires:{...r.temporaryOpenDataWires,...artifact(fakePath)}}
  assert.throws(()=>assertOpenDataWires(broken,i,source));dataTests.changedRamTailCutRejected=true
  const x=clone(i),owner=a[0].sourceTraceId;x.traces.find(t=>t.source_trace_id===owner).route.at(-1).x+=.01
  assert.throws(()=>assertOpenDataWires(r,x,source));dataTests.changedRamPadEndpointRejected=true
 }
 return{preparation:artifact(`${d}/result.json`),input:r.input,descriptor:r.temporaryOpenDataWires}
})
const dataSaved=save('dist/am3352-ddr32-casn-neighbor-replan-native-top-attempt-637','data-native')
dataTests.routedStagingSaveRejected=dataSaved.rejected;dataTests.routedStagingOutputAbsent=dataSaved.outputAbsent
const dataReport={status:'PASS',source:prior.source,preparations,tests:dataTests,
 helpers:['scripts/validate-am3352-staged-wire-guards.mjs','scripts/lib/am3352-open-data-wires.mjs','scripts/lib/am3352-open-command-prefixes.mjs','scripts/save-am3352-registered-command.mjs'].map(artifact),defaultChanged:false,fabricationReady:false}
writeFileSync('checks/integrated/am3352-ddr32-data-wire-guard-validation.json',JSON.stringify(dataReport,null,2)+'\n')
console.log(JSON.stringify({status:'PASS',prefixTests:Object.keys(prefixTests).length,dataTests:Object.keys(dataTests).length,stagedExportsRejected:true}))
