import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertSavedDdrCopper} from './lib/am3352-saved-ddr-copper.mjs'

// Bind the fixed-byte0 copper and the remaining native reservations to one
// physical diagnostic. Reservations are not complete CPU-to-RAM channels.
const prefix='checks/integrated/am3352-ram-rotated-180-byte0-fixed-reused-reservations'
const directory='dist/am3352-ram-rotated-180-byte0-fixed-reused-reservations-diagnostic'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)})
const local=read(`${prefix}-native-terminals.json`),native=read(`${prefix}-native-ddr-connectivity.json`)
const ddr=read(`${prefix}-ddr-connectivity.json`),reference=read(`${prefix}-reference-connectivity.json`)
const exported=read(`${directory}/export.json`)
for(const a of [local.board,local.circuit,local.savedFanouts,local.connectionMap,reference.referenceLayout,
 exported.source,exported.route,exported.circuit,exported.preservedSavedDdr])assert.equal(hash(a.path),a.sha256)
assert.equal(local.status,'KICAD_ALL_74_REMAINING_SYNCHRONOUS_TERMINALS_CONNECTED')
assert.equal(local.cpuFanoutsConnected,37);assert.equal(local.ramFanoutsConnected,37)
assert.equal(local.records.length,74);assert(local.records.every(r=>r.padToOutboardConnected))
assert.equal(local.physicalVias,160);assert.equal(local.copperLayers,4)
assert.equal(local.savedFanouts.sha256,exported.route.sha256)
for(const e of [native,reference])assert.equal(e.board.sha256,local.board.sha256)
for(const sha of [native.circuit.sha256,reference.source.sha256,ddr.circuitSha256,exported.circuit.sha256])
 assert.equal(sha,local.circuit.sha256)
for(const e of [native,ddr])assert.equal(e.connectionMap.sha256,local.connectionMap.sha256)
assert.equal(native.connectedSignals,11);assert.equal(ddr.connectedSignals,11)
const names=new Set(['DDR_D0','DDR_D1','DDR_D2','DDR_D3','DDR_D4','DDR_D5','DDR_D6','DDR_D7','DDR_DQM0','DDR_DQS0','DDR_DQSn0'])
assert.deepEqual(new Set(native.results.filter(r=>r.connected).map(r=>r.name)),names)
assert.equal(native.results.length,49);assert.equal(ddr.status,'AM3352_MEMORY_FAIL')
const base=read(exported.source.path),circuit=read(local.circuit.path)
const copper=assertSavedDdrCopper(base,read(exported.preservedSavedDdr.path),{ramRotation:180,rotatedD2PowerBridge:true,
 ramReferenceEscapes:read(reference.referenceLayout.path)})
assert.equal(copper.traces,70);assert.equal(copper.savedDdrSignals,11);assert.equal(copper.savedDdrVias,28)
assert.equal(copper.totalSourceTraces,81);assert.equal(base.filter(e=>e.type==='pcb_via').length,97)
for(const type of ['source_component','source_port','source_trace','source_net','source_bus','pcb_smtpad','pcb_port','pcb_keepout'])
 assert.deepEqual(circuit.filter(e=>e.type===type),base.filter(e=>e.type===type))
const stripPour=e=>{
 const copy=structuredClone(e)
 if(copy.type==='pcb_trace')for(const p of copy.route){delete p.is_inside_copper_pour;delete p.copper_pour_id}
 return copy
}
for(const type of ['pcb_trace','pcb_via'])for(const e of base.filter(e=>e.type===type))
 assert.deepEqual(stripPour(circuit.find(t=>t.type===type&&t[`${type}_id`]===e[`${type}_id`])),stripPour(e))
assert.equal(circuit.filter(e=>e.type==='pcb_trace').length,155)
assert.equal(circuit.filter(e=>e.type==='pcb_smtpad').length,882)
const vias=circuit.filter(e=>e.type==='pcb_via');assert.equal(vias.length,160)
let minimumHoleEdgeClearanceMm=Infinity
for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)minimumHoleEdgeClearanceMm=Math.min(minimumHoleEdgeClearanceMm,
 Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)-(vias[i].hole_diameter+vias[j].hole_diameter)/2)
