import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertSavedDdrCopper} from './lib/am3352-saved-ddr-copper.mjs'

// This verifies one exact editable byte1 replay. Other placement/phase
// candidates contribute no channels or physical qualifications to it.
const variant=process.argv[2]??'pair'
assert(['pair','matched'].includes(variant))
const planarMatched=variant==='matched'
const prefix=`checks/integrated/am3352-ram-rotated-180-byte1-${variant}`
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)})
const audit=read(`${prefix}-replay-source-validation.json`),ddr=read(`${prefix}-ddr-connectivity.json`)
const native=read(`${prefix}-native-ddr-connectivity.json`),reference=read(`${prefix}-reference-connectivity.json`)
const pathsPath=`routing/am3352-ram-rotated-180-byte1-${variant}-paths.json`
const provenance=read(pathsPath.replace('.json','.provenance.json'))
for(const a of [audit.circuit,native.board,provenance.source,provenance.nativeRouting,provenance.paths,provenance.memoryMap,reference.referenceLayout])assert.equal(hash(a.path),a.sha256)
for(const sha of [ddr.circuitSha256,native.circuit.sha256,reference.source.sha256])assert.equal(sha,audit.circuit.sha256)
assert.equal(reference.board.sha256,native.board.sha256)
assert.equal(ddr.connectionMap.sha256,provenance.memoryMap.sha256)
assert.equal(native.connectionMap.sha256,provenance.memoryMap.sha256)
assert.equal(native.connectedSignals,11);assert.equal(ddr.connectedSignals,11)
const names=new Set(['DDR_D8','DDR_D9','DDR_D10','DDR_D11','DDR_D12','DDR_D13','DDR_D14','DDR_D15','DDR_DQM1','DDR_DQS1','DDR_DQSn1'])
assert.deepEqual(new Set(native.results.filter(r=>r.connected).map(r=>r.name)),names)
assert.equal(ddr.status,'AM3352_MEMORY_FAIL');assert.equal(audit.ramRotation,180)
const circuit=read(audit.circuit.path),base=read(provenance.source.path)
const copper=assertSavedDdrCopper(circuit,read(pathsPath),{ramReferenceEscapes:read(reference.referenceLayout.path),ramRotation:180,rotatedD2PowerBridge:true})
assert.equal(copper.traces,70);assert.equal(copper.savedDdrSignals,11);assert.equal(copper.savedDdrVias,42)
for(const type of ['source_component','source_port','source_trace','source_net','source_bus','pcb_smtpad','pcb_port','pcb_keepout'])
 assert.deepEqual(circuit.filter(e=>e.type===type),base.filter(e=>e.type===type),`${type} identities/geometry must remain fixed`)
assert.equal(circuit.filter(e=>e.type==='pcb_trace').length,81)
const vias=circuit.filter(e=>e.type==='pcb_via');assert.equal(vias.length,111)
let minimumHoleEdgeClearanceMm=Infinity
for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)minimumHoleEdgeClearanceMm=Math.min(minimumHoleEdgeClearanceMm,
 Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)-(vias[i].hole_diameter+vias[j].hole_diameter)/2)
assert(minimumHoleEdgeClearanceMm>=.254-1e-6)
assert.equal(reference.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(reference.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(reference.ramBypassTerminalsConnectedToPlanes,28)
assert(reference.records.every(r=>r.connected)&&reference.bypassRecords.every(r=>r.connected))
assert.deepEqual(reference.explicitInnerPowerBridge,{ball:'D2',connectedNativeSegments:3,newHoles:0})
const drc=read(`${prefix}-kicad-drc.json`),presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)).length,0)
assert(drc.violations.every(v=>v.severity==='warning'))
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
const physicalRecords=planarMatched?3402:3026
assert(readFileSync(`${prefix}-library.log`,'utf8').includes(`all ${physicalRecords} physical records unchanged`))
const pair=ddr.timing.find(t=>t.name==='DDR_DQS1_PAIR'),byte=ddr.timing.find(t=>t.name==='DDR_BYTE1')
assert(pair.pass&&pair.skewMm<=.127);assert.equal(byte.pass,planarMatched)
assert(planarMatched?byte.skewMm<=.635:byte.skewMm>.635)
const runPath=planarMatched?'dist/am3352-ram-rotated-180-byte1-whole-matched-channel-attempt-332/result.json':
 'dist/am3352-ram-rotated-180-byte1-balanced-pair-channel-attempt-292/result.json',run=read(runPath)
