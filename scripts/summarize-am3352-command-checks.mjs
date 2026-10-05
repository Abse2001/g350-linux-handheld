import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-command-unmatched-pruned'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const source=read(`${prefix}-source-validation.json`),circuit=read(source.circuit.path)
assert.equal(hash(source.circuit.path),source.circuit.sha256)
const ddr=read(`${prefix}-ddr-connectivity.json`),native=read(`${prefix}-native-ddr-connectivity.json`)
const reference=read(`${prefix}-reference-connectivity.json`),drc=read(`${prefix}-kicad-drc.json`)
assert.equal(ddr.circuitSha256,source.circuit.sha256)
assert.equal(native.circuit.sha256,source.circuit.sha256)
assert.equal(reference.source.sha256,source.circuit.sha256)
assert.equal(hash(native.board.path),native.board.sha256)
assert.equal(reference.board.sha256,native.board.sha256)
assert.equal(ddr.status,'AM3352_MEMORY_FAIL');assert.equal(ddr.connectedSignals,26);assert.equal(native.connectedSignals,26)
assert.equal(native.results.length,49)
const pathsPath='routing/am3352-command-unmatched-pruned-paths.json',paths=read(pathsPath)
assert.equal(Object.keys(paths).length,26)
const command=circuit.find(e=>e.type==='source_bus'&&e.name==='DDR_COMMAND_CLOCK')
assert.equal(command.source_trace_ids.length,26)
const ids=new Set(command.source_trace_ids),names=circuit.filter(e=>e.type==='source_trace'&&ids.has(e.source_trace_id)).map(e=>e.name)
assert.deepEqual(new Set(Object.keys(paths)),new Set(names))
assert.deepEqual(new Set(native.results.filter(r=>r.connected).map(r=>r.name)),new Set(names))
assert.deepEqual(ddr.connectionMap,native.connectionMap)
assert.equal(hash(native.connectionMap.path),native.connectionMap.sha256)
assert.equal(source.existingPowerCopper.traces,69);assert.equal(source.existingPowerCopper.throughVias,69)
assert.equal(source.ddrThroughVias,130);assert.equal(source.physicalThroughVias,199)
assert.equal(reference.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(reference.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(reference.ramBypassTerminalsConnectedToPlanes,28)
assert(reference.records.every(r=>r.connected)&&reference.bypassRecords.every(r=>r.connected))
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)).length,0)
assert(drc.violations.every(v=>v.severity==='warning'))
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
const library=readFileSync(`${prefix}-library.log`,'utf8')
assert(library.includes('273 exact local footprints; all 7005 physical records unchanged'))
const timing=['DDR_COMMAND_CLOCK','DDR_CK_PAIR'].map(name=>ddr.timing.find(t=>t.name===name))
assert(timing.every(t=>t&&!t.pass&&t.skewMm>t.limitMm))
assert.deepEqual(timing.map(t=>t.limitMm),[.635,.127])
const runPath='dist/am3352-fine-wire-command-bridges-attempt-203/result.json',run=read(runPath)
assert.equal(run.status,'COMMAND_CHANNELS_MANUALLY_REPAIRED_UNQUALIFIED')
assert.equal(run.manualModification.retainedNativeChannels,2)
assert.equal(run.manualModification.negotiationRounds.at(-1).conflictingChannels,0)
assert.equal(hash(run.output.path),run.output.sha256)
const provenance=read(pathsPath.replace(/\.json$/,'.provenance.json'))
assert.equal(provenance.manualBacktrackCleanup.removedVias,0)
assert.equal(hash(provenance.manualBacktrackCleanup.original.path),provenance.manualBacktrackCleanup.original.sha256)
assert.equal(hash(pathsPath),provenance.paths.sha256)
assert(readFileSync('index.circuit.tsx','utf8').includes('am3352-guided-both-bytes-and-reset-replay'))
const summary={status:'COMMAND_CLOCK_CONNECTIVITY_AND_PHYSICAL_CHECKS_PASS_TIMING_AND_INTEGRATION_FAIL',
 source:source.circuit,board:native.board,editablePaths:{path:pathsPath,sha256:hash(pathsPath)},
 routingRun:{path:runPath,sha256:hash(runPath)},connectionMap:native.connectionMap,ramReferenceLayout:reference.referenceLayout,
 components:204,actualPadObstacles:882,copperLayerCount:4,signalLayers:['top','bottom'],referenceLayers:{inner1:'GND',inner2:'DDR_1V5'},
 nativeAutorouter:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',nativeBootstrapChannels:2,manuallyRepairedChannels:24,
 commandClockSignalsConnected:26,ddrSignalsConnectedInThisCandidate:26,requiredDdrSignals:49,
 openByteAndResetSignals:23,sourceTracePieces:95,sourcePowerTracePiecesPreserved:69,sourcePowerViasPreserved:69,
 ddrThroughVias:130,totalThroughVias:199,gerberShortsAllLayers:0,independentPhysicalViolationsAllSeverities:0,
 presentationWarnings:drc.violations.length,wholeHostUnconnectedItems:drc.unconnected_items.length,
 ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
 exactFootprintsPreserved:273,physicalLibraryRecordsPreserved:7005,timing,
 manualBacktrackCleanup:provenance.manualBacktrackCleanup,
 activeDefault:'experiments/am3352-guided-both-bytes-and-reset-replay.circuit.tsx',activeDefaultConnectedSignals:23,
 combinedWithDefault:false,originalShellFitVerified:false,fullElectricalTimingQualified:false,
 independentFullHostDrcPass:false,fabricationReady:false,
 scope:'Separate command/clock candidate only. Original command and clock skew limits fail; both bytes and reset are open here. The checked 23-signal default is preserved. Fresh byte routing, all-host power/peripherals, measured original-shell mechanics and release checks remain required.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,connectedCommands:26,shorts:0,physicalViolations:0,
 commandSkewMm:timing[0].skewMm,clockSkewMm:timing[1].skewMm,fabricationReady:false}))
