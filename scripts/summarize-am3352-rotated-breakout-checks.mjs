import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertSourceCopper} from './lib/am3352-source-copper.mjs'

assert(process.argv[2]===undefined||process.argv[2]==='byte1-cpu-reserved')
const cpuReserved=process.argv[2]==='byte1-cpu-reserved'
const prefix=cpuReserved?'checks/integrated/am3352-ram-rotated-180-byte1-cpu-reserved':'checks/integrated/am3352-ram-rotated-180-pruned-breakout'
const reservedVias=cpuReserved?85:74,removedBranches=cpuReserved?11:22,physicalRecords=cpuReserved?609:598
const diagnosticDirectory=cpuReserved?'dist/am3352-ram-rotated-180-byte1-cpu-reserved-breakout-diagnostic':'dist/am3352-ram-rotated-180-pruned-breakout-diagnostic'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)})
const local=read(`${prefix}-native-connectivity.json`),reference=read(`${prefix}-reference-connectivity.json`),ddr=read(`${prefix}-native-ddr-connectivity.json`)
for(const a of [local.board,local.circuit,local.savedFanouts])assert.equal(hash(a.path),a.sha256)
assert.equal(local.cpuFanoutsConnected,48);assert.equal(local.ramFanoutsConnected,48)
assert.equal(local.records.length,96);assert(local.records.every(r=>r.padToOutboardConnected))
for(const evidence of [reference,ddr])assert.equal(evidence.board.sha256,local.board.sha256)
assert.equal(reference.source.sha256,local.circuit.sha256);assert.equal(ddr.circuit.sha256,local.circuit.sha256)
assert.equal(ddr.connectedSignals,0);assert.equal(ddr.results.length,49);assert(ddr.results.every(r=>!r.connected))
assert.equal(reference.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(reference.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(reference.ramBypassTerminalsConnectedToPlanes,28)
assert(reference.records.every(r=>r.connected)&&reference.bypassRecords.every(r=>r.connected))
const exported=read(`${diagnosticDirectory}/export.json`)
assert.equal(exported.circuit.sha256,local.circuit.sha256);assert.equal(hash(exported.source.path),exported.source.sha256)
assert.equal(exported.route.sha256,local.savedFanouts.sha256)
const base=read(exported.source.path),circuit=read(local.circuit.path)
const ram=base.find(e=>e.type==='source_component'&&e.name==='U_RAM')
assert.equal(base.find(e=>e.type==='pcb_component'&&e.source_component_id===ram.source_component_id).rotation,180)
const referenceLayout=read(reference.referenceLayout.path)
assert.equal(hash(reference.referenceLayout.path),reference.referenceLayout.sha256)
assertSourceCopper(base,{ramReferenceEscapes:referenceLayout,ramRotation:180})
for(const type of ['source_component','source_port','source_trace','source_net','source_bus','pcb_smtpad','pcb_port','pcb_keepout'])assert.deepEqual(circuit.filter(e=>e.type===type),base.filter(e=>e.type===type))
for(const type of ['pcb_trace','pcb_via'])for(const e of base.filter(e=>e.type===type))assert.deepEqual(circuit.find(t=>t.type===type&&t[`${type}_id`]===e[`${type}_id`]),e)
assert.equal(circuit.filter(e=>e.type==='pcb_trace').length,165)
const vias=circuit.filter(e=>e.type==='pcb_via');assert.equal(vias.length,69+reservedVias)
let minimumHoleEdgeClearanceMm=Infinity
for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)minimumHoleEdgeClearanceMm=Math.min(minimumHoleEdgeClearanceMm,Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)-(vias[i].hole_diameter+vias[j].hole_diameter)/2)
assert(minimumHoleEdgeClearanceMm>=.254-1e-6)
const preparationPath=cpuReserved?'dist/am3352-ram-rotated-180-byte0-rebound-bootstrap-attempt-233/result.json':'dist/am3352-ram-rotated-180-bootstrap-attempt-229/result.json'
const preparation=read(preparationPath)
assert.equal(preparation.preparedLocalEscapes,96);assert.equal(preparation.coreVersion,'0.0.2056')
assert.equal(preparation.source.sha256,exported.source.sha256);assert.equal(hash(preparation.input.path),preparation.input.sha256)
const pruningPath=cpuReserved?'dist/am3352-ram-rotated-180-byte1-cpu-reserved-bootstrap-attempt-258/result.json':'dist/am3352-ram-rotated-180-pruned-bootstrap-attempt-231/result.json'
const pruning=read(pruningPath)
assert.equal(pruning.manualUnusedBranchPruning.unusedBootstrapHolesRemoved,removedBranches)
assert.equal(pruning.manualUnusedBranchPruning.otherNativeDogbonesUnchanged,reservedVias)
if(cpuReserved){
 assert.equal(pruning.manualUnusedBranchPruning.package,'U_RAM')
 assert.equal(pruning.manualUnusedBranchPruning.retainedByte1CpuThroughDogbones,11)
 assert.equal(local.connectionMap.sha256,preparation.memoryMap.sha256)
 assert.equal(hash(local.connectionMap.path),local.connectionMap.sha256)
}
const native=read(local.savedFanouts.path),original=read(pruning.manualUnusedBranchPruning.nativeInput.path)
assert.equal(hash(pruning.manualUnusedBranchPruning.nativeInput.path),pruning.manualUnusedBranchPruning.nativeInput.sha256)
const byte1=new Set(read(pruning.input.path).buses.find(b=>b.name==='DDR_BYTE1').connectionNames)
for(let i=0;i<96;i++)assert.deepEqual(native[i],byte1.has(original[i].source_trace_id)&&(!cpuReserved||original[i].route[0].y<-15)?{...original[i],route:original[i].route.slice(0,2)}:original[i])
const drcPath=`${prefix}-kicad-drc.json`,drc=read(drcPath)
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert.equal(drc.violations.filter(v=>v.type==='via_dangling').length,reservedVias)
assert.equal(drc.violations.filter(v=>v.type==='track_dangling').length,removedBranches)
assert(drc.violations.every(v=>v.severity==='warning'))
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)&&!['via_dangling','track_dangling'].includes(v.type)).length,0)
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
assert(readFileSync(`${prefix}-library.log`,'utf8').includes(`all ${physicalRecords} physical records unchanged`))
const summary={status:cpuReserved?'ROTATED_RAM_CPU_BYTE1_ESCAPES_RESERVED_ALL_96_TERMINALS_CHECKED_CHANNELS_OPEN':'ROTATED_RAM_ALL_96_NATIVE_TERMINALS_CONNECTED_REFERENCE_PLANES_PRESERVED_CHANNELS_OPEN',
 source:exported.source,circuit:local.circuit,board:local.board,nativeTerminals:local.savedFanouts,
 referenceLayout:reference.referenceLayout,ramRotationDeg:180,coreVersion:preparation.coreVersion,
 nativePreparation:artifact(preparationPath),unusedBranchPruning:artifact(pruningPath),
 components:204,actualPadObstacles:882,copperLayers:4,signalLayers:['top','bottom'],
 cpuSynchronousTerminalsConnected:48,ramSynchronousTerminalsConnected:48,
 sourcePowerTracePiecesPreserved:69,sourcePowerThroughViasPreserved:69,addedReservedSignalVias:reservedVias,totalThroughVias:69+reservedVias,
 ...(cpuReserved?{retainedByte1CpuThroughDogbones:11,connectionMap:local.connectionMap}:{}),
 completedEndToEndDdrChannels:0,requiredDdrChannels:49,minimumHoleEdgeClearanceMm,
 gerberShortsAllLayers:0,clearanceViolations:0,unfinishedViaWarnings:reservedVias,unfinishedTrackWarnings:removedBranches,
 presentationWarnings:drc.violations.filter(v=>presentation.has(v.type)).length,hostUnconnectedItems:drc.unconnected_items.length,
 ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,physicalLibraryRecordsPreserved:physicalRecords,
 evidence:[`${prefix}-native-connectivity.json`,`${prefix}-reference-connectivity.json`,`${prefix}-native-ddr-connectivity.json`,drcPath,`${prefix}-shorts.log`].map(artifact),
 fullPhysicalDrcPass:false,timingQualified:false,fabricationReady:false,originalShellFitVerified:false,
 scope:'Separate 180 degree RAM placement with explicitly transformed supply escapes. All synchronous local terminals and RAM reference connections pass. '
 +(cpuReserved?'Eleven CPU byte1 through-dogbones remain reserved before byte0 fanouts; only unused RAM byte1 holes are pruned. ':'Unused temporary byte1 holes are pruned; ')
 +'All remaining dangling warnings are retained. Complete DDR channels, original matching and full host/mechanical qualification remain required.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,cpuTerminals:48,ramTerminals:48,shorts:0,clearanceViolations:0,completedChannels:0}))