assert.equal(run.completedSignals,11);assert.equal(run.mode,planarMatched?'matched-handoffs':'pair-matched-bootstrap')
assert.equal(run.timingRequirements.buses[0].maxLengthSkew,.635)
assert.equal(run.timingRequirements.differentialPairs[0].lengthTolerance,.127)
assert.equal(hash(run.output.path),run.output.sha256);assert.equal(run.output.sha256,provenance.nativeRouting.sha256)
if(planarMatched){
 const input=read(run.channel.input.path)
 assert.equal(hash(run.channel.input.path),run.channel.input.sha256)
 assert.equal(input.buses[0].maxLengthSkew,.635);assert.equal(input.differentialPairs[0].lengthTolerance,.127)
 assert(run.channel.stats.busLengths.every(b=>b.matched&&b.skewMm<=b.toleranceMm))
 assert(run.channel.stats.pairLengths.every(p=>p.matched&&p.skewMm<=p.toleranceMm))
 assert.equal(provenance.manualLocalDataTuning.length,34)
}
const summary={status:planarMatched?'ROTATED_RAM_BYTE1_PHYSICAL_AND_PLANAR_MATCH_CHECKS_PASS_HOST_INCOMPLETE':
 'ROTATED_RAM_BYTE1_CONTINUITY_AND_PHYSICAL_CHECKS_PASS_WHOLE_BYTE_TIMING_FAIL',
 source:audit.circuit,board:native.board,baseSource:provenance.source,editablePaths:provenance.paths,
 connectionMap:provenance.memoryMap,ramReferenceLayout:reference.referenceLayout,ramRotationDeg:180,
 nativeAutorouter:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',nativeRun:artifact(runPath),
 nativeBootstrapChannels:11,components:204,actualPadObstacles:882,copperLayers:4,signalLayers:['top','bottom'],
 referenceLayers:{inner1:'GND',inner2:'DDR_1V5'},ddrSignalsConnected:11,requiredDdrSignals:49,openDdrSignals:38,
 existingPowerTracePieces:70,existingPowerVias:69,ddrThroughVias:42,totalThroughVias:111,minimumHoleEdgeClearanceMm,
 explicitInnerPowerBridge:reference.explicitInnerPowerBridge,
 dqs1PlanarSkewMm:pair.skewMm,dqs1PlanarSkewLimitMm:.127,dqs1PlanarMatchPass:true,
 byte1PlanarSkewMm:byte.skewMm,byte1PlanarSkewLimitMm:.635,byte1PlanarMatchPass:planarMatched,
 gerberShortsAllLayers:0,independentPhysicalViolationsAllSeverities:0,presentationWarnings:drc.violations.length,
 hostUnconnectedItems:drc.unconnected_items.length,ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
 exactFootprintsPreserved:273,physicalLibraryRecordsPreserved:physicalRecords,
 evidence:[`${prefix}-replay-source-validation.json`,`${prefix}-ddr-connectivity.json`,`${prefix}-native-ddr-connectivity.json`,
  `${prefix}-reference-connectivity.json`,`${prefix}-kicad-drc.json`,`${prefix}-shorts.log`,`${prefix}-library.log`].map(artifact),
 snapshot:artifact(`images/am3352-ram-rotated-180-byte1-${variant}-top.png`),
 activeDefaultChanged:false,combinedWithOtherCandidates:false,originalShellFitVerified:false,
 fabricationReady:false,timingQualified:false,planarTimingPass:planarMatched,fullElectricalTimingQualified:false,pairGeometryQualified:false,
 scope:`Separate 180 degree RAM byte1 replay. Eleven native end-to-end channels plus manual fanouts pass physical clearance and numeric-pad connectivity; RAM references and the authored inner2 power bridge pass. Original whole-byte skew ${planarMatched?'passes':'fails'}; 38 DDR signals and full host/mechanical qualification remain unfinished.`}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,connected:11,shorts:0,physicalViolations:0,byteSkewMm:byte.skewMm}))
