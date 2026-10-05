import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readRoutingSourceSnapshot} from './lib/am3352-routing-source-snapshot.mjs'
import {assertSourceCopper} from './lib/am3352-source-copper.mjs'

const [bootstrap,fullBootstrap,directory]=process.argv.slice(2);assert(bootstrap&&fullBootstrap&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),full=read(`${fullBootstrap}/result.json`)
assert.deepEqual(prior.source,full.source);assert.deepEqual(prior.memoryMap,full.memoryMap)
const source=readRoutingSourceSnapshot(prior.source).circuit
assertSourceCopper(source,{ramRotation:180,rotatedD2PowerBridge:true,ramReferenceEscapes:read('lib/am3352/ram-reference-escapes-rotated-180.json')})
const input=read(`${bootstrap}/input.simple-route.json`)
assert.deepEqual(input,read(`${fullBootstrap}/input.simple-route.json`))
const originalPath=`${bootstrap}/signal-escapes.native.json`,fullPath=`${fullBootstrap}/signal-escapes.native.json`
const before=read(originalPath),canonical=read(fullPath)
assert.equal(before.length,96);assert.equal(canonical.length,96)
assert.equal(before.flatMap(t=>t.route.filter(p=>p.route_type==='via')).length,59)
const bus=input.buses.find(b=>b.name==='DDR_BYTE1')
const pair=input.differentialPairs.find(p=>p.connectionNames.every(n=>bus.connectionNames.includes(n)));assert(pair)
const ids=new Set(pair.connectionNames),changed=[]
const native=before.map(t=>{
 if(!ids.has(t.source_trace_id)||!t.pcb_trace_id.endsWith('_0'))return structuredClone(t)
 assert.equal(t.route.length,1)
 const full=canonical.find(p=>p.pcb_trace_id===t.pcb_trace_id);assert(full)
 assert.deepEqual(t.route[0],full.route[0]);assert.equal(full.route.filter(p=>p.route_type==='via').length,1)
 assert.equal(full.route.at(-1).layer,'bottom')
 changed.push(t.pcb_trace_id);return structuredClone(full)
})
assert.equal(changed.length,2);assert.equal(native.flatMap(t=>t.route.filter(p=>p.route_type==='via')).length,61)
mkdirSync(directory,{recursive:true})
const nativePath=`${directory}/signal-escapes.native.json`,inputPath=`${directory}/input.simple-route.json`
writeFileSync(nativePath,JSON.stringify(native,null,2)+'\n');writeFileSync(inputPath,JSON.stringify(input)+'\n')
const report={...prior,status:'TWO_CPU_BYTE1_NATIVE_STROBE_VIAS_RESTORED_OTHER_CPU_TOP_STARTS_RETAINED',
 input:{path:inputPath,sha256:hash(inputPath)},nativeBootstrap:{path:nativePath,sha256:hash(nativePath),dogbones:96},
 manualCpuStrobeViaRestoration:{priorNative:{path:originalPath,sha256:hash(originalPath)},fullNative:{path:fullPath,sha256:hash(fullPath)},
  changedTraceIds:changed,restoredNativeVias:2,signalHoles:61,remainingExactCpuByte1PadStarts:9,
  everyOtherNativeDescriptorAndSourceCopperUnchanged:true,newCompleteChannels:0},
 fabricationReady:false,timingQualified:false}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,restoredStrobeVias:2,signalVias:61,completeChannels:0}))