assert(minimumHoleEdgeClearanceMm>=.254-1e-6)
assert.equal(reference.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(reference.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(reference.ramBypassTerminalsConnectedToPlanes,28)
assert(reference.records.every(r=>r.connected)&&reference.bypassRecords.every(r=>r.connected))
assert.deepEqual(reference.explicitInnerPowerBridge,{ball:'D2',connectedNativeSegments:3,newHoles:0})
const drcPath=`${prefix}-kicad-drc.json`,drc=read(drcPath)
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert.equal(drc.violations.filter(v=>v.type==='via_dangling').length,63)
assert.equal(drc.violations.filter(v=>v.type==='track_dangling').length,11)
assert(drc.violations.every(v=>v.severity==='warning'))
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)&&!['via_dangling','track_dangling'].includes(v.type)).length,0)
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
assert(readFileSync(`${prefix}-library.log`,'utf8').includes('all 2466 physical records unchanged'))
const byte=ddr.timing.find(t=>t.name==='DDR_BYTE0'),pair=ddr.timing.find(t=>t.name==='DDR_DQS0_PAIR')
assert.equal(byte.limitMm,.635);assert(!byte.pass&&byte.skewMm>.635)
assert.equal(pair.limitMm,.127);assert(pair.pass&&pair.skewMm<=.127)
const summary={status:'FIXED_BYTE0_AND_74_REMAINING_NATIVE_TERMINALS_PHYSICALLY_CHECKED_TIMING_AND_CHANNELS_INCOMPLETE',
 source:exported.source,circuit:local.circuit,board:local.board,savedByte0:exported.preservedSavedDdr,
 nativeTerminals:local.savedFanouts,connectionMap:local.connectionMap,referenceLayout:reference.referenceLayout,
 components:204,actualPads:882,copperLayers:4,signalLayers:['top','bottom'],referenceLayers:{inner1:'GND',inner2:'DDR_1V5'},
 fixedEndToEndByte0Channels:11,newEndToEndChannelsFromReservations:0,requiredDdrChannels:49,openDdrChannels:38,
 cpuRemainingSynchronousTerminalsConnected:37,ramRemainingSynchronousTerminalsConnected:37,
 sourcePowerTracePieces:70,sourcePowerVias:69,savedByte0Vias:28,addedReservedSignalVias:63,totalThroughVias:160,
 totalTracePieces:155,minimumHoleEdgeClearanceMm,explicitInnerPowerBridge:reference.explicitInnerPowerBridge,
 byte0PlanarSkewMm:byte.skewMm,byte0PlanarSkewLimitMm:.635,byte0PlanarMatchPass:false,
 dqs0PlanarSkewMm:pair.skewMm,dqs0PlanarSkewLimitMm:.127,dqs0PlanarMatchPass:true,
 gerberShortsAllLayers:0,clearanceViolationsAllSeverities:0,unfinishedViaWarnings:63,unfinishedTrackWarnings:11,
 presentationWarnings:drc.violations.filter(v=>presentation.has(v.type)).length,hostUnconnectedItems:drc.unconnected_items.length,
 ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
 exactFootprintsPreserved:273,physicalLibraryRecordsPreserved:2466,
 evidence:[`${directory}/export.json`,`${prefix}-native-terminals.json`,`${prefix}-native-ddr-connectivity.json`,
 `${prefix}-ddr-connectivity.json`,`${prefix}-reference-connectivity.json`,drcPath,`${prefix}-shorts.log`,`${prefix}-library.log`].map(artifact),
 snapshot:artifact('images/am3352-ram-rotated-180-byte0-fixed-reused-reservations-top.png'),
 activeDefaultChanged:false,combinedWithSeparateByte1Candidate:false,fullPhysicalDrcPass:false,
 timingQualified:false,fabricationReady:false,originalShellFitVerified:false,
 scope:'One diagnostic preserves eleven fixed byte0 channels while checking all 74 remaining byte1/command pad-to-terminal reservations. The reservations have dangling copper and add no end-to-end channels. Byte0 whole-byte skew fails; 38 DDR signals, powered host, peripherals, electrical timing and original-shell measurements remain unfinished.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,fixedChannels:11,remainingTerminals:74,shorts:0,clearanceViolations:0,byte0SkewMm:byte.skewMm}))
