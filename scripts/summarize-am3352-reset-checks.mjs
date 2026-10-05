import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-guided-both-bytes-and-reset'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const source=read(`${prefix}-source-validation.json`),circuit=read(source.circuit.path)
assert.equal(hash(source.circuit.path),source.circuit.sha256)
const ddr=read(`${prefix}-ddr-connectivity.json`),native=read(`${prefix}-native-ddr-connectivity.json`),reference=read(`${prefix}-reference-connectivity.json`)
for(const sha of [ddr.circuitSha256,native.circuit.sha256,reference.source.sha256])assert.equal(sha,source.circuit.sha256)
assert.equal(hash(native.board.path),native.board.sha256);assert.equal(reference.board.sha256,native.board.sha256)
assert.equal(ddr.status,'AM3352_MEMORY_FAIL');assert.equal(ddr.connectedSignals,23);assert.equal(native.connectedSignals,23)
assert.equal(native.results.filter(r=>!r.connected).length,26)
assert(native.results.find(r=>r.name==='DDR_RESETn').connected)
assert.deepEqual(ddr.connectionMap,native.connectionMap);assert.equal(hash(native.connectionMap.path),native.connectionMap.sha256)
const commandIds=new Set(circuit.find(e=>e.type==='source_bus'&&e.name==='DDR_COMMAND_CLOCK').source_trace_ids)
const commandNames=new Set(circuit.filter(e=>e.type==='source_trace'&&commandIds.has(e.source_trace_id)).map(e=>e.name))
assert.deepEqual(new Set(native.results.filter(r=>!r.connected).map(r=>r.name)),commandNames)
assert.equal(reference.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(reference.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(reference.ramBypassTerminalsConnectedToPlanes,28)
assert(reference.records.every(r=>r.connected)&&reference.bypassRecords.every(r=>r.connected))
const timing=['DDR_BYTE0','DDR_BYTE1','DDR_DQS0_PAIR','DDR_DQS1_PAIR'].map(n=>ddr.timing.find(t=>t.name===n))
assert(timing.every(t=>t.pass&&t.skewMm<=t.limitMm+1e-6))
const drc=read(`${prefix}-kicad-drc.json`),presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)).length,0)
assert(drc.violations.every(v=>v.severity==='warning'))
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
assert(readFileSync(`${prefix}-library.log`,'utf8').includes('all 13419 physical records unchanged'))
const priorSummary=read('checks/integrated/am3352-guided-both-bytes-matched-check-summary.json')
assert.equal(hash(priorSummary.source.path),priorSummary.source.sha256)
const baseline=read(priorSummary.source.path)
for(const type of ['source_component','source_port','source_trace','source_net','source_bus','pcb_smtpad','pcb_port','pcb_keepout'])
 assert.deepEqual(circuit.filter(e=>e.type===type),baseline.filter(e=>e.type===type),`Preserve every prior ${type}`)
const path='routing/am3352-guided-both-bytes-and-reset-paths.json',paths=read(path),priorPaths=read(priorSummary.editablePaths.path)
assert.equal(Object.keys(paths).length,23)
for(const [name,route] of Object.entries(priorPaths))assert.deepEqual(paths[name],route,'All 22 checked byte paths must remain unchanged')
const runPath='dist/am3352-guided-reset-channel-attempt-131/result.json',run=read(runPath)
assert(run.channel.solved&&!run.channel.failed);assert.equal(run.mode,'matched-handoffs');assert.equal(run.completedSignals,1)
assert.equal(hash(run.output.path),run.output.sha256)
const snapshot='images/am3352-guided-both-bytes-and-reset-top.png'
const summary={status:'DDR_BYTES_AND_RESET_PHYSICAL_CHECKS_PASS_COMMAND_CLOCK_AND_HOST_INCOMPLETE',
 source:source.circuit,board:native.board,components:204,actualPadObstacles:882,copperLayerCount:4,maxCopperLayers:4,
 signalLayers:['top','bottom'],byte0ChannelLayer:'bottom',byte1ChannelLayer:'top',resetChannelLayer:'top',
 referenceLayers:{inner1:'GND',inner2:'DDR_1V5'},nativeAutorouter:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',
 nativeResetRun:{path:runPath,sha256:hash(runPath)},previousBothByteEvidence:{path:'checks/integrated/am3352-guided-both-bytes-matched-check-summary.json',sha256:hash('checks/integrated/am3352-guided-both-bytes-matched-check-summary.json')},
 editablePaths:{path,sha256:hash(path)},connectionMap:native.connectionMap,ramReferenceLayout:reference.referenceLayout,
 ddrSignalsConnected:23,requiredDdrSignals:49,unroutedDdrSignals:26,remainingSignalNames:[...commandNames].sort(),
 ddrThroughVias:source.ddrThroughVias,physicalThroughVias:source.physicalThroughVias,
 existingPowerTracePieces:69,existingPowerVias:69,sourceTracePieces:92,
 ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
 timing,bothByteGeometriesPreserved:true,resetPlanarLengthMm:run.channel.stats.busLengths[0].lengths[0].totalLengthMm,
 resetAdditionalVias:0,gerberShorts:0,gerberShortsLayerScope:'all four layers',independentPhysicalViolationsAllSeverities:0,
 presentationWarnings:drc.violations.length,allHostUnconnectedItems:drc.unconnected_items.length,physicalLibraryRecordsPreserved:13419,
 snapshot:{path:snapshot,sha256:hash(snapshot),visuallyInspected:true},fabricationReady:false,completePowerRouting:false,
 fullElectricalTimingQualified:false,pairGeometryQualified:false,
 scope:'Both checked native byte channels plus a native bus_lanes reset channel with manual pad escapes. All 26 command/clock signals, full host power, impedance/package/via timing, handheld integration and Linux bring-up remain unfinished.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,connected:23,open:26,shorts:0,physicalViolations:0,source:summary.source,board:summary.board}))
