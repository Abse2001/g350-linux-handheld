import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-ddr-usbc-cke-matched'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const source=read(`${prefix}-source-validation.json`),planar=read(`${prefix}-ddr-connectivity.json`)
const ddr=read(`${prefix}-native-ddr-connectivity.json`),usb=read(`${prefix}-native-usb-connectivity.json`)
const refs=read(`${prefix}-reference-connectivity.json`),drc=read(`${prefix}-kicad-drc.json`)
const prior=read(source.priorCheckedSummary.path),provenance=read(source.provenance.path)
for(const a of [source.source,source.previousSource,source.paths,source.provenance,source.priorCheckedSummary,provenance.repairRun,provenance.shortcutDiagnostic])checked(a)
assert.deepEqual(source.previousSource,prior.source)
assert.deepEqual(source.changedSignals,['DDR_DQSn1'])
assert.equal(source.tracePieces,128);assert.equal(source.throughVias,143)
assert.equal(source.preservedTracePieces,127);assert.equal(source.preservedThroughVias,143);assert.equal(source.newVias,0)
for(const a of [ddr.circuit,usb.circuit,refs.source]){checked(a);assert.deepEqual(a,source.source)}
for(const a of [ddr.board,usb.board,refs.board]){checked(a);assert.deepEqual(a,ddr.board)}
assert.equal(planar.circuitSha256,source.source.sha256)
checked(prior.nativeDdrAudit)
const previous=read(prior.nativeDdrAudit.path)
for(const r of [planar,ddr]){
  assert.equal(r.requiredSignals,49);assert.equal(r.connectedSignals,26)
  assert.deepEqual(r.results.map(x=>({name:x.name,connected:x.connected})),previous.results.map(x=>({name:x.name,connected:x.connected})))
}
assert.equal(planar.problems.length,24)
assert.equal(planar.problems.filter(p=>p.startsWith('Unconnected memory signal: ')).length,23)
assert.deepEqual(planar.timing.filter(t=>!t.pass).map(t=>t.name),['DDR_COMMAND_CLOCK'])
for(const name of ['DDR_BYTE0','DDR_BYTE1','DDR_DQS0_PAIR','DDR_DQS1_PAIR','DDR_CK_PAIR'])assert(planar.timing.find(t=>t.name===name).pass)
assert.equal(usb.numericPadNetAssignmentsVerified,38);assert.equal(usb.connectivityRecords.length,40)
assert(usb.connectivityRecords.every(r=>r.connected||r.connectedToFilledPlane))
for(const k of ['bothCableOrientationsDataConnected','ccRdReturnsConnected','localVbusAndEsdBypassConnected','vbusPmicFeedConnected','vbusSenseRouted','pmicInputBypassConnected','senseFilterClampAndGroundConnected'])assert(usb[k])
assert.equal(refs.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(refs.ramGroundBallsConnectedToGroundPlane,21);assert.equal(refs.ramBypassTerminalsConnectedToPlanes,28)
assert(refs.records.every(r=>r.connected)&&refs.bypassRecords.every(r=>r.connected))
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert(drc.violations.every(v=>presentation.has(v.type)&&v.severity==='warning'))
assert.equal(drc.violations.length,418)
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
const library=/293 exact local footprints; all (\d+) physical records unchanged/.exec(readFileSync(`${prefix}-library.log`,'utf8'))
assert(library);assert.equal(Number(library[1]),13809)
const cke=planar.results.find(r=>r.name==='DDR_CKE'),negative=planar.results.find(r=>r.name==='DDR_DQSn1'),positive=planar.results.find(r=>r.name==='DDR_DQS1')
assert.equal(cke.physicalVias,4);assert.equal(negative.physicalVias,4);assert.equal(positive.physicalVias,4)
assert.equal(cke.planarLengthMm,prior.ckePlanarMm);assert(cke.planarLengthMm>44.29)
assert.equal(source.ddrPowerPlaneRepair.planeCopperClearanceMm,.12)
assert(source.ddrPowerPlaneRepair.sourceManufacturingMinimumsUnchanged&&source.ddrPowerPlaneRepair.groundPlaneClearanceUnchanged)
const board=readFileSync(ddr.board.path,'utf8'),planeHeaders=[...board.matchAll(/\(zone\s+\(net "(GND|DDR_1V5)"\)[\s\S]*?\(min_thickness ([\d.]+)\)/g)]
assert.deepEqual(planeHeaders.map(m=>[m[1],Number(m[2])]).sort(),[['DDR_1V5',.25],['GND',.25]])
const summary={status:'DDR26_CKE_AND_SHARED_USBC_COPPER_PLANES_AND_RELATIVE_PLANAR_MATCHING_CHECKED_HOST_INCOMPLETE',
  entry:artifact('experiments/am3352-ddr-usbc-cke-matched.circuit.tsx'),source:source.source,board:ddr.board,paths:source.paths,priorCheckedSummary:source.priorCheckedSummary,
  sourceGeometryAudit:artifact(`${prefix}-source-validation.json`),nativeDdrAudit:artifact(`${prefix}-native-ddr-connectivity.json`),planarDdrAudit:artifact(`${prefix}-ddr-connectivity.json`),
  nativeUsbAudit:artifact(`${prefix}-native-usb-connectivity.json`),ramReferenceAudit:artifact(`${prefix}-reference-connectivity.json`),nativeDrc:artifact(`${prefix}-kicad-drc.json`),gerberShortsAudit:artifact(`${prefix}-shorts.log`),libraryAudit:artifact(`${prefix}-library.log`),
  routingProvenance:source.provenance,manualStrobeRepairRun:provenance.repairRun,nativeChannelRun:prior.nativeChannelRun,manualRamTailRun:prior.manualRamTailRun,
  components:212,actualPads:912,copperLayers:4,tracePieces:128,throughVias:143,preservedThroughVias:143,newVias:0,
  connectedDdrSignals:26,requiredDdrSignals:49,remainingDdrSignalNames:ddr.results.filter(r=>!r.connected).map(r=>r.name).sort(),
  changedSignals:source.changedSignals,ddrTiming:planar.timing,minimumHoleEdgeGapMm:source.minimumHoleEdgeGapMm,
  ckeConnected:true,ckePlanarMm:cke.planarLengthMm,ckeThroughVias:4,ckeNominalRangeMm:prior.ckeNominalRangeMm,ckeNominalLengthPass:false,clockNominalLengthPass:false,
  negativeStrobePlanarMm:negative.planarLengthMm,positiveStrobePlanarMm:positive.planarLengthMm,negativeStrobeThroughVias:4,positiveStrobeThroughVias:4,
  bothCableOrientationsDataConnected:true,chargingAndDataShareOneSocket:true,usbNumericPadNetAssignmentsVerified:38,usbConnectedPadChecks:40,
  ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,retainedDdrPowerPlaneRepair:{...source.ddrPowerPlaneRepair,independentFilledReferenceConnectivityPass:true},
  gerberShortsAllLayers:0,independentPhysicalViolationsAllSeverities:0,presentationWarnings:drc.violations.length,hostUnconnectedItemsReported:drc.unconnected_items.length,ignoredNativeChecks:drc.ignored_checks,
  physicalLibraryRecordsPreserved:Number(library[1]),nativeBusLanesBootstrap:true,manualLocalRepairs:true,bothBytePlanarTimingPass:true,allThreeDifferentialPairPlanarTimingPass:true,
  topSnapshot:{...artifact('images/am3352-ddr-usbc-cke-matched-top.png'),visuallyInspected:true},bottomSnapshot:{...artifact('images/am3352-ddr-usbc-cke-matched-bottom.png'),visuallyInspected:true},
  cliPackageVersion:read('node_modules/@tscircuit/cli/package.json').version,tscircuitVersion:read('node_modules/tscircuit/package.json').version,
  fullElectricalTimingQualified:false,controlledImpedanceQualified:false,completePowerRouting:false,linuxInstallerTested:false,originalShellFitVerified:false,fabricationReady:false,
  scope:'One four-layer DDR26/shared-USB-C source retains the native bus_lanes CKE channel, repaired RAM tails and connected power planes. Two negative-strobe wire shortcuts restore relative planar matching without moving any hole or other record. Exact DDR/USB endpoints, RAM supply/ground/bypass continuity, physical DRC and all-layer shorts pass. The other 23 address/control channels, TI placement nominal CKE/clock lengths, electrical timing/impedance, complete powered host/Linux and measured original G350 shell remain required.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,connected:26,open:23,shorts:0,physicalViolations:0,bothBytesPlanarPass:true,allThreePairsPlanarPass:true,strobeSkewMm:negative.planarLengthMm-positive.planarLengthMm,fabricationReady:false}))
