import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Bind one full replay. Continuity and manufacturable clearance are distinct
// from timing: this candidate intentionally fails the byte1/strobe audit.
const prefix='checks/integrated/am3352-ddr-usbc-cke-joint-power-plane-bounded'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const source=read(`${prefix}-source-validation.json`),planar=read(`${prefix}-ddr-connectivity.json`)
const ddr=read(`${prefix}-native-ddr-connectivity.json`),usb=read(`${prefix}-native-usb-connectivity.json`)
const refs=read(`${prefix}-reference-connectivity.json`),drc=read(`${prefix}-kicad-drc.json`)
const prior=read(source.priorCheckedSummary.path),provenance=read(source.provenance.path)
for(const a of [source.source,source.previousSource,source.paths,source.provenance,source.priorCheckedSummary,source.ddrPowerPlaneRepair.entry])checked(a)
assert.deepEqual(source.previousSource,prior.source)
assert.deepEqual(source.changedExistingSignals,['DDR_DQSn1','DDR_D1','DDR_D7'])
assert.deepEqual(source.addedSignals,['DDR_CKE'])
assert.equal(source.tracePieces,128);assert.equal(source.throughVias,143)
assert.equal(source.preservedFixedTracePieces,124);assert.equal(source.preservedThroughVias,135);assert.equal(source.addedThroughVias,8)
assert(source.planeDeclarationsAndBoundariesPreserved&&source.ddrPowerPlaneRepair.sourceManufacturingMinimumsUnchanged)
assert(source.ddrPowerPlaneRepair.groundPlaneClearanceUnchanged)
assert.equal(source.ddrPowerPlaneRepair.planeCopperClearanceMm,.12)
assert(source.ddrPowerPlaneRepair.nominalPlaneToOtherNetDrillGapMm>=.2)
for(const a of [ddr.circuit,usb.circuit,refs.source]){checked(a);assert.deepEqual(a,source.source)}
for(const a of [ddr.board,usb.board,refs.board]){checked(a);assert.deepEqual(a,ddr.board)}
assert.equal(planar.circuitSha256,source.source.sha256)
const previous=read(prior.nativeDdrAudit.path)
checked(prior.nativeDdrAudit)
for(const r of [planar,ddr]){
  assert.equal(r.requiredSignals,49);assert.equal(r.connectedSignals,26)
  assert.deepEqual(r.results.map(x=>({name:x.name,connected:x.connected})),previous.results.map(x=>({name:x.name,connected:x.connected||x.name==='DDR_CKE'})))
}
assert.equal(planar.problems.length,26)
assert.equal(planar.problems.filter(p=>p.startsWith('Unconnected memory signal: ')).length,23)
assert.deepEqual(planar.timing.filter(t=>!t.pass).map(t=>t.name),['DDR_BYTE1','DDR_COMMAND_CLOCK','DDR_DQS1_PAIR'])
for(const name of ['DDR_BYTE0','DDR_DQS0_PAIR','DDR_CK_PAIR'])assert(planar.timing.find(t=>t.name===name).pass)
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
assert(library);assert.equal(Number(library[1]),13899)
for(const a of [provenance.ramTailRun,provenance.ramTails,provenance.stagedCkeCopper,provenance.stagedCkeCopper.nativeChannelRun,provenance.nativeBootstrap,provenance.checkedCpuChannelReuse.sections])checked(a)
assert.equal(read(provenance.stagedCkeCopper.nativeChannelRun.path).status,'GUIDED_NATIVE_CHANNEL_ROUTED_UNQUALIFIED')
assert.equal(read(provenance.ramTailRun.path).status,'RAM_FANOUTS_REACHED_CHECKED_CPU_CHANNEL_HANDOFFS')
const cke=planar.results.find(r=>r.name==='DDR_CKE'),negative=planar.results.find(r=>r.name==='DDR_DQSn1'),positive=planar.results.find(r=>r.name==='DDR_DQS1')
assert.equal(cke.physicalVias,4);assert.equal(negative.physicalVias,4);assert.equal(positive.physicalVias,4)
assert.deepEqual(provenance.ckePlacementNominalRangeMm,[41.75,44.29])
assert(cke.planarLengthMm>44.29)
const board=readFileSync(ddr.board.path,'utf8')
const planeHeaders=[...board.matchAll(/\(zone\s+\(net "(GND|DDR_1V5)"\)[\s\S]*?\(min_thickness ([\d.]+)\)/g)]
assert.deepEqual(planeHeaders.map(m=>[m[1],Number(m[2])]).sort(),[['DDR_1V5',.25],['GND',.25]])
const summary={status:'DDR26_CKE_CONTINUITY_POWER_PLANES_AND_CLEARANCE_CHECKED_BYTE1_TIMING_FAILS_HOST_INCOMPLETE',
  source:source.source,board:ddr.board,paths:source.paths,priorCheckedSummary:source.priorCheckedSummary,entry:source.ddrPowerPlaneRepair.entry,
  sourceGeometryAudit:artifact(`${prefix}-source-validation.json`),nativeDdrAudit:artifact(`${prefix}-native-ddr-connectivity.json`),planarDdrAudit:artifact(`${prefix}-ddr-connectivity.json`),
  nativeUsbAudit:artifact(`${prefix}-native-usb-connectivity.json`),ramReferenceAudit:artifact(`${prefix}-reference-connectivity.json`),nativeDrc:artifact(`${prefix}-kicad-drc.json`),gerberShortsAudit:artifact(`${prefix}-shorts.log`),libraryAudit:artifact(`${prefix}-library.log`),
  routingProvenance:source.provenance,nativeChannelRun:provenance.stagedCkeCopper.nativeChannelRun,manualRamTailRun:provenance.ramTailRun,
  components:212,actualPads:912,copperLayers:4,tracePieces:128,throughVias:143,preservedThroughVias:135,addedThroughVias:8,
  connectedDdrSignals:26,requiredDdrSignals:49,remainingDdrSignalNames:ddr.results.filter(r=>!r.connected).map(r=>r.name).sort(),
  changedExistingSignals:source.changedExistingSignals,addedSignals:source.addedSignals,ddrTiming:planar.timing,minimumHoleEdgeGapMm:source.minimumHoleEdgeGapMm,
  ckeConnected:true,newConnectedDdrSignals:1,ckePlanarMm:cke.planarLengthMm,ckeThroughVias:4,ckeNominalRangeMm:provenance.ckePlacementNominalRangeMm,ckeNominalLengthPass:false,
  negativeStrobePlanarMm:negative.planarLengthMm,positiveStrobePlanarMm:positive.planarLengthMm,negativeStrobeThroughVias:4,positiveStrobeThroughVias:4,
  bothCableOrientationsDataConnected:true,chargingAndDataShareOneSocket:true,usbNumericPadNetAssignmentsVerified:38,usbConnectedPadChecks:40,
  ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,ddrPowerPlaneRepair:{...source.ddrPowerPlaneRepair,independentFilledReferenceConnectivityPass:true,nativeZoneMinimumThicknessMm:.25},
  gerberShortsAllLayers:0,independentPhysicalViolationsAllSeverities:0,presentationWarnings:drc.violations.length,hostUnconnectedItemsReported:drc.unconnected_items.length,ignoredNativeChecks:drc.ignored_checks,
  physicalLibraryRecordsPreserved:Number(library[1]),nativeBusLanesBootstrap:true,manualLocalRepairs:true,bothBytePlanarTimingPass:false,allThreeDifferentialPairPlanarTimingPass:false,
  topSnapshot:{...artifact('images/am3352-ddr-usbc-cke-joint-power-plane-bounded-top.png'),visuallyInspected:true},bottomSnapshot:{...artifact('images/am3352-ddr-usbc-cke-joint-power-plane-bounded-bottom.png'),visuallyInspected:true},
  cliPackageVersion:read('node_modules/@tscircuit/cli/package.json').version,tscircuitVersion:read('node_modules/tscircuit/package.json').version,
  defaultChanged:false,fullElectricalTimingQualified:false,controlledImpedanceQualified:false,completePowerRouting:false,linuxInstallerTested:false,originalShellFitVerified:false,fabricationReady:false,
  scope:'Separate DDR26 continuity candidate; default remains checked DDR25. CKE uses a native bus_lanes channel and manually guarded local fanouts. Three RAM tails are rebuilt, preserving all prior holes and other copper. A bounded DDR power-pour clearance repair restores the RAM supply plane without changing source manufacturing minimums or outer plane boundaries. Physical DRC, shorts, exact DDR/USB endpoints and RAM supply/ground/bypass continuity pass. Whole-byte1 and DQS1 planar matching fail; CKE is longer than the current TI placement nominal range. All 23 other address/control channels, nominal clock tuning, electrical timing, host/Linux and measured original-shell geometry remain required.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,connected:26,open:23,shorts:0,physicalViolations:0,ramReferences:[18,21,28],byte1TimingPass:false,fabricationReady:false}))
