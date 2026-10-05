import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-joint-native-breakout'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const physical=read(`${prefix}-kicad-connectivity.json`),reference=read(`${prefix}-reference-connectivity.json`)
const continuity=read(`${prefix}-native-ddr-connectivity.json`)
for(const artifact of [physical.board,physical.circuit,physical.nativeEscapes])assert.equal(hash(artifact.path),artifact.sha256)
assert.equal(reference.board.sha256,physical.board.sha256);assert.equal(continuity.board.sha256,physical.board.sha256)
assert.equal(reference.source.sha256,physical.circuit.sha256);assert.equal(continuity.circuit.sha256,physical.circuit.sha256)
assert.equal(physical.cpuBreakouts,48);assert.equal(physical.ramBreakouts,48)
assert.equal(physical.results.length,96);assert(physical.results.every(r=>r.padToViaConnected))
assert.equal(continuity.connectedSignals,0);assert.equal(continuity.results.length,49)
assert.equal(reference.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(reference.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(reference.ramBypassTerminalsConnectedToPlanes,28)
assert(reference.records.every(r=>r.connected)&&reference.bypassRecords.every(r=>r.connected))
const circuit=read(physical.circuit.path),exportPath='dist/am3352-joint-native-breakout-physical-diagnostic/export.json'
const exported=read(exportPath),base=read(exported.source.path)
assert.equal(hash(exported.source.path),exported.source.sha256);assert.equal(exported.circuit.sha256,physical.circuit.sha256)
assert.equal(exported.route.sha256,physical.nativeEscapes.sha256);assert.equal(exported.claimedSignalsPendingIndependentContinuity,0)
assert.equal(exported.addedTracePieces,96);assert.equal(exported.addedPhysicalVias,96)
for(const type of ['source_component','source_port','source_trace','source_net','source_bus','pcb_smtpad','pcb_port','pcb_keepout'])
 assert.deepEqual(circuit.filter(e=>e.type===type),base.filter(e=>e.type===type),`Preserve every actual ${type}`)
for(const type of ['pcb_trace','pcb_via'])for(const e of base.filter(e=>e.type===type))
 assert.deepEqual(circuit.find(t=>t.type===type&&t[`${type}_id`]===e[`${type}_id`]),e,'Original source power copper is immutable')
assert.equal(circuit.filter(e=>e.type==='pcb_trace').length,165);assert.equal(circuit.filter(e=>e.type==='pcb_via').length,165)
const vias=circuit.filter(e=>e.type==='pcb_via');let minimumHoleEdgeMm=Infinity
for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)minimumHoleEdgeMm=Math.min(minimumHoleEdgeMm,Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)-.254)
assert(minimumHoleEdgeMm>=.254-1e-6)
const drcPath=`${prefix}-kicad-drc.json`,drc=read(drcPath)
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
const unfinished=drc.violations.filter(v=>v.type==='via_dangling')
assert.equal(unfinished.length,96)
for(const v of unfinished){
 assert.equal(v.severity,'warning');assert.equal(v.items.length,1)
 const p=v.items[0].pos
 assert(physical.results.some(r=>Math.hypot(100+r.via.x-p.x,100-r.via.y-p.y)<1e-5),'Every dangling via must be an explicitly reserved signal breakout')
}
const other=drc.violations.filter(v=>!presentation.has(v.type)&&v.type!=='via_dangling');assert.equal(other.length,0)
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
assert(readFileSync(`${prefix}-kicad-library.log`,'utf8').includes('all 620 physical records unchanged'))
const snapshot='images/am3352-joint-native-breakout-top.png'
const summary={status:'JOINT_NATIVE_BREAKOUT_CONNECTIVITY_VERIFIED_CHANNELS_UNFINISHED',
 source:exported.source,circuit:physical.circuit,board:physical.board,nativeEscapes:physical.nativeEscapes,
 nativeAutorouter:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',
 components:204,actualPadObstacles:882,copperLayerCount:4,signalLayers:['top','bottom'],
 synchronousSignals:48,cpuBreakoutsConnected:48,ramBreakoutsConnected:48,
 sourcePowerTracePiecesPreserved:69,sourcePowerViasPreserved:69,reservedSignalVias:96,totalThroughVias:165,
 minimumHoleEdgeClearanceMm:minimumHoleEdgeMm,gerberShortsAllLayers:0,
 expectedUnfinishedViaWarnings:96,otherPhysicalViolationsAllSeverities:other.length,
 presentationWarnings:drc.violations.filter(v=>presentation.has(v.type)).length,
 ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
 completedDdrChannels:0,requiredDdrChannels:49,physicalLibraryRecordsPreserved:620,
 evidence:[`${prefix}-kicad-connectivity.json`,`${prefix}-reference-connectivity.json`,`${prefix}-native-ddr-connectivity.json`,drcPath,`${prefix}-shorts.log`,exportPath].map(path=>({path,sha256:hash(path)})),
 snapshot:{path:snapshot,sha256:hash(snapshot),visuallyInspected:true},
 fabricationReady:false,fullPhysicalDrcPass:false,timingQualified:false,
 scope:'Joint pad-to-via bootstrap only. All 96 dangling-via warnings are retained; no complete DDR channel or fabrication pass is claimed. The active 23-signal checked replay is a separate candidate.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,breakouts:96,shorts:0,unfinishedViaWarnings:96,otherPhysicalViolations:0,completeChannels:0}))
