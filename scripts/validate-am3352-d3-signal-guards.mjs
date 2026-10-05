import {readFileSync,writeFileSync,mkdtempSync,existsSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'
import {assertOpenD3Signal} from './lib/am3352-open-d3-signal.mjs'
import {readStagedCasnD3Open} from './lib/am3352-staged-casn-d3-open.mjs'
import {readStagedCasnD3Restored} from './lib/am3352-staged-casn-d3-restored.mjs'

const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),directory=mkdtempSync(`${tmpdir()}/g350-d3-signal-guards-`)
const preparation='dist/am3352-ddr32-casn-d3-signal-open-attempt-670/result.json',r=read(preparation),source=read(r.source.path),input=read(r.input.path),tests={}
const {omittedHoleIds}=assertOpenD3Signal(r,input,source);assert.deepEqual([...omittedHoleIds],['pcb_via_145','pcb_via_146']);tests.onlyDeclaredD3HolesAccepted=true
for(const [name,mutate] of [
 ['undeclaredCopperChangeRejected',i=>{i.traces.find(t=>t.source_trace_id==='source_trace_13').route[0].x+=.01}],
 ['padDeletionRejected',i=>{i.obstacles.splice(i.obstacles.findIndex(o=>o.circuitJsonMetadata?.pcb_smtpad_id),1)}],
 ['changedD3CpuPadMarkerRejected',i=>{i.traces.find(t=>t.source_trace_id==='source_trace_42').route[0].x+=.01}],
 ['changedCsn0TailRejected',i=>{i.traces.find(t=>t.source_trace_id==='source_trace_5').route[0].x+=.01}],
 ['changedViaDimensionsRejected',i=>{i.minViaHoleDiameter=.2}]
]){const i=structuredClone(input);mutate(i);assert.throws(()=>assertOpenD3Signal(r,i,source));tests[name]=true}
const changedSource=structuredClone(source);changedSource.splice(changedSource.findIndex(v=>v.type==='pcb_via'&&v.source_net_id),1);assert.throws(()=>assertOpenD3Signal(r,input,changedSource));tests.referenceHoleDeletionRejected=true
const d=read(r.temporaryOpenD3Signal.path);d.omittedSignalHoles[0]=source.find(v=>v.type==='pcb_via'&&v.source_net_id)
const fake=`${directory}/undeclared-reference-hole.json`;writeFileSync(fake,JSON.stringify(d)+'\n')
const wrong={...r,temporaryOpenD3Signal:{...r.temporaryOpenD3Signal,...artifact(fake)}};assert.throws(()=>assertOpenD3Signal(wrong,input,source));tests.referenceHoleReplanRejected=true
const casn=readStagedCasnD3Open('dist/am3352-ddr32-casn-d3-open-native-bottom-leg-attempt-673');assert.equal(casn.input.traces.length,135);tests.actualNativeCasnJoinVerified=true
const restored=readStagedCasnD3Restored('dist/am3352-ddr32-d3-guarded-native-bottom-carrier-attempt-676');assert.equal(restored.input.traces.length,135);assert.equal(restored.input.traces.find(t=>t.source_trace_id==='source_trace_42').route.filter(p=>p.route_type==='via').length,4);tests.actualNativeD3JoinVerified=true
const destination=`${directory}/rejected.json`,save=spawnSync(process.execPath,['scripts/save-am3352-registered-command.mjs','dist/am3352-ddr32-d3-guarded-native-bottom-carrier-attempt-676',destination],{encoding:'utf8'})
assert.equal(save.status,1);assert(save.stderr.includes('Rebuild all temporarily opened signals'));assert(!existsSync(destination));tests.incompleteReplaySaveRejected=true
const report={status:'PASS',preparation:artifact(preparation),source:r.source,input:r.input,tests,helpers:['scripts/validate-am3352-d3-signal-guards.mjs','scripts/lib/am3352-open-d3-signal.mjs','scripts/lib/am3352-open-command-prefixes.mjs','scripts/lib/am3352-staged-casn-d3-open.mjs','scripts/lib/am3352-staged-casn-d3-restored.mjs','scripts/save-am3352-registered-command.mjs'].map(artifact),frozenSourceModified:false,defaultChanged:false,fabricationReady:false}
writeFileSync('checks/integrated/am3352-ddr32-d3-signal-guard-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:'PASS',tests:Object.keys(tests).length,sourceModified:false,exportable:false,fabricationReady:false}))
