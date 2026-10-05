import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertSavedDdrCopper} from './lib/am3352-saved-ddr-copper.mjs'

// Qualify this specific intermediate replay without relaxing release timing.
const prefix='checks/integrated/am3352-ram-rotated-180-byte0-pair'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)})
const audit=read(`${prefix}-source-validation.json`),ddr=read(`${prefix}-ddr-connectivity.json`)
const native=read(`${prefix}-native-ddr-connectivity.json`),reference=read(`${prefix}-reference-connectivity.json`)
const circuit=read(audit.circuit.path),pathsPath='routing/am3352-ram-rotated-180-byte0-pair-paths.json'
const provenance=read(pathsPath.replace('.json','.provenance.json'))
for(const a of [audit.circuit,native.board,provenance.source,provenance.nativeRouting,provenance.paths,provenance.memoryMap,reference.referenceLayout])assert.equal(hash(a.path),a.sha256)
for(const sha of [ddr.circuitSha256,native.circuit.sha256,reference.source.sha256])assert.equal(sha,audit.circuit.sha256)
assert.equal(reference.board.sha256,native.board.sha256)
assert.equal(ddr.connectionMap.sha256,provenance.memoryMap.sha256)
assert.equal(native.connectedSignals,11);assert.equal(ddr.connectedSignals,11)
assert.equal(ddr.status,'AM3352_MEMORY_FAIL');assert.equal(audit.ramRotation,180)
assertSavedDdrCopper(circuit,read(pathsPath),{ramReferenceEscapes:read(reference.referenceLayout.path),ramRotation:180})
const base=read(provenance.source.path)
for(const type of ['source_component','source_port','source_trace','source_net','pcb_smtpad','pcb_port','pcb_keepout'])
  assert.deepEqual(circuit.filter(e=>e.type===type),base.filter(e=>e.type===type),`Rebound ${type} identities/geometry must remain fixed`)
assert.equal(circuit.filter(e=>e.type==='pcb_trace').length,80)
const vias=circuit.filter(e=>e.type==='pcb_via');assert.equal(vias.length,99)
let minimumHoleEdgeClearanceMm=Infinity
for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)minimumHoleEdgeClearanceMm=Math.min(minimumHoleEdgeClearanceMm,
  Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)-(vias[i].hole_diameter+vias[j].hole_diameter)/2)
assert(minimumHoleEdgeClearanceMm>=.254-1e-6)
assert.equal(reference.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(reference.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(reference.ramBypassTerminalsConnectedToPlanes,28)
assert(reference.records.every(r=>r.connected)&&reference.bypassRecords.every(r=>r.connected))
const drc=read(`${prefix}-kicad-drc.json`),presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)).length,0)
assert(drc.violations.every(v=>v.severity==='warning'))
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
assert(readFileSync(`${prefix}-library.log`,'utf8').includes('all 2147 physical records unchanged'))
const pair=ddr.timing.find(t=>t.name==='DDR_DQS0_PAIR'),byte=ddr.timing.find(t=>t.name==='DDR_BYTE0')
assert(pair.pass&&pair.skewMm<=.127);assert(!byte.pass&&byte.skewMm>.635)
const runPath='dist/am3352-ram-rotated-180-byte0-pair-channel-attempt-247/result.json',run=read(runPath)
assert.equal(run.completedSignals,11);assert.equal(run.mode,'pair-matched-bootstrap')
assert.equal(run.timingRequirements.buses[0].maxLengthSkew,.635)
assert.equal(run.timingRequirements.differentialPairs[0].lengthTolerance,.127)
assert.equal(hash(run.output.path),run.output.sha256);assert.equal(run.output.sha256,provenance.nativeRouting.sha256)
const summary={status:'ROTATED_RAM_BYTE0_CONTINUITY_AND_PHYSICAL_CHECKS_PASS_WHOLE_BYTE_TIMING_FAIL',
  source:audit.circuit,board:native.board,baseSource:provenance.source,editablePaths:provenance.paths,
  connectionMap:provenance.memoryMap,ramReferenceLayout:reference.referenceLayout,ramRotationDeg:180,
  nativeAutorouter:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',nativeRun:artifact(runPath),
  nativeBootstrapChannels:11,components:204,actualPadObstacles:882,copperLayers:4,signalLayers:['top','bottom'],
  referenceLayers:{inner1:'GND',inner2:'DDR_1V5'},ddrSignalsConnected:11,requiredDdrSignals:49,openDdrSignals:38,
  existingPowerTracePieces:69,existingPowerVias:69,ddrThroughVias:30,totalThroughVias:99,minimumHoleEdgeClearanceMm,
  dqs0PlanarSkewMm:pair.skewMm,dqs0PlanarSkewLimitMm:.127,dqs0PlanarMatchPass:true,
  byte0PlanarSkewMm:byte.skewMm,byte0PlanarSkewLimitMm:.635,byte0PlanarMatchPass:false,
  gerberShortsAllLayers:0,independentPhysicalViolationsAllSeverities:0,presentationWarnings:drc.violations.length,
  hostUnconnectedItems:drc.unconnected_items.length,ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
  exactFootprintsPreserved:273,physicalLibraryRecordsPreserved:2147,
  evidence:[`${prefix}-source-validation.json`,`${prefix}-ddr-connectivity.json`,`${prefix}-native-ddr-connectivity.json`,
    `${prefix}-reference-connectivity.json`,`${prefix}-kicad-drc.json`,`${prefix}-shorts.log`].map(artifact),
  snapshot:artifact('images/am3352-ram-rotated-180-byte0-pair-bottom.png'),
  activeDefaultChanged:false,combinedWithOtherCandidates:false,originalShellFitVerified:false,
  fabricationReady:false,timingQualified:false,fullElectricalTimingQualified:false,pairGeometryQualified:false,
  scope:'Separate 180 degree RAM placement. Eleven native end-to-end byte0 paths plus manual fanouts pass copper continuity and physical clearance. Original whole-byte skew fails, and 38 DDR signals and full host/mechanical qualification remain unfinished.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,connected:11,shorts:0,physicalViolations:0,byteSkewMm:byte.skewMm}))
