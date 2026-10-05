import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertSavedDdrCopper} from './lib/am3352-saved-ddr-copper.mjs'

const prefix='checks/integrated/am3352-ram-rotated-180-byte-swapped-byte0-pair'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)})
const audit=read(`${prefix}-source-validation.json`),ddr=read(`${prefix}-ddr-connectivity.json`)
const native=read(`${prefix}-native-ddr-connectivity.json`),reference=read(`${prefix}-reference-connectivity.json`)
const pathsPath='routing/am3352-ram-rotated-180-byte-swapped-byte0-pair-paths.json'
const provenance=read(pathsPath.replace('.json','.provenance.json'))
for(const a of [audit.circuit,native.board,provenance.source,provenance.nativeRouting,provenance.paths,
 provenance.memoryMap,reference.referenceLayout])assert.equal(hash(a.path),a.sha256)
for(const sha of [ddr.circuitSha256,native.circuit.sha256,reference.source.sha256])assert.equal(sha,audit.circuit.sha256)
assert.equal(reference.board.sha256,native.board.sha256)
for(const e of [native,ddr])assert.equal(e.connectionMap.sha256,provenance.memoryMap.sha256)
assert.equal(native.connectedSignals,11);assert.equal(ddr.connectedSignals,11)
const names=new Set([...Array.from({length:8},(_,i)=>`DDR_D${i}`),'DDR_DQM0','DDR_DQS0','DDR_DQSn0'])
assert.deepEqual(new Set(native.results.filter(r=>r.connected).map(r=>r.name)),names)
assert.equal(native.results.length,49);assert.equal(ddr.status,'AM3352_MEMORY_FAIL')
assert.equal(audit.ramRotation,180)
const circuit=read(audit.circuit.path),base=read(provenance.source.path)
const copper=assertSavedDdrCopper(circuit,read(pathsPath),{ramRotation:180,rotatedD2PowerBridge:true,
 ramReferenceEscapes:read(reference.referenceLayout.path)})
assert.equal(copper.traces,70);assert.equal(copper.savedDdrSignals,11);assert.equal(copper.savedDdrVias,24)
for(const type of ['source_component','source_port','source_trace','source_net','source_bus','pcb_smtpad','pcb_port','pcb_keepout'])
 assert.deepEqual(circuit.filter(e=>e.type===type),base.filter(e=>e.type===type))
assert.equal(circuit.filter(e=>e.type==='pcb_trace').length,81)
const vias=circuit.filter(e=>e.type==='pcb_via');assert.equal(vias.length,93)
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
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)).length,0)
assert(drc.violations.every(v=>v.severity==='warning'))
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
assert(readFileSync(`${prefix}-library.log`,'utf8').includes('all 2081 physical records unchanged'))
const pair=ddr.timing.find(t=>t.name==='DDR_DQS0_PAIR'),byte=ddr.timing.find(t=>t.name==='DDR_BYTE0')
assert(pair.pass&&pair.skewMm<=.127);assert(!byte.pass&&byte.skewMm>.635)
assert.equal(pair.limitMm,.127);assert.equal(byte.limitMm,.635)
const runPath='dist/am3352-ram-rotated-180-byte-swapped-byte0-clear-pair-channel-attempt-358/result.json',run=read(runPath)
assert.equal(run.completedSignals,11);assert.equal(run.mode,'pair-matched-bootstrap')
assert.equal(run.timingRequirements.buses[0].maxLengthSkew,.635)
assert.equal(run.timingRequirements.differentialPairs[0].lengthTolerance,.127)
assert.equal(hash(run.output.path),run.output.sha256);assert.equal(run.output.sha256,provenance.nativeRouting.sha256)
const map=read(provenance.memoryMap.path)
assert.equal(map.length,49)
const byteGroup=n=>Number(n.match(/DDR_D(\d+)$/)?.[1])<8?0:1
for(const c of map.filter(c=>/^DDR_D\d+$/.test(c.name)))assert.equal(Number(c.ramFunction.slice(2))<8?0:1,1-byteGroup(c.name))
for(const [name,fn] of [['DDR_DQM0','UDM'],['DDR_DQS0','UDQS'],['DDR_DQSn0','UDQSn'],
 ['DDR_DQM1','LDM'],['DDR_DQS1','LDQS'],['DDR_DQSn1','LDQSn']])assert.equal(map.find(c=>c.name===name).ramFunction,fn)
const summary={status:'RAM180_BYTE_SWAPPED_BYTE0_CONTINUITY_AND_PHYSICAL_CHECKS_PASS_WHOLE_BYTE_TIMING_FAIL',
 source:audit.circuit,board:native.board,baseSource:provenance.source,editablePaths:provenance.paths,
 connectionMap:provenance.memoryMap,ramReferenceLayout:reference.referenceLayout,ramRotationDeg:180,
 completeByteSwapAssociationsChecked:true,nativeAutorouter:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',nativeRun:artifact(runPath),
 components:204,actualPads:882,copperLayers:4,signalLayers:['top','bottom'],referenceLayers:{inner1:'GND',inner2:'DDR_1V5'},
 ddrSignalsConnected:11,requiredDdrSignals:49,openDdrSignals:38,totalTracePieces:81,
 existingPowerTracePieces:70,existingPowerVias:69,ddrThroughVias:24,totalThroughVias:93,minimumHoleEdgeClearanceMm,
 dqs0PlanarSkewMm:pair.skewMm,dqs0PlanarSkewLimitMm:.127,dqs0PlanarMatchPass:true,
 byte0PlanarSkewMm:byte.skewMm,byte0PlanarSkewLimitMm:.635,byte0PlanarMatchPass:false,
 gerberShortsAllLayers:0,independentPhysicalViolationsAllSeverities:0,presentationWarnings:drc.violations.length,
 hostUnconnectedItems:drc.unconnected_items.length,ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
 explicitInnerPowerBridge:reference.explicitInnerPowerBridge,exactFootprintsPreserved:273,physicalLibraryRecordsPreserved:2081,
 evidence:[`${prefix}-source-validation.json`,`${prefix}-ddr-connectivity.json`,`${prefix}-native-ddr-connectivity.json`,
 `${prefix}-reference-connectivity.json`,drcPath,`${prefix}-shorts.log`,`${prefix}-library.log`].map(artifact),
 snapshots:['images/am3352-ram-rotated-180-byte-swapped-byte0-pair-top.png',
 'images/am3352-ram-rotated-180-byte-swapped-byte0-pair-bottom-detail.png'].map(artifact),
 activeDefaultChanged:false,combinedWithOtherCandidates:false,originalShellFitVerified:false,fabricationReady:false,
 timingQualified:false,fullElectricalTimingQualified:false,pairGeometryQualified:false,
 scope:'Separate whole-byte-swapped RAM180 byte0 replay. Eleven native channels plus edited local fanouts pass exact-pad connectivity, all-layer shorts, physical DRC and RAM plane checks. Whole-byte matching, 38 DDR signals, full powered host/peripherals, software leveling/Linux and measured original-shell integration remain unfinished.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,connected:11,ddrVias:24,shorts:0,physicalViolations:0,byteSkewMm:byte.skewMm}))
