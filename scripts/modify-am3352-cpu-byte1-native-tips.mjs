import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertSourceCopper} from './lib/am3352-source-copper.mjs'
import {readRoutingSourceSnapshot} from './lib/am3352-routing-source-snapshot.mjs'

// CPU byte1 vias were already pruned. Return only those eleven unused TOP
// tip descriptors to their exact actual pads. No source copper is removed.
const [bootstrap,directory]=process.argv.slice(2);assert(bootstrap&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),input=read(`${bootstrap}/input.simple-route.json`)
assert.equal(prior.manualUnusedBranchPruning.package,'U_SOC')
assert.equal(prior.manualUnusedBranchPruning.retainedByte1RamThroughDogbones,11)
assert.equal(prior.manualUnusedBranchPruning.unusedBootstrapHolesRemoved,11)
const source=readRoutingSourceSnapshot(prior.source).circuit
assertSourceCopper(source,{ramRotation:180,rotatedD2PowerBridge:true,
 ramReferenceEscapes:read('lib/am3352/ram-reference-escapes-rotated-180.json')})
assert.equal(input.traces.length,70);assert.equal(input.layerCount,4)
assert.deepEqual(input.buses.find(b=>b.name==='DDR_BYTE1').allowedLayers,['top'])
const nativePath=`${bootstrap}/signal-escapes.native.json`,original=read(nativePath)
assert.equal(original.length,96)
const ids=new Set(source.find(e=>e.type==='source_bus'&&e.name==='DDR_BYTE1').source_trace_ids)
const cpu=source.find(e=>e.type==='source_component'&&e.name==='U_SOC')
const changedTraceIds=[]
const edited=original.map(t=>{
 if(!ids.has(t.source_trace_id)||!t.pcb_trace_id.endsWith('_0'))return structuredClone(t)
 assert.equal(t.route.length,2)
 assert(t.route.every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.1016))
 const trace=source.find(e=>e.type==='source_trace'&&e.source_trace_id===t.source_trace_id)
 const sp=source.find(e=>e.type==='source_port'&&e.source_component_id===cpu.source_component_id&&trace.connected_source_port_ids.includes(e.source_port_id))
 const port=source.find(e=>e.type==='pcb_port'&&e.source_port_id===sp.source_port_id)
 assert(Math.hypot(t.route[0].x-port.x,t.route[0].y-port.y)<1e-6)
 assert.deepEqual(port.layers,['top'])
 changedTraceIds.push(t.pcb_trace_id)
 return {...t,route:t.route.slice(0,1)}
})
assert.equal(changedTraceIds.length,11)
for(const a of [original,edited])assert.equal(a.flatMap(t=>t.route.filter(p=>p.route_type==='via')).length,85)
mkdirSync(directory,{recursive:true})
const path=`${directory}/signal-escapes.native.json`
writeFileSync(path,JSON.stringify(edited,null,2)+'\n')
writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(input)+'\n')
const report={...prior,status:'CPU_BYTE1_HANDOFFS_RETURNED_TO_ACTUAL_TOP_PADS_RAM_FULL_VIAS_RETAINED',
 input:{path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)},
 nativeBootstrap:{path,sha256:hash(path),dogbones:96},
 manualCpuPadStartCorrection:{priorNative:{path:nativePath,sha256:hash(nativePath),dogbones:96},
  changedTraceIds,removedUnusedTopBranches:11,actualSourceCopperUnchanged:true,physicalSignalHolesUnchanged:85,
  actualCpuPadStartsRetained:true,zeroLengthPadDescriptorsAreNotPhysicalRoutes:true},
 completedSignalChannels:0,fabricationReady:false,timingQualified:false}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,actualCpuPadStarts:11,signalHoles:85,sourcePowerPieces:70,completeChannels:0}))
