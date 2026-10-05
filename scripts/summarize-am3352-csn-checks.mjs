import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-ddr-usbc-csn-joint'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const source=read(`${prefix}-source-validation.json`),planar=read(`${prefix}-ddr-connectivity.json`)
const ddr=read(`${prefix}-native-ddr-connectivity.json`),usb=read(`${prefix}-native-usb-connectivity.json`)
const refs=read(`${prefix}-reference-connectivity.json`),drc=read(`${prefix}-kicad-drc.json`)
const prior=read(source.priorCheckedSummary.path),provenance=read(source.provenance.path)
for(const a of [source.source,source.previousSource,source.paths,source.provenance,source.priorCheckedSummary,source.memoryMap,
  provenance.source,provenance.priorPaths,provenance.priorCheckedSummary,provenance.nativeChannelRun,provenance.nativeChannelInput,
  provenance.nativeChannelOutput,provenance.manualLocalRun,provenance.manualLocalCopper,provenance.nativeBootstrap,
  provenance.cpuPrefixRepair.manualRun,provenance.cpuPrefixRepair.manualCopper,provenance.cpuPrefixRepair.preparation,provenance.cpuPrefixRepair.originalTails])checked(a)
assert.deepEqual(source.previousSource,prior.source)
assert.deepEqual(source.addedSignals,['DDR_CSn0']);assert.deepEqual(source.changedExistingSignals,['DDR_D14'])
assert(source.restoredD10Unchanged&&source.originalD14RamAndChannelTailPreserved)
for(const [key,value] of Object.entries({components:212,actualPads:912,copperLayers:4,tracePieces:130,throughVias:149,preservedTracePieces:128,preservedThroughVias:147,addedThroughVias:2}))assert.equal(source[key],value)
assert(source.planeDeclarationsAndBoundariesPreserved&&source.planeAntipadsRegeneratedForAddedHoles)
for(const a of [ddr.circuit,usb.circuit,refs.source]){checked(a);assert.deepEqual(a,source.source)}
for(const a of [ddr.board,usb.board,refs.board]){checked(a);assert.deepEqual(a,ddr.board)}
assert.deepEqual(ddr.connectionMap,source.memoryMap);assert.deepEqual(planar.connectionMap,source.memoryMap)
assert.equal(planar.circuitSha256,source.source.sha256)
checked(prior.nativeDdrAudit)
const previous=read(prior.nativeDdrAudit.path)
for(const r of [planar,ddr]){
  assert.equal(r.requiredSignals,49);assert.equal(r.connectedSignals,28)
  assert.deepEqual(r.results.map(x=>({name:x.name,connected:x.connected})),previous.results.map(x=>({name:x.name,connected:x.name==='DDR_CSn0'||x.connected})))
}
assert.equal(planar.problems.length,22)
assert.equal(planar.problems.filter(p=>p.startsWith('Unconnected memory signal: ')).length,21)
assert.deepEqual(planar.timing.filter(t=>!t.pass).map(t=>t.name),['DDR_COMMAND_CLOCK'])
for(const name of ['DDR_BYTE0','DDR_BYTE1','DDR_DQS0_PAIR','DDR_DQS1_PAIR','DDR_CK_PAIR'])assert(planar.timing.find(t=>t.name===name).pass)
assert.equal(usb.numericPadNetAssignmentsVerified,38);assert.equal(usb.connectivityRecords.length,40)
assert(usb.connectivityRecords.every(r=>r.connected||r.connectedToFilledPlane))
for(const k of ['bothCableOrientationsDataConnected','ccRdReturnsConnected','localVbusAndEsdBypassConnected','vbusPmicFeedConnected','vbusSenseRouted','pmicInputBypassConnected','senseFilterClampAndGroundConnected'])assert(usb[k])
assert.equal(refs.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(refs.ramGroundBallsConnectedToGroundPlane,21);assert.equal(refs.ramBypassTerminalsConnectedToPlanes,28)
assert(refs.records.every(r=>r.connected)&&refs.bypassRecords.every(r=>r.connected))
checked(refs.referenceLayout)
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert(drc.violations.every(v=>presentation.has(v.type)&&v.severity==='warning'))
assert.equal(drc.violations.length,418);assert.equal(drc.unconnected_items.length,499)
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
const library=/293 exact local footprints; all (\d+) physical records unchanged/.exec(readFileSync(`${prefix}-library.log`,'utf8'))
assert(library);assert.equal(Number(library[1]),14573)

// Recompute the placement reference from all 26 actual command/clock endpoint
// pairs. The earlier primary-source review supplies the allowance and tolerance,
// not geometry or electrical qualification for this newer replay.
const tiReview=artifact('checks/integrated/am3352-ddr25-ti-nominal-length-review.json')
assert.equal(tiReview.sha256,'58d12363dd266710b21b090194cd82e9c320f4a6be6a40b77dca9183656fce8e')
const review=read(tiReview.path),circuit=read(source.source.path),command=/^DDR_(A\d+|BA\d+|CASn|RASn|WEn|CSn0|CKE|ODT|CKn?)$/
const commandRows=circuit.filter(e=>e.type==='source_trace'&&command.test(e.name)).map(t=>{
  const endpoints=t.connected_source_port_ids.map(id=>circuit.find(e=>e.type==='pcb_port'&&e.source_port_id===id))
  assert.equal(endpoints.length,2);assert(endpoints.every(Boolean))
  return {name:t.name,manhattanMm:Math.abs(endpoints[0].x-endpoints[1].x)+Math.abs(endpoints[0].y-endpoints[1].y)}
})
assert.equal(commandRows.length,26)
const longestManhattanMm=Math.max(...commandRows.map(r=>r.manhattanMm)),nominalMm=longestManhattanMm+review.commandClock.additionalRoutingAllowanceMm
assert(Math.abs(longestManhattanMm-review.commandClock.longestManhattanMm)<1e-8)
assert(Math.abs(nominalMm-review.commandClock.nominalMm)<1e-8)
const rangeMm=review.commandClock.rangeMm,odt=planar.results.find(r=>r.name==='DDR_ODT'),cke=planar.results.find(r=>r.name==='DDR_CKE')
assert.equal(odt.physicalVias,4);assert.equal(odt.planarLengthMm,prior.odtPlanarMm)
assert(prior.odtNominalLengthPass&&odt.planarLengthMm>=rangeMm[0]&&odt.planarLengthMm<=rangeMm[1])
assert.equal(cke.planarLengthMm,prior.ckePlanarMm);assert(cke.planarLengthMm>rangeMm[1])
const clocks=review.commandClock.clocks.map(r=>{
  const now=planar.results.find(p=>p.name===r.name);assert.equal(now.planarLengthMm,r.routedPlanarMm)
  assert(now.planarLengthMm<rangeMm[0]);return {name:r.name,planarMm:now.planarLengthMm,nominalLengthPass:false}
})
const native=read(provenance.nativeChannelRun.path)
assert.equal(native.status,'GUIDED_NATIVE_CHANNEL_ROUTED_UNQUALIFIED');assert.equal(native.solver,'@tscircuit/core SOLVERS.BusLanesPipelineSolver')
assert.equal(native.totalDdrSignalsAfterPhase,26);assert.equal(native.newCandidateChannelCount,1);assert.equal(native.exportable,false)
assert.equal(provenance.newPhysicalVias,2);assert.equal(provenance.throughVias,0)
const csn=planar.results.find(r=>r.name==='DDR_CSn0'),d14=planar.results.find(r=>r.name==='DDR_D14')
assert.equal(csn.physicalVias,0);assert.equal(csn.planarLengthMm,source.csnPlanarMm)
assert(source.csnNominalLengthPass&&csn.planarLengthMm>=rangeMm[0]&&csn.planarLengthMm<=rangeMm[1])
assert.equal(d14.physicalVias,2);assert.equal(d14.planarLengthMm,source.d14PlanarMm)
assert.equal(provenance.cpuPrefixRepair.newPhysicalVias,2)
assert.deepEqual(planar.results.filter(r=>r.connected&&r.name!=='DDR_D14'&&r.name!=='DDR_CSn0').map(r=>({name:r.name,planarLengthMm:r.planarLengthMm,physicalVias:r.physicalVias})),
 read(prior.planarDdrAudit.path).results.filter(r=>r.connected).filter(r=>r.name!=='DDR_D14').map(r=>({name:r.name,planarLengthMm:r.planarLengthMm,physicalVias:r.physicalVias})))
const vias=circuit.filter(e=>e.type==='pcb_trace'&&circuit.find(s=>s.type==='source_trace'&&s.name==='DDR_ODT').source_trace_id===e.source_trace_id)[0].route.filter(p=>p.route_type==='via')
assert.equal(vias.length,4)
const summary={status:'DDR28_CSN_D14_CPU_REPAIR_AND_SHARED_USBC_COPPER_PLANES_AND_RELATIVE_PLANAR_MATCHING_CHECKED_HOST_INCOMPLETE',
  entry:artifact('experiments/am3352-ddr-usbc-csn-joint.circuit.tsx'),source:source.source,board:ddr.board,paths:source.paths,priorCheckedSummary:source.priorCheckedSummary,
  sourceGeometryAudit:artifact(`${prefix}-source-validation.json`),nativeDdrAudit:artifact(`${prefix}-native-ddr-connectivity.json`),planarDdrAudit:artifact(`${prefix}-ddr-connectivity.json`),
  nativeUsbAudit:artifact(`${prefix}-native-usb-connectivity.json`),ramReferenceAudit:artifact(`${prefix}-reference-connectivity.json`),nativeDrc:artifact(`${prefix}-kicad-drc.json`),gerberShortsAudit:artifact(`${prefix}-shorts.log`),libraryAudit:artifact(`${prefix}-library.log`),
  routingProvenance:source.provenance,nativeChannelRun:provenance.nativeChannelRun,nativeChannelInput:provenance.nativeChannelInput,nativeChannelOutput:provenance.nativeChannelOutput,
  manualLocalRun:provenance.manualLocalRun,manualLocalCopper:provenance.manualLocalCopper,cpuPrefixRepair:provenance.cpuPrefixRepair,
  memoryMap:source.memoryMap,ramReferenceLayout:refs.referenceLayout,
  components:212,actualPads:912,copperLayers:4,tracePieces:130,throughVias:149,preservedTracePieces:128,preservedThroughVias:147,newVias:2,
  connectedDdrSignals:28,requiredDdrSignals:49,remainingDdrSignalNames:ddr.results.filter(r=>!r.connected).map(r=>r.name).sort(),
  addedSignals:source.addedSignals,changedExistingSignals:source.changedExistingSignals,ddrTiming:planar.timing,minimumHoleEdgeGapMm:source.minimumHoleEdgeGapMm,
  csnConnected:true,csnPlanarMm:csn.planarLengthMm,csnThroughVias:0,csnNominalLengthPass:true,
  d14CpuPrefixRepairChecked:true,d14PlanarMm:d14.planarLengthMm,d14ThroughVias:2,newCpuViaGeometry:source.newCpuViaGeometry,restoredD10Unchanged:true,
  odtConnected:true,odtPlanarMm:odt.planarLengthMm,odtThroughVias:4,odtAddedViaGeometry:vias,odtNominalLengthPass:true,
  placementNominalReview:{primarySourceReview:tiReview,commandRows,longestManhattanMm,additionalRoutingAllowanceMm:review.commandClock.additionalRoutingAllowanceMm,nominalMm,rangeMm,clocks,recomputeAfterPlacementChanges:true},
  ckeConnected:true,ckePlanarMm:cke.planarLengthMm,ckeThroughVias:4,ckeNominalRangeMm:rangeMm,ckeNominalLengthPass:false,clockNominalLengthPass:false,
  negativeStrobePlanarMm:prior.negativeStrobePlanarMm,positiveStrobePlanarMm:prior.positiveStrobePlanarMm,negativeStrobeThroughVias:4,positiveStrobeThroughVias:4,
  bothCableOrientationsDataConnected:true,chargingAndDataShareOneSocket:true,usbNumericPadNetAssignmentsVerified:38,usbConnectedPadChecks:40,
  ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,retainedDdrPowerPlaneRepair:prior.retainedDdrPowerPlaneRepair,
  gerberShortsAllLayers:0,independentPhysicalViolationsAllSeverities:0,presentationWarnings:418,hostUnconnectedItemsReported:499,hostUnconnectedItemsCountIsReportedAndCapped:true,ignoredNativeChecks:drc.ignored_checks,
  physicalLibraryRecordsPreserved:14573,nativeBusLanesBootstrap:true,manualLocalRepairs:true,bothBytePlanarTimingPass:true,allThreeDifferentialPairPlanarTimingPass:true,fullCommandClassMatchingPass:false,
  topSnapshot:{...artifact('images/am3352-ddr-usbc-csn-joint-top.png'),visuallyInspected:true},bottomSnapshot:{...artifact('images/am3352-ddr-usbc-csn-joint-bottom.png'),visuallyInspected:true},
  cliPackageVersion:read('node_modules/@tscircuit/cli/package.json').version,tscircuitVersion:read('node_modules/tscircuit/package.json').version,
  fullElectricalTimingQualified:false,controlledImpedanceQualified:false,completePowerRouting:false,linuxInstallerTested:false,originalShellFitVerified:false,fabricationReady:false,
  scope:'One four-layer DDR28/shared-USB-C replay preserves all old holes and all traces except the guarded D14 CPU prefix. Native bus_lanes supplies the CSn0 carrier; manual package escapes and two new D14 CPU vias restore complete byte1 continuity within relative planar limits. CSn0 and retained ODT meet the current placement nominal range. Exact DDR/USB endpoints, RAM supply/ground/bypass continuity and single connected reference planes, physical DRC and all-layer shorts pass. The other 21 address/control signals, nominal CKE/clock tuning, full command matching, package/via timing and impedance, complete host/Linux and measured original shell remain required.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,connected:28,open:21,shorts:0,physicalViolations:0,csnPlanarMm:csn.planarLengthMm,d14PlanarMm:d14.planarLengthMm,fabricationReady:false}))
