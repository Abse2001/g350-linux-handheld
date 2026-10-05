import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertSavedDdrCopper} from './lib/am3352-saved-ddr-copper.mjs'

// Replace one unused native RAM mask branch with its exact pad start.
// This is a manual routing descriptor, not manufactured copper. Native
// bus_lanes will still route the next complete byte0 channel.
const [bootstrap,directory]=process.argv.slice(2);assert(bootstrap&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),input=read(`${bootstrap}/input.simple-route.json`)
assert.equal(hash(prior.source.path),prior.source.sha256)
assert.equal(hash(prior.input.path),prior.input.sha256)
assert.equal(hash(prior.preservedSavedDdr.path),prior.preservedSavedDdr.sha256)
assert.equal(prior.preparationBus,'DDR_BYTE0');assert.equal(prior.preparedLocalEscapes,22)
assert.equal(prior.sourceCopper.totalSourceTraces,81);assert.equal(prior.sourceCopper.totalThroughVias,111)
const source=read(prior.source.path)
const power=assertSavedDdrCopper(source,read(prior.preservedSavedDdr.path),{
 ramRotation:180,rotatedD2PowerBridge:true,ramReferenceEscapes:read(prior.ramReferenceLayout.path)})
assert.equal(power.savedDdrSignals,11);assert(power.savedDdrNames.every(n=>/^DDR_(D(?:8|9|1[0-5])|DQM1|DQSn?1)$/.test(n)))
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,882)
const nativePath=`${bootstrap}/signal-escapes.native.json`,native=read(nativePath)
assert.equal(native.length,22)
const signal=source.find(e=>e.type==='source_trace'&&e.name==='DDR_DQM0')
const connection=input.connections.find(c=>c.name===signal.source_trace_id);assert(connection)
const id=`local_dogbone_${signal.source_trace_id}_1`,index=native.findIndex(t=>t.pcb_trace_id===id)
assert(index>=0)
const original=native[index],pad=connection.pointsToConnect[1]
assert.equal(pad.layer,'top')
assert(Math.hypot(original.route[0].x-pad.x,original.route[0].y-pad.y)<1e-6)
assert.equal(original.route.filter(p=>p.route_type==='via').length,1)
native[index]={...original,route:[{...original.route[0]}]}
for(let i=0;i<native.length;i++)if(i!==index)assert.deepEqual(native[i],read(nativePath)[i])
assert.equal(native.flatMap(t=>t.route).filter(p=>p.route_type==='via').length,21)
mkdirSync(directory,{recursive:true})
const nextNativePath=`${directory}/signal-escapes.native.json`,nextInputPath=`${directory}/input.simple-route.json`
writeFileSync(nextNativePath,JSON.stringify(native,null,2)+'\n')
writeFileSync(nextInputPath,readFileSync(prior.input.path))
const report={...prior,status:'BYTE0_RAM_MASK_ACTUAL_PAD_START_PENDING_LOCAL_ROUTING',
 input:{path:nextInputPath,sha256:hash(nextInputPath)},
 manualRamMaskPadStartCorrection:{signal:'DDR_DQM0',package:'U_RAM',priorNative:{path:nativePath,sha256:hash(nativePath)},
  nativeDescriptors:{path:nextNativePath,sha256:hash(nextNativePath)},changedTraceId:id,actualPad:{x:pad.x,y:pad.y,layer:pad.layer},
  nativeViaBranchesRetained:21,singlePointPadMarkers:1,newCompleteChannels:0,independentlyPhysicallyChecked:false},
 completedSignalChannels:0,fabricationReady:false,timingQualified:false,
 scope:'One unused RAM DQM0 dogbone is replaced by an exact actual-pad start. All other native branches and every actual source copper/obstacle remain fixed. Manual local escape and native channels still need routing and independent qualification.'}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,physicalNativeViaBranches:21,actualPadMarkers:1}))
