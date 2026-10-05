import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readRoutingSourceSnapshot} from './lib/am3352-routing-source-snapshot.mjs'

const [bootstrap,directory]=process.argv.slice(2);assert(bootstrap&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),input=read(`${bootstrap}/input.simple-route.json`)
assert.equal(prior.nativeRamOnlyPreparation?.ramPadDogbones,26)
const source=readRoutingSourceSnapshot(prior.source).circuit
const cke=source.find(e=>e.type==='source_trace'&&e.name==='DDR_CKE');assert(cke)
const native=read(`${bootstrap}/signal-escapes.native.json`);assert.equal(native.length,26)
let edits=0
const edited=native.map(t=>{
  if(t.source_trace_id!==cke.source_trace_id)return t
  assert.equal(t.pcb_trace_id,`local_dogbone_${cke.source_trace_id}_1`)
  assert.equal(t.route.findIndex(p=>p.route_type==='via'),2)
  assert(t.route.slice(0,2).every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.1016))
  edits++;return {...t,route:structuredClone(t.route.slice(0,2))}
})
assert.equal(edits,1)
mkdirSync(directory,{recursive:true})
writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(input)+'\n')
writeFileSync(`${directory}/signal-escapes.native.json`,JSON.stringify(edited,null,2)+'\n')
const report={...prior,status:'NATIVE_RAM_DOGBONES_RETAINED_CKE_UNUSED_BRANCH_PRUNED',
  input:{path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)},
  manualUnusedBranchPruning:{nativeInput:{path:`${bootstrap}/signal-escapes.native.json`,sha256:hash(`${bootstrap}/signal-escapes.native.json`)},
    topPadDogboneWiresRetained:26,retainedNativeThroughDogbones:25,unusedBootstrapHolesRemoved:1,
    prunedSignal:'DDR_CKE',actualSourceCopperUnchanged:true,
    scope:'Remove only the unmanufactured CKE bottom branch to free the adjacent clock escape. CKE keeps its native top pad wire; any local layer change must author a full-depth checked via.'}}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,nativeTopWires:26,nativeThroughDogbones:25,actualSourceCopperUnchanged:true}))
