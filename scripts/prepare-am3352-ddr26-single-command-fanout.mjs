import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary,selectCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'

// Bind the exact real package pad starts from a failed native phase to a
// manual local fanout search. The channel is still routed by native bus_lanes.
const [preparation,directory,layer='bottom']=process.argv.slice(2);assert(preparation&&directory)
assert(['top','bottom'].includes(layer))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const priorPath=`${preparation}/result.json`,prior=read(priorPath)
const summaryArtifact=selectCheckedCommandSummary(prior.source),summaryPath=summaryArtifact.path
const {summary,registration}=readCheckedCommandSummary(summaryArtifact)
for(const a of [summary.source,summary.paths,prior.source,prior.input,prior.connectionMap])assert.equal(hash(a.path),a.sha256)
assert.deepEqual(summary.source,prior.source)
assert.equal(summary.connectedDdrSignals,registration.signals);assert(summary.bothBytePlanarTimingPass&&summary.allThreeDifferentialPairPlanarTimingPass)
assert.equal(summary.independentPhysicalViolationsAllSeverities,0);assert.equal(summary.gerberShortsAllLayers,0)
assert(['NATIVE_DDR_PHASE_FAILED','NATIVE_DDR_PHASE_TIMEOUT'].includes(prior.status))
assert.equal(prior.signalLayer,'top');assert.equal(prior.preparedEscapes,0)
assert.equal(prior.definitions.length,1);assert(summary.remainingDdrSignalNames.includes(prior.definitions[0].name))
const input=read(prior.input.path),source=read(summary.source.path)
assert.equal(input.connections.length,1);assert.equal(input.traces.length,registration.traces)
assert.equal(source.filter(e=>e.type==='pcb_via').length,registration.holes)
assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false);assert.equal(input.differentialPairs.length,0)
assert(input.connections.every(c=>c.pointsToConnect.every(p=>p.layer==='top'&&p.pcb_port_id)))
assert.equal(input.buses.length,1);assert.equal(input.buses[0].maxLengthSkew,.635)
assert.deepEqual(input.buses[0].allowedLayers,['top'])
input.buses[0].allowedLayers=[layer]
const refs='lib/am3352/ram-reference-escapes-byte1-access.json'
mkdirSync(directory,{recursive:true});const inputPath=`${directory}/input.simple-route.json`,nativePath=`${directory}/signal-escapes.native.json`
writeFileSync(inputPath,JSON.stringify(input)+'\n');writeFileSync(nativePath,'[]\n')
const report={status:`DDR${registration.signals}_RETAINED_SINGLE_COMMAND_EXACT_PAD_STARTS_READY_FOR_MANUAL_FANOUTS`,
  source:summary.source,input:{path:inputPath,sha256:hash(inputPath)},preparedLocalEscapes:0,
  sourceCopper:{traces:registration.traces,totalSourceTraces:registration.traces},memoryMap:prior.connectionMap,
  preservedSavedDdr:{...summary.paths,signals:registration.signals},ramReferenceLayout:{path:refs,sha256:hash(refs)},
  checkedSourceSummary:{path:summaryPath,sha256:hash(summaryPath)},
  nativeAddressControlPreparation:{path:priorPath,sha256:hash(priorPath)},
  manualPartialCommandSelection:{signalNames:[prior.definitions[0].name],sourceTraceIds:input.connections.map(c=>c.name),selectedChannels:1,fullCommandClassSignals:26,fullClassMatchingDeferred:true},
  manualChannelLayerAllocation:{priorSignalLayer:'top',channelSignalLayer:layer,actualPackagePadsRemain:'top',originalBusSkewMm:.635},
  actualPackagePadStartsAllowed:true,allChannelEndpointsActualTopPads:true,defaultChanged:false,fabricationReady:false}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,selection:prior.definitions[0].name,channelLayer:layer,actualPadStarts:2,sourceTracesRetained:registration.traces,throughViasRetained:registration.holes,fabricationReady:false}))
