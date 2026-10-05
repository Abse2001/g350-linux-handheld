import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertRetainedPhaseCopper} from './lib/am3352-retained-phase-copper.mjs'
import {assertRamByte1TipCorrection} from './lib/am3352-ram-native-tip-correction.mjs'

const [bootstrap,directory]=process.argv.slice(2);assert(bootstrap&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),input=read(`${bootstrap}/input.simple-route.json`)
assert.equal(assertRetainedPhaseCopper(prior,input),33)
const source=read(prior.source.path),original=read(prior.nativeBootstrap.path)
const names=new Set(source.find(e=>e.type==='source_bus'&&e.name==='DDR_BYTE1').source_trace_ids)
const edited=original.map(t=>names.has(t.source_trace_id)&&t.pcb_trace_id.endsWith('_1')?{...t,route:t.route.slice(0,1)}:t)
const changedTraceIds=assertRamByte1TipCorrection(original,edited,source)
assert.equal(source.filter(e=>e.type==='pcb_trace').length,69)
assert(source.filter(e=>e.type==='pcb_trace').every(t=>!original.some(n=>n.pcb_trace_id===t.pcb_trace_id)))
mkdirSync(directory,{recursive:true})
const path=`${directory}/signal-escapes.native.json`
writeFileSync(path,JSON.stringify(edited,null,2)+'\n')
writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(input)+'\n')
const report={...prior,status:'RAM_BYTE1_HANDOFFS_RETURNED_TO_ACTUAL_TOP_PADS_CPU_RESERVATIONS_RETAINED',
  input:{path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)},
  nativeBootstrap:{path,sha256:hash(path),dogbones:96},
  manualRamNativeTipCorrection:{kind:'UNUSED_RAM_BYTE1_TOP_BRANCHES_REMOVED',priorNative:prior.nativeBootstrap,
    changedTraceIds,removedUnusedTopBranches:11,actualSourceCopperUnchanged:true,physicalSignalHolesUnchanged:85,
    actualRamPadStartsRetained:true,zeroLengthPadDescriptorsAreNotPhysicalRoutes:true},
  fabricationReady:false,timingQualified:false}
assert.equal(assertRetainedPhaseCopper(report,input),33)
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,changedRamDescriptors:11,sourcePiecesRetained:69,byte0PiecesRetained:33,signalHolesRetained:85}))
