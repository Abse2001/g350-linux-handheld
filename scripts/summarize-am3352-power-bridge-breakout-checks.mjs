import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertSourceCopper} from './lib/am3352-source-copper.mjs'

const prefix='checks/integrated/am3352-ram-rotated-180-power-bridge-breakout'
const directory='dist/am3352-ram-rotated-180-power-bridge-breakout-diagnostic'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)})
const local=read(`${prefix}-native-connectivity.json`),reference=read(`${prefix}-reference-connectivity.json`),ddr=read(`${prefix}-native-ddr-connectivity.json`)
for(const a of [local.board,local.circuit,local.nativeEscapes,local.memoryMap,reference.referenceLayout])assert.equal(hash(a.path),a.sha256)
assert.equal(local.status,'KICAD_ALL_96_NATIVE_PAD_TO_VIA_BREAKOUTS_CONNECTED')
assert.equal(local.cpuBreakouts,48);assert.equal(local.ramBreakouts,48);assert.equal(local.physicalVias,165)
assert.equal(local.results.length,96);assert(local.results.every(r=>r.padToViaConnected))
for(const evidence of [reference,ddr])assert.equal(evidence.board.sha256,local.board.sha256)
assert.equal(reference.source.sha256,local.circuit.sha256);assert.equal(ddr.circuit.sha256,local.circuit.sha256)
assert.equal(ddr.connectionMap.sha256,local.memoryMap.sha256)
assert.equal(ddr.connectedSignals,0);assert.equal(ddr.results.length,49);assert(ddr.results.every(r=>!r.connected))
assert.equal(reference.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(reference.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(reference.ramBypassTerminalsConnectedToPlanes,28)
assert(reference.records.every(r=>r.connected)&&reference.bypassRecords.every(r=>r.connected))
assert.deepEqual(reference.explicitInnerPowerBridge,{ball:'D2',connectedNativeSegments:3,newHoles:0})
const exported=read(`${directory}/export.json`)
assert.equal(exported.circuit.sha256,local.circuit.sha256);assert.equal(hash(exported.source.path),exported.source.sha256)
assert.equal(exported.route.sha256,local.nativeEscapes.sha256)
const base=read(exported.source.path),circuit=read(local.circuit.path)
const power=assertSourceCopper(base,{ramRotation:180,rotatedD2PowerBridge:true,ramReferenceEscapes:read(reference.referenceLayout.path)})
assert.equal(power.traces,70);assert.equal(power.throughVias,69)
for(const type of ['source_component','source_port','source_trace','source_net','source_bus','pcb_smtpad','pcb_port','pcb_keepout'])assert.deepEqual(circuit.filter(e=>e.type===type),base.filter(e=>e.type===type))
const stripPourAnnotations=e=>{
 const copy=structuredClone(e)
 if(copy.type==='pcb_trace')for(const p of copy.route){delete p.is_inside_copper_pour;delete p.copper_pour_id}
 return copy
}
for(const type of ['pcb_trace','pcb_via'])for(const e of base.filter(e=>e.type===type))assert.deepEqual(stripPourAnnotations(circuit.find(t=>t.type===type&&t[`${type}_id`]===e[`${type}_id`])),stripPourAnnotations(e))
assert.equal(circuit.filter(e=>e.type==='pcb_trace').length,166)
assert.equal(circuit.filter(e=>e.type==='pcb_smtpad').length,882)
const vias=circuit.filter(e=>e.type==='pcb_via');assert.equal(vias.length,165)
let minimumHoleEdgeClearanceMm=Infinity
for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)minimumHoleEdgeClearanceMm=Math.min(minimumHoleEdgeClearanceMm,Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)-(vias[i].hole_diameter+vias[j].hole_diameter)/2)
assert(minimumHoleEdgeClearanceMm>=.254-1e-6)
const nativePreparation='dist/am3352-ram-rotated-180-power-bridge-bootstrap-attempt-269/result.json'
const preparation=read(nativePreparation)
assert.equal(preparation.preparedLocalEscapes,96);assert.equal(preparation.coreVersion,'0.0.2056')
assert.equal(preparation.source.sha256,exported.source.sha256);assert.equal(hash(preparation.input.path),preparation.input.sha256)
assert.equal(preparation.memoryMap.sha256,local.memoryMap.sha256)
const drcPath=`${prefix}-canonical-drc.json`,drc=read(drcPath)
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert.equal(drc.violations.filter(v=>v.type==='via_dangling').length,96)
assert.equal(drc.violations.filter(v=>v.type==='track_dangling').length,0)
assert(drc.violations.every(v=>v.severity==='warning'))
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)&&v.type!=='via_dangling').length,0)
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
assert(readFileSync(`${prefix}-library.log`,'utf8').includes('all 623 physical records unchanged'))
const summary={status:'ROTATED_RAM_ALL_96_FULL_DEPTH_BREAKOUTS_AND_EXPLICIT_POWER_BRIDGE_CHECKED_CHANNELS_OPEN',
 source:exported.source,circuit:local.circuit,board:local.board,nativeTerminals:local.nativeEscapes,memoryMap:local.memoryMap,
 referenceLayout:reference.referenceLayout,ramRotationDeg:180,coreVersion:preparation.coreVersion,nativePreparation:artifact(nativePreparation),
 components:204,actualPadObstacles:882,copperLayers:4,signalLayers:['top','bottom'],
 cpuSynchronousTerminalsConnected:48,ramSynchronousTerminalsConnected:48,
 sourcePowerTracePiecesPreserved:70,sourcePowerThroughViasPreserved:69,addedReservedSignalVias:96,totalThroughVias:165,
 explicitInnerPowerBridge:reference.explicitInnerPowerBridge,
 completedEndToEndDdrChannels:0,requiredDdrChannels:49,minimumHoleEdgeClearanceMm,
 gerberShortsAllLayers:0,clearanceViolations:0,unfinishedViaWarnings:96,unfinishedTrackWarnings:0,
 presentationWarnings:drc.violations.filter(v=>presentation.has(v.type)).length,hostUnconnectedItems:drc.unconnected_items.length,
 ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,physicalLibraryRecordsPreserved:623,
 evidence:[`${prefix}-native-connectivity.json`,`${prefix}-reference-connectivity.json`,`${prefix}-native-ddr-connectivity.json`,drcPath,`${prefix}-shorts.log`,`${prefix}-library.log`].map(artifact),
 fullPhysicalDrcPass:false,timingQualified:false,fabricationReady:false,originalShellFitVerified:false,
 scope:'Separate rotated RAM diagnostic. All 96 full-depth native pad-to-via escapes and all RAM references pass; D2 reaches the continuous inner2 plane through three explicitly authored power segments. No signal routes use the inner layers. All 96 dangling warnings remain. Complete DDR channels, timing, powered-host routing and measured original-shell fit are still required.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,cpuTerminals:48,ramTerminals:48,shorts:0,clearanceViolations:0,completedChannels:0}))
