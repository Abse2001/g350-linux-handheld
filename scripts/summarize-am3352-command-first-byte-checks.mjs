import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-command-first-native-byte'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)})
const physical=read(`${prefix}-native-connectivity.json`),reference=read(`${prefix}-reference-connectivity.json`),ddr=read(`${prefix}-native-ddr-connectivity.json`)
for(const a of [physical.board,physical.circuit,physical.savedFanouts])assert.equal(hash(a.path),a.sha256)
assert.equal(physical.cpuFanoutsConnected,22);assert.equal(physical.ramFanoutsConnected,22)
assert.equal(physical.records.length,44);assert(physical.records.every(r=>r.padToOutboardConnected))
for(const evidence of [reference,ddr])assert.equal(evidence.board.sha256,physical.board.sha256)
assert.equal(reference.source.sha256,physical.circuit.sha256);assert.equal(ddr.circuit.sha256,physical.circuit.sha256)
assert.equal(ddr.connectedSignals,26);assert.equal(ddr.results.length,49)
assert(ddr.results.every(r=>r.connected===/^DDR_(?:A\d+|BA\d+|RASn|CASn|WEn|CSn0|CKE|ODT|CKn?)$/.test(r.name)))
assert.equal(reference.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(reference.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(reference.ramBypassTerminalsConnectedToPlanes,28)
assert(reference.records.every(r=>r.connected)&&reference.bypassRecords.every(r=>r.connected))
const exported=read('dist/am3352-command-first-native-byte-physical-diagnostic/export.json')
assert.equal(exported.circuit.sha256,physical.circuit.sha256);assert.equal(hash(exported.source.path),exported.source.sha256)
assert.equal(exported.route.sha256,physical.savedFanouts.sha256)
const base=read(exported.source.path),circuit=read(physical.circuit.path)
for(const type of ['source_component','source_port','source_trace','source_net','source_bus','pcb_smtpad','pcb_port','pcb_keepout'])assert.deepEqual(circuit.filter(e=>e.type===type),base.filter(e=>e.type===type))
for(const type of ['pcb_trace','pcb_via'])for(const e of base.filter(e=>e.type===type))assert.deepEqual(circuit.find(t=>t.type===type&&t[`${type}_id`]===e[`${type}_id`]),e)
assert.equal(base.filter(e=>e.type==='pcb_trace').length,95);assert.equal(base.filter(e=>e.type==='pcb_via').length,199)
assert.equal(circuit.filter(e=>e.type==='pcb_trace').length,139)
const vias=circuit.filter(e=>e.type==='pcb_via');assert.equal(vias.length,221)
let minimumHoleEdgeClearanceMm=Infinity
for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)minimumHoleEdgeClearanceMm=Math.min(minimumHoleEdgeClearanceMm,Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)-(vias[i].hole_diameter+vias[j].hole_diameter)/2)
assert(minimumHoleEdgeClearanceMm>=.254-1e-6)
const preparationPath='dist/am3352-command-first-byte-bootstrap-attempt-208/result.json',preparation=read(preparationPath)
assert.equal(preparation.coreVersion,'0.0.2056');assert.equal(preparation.preparedLocalEscapes,44)
assert.equal(preparation.source.sha256,exported.source.sha256)
assert.equal(hash(preparation.input.path),preparation.input.sha256)
const originalNative=read('dist/am3352-command-first-byte-bootstrap-attempt-204/signal-escapes.native.json')
const updatedNativePath='dist/am3352-command-first-byte-bootstrap-attempt-208/signal-escapes.native.json'
assert.deepEqual(read(updatedNativePath),originalNative)
const pruned=read('dist/am3352-command-first-byte1-pruned-bootstrap-attempt-210/result.json')
assert.equal(pruned.manualUnusedBranchPruning.unusedBootstrapHolesRemoved,22)
assert.equal(pruned.manualUnusedBranchPruning.otherNativeDogbonesUnchanged,22)
const actualNative=read(physical.savedFanouts.path),byte1Ids=new Set(read(pruned.input.path).buses.find(b=>b.name==='DDR_BYTE1').connectionNames)
assert.equal(actualNative.length,44)
for(let i=0;i<44;i++)assert.deepEqual(actualNative[i],byte1Ids.has(originalNative[i].source_trace_id)?{...originalNative[i],route:originalNative[i].route.slice(0,2)}:originalNative[i])
const drcPath=`${prefix}-kicad-drc.json`,drc=read(drcPath)
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert.equal(drc.violations.filter(v=>v.type==='via_dangling').length,22)
assert.equal(drc.violations.filter(v=>v.type==='track_dangling').length,22)
assert(drc.violations.every(v=>v.severity==='warning'))
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)&&!['via_dangling','track_dangling'].includes(v.type)).length,0)
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
assert(readFileSync(`${prefix}-library.log`,'utf8').includes('all 7071 physical records unchanged'))
const summary={status:'COMMAND_COPPER_AND_ALL_44_BYTE_BREAKOUTS_PHYSICALLY_COMPATIBLE_CHANNELS_UNFINISHED',
 source:exported.source,circuit:physical.circuit,board:physical.board,fixedFanouts:physical.savedFanouts,
 nativeBootstrap:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',coreVersion:preparation.coreVersion,
 nativePreparation:artifact(preparationPath),nativeGeometryUnchangedAfterToolchainUpdate:true,
 components:204,actualPadObstacles:882,copperLayers:4,signalLayers:['top','bottom'],
 cpuByteBreakoutsConnected:22,ramByteBreakoutsConnected:22,
 sourceTracePiecesPreserved:95,sourceThroughViasPreserved:199,addedByteBreakoutVias:22,totalThroughVias:221,
 commandClockEndToEndChannelsPreserved:26,newByteEndToEndChannels:0,requiredDdrChannels:49,
 minimumHoleEdgeClearanceMm,gerberShortsAllLayers:0,clearanceViolations:0,
 unfinishedViaWarnings:22,unfinishedTrackWarnings:22,presentationWarnings:drc.violations.filter(v=>presentation.has(v.type)).length,
 hostUnconnectedItems:drc.unconnected_items.length,ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
 physicalLibraryRecordsPreserved:7071,
 evidence:[`${prefix}-native-connectivity.json`,`${prefix}-reference-connectivity.json`,`${prefix}-native-ddr-connectivity.json`,drcPath,`${prefix}-shorts.log`].map(artifact),
 fullPhysicalDrcPass:false,fabricationReady:false,timingQualified:false,originalShellFitVerified:false,
 scope:'Separate command-first diagnostic. Native byte terminals are physically compatible with retained command copper; no new full byte channel is connected. Existing command/clock matching still fails. The checked 23-signal default is separate and unchanged.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,cpuBreakouts:22,ramBreakouts:22,shorts:0,clearanceViolations:0,completedChannels:26,newByteChannels:0}))
