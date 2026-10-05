import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-ddr-usbc-odt-nominal'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const source=read(`${prefix}-source-validation.json`),planar=read(`${prefix}-ddr-connectivity.json`)
const ddr=read(`${prefix}-native-ddr-connectivity.json`),usb=read(`${prefix}-native-usb-connectivity.json`)
const refs=read(`${prefix}-reference-connectivity.json`),drc=read(`${prefix}-kicad-drc.json`)
const prior=read(source.priorCheckedSummary.path),provenance=read(source.provenance.path)
for(const a of [source.source,source.previousSource,source.paths,source.provenance,source.priorCheckedSummary,source.memoryMap,
  provenance.source,provenance.priorPaths,provenance.priorCheckedSummary,provenance.nativeChannelRun,provenance.nativeChannelInput,
  provenance.nativeChannelOutput,provenance.manualLocalRun,provenance.manualLocalCopper,provenance.nativeBootstrap,
  provenance.manualNominalShortcut.run,provenance.manualNominalShortcut.priorPaths])checked(a)
assert.deepEqual(source.previousSource,prior.source)
assert.deepEqual(source.addedSignals,['DDR_ODT']);assert.deepEqual(source.changedExistingSignals,[])
for(const [key,value] of Object.entries({components:212,actualPads:912,copperLayers:4,tracePieces:129,throughVias:147,preservedTracePieces:128,preservedThroughVias:143,addedThroughVias:4}))assert.equal(source[key],value)
assert(source.planeDeclarationsAndBoundariesPreserved&&source.planeAntipadsRegeneratedForAddedHoles)
for(const a of [ddr.circuit,usb.circuit,refs.source]){checked(a);assert.deepEqual(a,source.source)}
for(const a of [ddr.board,usb.board,refs.board]){checked(a);assert.deepEqual(a,ddr.board)}
assert.deepEqual(ddr.connectionMap,source.memoryMap);assert.deepEqual(planar.connectionMap,source.memoryMap)
assert.equal(planar.circuitSha256,source.source.sha256)
checked(prior.nativeDdrAudit)
const previous=read(prior.nativeDdrAudit.path)
for(const r of [planar,ddr]){
  assert.equal(r.requiredSignals,49);assert.equal(r.connectedSignals,27)
  assert.deepEqual(r.results.map(x=>({name:x.name,connected:x.connected})),previous.results.map(x=>({name:x.name,connected:x.name==='DDR_ODT'||x.connected})))
}
assert.equal(planar.problems.length,23)
assert.equal(planar.problems.filter(p=>p.startsWith('Unconnected memory signal: ')).length,22)
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
assert(library);assert.equal(Number(library[1]),14149)

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
assert.equal(odt.physicalVias,4);assert.equal(odt.planarLengthMm,source.odtPlanarMm)
assert(source.odtNominalLengthPass&&odt.planarLengthMm>=rangeMm[0]&&odt.planarLengthMm<=rangeMm[1])
assert.equal(cke.planarLengthMm,prior.ckePlanarMm);assert(cke.planarLengthMm>rangeMm[1])
const clocks=review.commandClock.clocks.map(r=>{
  const now=planar.results.find(p=>p.name===r.name);assert.equal(now.planarLengthMm,r.routedPlanarMm)
  assert(now.planarLengthMm<rangeMm[0]);return {name:r.name,planarMm:now.planarLengthMm,nominalLengthPass:false}
})
const native=read(provenance.nativeChannelRun.path)
assert.equal(native.status,'GUIDED_NATIVE_CHANNEL_ROUTED_UNQUALIFIED');assert.equal(native.solver,'@tscircuit/core SOLVERS.BusLanesPipelineSolver')
assert.equal(native.totalDdrSignalsAfterPhase,27);assert.equal(native.newCandidateChannelCount,1)
assert.equal(provenance.manualNominalShortcut.newVias,0)
const vias=circuit.filter(e=>e.type==='pcb_trace'&&circuit.find(s=>s.type==='source_trace'&&s.name==='DDR_ODT').source_trace_id===e.source_trace_id)[0].route.filter(p=>p.route_type==='via')
assert.equal(vias.length,4)
const summary={status:'DDR27_ODT_NOMINAL_AND_SHARED_USBC_COPPER_PLANES_AND_RELATIVE_PLANAR_MATCHING_CHECKED_HOST_INCOMPLETE',
  entry:artifact('experiments/am3352-ddr-usbc-odt-nominal.circuit.tsx'),source:source.source,board:ddr.board,paths:source.paths,priorCheckedSummary:source.priorCheckedSummary,
  sourceGeometryAudit:artifact(`${prefix}-source-validation.json`),nativeDdrAudit:artifact(`${prefix}-native-ddr-connectivity.json`),planarDdrAudit:artifact(`${prefix}-ddr-connectivity.json`),
  nativeUsbAudit:artifact(`${prefix}-native-usb-connectivity.json`),ramReferenceAudit:artifact(`${prefix}-reference-connectivity.json`),nativeDrc:artifact(`${prefix}-kicad-drc.json`),gerberShortsAudit:artifact(`${prefix}-shorts.log`),libraryAudit:artifact(`${prefix}-library.log`),
  routingProvenance:source.provenance,nativeChannelRun:provenance.nativeChannelRun,nativeChannelInput:provenance.nativeChannelInput,nativeChannelOutput:provenance.nativeChannelOutput,
  manualLocalRun:provenance.manualLocalRun,manualLocalCopper:provenance.manualLocalCopper,manualNominalShortcutRun:provenance.manualNominalShortcut.run,
  memoryMap:source.memoryMap,ramReferenceLayout:refs.referenceLayout,
  components:212,actualPads:912,copperLayers:4,tracePieces:129,throughVias:147,preservedTracePieces:128,preservedThroughVias:143,newVias:4,
  connectedDdrSignals:27,requiredDdrSignals:49,remainingDdrSignalNames:ddr.results.filter(r=>!r.connected).map(r=>r.name).sort(),
  addedSignals:source.addedSignals,changedExistingSignals:[],ddrTiming:planar.timing,minimumHoleEdgeGapMm:source.minimumHoleEdgeGapMm,
  odtConnected:true,odtPlanarMm:odt.planarLengthMm,odtThroughVias:4,odtAddedViaGeometry:vias,odtNominalLengthPass:true,
  placementNominalReview:{primarySourceReview:tiReview,commandRows,longestManhattanMm,additionalRoutingAllowanceMm:review.commandClock.additionalRoutingAllowanceMm,nominalMm,rangeMm,clocks,recomputeAfterPlacementChanges:true},
  ckeConnected:true,ckePlanarMm:cke.planarLengthMm,ckeThroughVias:4,ckeNominalRangeMm:rangeMm,ckeNominalLengthPass:false,clockNominalLengthPass:false,
  negativeStrobePlanarMm:prior.negativeStrobePlanarMm,positiveStrobePlanarMm:prior.positiveStrobePlanarMm,negativeStrobeThroughVias:4,positiveStrobeThroughVias:4,
  bothCableOrientationsDataConnected:true,chargingAndDataShareOneSocket:true,usbNumericPadNetAssignmentsVerified:38,usbConnectedPadChecks:40,
  ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,retainedDdrPowerPlaneRepair:prior.retainedDdrPowerPlaneRepair,
  gerberShortsAllLayers:0,independentPhysicalViolationsAllSeverities:0,presentationWarnings:418,hostUnconnectedItemsReported:499,hostUnconnectedItemsCountIsReportedAndCapped:true,ignoredNativeChecks:drc.ignored_checks,
  physicalLibraryRecordsPreserved:14149,nativeBusLanesBootstrap:true,manualLocalRepairs:true,bothBytePlanarTimingPass:true,allThreeDifferentialPairPlanarTimingPass:true,fullCommandClassMatchingPass:false,
  topSnapshot:{...artifact('images/am3352-ddr-usbc-odt-nominal-top.png'),visuallyInspected:true},bottomSnapshot:{...artifact('images/am3352-ddr-usbc-odt-nominal-bottom.png'),visuallyInspected:true},
  cliPackageVersion:read('node_modules/@tscircuit/cli/package.json').version,tscircuitVersion:read('node_modules/tscircuit/package.json').version,
  fullElectricalTimingQualified:false,controlledImpedanceQualified:false,completePowerRouting:false,linuxInstallerTested:false,originalShellFitVerified:false,fabricationReady:false,
  scope:'One four-layer DDR27/shared-USB-C source retains every prior trace and hole, adds a native bus_lanes ODT channel with guarded manual package fanouts, then shortens only a via-free top wire section to the current placement-derived nominal range. Exact DDR/USB endpoints, RAM supply/ground/bypass continuity, physical DRC and all-layer shorts pass. The other 22 address/control channels, TI placement nominal CKE/clock lengths, full command matching, electrical timing/impedance, complete powered host/Linux and measured original G350 shell remain required.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,connected:27,open:22,shorts:0,physicalViolations:0,odtPlanarMm:odt.planarLengthMm,odtNominalLengthPass:true,fabricationReady:false}))
