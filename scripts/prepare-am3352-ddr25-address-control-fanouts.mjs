import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [preparation,directory]=process.argv.slice(2);assert(preparation&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const summaryPath='checks/integrated/am3352-ddr-usbc-repaired-strobes-check-summary.json',summary=read(summaryPath)
const priorPath=`${preparation}/result.json`,prior=read(priorPath)
for(const a of [summary.source,summary.paths,prior.source,prior.input,prior.connectionMap])assert.equal(hash(a.path),a.sha256)
assert.deepEqual(summary.source,prior.source)
assert.equal(summary.connectedDdrSignals,25);assert(summary.bothBytePlanarTimingPass)
assert.equal(summary.independentPhysicalViolationsAllSeverities,0);assert.equal(summary.gerberShortsAllLayers,0)
assert.equal(prior.status,'NATIVE_DDR_LOCAL_ESCAPES_PREPARED_CHANNELS_UNROUTED')
assert.equal(prior.selection,'address-control');assert.equal(prior.signalLayer,'top');assert.equal(prior.preparedEscapes,0)
const input=read(prior.input.path)
assert.equal(input.connections.length,24);assert.equal(input.traces.length,127)
assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false)
assert.equal(input.differentialPairs.length,0)
assert(input.connections.every(c=>c.pointsToConnect.every(p=>p.layer==='top'&&p.pcb_port_id)))
assert.equal(input.buses.length,1);assert.equal(input.buses[0].maxLengthSkew,.635)
assert.deepEqual(input.buses[0].allowedLayers,['top'])
assert.deepEqual(new Set(prior.definitions.map(d=>d.name)),new Set(summary.remainingDdrSignalNames))
const refs='lib/am3352/ram-reference-escapes-byte1-access.json'
mkdirSync(directory,{recursive:true});const inputPath=`${directory}/input.simple-route.json`,nativePath=`${directory}/signal-escapes.native.json`
writeFileSync(inputPath,JSON.stringify(input)+'\n');writeFileSync(nativePath,'[]\n')
const report={status:'DDR25_RETAINED_ADDRESS_CONTROL_EXACT_PAD_STARTS_READY_FOR_MANUAL_FANOUTS',
  source:summary.source,input:{path:inputPath,sha256:hash(inputPath)},preparedLocalEscapes:0,
  sourceCopper:{traces:69,totalSourceTraces:127},memoryMap:prior.connectionMap,
  preservedSavedDdr:{...summary.paths,signals:25},ramReferenceLayout:{path:refs,sha256:hash(refs)},
  checkedSourceSummary:{path:summaryPath,sha256:hash(summaryPath)},
  nativeAddressControlPreparation:{path:priorPath,sha256:hash(priorPath)},
  actualPackagePadStartsAllowed:true,allChannelEndpointsActualTopPads:true,
  remainingAddressControlSignals:summary.remainingDdrSignalNames,defaultChanged:false,fabricationReady:false}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,actualPadStarts:48,sourceTracesRetained:127,fabricationReady:false}))
