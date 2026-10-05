import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-natural-command-fanouts'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const physical=read(`${prefix}-native-connectivity.json`),reference=read(`${prefix}-reference-connectivity.json`),ddr=read(`${prefix}-native-ddr-connectivity.json`)
for(const a of [physical.board,physical.circuit,physical.savedFanouts])assert.equal(hash(a.path),a.sha256)
assert.equal(physical.cpuFanoutsConnected,26);assert.equal(physical.ramFanoutsConnected,26)
assert.equal(physical.records.length,52);assert(physical.records.every(r=>r.padToOutboardConnected))
assert.equal(reference.board.sha256,physical.board.sha256);assert.equal(ddr.board.sha256,physical.board.sha256)
assert.equal(reference.source.sha256,physical.circuit.sha256);assert.equal(ddr.circuit.sha256,physical.circuit.sha256)
assert.equal(ddr.connectedSignals,0);assert.equal(ddr.results.length,49)
assert.equal(reference.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(reference.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(reference.ramBypassTerminalsConnectedToPlanes,28)
assert(reference.records.every(r=>r.connected)&&reference.bypassRecords.every(r=>r.connected))
const exported=read('dist/am3352-natural-command-fanouts-physical-diagnostic/export.json')
assert.equal(exported.circuit.sha256,physical.circuit.sha256);assert.equal(hash(exported.source.path),exported.source.sha256)
assert.equal(exported.route.sha256,physical.savedFanouts.sha256)
const base=read(exported.source.path),circuit=read(physical.circuit.path)
for(const type of ['source_component','source_port','source_trace','source_net','source_bus','pcb_smtpad','pcb_port','pcb_keepout'])assert.deepEqual(circuit.filter(e=>e.type===type),base.filter(e=>e.type===type))
for(const type of ['pcb_trace','pcb_via'])for(const e of base.filter(e=>e.type===type))assert.deepEqual(circuit.find(t=>t.type===type&&t[`${type}_id`]===e[`${type}_id`]),e)
const vias=circuit.filter(e=>e.type==='pcb_via');assert.equal(vias.length,175)
let minimumHoleEdgeClearanceMm=Infinity
for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)minimumHoleEdgeClearanceMm=Math.min(minimumHoleEdgeClearanceMm,Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)-.254)
assert(minimumHoleEdgeClearanceMm>=.254-1e-6)
const drcPath=`${prefix}-kicad-drc.json`,drc=read(drcPath)
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
const unfinished=drc.violations.filter(v=>['via_dangling','track_dangling'].includes(v.type))
assert.equal(unfinished.filter(v=>v.type==='via_dangling').length,47)
assert.equal(unfinished.filter(v=>v.type==='track_dangling').length,44)
assert(drc.violations.every(v=>v.severity==='warning'))
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)&&!['via_dangling','track_dangling'].includes(v.type)).length,0)
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
assert(readFileSync(`${prefix}-kicad-library.log`,'utf8').includes('all 4726 physical records unchanged'))
const compositionPath='dist/am3352-joint-command-natural-fanouts-attempt-148/result.json',composition=read(compositionPath)
assert.equal(composition.manualNativeEscapeCorrection.modifiedCommandEscapeDescriptors,52)
assert.equal(composition.manualNativeEscapeCorrection.otherNativeDogbonesUnchanged,44)
for(const e of composition.manualNativeEscapeCorrection.naturalFanouts)for(const a of [e.paths,e.report])assert.equal(hash(a.path),a.sha256)
const summary={status:'ALL_52_NATURAL_COMMAND_FANOUTS_PHYSICALLY_CONNECTED_CHANNELS_UNFINISHED',
 source:exported.source,circuit:physical.circuit,board:physical.board,fixedFanouts:physical.savedFanouts,
 nativeBootstrap:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',
 manualComposition:{path:compositionPath,sha256:hash(compositionPath)},
 components:204,actualPadObstacles:882,copperLayers:4,signalLayers:['top','bottom'],
 commandSignals:26,cpuNaturalFanoutsConnected:26,ramNaturalFanoutsConnected:26,
 completedEndToEndDdrChannels:0,requiredDdrChannels:49,
 sourcePowerTracesPreserved:69,sourcePowerViasPreserved:69,signalViasReserved:106,totalThroughVias:175,
 minimumHoleEdgeClearanceMm,gerberShortsAllLayers:0,clearanceViolations:0,
 unfinishedViaWarnings:47,unfinishedTrackWarnings:44,presentationWarnings:drc.violations.filter(v=>presentation.has(v.type)).length,
 hostUnconnectedItems:drc.unconnected_items.length,ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
 physicalLibraryRecordsPreserved:4726,
 evidence:[`${prefix}-native-connectivity.json`,`${prefix}-reference-connectivity.json`,`${prefix}-native-ddr-connectivity.json`,drcPath,`${prefix}-shorts.log`].map(path=>({path,sha256:hash(path)})),
 fullPhysicalDrcPass:false,fabricationReady:false,timingQualified:false,
 scope:'Both packages have complete natural local command/clock escapes. All unfinished-track/via warnings remain. CPU/RAM channel alignment, native channels, timing and full host integration are still required. The checked 23-signal active replay is separate.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,cpuFanouts:26,ramFanouts:26,shorts:0,clearanceViolations:0,completeDdrChannels:0}))
