import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// A checked routing milestone, never a fabrication release. Validate exact
// source/board hashes and reject physical violations at every severity.
const prefix=process.argv[2]??'checks/integrated/am3352-guided-both-bytes-matched'
const imagePath=process.argv[3]??'images/am3352-guided-both-bytes-matched-top.png'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const source=read(`${prefix}-source-validation.json`),circuit=read(source.circuit.path)
assert.equal(hash(source.circuit.path),source.circuit.sha256)
const ddr=read(`${prefix}-ddr-connectivity.json`),native=read(`${prefix}-native-ddr-connectivity.json`),reference=read(`${prefix}-reference-connectivity.json`)
for(const sha of [ddr.circuitSha256,native.circuit.sha256,reference.source.sha256])assert.equal(sha,source.circuit.sha256)
assert.equal(hash(native.board.path),native.board.sha256);assert.equal(reference.board.sha256,native.board.sha256)
assert.equal(native.connectedSignals,22);assert.equal(ddr.connectedSignals,22);assert.equal(ddr.status,'AM3352_MEMORY_FAIL')
assert.equal(native.results.filter(r=>!r.connected).length,27)
assert.deepEqual(ddr.connectionMap,native.connectionMap);assert.equal(hash(native.connectionMap.path),native.connectionMap.sha256)
assert.equal(reference.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(reference.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(reference.ramBypassTerminalsConnectedToPlanes,28)
assert(reference.records.every(r=>r.connected)&&reference.bypassRecords.every(r=>r.connected))
const timing=['DDR_BYTE0','DDR_BYTE1','DDR_DQS0_PAIR','DDR_DQS1_PAIR'].map(name=>ddr.timing.find(t=>t.name===name))
assert(timing.every(t=>t.pass&&t.skewMm<=t.limitMm+1e-6))
const drc=read(`${prefix}-kicad-drc.json`),presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)).length,0)
assert(drc.violations.every(v=>v.severity==='warning'))
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
assert(readFileSync(`${prefix}-library.log`,'utf8').includes('all 13286 physical records unchanged'))
const baseline=read('dist/experiments/am3352-guided-byte1-rebound-top-host/circuit.json')
for(const type of ['source_component','source_port','source_trace','source_net','pcb_smtpad'])
 assert.deepEqual(circuit.filter(e=>e.type===type),baseline.filter(e=>e.type===type),`Prior ${type} must remain unchanged`)
const pathsPath='routing/am3352-guided-both-bytes-matched-paths.json',paths=read(pathsPath),byte0=read('routing/am3352-guided-byte0-matched-paths.json')
for(const [name,path] of Object.entries(byte0))assert.deepEqual(paths[name],path,'Checked byte0 geometry must remain unchanged')
const nativeRun='dist/am3352-guided-byte1-data-tuned-full-channel-attempt-110/result.json',run=read(nativeRun)
assert.equal(run.mode,'matched-handoffs');assert(run.channel.solved&&!run.channel.failed)
assert(run.timingRequirements.buses.every(b=>b.maxLengthSkew===.635))
assert(run.timingRequirements.differentialPairs.every(p=>p.lengthTolerance===.127))
assert.equal(hash(run.output.path),run.output.sha256)
const summary={status:'DDR_BOTH_BYTES_PLANAR_MATCH_AND_PHYSICAL_CHECKS_PASS_DDR_AND_HOST_INCOMPLETE',
 source:source.circuit,board:native.board,components:204,actualPadObstacles:882,
 copperLayerCount:4,maxCopperLayers:4,signalLayers:['top','bottom'],byte0ChannelLayer:'bottom',byte1ChannelLayer:'top',referenceLayers:{inner1:'GND',inner2:'DDR_1V5'},
 nativeAutorouter:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',nativeRun:{path:nativeRun,sha256:hash(nativeRun)},
 editablePaths:{path:pathsPath,sha256:hash(pathsPath)},connectionMap:native.connectionMap,ramReferenceLayout:reference.referenceLayout,
 ddrSignalsConnected:22,requiredDdrSignals:49,unroutedDdrSignals:27,ddrThroughVias:source.ddrThroughVias,physicalThroughVias:source.physicalThroughVias,
 existingPowerTracePieces:69,existingPowerVias:69,ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
 timing,byte0GeometryPreserved:true,manualPairTuning:run.manualPairTuning,manualLocalDataTuning:run.manualLocalDataTuning,
 gerberShorts:0,gerberShortsLayerScope:'all four layers',independentPhysicalViolationsAllSeverities:0,
 presentationWarnings:drc.violations.length,allHostUnconnectedItems:drc.unconnected_items.length,
 snapshot:{path:imagePath,sha256:hash(imagePath),visuallyInspected:true},
 fabricationReady:false,completePowerRouting:false,fullElectricalTimingQualified:false,pairGeometryQualified:false,
 scope:'Two editable native bus_lanes byte channels with manual dogbone/fanout edits and local tuning. '
 +'Both byte and DQS planar checks pass. 27 DDR command/clock/reset signals, package/via delays, impedance, full power and handheld integration remain unfinished.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify(summary))
