import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertDiagnosticCommandOpenings} from './lib/am3352-command-openings.mjs'
import {assertSourceCopper} from './lib/am3352-source-copper.mjs'
import {readRoutingSourceSnapshot} from './lib/am3352-routing-source-snapshot.mjs'

// For a top-layer channel, keep each native pad-to-dogbone-center wire.
// Remove only the unused bottom branch and its unmanufactured bootstrap
// hole. Local crossings must then author their own checked through-vias.
const [bootstrap,directory,busName='DDR_BYTE1',endpoint]=process.argv.slice(2);assert(bootstrap&&directory)
assert(['DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(busName))
assert(endpoint===undefined||endpoint==='cpu-only'||endpoint==='ram-only'&&busName==='DDR_BYTE1')
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),input=read(`${bootstrap}/input.simple-route.json`)
assert.deepEqual(input.buses.find(b=>b.name===busName).allowedLayers,['top'])
const native=read(`${bootstrap}/signal-escapes.native.json`)
const count=busName==='DDR_COMMAND_CLOCK'?26:endpoint?11:22
const openCommand=prior.temporaryOpenCommandChannels!==undefined
if(openCommand)assert.equal(prior.preservedSavedDdr.signals,26-assertDiagnosticCommandOpenings(prior.temporaryOpenCommandChannels))
const sharedBytes=busName==='DDR_BYTE1'&&(prior.preservedSavedDdr?.signals===26||openCommand)&&prior.preparedLocalEscapes===44
const bridge=prior.sourceCopper?.rotatedD2PowerBridge!==undefined
if(bridge)assertSourceCopper(readRoutingSourceSnapshot(prior.source).circuit,{ramRotation:180,rotatedD2PowerBridge:true,
  ramReferenceEscapes:read('lib/am3352/ram-reference-escapes-rotated-180.json')})
const sourceTraceCount=bridge?70:69
const fullJointBytes=busName==='DDR_BYTE1'&&prior.preparedLocalEscapes===96&&prior.sourceCopper?.traces===sourceTraceCount
if(endpoint==='cpu-only'&&busName==='DDR_BYTE1')assert(fullJointBytes,'CPU-only byte1 pruning requires the full jointly prepared source')
assert.equal(native.length,endpoint||fullJointBytes?96:sharedBytes?44:count)
if(busName==='DDR_COMMAND_CLOCK'&&!endpoint)assert.equal(prior.nativeRamOnlyPreparation?.ramPadDogbones,26)
const phaseIds=new Set(input.buses.find(b=>b.name===busName).connectionNames)
const changed=[]
const edited=native.map(t=>{
  if(!phaseIds.has(t.source_trace_id)||endpoint==='cpu-only'&&t.route[0].y<-15||endpoint==='ram-only'&&t.route[0].y>-15)return structuredClone(t)
  const index=t.route.findIndex(p=>p.route_type==='via');assert.equal(index,2)
  assert(t.route.slice(0,index).every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.1016))
  changed.push(t.pcb_trace_id)
  return {...t,route:structuredClone(t.route.slice(0,index))}
})
assert.equal(changed.length,count)
for(let i=0;i<native.length;i++)if(!changed.includes(native[i].pcb_trace_id))assert.deepEqual(edited[i],native[i])
mkdirSync(directory,{recursive:true})
writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(input)+'\n')
writeFileSync(`${directory}/signal-escapes.native.json`,JSON.stringify(edited,null,2)+'\n')
writeFileSync(`${directory}/result.json`,JSON.stringify({...prior,status:'NATIVE_TOP_WIRES_RETAINED_UNUSED_VIA_BRANCHES_PRUNED',
  input:{path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)},
  ...(prior.manualUnusedBranchPruning?{manualUnusedBranchPruningHistory:[...(prior.manualUnusedBranchPruningHistory??[]),prior.manualUnusedBranchPruning]}:{}),
  manualUnusedBranchPruning:{prunedBusName:busName,nativeInput:{path:`${bootstrap}/signal-escapes.native.json`,sha256:hash(`${bootstrap}/signal-escapes.native.json`)},
    topPadDogboneWiresRetained:count,unusedBootstrapHolesRemoved:count,actualSourceCopperUnchanged:true,
    ...(endpoint==='cpu-only'?{package:'U_SOC',changedTraceIds:changed,otherNativeDogbonesUnchanged:native.length-count}:{}),
    ...(sharedBytes?{changedTraceIds:changed,otherNativeDogbonesUnchanged:22,actualSourceTracesRetained:prior.sourceCopper.totalSourceTraces,actualSourceThroughViasRetained:prior.sourceCopper.totalThroughVias}:{}),
    ...(fullJointBytes?{changedTraceIds:changed,otherNativeDogbonesUnchanged:96-count,actualSourceTracesRetained:sourceTraceCount,actualSourceThroughViasRetained:69,
      ...(endpoint==='ram-only'?{package:'U_RAM',retainedByte1CpuThroughDogbones:11}:{} ),
      ...(endpoint==='cpu-only'?{retainedByte1RamThroughDogbones:11}:{} )}:{}),
    scope:'Manual intermediate fanout edit; no actual source hole is removed. New local layer changes still require full-depth physical vias and independent checks.'}},null,2)+'\n')
console.log(`Retained all ${count} native top pad wires; removed ${count} unused native bottom via branches.`)
