import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertSourceCopper} from './lib/am3352-source-copper.mjs'
import {readRoutingSourceSnapshot} from './lib/am3352-routing-source-snapshot.mjs'

// Preserve eleven RAM fanouts only across the exact removal of eleven
// unused CPU byte1 via branches. Source copper, other holes and pads stay.
// This does not accept local copper, complete a channel or qualify timing.
const [bootstrap,localDirectory,directory]=process.argv.slice(2)
assert(bootstrap&&localDirectory&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const next=read(`${bootstrap}/result.json`),old=read(`${localDirectory}/result.json`)
assert.equal(old.bus,'DDR_BYTE1');assert.equal(old.freeDqExitPermutation,false)
assert.deepEqual(next.source,old.source);assert.deepEqual(next.memoryMap,old.memoryMap)
const source=readRoutingSourceSnapshot(next.source).circuit
assertSourceCopper(source,{ramRotation:180,rotatedD2PowerBridge:true,
  ramReferenceEscapes:read('lib/am3352/ram-reference-escapes-rotated-180.json')})
assert.equal(next.manualUnusedBranchPruning.package,'U_SOC')
const strobeRestoration=next.manualCpuStrobeViaRestoration!==undefined
const commandPruning=!strobeRestoration&&next.manualUnusedBranchPruning.prunedBusName==='DDR_COMMAND_CLOCK'
const expectedChanges=strobeRestoration?2:commandPruning?26:11
if(strobeRestoration)assert.equal(next.manualCpuStrobeViaRestoration.restoredNativeVias,2)
else assert.equal(next.manualUnusedBranchPruning.unusedBootstrapHolesRemoved,expectedChanges)
if(!commandPruning&&!strobeRestoration)assert.equal(next.manualUnusedBranchPruning.retainedByte1RamThroughDogbones,11)
assert.equal(next.sourceCopper.traces,70);assert.equal(next.sourceCopper.throughVias,69)
const input=read(`${bootstrap}/input.simple-route.json`),native=read(`${bootstrap}/signal-escapes.native.json`)
assert.equal(native.length,96);assert.equal(input.traces.length,70)
const previousInputPath=old.nativeBootstrap.path.replace('signal-escapes.native.json','input.simple-route.json')
assert.deepEqual(input,read(previousInputPath),'Only unused native CPU branches may change')
assert.equal(hash(old.nativeBootstrap.path),old.nativeBootstrap.sha256)
const previousNative=read(old.nativeBootstrap.path)
const phase=new Set(input.buses.find(b=>b.name==='DDR_BYTE1').connectionNames)
const changedPhase=strobeRestoration?new Set(input.differentialPairs.find(p=>p.connectionNames.every(n=>phase.has(n))).connectionNames):commandPruning?new Set(input.buses.find(b=>b.name==='DDR_COMMAND_CLOCK').connectionNames):phase
assert.deepEqual(input.buses.find(b=>b.name=== (commandPruning?'DDR_COMMAND_CLOCK':'DDR_BYTE1')).allowedLayers,['top'])
let changes=0
for(const t of native){
 const before=previousNative.find(p=>p.pcb_trace_id===t.pcb_trace_id);assert(before)
 if(changedPhase.has(t.source_trace_id)&&t.route[0].y>-15){
  assert(before.route.every(p=>p.y>-10))
  if(strobeRestoration){
   const restoration=next.manualCpuStrobeViaRestoration
   assert.equal(hash(restoration.priorNative.path),restoration.priorNative.sha256)
   assert.equal(old.nativeBootstrap.sha256,restoration.priorNative.sha256)
   assert.equal(hash(restoration.fullNative.path),restoration.fullNative.sha256)
   assert.equal(before.route.length,1)
   const canonical=read(restoration.fullNative.path).find(p=>p.pcb_trace_id===t.pcb_trace_id);assert(canonical)
   assert.deepEqual(t,canonical);assert.deepEqual(before.route[0],t.route[0])
   assert.equal(t.route.filter(p=>p.route_type==='via').length,1)
  }else if(next.manualCpuPadStartCorrection&&!commandPruning){
   assert.equal(hash(next.manualCpuPadStartCorrection.priorNative.path),next.manualCpuPadStartCorrection.priorNative.sha256)
   assert.equal(old.nativeBootstrap.sha256,next.manualCpuPadStartCorrection.priorNative.sha256)
   assert.equal(before.route.length,2)
   assert(before.route.every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.1016))
   assert.deepEqual(t,{...before,route:before.route.slice(0,1)})
  }else{
   assert.equal(before.route.filter(p=>p.route_type==='via').length,1)
   assert.deepEqual(t,{...before,route:before.route.slice(0,2)})
  }
  changes++
 }else assert.deepEqual(t,before)
}
assert.equal(changes,expectedChanges)
const paths=read(`${localDirectory}/local-escapes.json`).filter(t=>t.route[0].y<-15)
const records=old.localEscapes.filter(r=>r.package==='U_RAM'&&!r.error)
assert.equal(paths.length,11);assert.equal(records.length,11)
assert.deepEqual(new Set(paths.map(t=>t.source_trace_id)),phase)
for(const t of paths){
 assert(t.route.every(p=>p.y<=-18+1e-6),'RAM copper must remain outside every changed CPU branch')
 const stub=native.find(p=>p.pcb_trace_id===t.pcb_trace_id.replace('guided_',''));assert(stub)
 assert.deepEqual(stub,previousNative.find(p=>p.pcb_trace_id===stub.pcb_trace_id))
 assert(Math.hypot(t.route[0].x-stub.route.at(-1).x,t.route[0].y-stub.route.at(-1).y)<1e-6)
 assert.equal(t.route.at(-1).layer,'top')
}
mkdirSync(directory,{recursive:true})
writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(input)+'\n')
writeFileSync(`${directory}/signal-escapes.native.json`,JSON.stringify(native,null,2)+'\n')
writeFileSync(`${directory}/local-escapes.json`,JSON.stringify(paths,null,2)+'\n')
const nativePath=`${directory}/signal-escapes.native.json`
const report={...old,status:'RAM_BYTE1_FANOUTS_REBASED_UNUSED_CPU_BRANCHES_PRUNED',source:next.source,sourceCopper:next.sourceCopper,
 preparedLocalEscapes:96,input:{path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)},
 nativeBootstrap:{path:nativePath,sha256:hash(nativePath),dogbones:96},localEscapes:records,
 manualUnusedBranchPruning:next.manualUnusedBranchPruning,
 manualUnusedBranchPruningHistory:next.manualUnusedBranchPruningHistory,
 manualCpuPadStartCorrection:next.manualCpuPadStartCorrection,
 manualCpuStrobeViaRestoration:next.manualCpuStrobeViaRestoration,
 rebasedRamFanouts:{path:`${localDirectory}/local-escapes.json`,sha256:hash(`${localDirectory}/local-escapes.json`),count:11,
  sourceCopperAndEveryOtherNativeDescriptorUnchanged:true,changedCpuBranches:expectedChanges},
 completedSignals:0,fabricationReady:false,timingQualified:false,pairGeometryQualified:false}
for(const key of ['channel','output','localReplans','reusedPackageFanouts','localOrderSeed'])delete report[key]
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,reusedRamFanouts:11,nativeDescriptors:96,signalVias:native.flatMap(t=>t.route.filter(p=>p.route_type==='via')).length,completeChannels:0}))
