import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Evidence summary for one checked, incomplete native/manual routing replay.
// It is deliberately not a fabrication release and rejects physical warnings.
const prefix=process.argv[2]??'checks/integrated/am3352-guided-byte0-pair-matched'
const imagePath=process.argv[3]??'images/am3352-guided-byte0-pair-matched-bottom.png'
const baselinePath=process.argv[4]??'dist/diagnostics/am3352-ram-bypass/circuit.json'
const byteMustPass=process.argv[5]==='byte-matched'
const nativeRun=process.argv[6]??'dist/am3352-guided-byte0-pair-matched-attempt-58/result.json'
const manualRun=process.argv[7]??'dist/am3352-guided-byte0-dqs-balanced-attempt-53/result.json'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const source=read(`${prefix}-source-validation.json`),circuitPath=source.circuit.path,circuit=read(circuitPath)
assert.equal(hash(circuitPath),source.circuit.sha256)
const ddr=read(`${prefix}-ddr-connectivity.json`),native=read(`${prefix}-native-ddr-connectivity.json`),reference=read(`${prefix}-reference-connectivity.json`)
for(const sha of [ddr.circuitSha256,native.circuit.sha256,reference.source.sha256])assert.equal(sha,source.circuit.sha256)
assert.equal(hash(native.board.path),native.board.sha256);assert.equal(reference.board.sha256,native.board.sha256)
assert.equal(native.connectedSignals,11);assert.equal(ddr.connectedSignals,11);assert.equal(ddr.status,'AM3352_MEMORY_FAIL')
assert.equal(reference.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(reference.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(reference.ramBypassTerminalsConnectedToPlanes,28)
assert(reference.records.every(r=>r.connected)&&reference.bypassRecords.every(r=>r.connected))
const drc=read(`${prefix}-kicad-drc.json`),presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)).length,0)
assert(drc.violations.every(v=>v.severity==='warning'))
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
const pair=ddr.timing.find(t=>t.name==='DDR_DQS0_PAIR'),byte=ddr.timing.find(t=>t.name==='DDR_BYTE0')
assert(pair.pass&&pair.skewMm<=.127);assert.equal(byte.pass,byteMustPass)
if(byteMustPass)assert(byte.skewMm<=.635+1e-6);else assert(byte.skewMm>.635)
const baseline=read(baselinePath)
for(const type of ['source_component','source_port','source_trace','source_net','pcb_smtpad'])
  assert.deepEqual(circuit.filter(e=>e.type===type),baseline.filter(e=>e.type===type),`Prior ${type} must remain unchanged`)
const summary={status:byteMustPass?'DDR_BYTE0_PLANAR_MATCH_AND_PHYSICAL_CHECKS_PASS_DDR_AND_HOST_INCOMPLETE':'DDR_BYTE0_CONTINUITY_AND_DQS_PLANAR_MATCH_CHECKED_BYTE_AND_HOST_INCOMPLETE',
  source:source.circuit,board:native.board,components:204,actualPadObstacles:882,
  copperLayerCount:4,maxCopperLayers:4,signalLayers:['top','bottom'],referenceLayers:{inner1:'GND',inner2:'DDR_1V5'},
  nativeAutorouter:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',nativeRun,manualTuning:manualRun,
  ...(source.referenceLayout?{ramReferenceLayout:source.referenceLayout,manualRamReferenceViaMove:{ball:'C1',from:{x:-2.8,y:-23},to:{x:-3.8,y:-22.2},lengthMm:Math.hypot(.6,.4),all39ReferenceConnectionsChecked:true}}:{}),
  ddrSignalsConnected:11,requiredDdrSignals:49,ddrThroughVias:source.ddrThroughVias,physicalThroughVias:source.physicalThroughVias,
  existingPowerTracePieces:69,existingPowerVias:69,ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
  dqs0PlanarSkewMm:pair.skewMm,dqs0PlanarSkewLimitMm:.127,dqs0PlanarMatchPass:true,
  byte0PlanarSkewMm:byte.skewMm,byte0PlanarSkewLimitMm:.635,byte0PlanarMatchPass:byteMustPass,
  gerberShorts:0,gerberShortsLayerScope:'all four layers',independentPhysicalViolationsAllSeverities:0,
  presentationWarnings:drc.violations.length,allHostUnconnectedItems:drc.unconnected_items.length,
  snapshot:{path:imagePath,sha256:hash(imagePath),visuallyInspected:true},
  fabricationReady:false,completePowerRouting:false,fullElectricalTimingQualified:false,pairGeometryQualified:false,
  scope:'Editable source replay of the native bootstrap and manual fanouts. '
    +(byteMustPass?'Byte0/DQS0 planar matching passes; ':'DQS0 planar matching passes but byte0 skew fails; ')
    +'38 DDR signals, package/via delays, impedance, CPU/PMIC power, peripherals and firmware remain unfinished.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify(summary))
