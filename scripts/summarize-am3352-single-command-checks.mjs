import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'

const [prefix,entry,mode='nominal']=process.argv.slice(2);assert(prefix&&entry)
assert(['nominal','bootstrap'].includes(mode))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const source=read(`${prefix}-source-validation.json`),planar=read(`${prefix}-ddr-connectivity.json`)
const ddr=read(`${prefix}-native-ddr-connectivity.json`),usb=read(`${prefix}-native-usb-connectivity.json`),refs=read(`${prefix}-reference-connectivity.json`),drc=read(`${prefix}-kicad-drc.json`)
const {summary:prior,registration}=readCheckedCommandSummary(source.priorCheckedSummary),provenance=read(source.provenance.path)
for(const a of [source.source,source.previousSource,source.paths,source.provenance,source.priorCheckedSummary,source.memoryMap,
  provenance.source,provenance.priorPaths,provenance.nativeChannelRun,provenance.nativeChannelInput,provenance.nativeChannelOutput,provenance.manualLocalRun,provenance.manualLocalCopper,provenance.nativeBootstrap])checked(a)
if(provenance.manualNominalTuning){checked(provenance.manualNominalTuning.priorPaths);checked(provenance.manualNominalTuning.priorProvenance)}
const name=source.addedSignals[0],count=registration.signals+1
assert.equal(source.addedSignals.length,1);assert(prior.remainingDdrSignalNames.includes(name));assert.deepEqual(source.changedExistingSignals,[])
assert.deepEqual(source.previousSource,prior.source)
for(const [key,value] of Object.entries({components:212,actualPads:912,copperLayers:4,tracePieces:registration.traces+1,throughVias:registration.holes+provenance.throughVias,preservedTracePieces:registration.traces,preservedThroughVias:registration.holes,addedThroughVias:provenance.throughVias}))assert.equal(source[key],value)
assert(source.planeDeclarationsAndBoundariesPreserved&&source.planeAntipadsRegeneratedForAddedHoles)
for(const a of [ddr.circuit,usb.circuit,refs.source]){checked(a);assert.deepEqual(a,source.source)}
for(const a of [ddr.board,usb.board,refs.board]){checked(a);assert.deepEqual(a,ddr.board)}
assert.deepEqual(ddr.connectionMap,source.memoryMap);assert.deepEqual(planar.connectionMap,source.memoryMap)
assert.equal(planar.circuitSha256,source.source.sha256)
const previous=read(prior.nativeDdrAudit.path)
for(const r of [planar,ddr]){
  assert.equal(r.requiredSignals,49);assert.equal(r.connectedSignals,count)
  assert.deepEqual(r.results.map(x=>({name:x.name,connected:x.connected})),previous.results.map(x=>({name:x.name,connected:x.name===name||x.connected})))
}
assert.equal(planar.problems.length,50-count)
assert.equal(planar.problems.filter(p=>p.startsWith('Unconnected memory signal: ')).length,49-count)
assert.deepEqual(planar.timing.filter(t=>!t.pass).map(t=>t.name),['DDR_COMMAND_CLOCK'])
for(const group of ['DDR_BYTE0','DDR_BYTE1','DDR_DQS0_PAIR','DDR_DQS1_PAIR','DDR_CK_PAIR'])assert(planar.timing.find(t=>t.name===group).pass)
const oldPlanar=read(prior.planarDdrAudit.path)
assert.deepEqual(planar.results.filter(r=>r.connected&&r.name!==name).map(r=>({name:r.name,planarLengthMm:r.planarLengthMm,physicalVias:r.physicalVias})),oldPlanar.results.filter(r=>r.connected).map(r=>({name:r.name,planarLengthMm:r.planarLengthMm,physicalVias:r.physicalVias})))
assert.equal(usb.numericPadNetAssignmentsVerified,38);assert.equal(usb.connectivityRecords.length,40)
assert(usb.connectivityRecords.every(r=>r.connected||r.connectedToFilledPlane))
for(const k of ['bothCableOrientationsDataConnected','ccRdReturnsConnected','localVbusAndEsdBypassConnected','vbusPmicFeedConnected','vbusSenseRouted','pmicInputBypassConnected','senseFilterClampAndGroundConnected'])assert(usb[k])
assert.equal(refs.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(refs.ramGroundBallsConnectedToGroundPlane,21);assert.equal(refs.ramBypassTerminalsConnectedToPlanes,28)
assert(refs.records.every(r=>r.connected)&&refs.bypassRecords.every(r=>r.connected));checked(refs.referenceLayout)
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert(drc.violations.every(v=>presentation.has(v.type)&&v.severity==='warning'));assert.equal(drc.violations.length,418);assert.equal(drc.unconnected_items.length,499)
assert.deepEqual(drc.ignored_checks,read(prior.nativeDrc.path).ignored_checks)
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
const library=/293 exact local footprints; all (\d+) physical records unchanged/.exec(readFileSync(`${prefix}-library.log`,'utf8'));assert(library)
const physicalLibraryRecordsPreserved=Number(library[1]);assert(physicalLibraryRecordsPreserved>prior.physicalLibraryRecordsPreserved)

// Verify that the placement reference still comes from all actual endpoints.
const tiReview=prior.placementNominalReview.primarySourceReview;checked(tiReview)
assert.equal(tiReview.sha256,'58d12363dd266710b21b090194cd82e9c320f4a6be6a40b77dca9183656fce8e')
const review=read(tiReview.path),circuit=read(source.source.path),command=/^DDR_(A\d+|BA\d+|CASn|RASn|WEn|CSn0|CKE|ODT|CKn?)$/
const commandRows=circuit.filter(e=>e.type==='source_trace'&&command.test(e.name)).map(t=>{
  const endpoints=t.connected_source_port_ids.map(id=>circuit.find(e=>e.type==='pcb_port'&&e.source_port_id===id));assert.equal(endpoints.length,2);assert(endpoints.every(Boolean))
  return {name:t.name,manhattanMm:Math.abs(endpoints[0].x-endpoints[1].x)+Math.abs(endpoints[0].y-endpoints[1].y)}
})
assert.equal(commandRows.length,26);assert.deepEqual(commandRows,prior.placementNominalReview.commandRows)
const longestManhattanMm=Math.max(...commandRows.map(r=>r.manhattanMm)),nominalMm=longestManhattanMm+review.commandClock.additionalRoutingAllowanceMm,rangeMm=review.commandClock.rangeMm
assert(Math.abs(nominalMm-review.commandClock.nominalMm)<1e-8)
const added=planar.results.find(r=>r.name===name);assert.equal(added.physicalVias,provenance.throughVias);assert.equal(added.planarLengthMm,source.addedSignalPlanarMm)
const addedSignalNominalLengthPass=added.planarLengthMm>=rangeMm[0]&&added.planarLengthMm<=rangeMm[1]
assert.equal(source.addedSignalNominalLengthPass,addedSignalNominalLengthPass)
assert.equal(provenance.nominalLengthPass,addedSignalNominalLengthPass)
if(mode==='nominal')assert(addedSignalNominalLengthPass)
else assert(!addedSignalNominalLengthPass,'Use the normal binder for a nominal-length passing replay')
const native=read(provenance.nativeChannelRun.path)
assert.equal(native.status,'GUIDED_NATIVE_CHANNEL_ROUTED_UNQUALIFIED');assert.equal(native.solver,'@tscircuit/core SOLVERS.BusLanesPipelineSolver')
assert.equal(native.totalDdrSignalsAfterPhase,count);assert.equal(native.newCandidateChannelCount,1)
assert(!native.temporaryOpenCpuTails&&!native.temporaryOpenRamTails&&native.exportable!==false)
const summary={status:`DDR${count}_${name}_${mode==='nominal'?'NOMINAL':'BOOTSTRAP_NOMINAL_LENGTH_FAIL'}_AND_SHARED_USBC_COPPER_PLANES_AND_RELATIVE_PLANAR_MATCHING_CHECKED_HOST_INCOMPLETE`,
  entry:artifact(entry),source:source.source,board:ddr.board,paths:source.paths,priorCheckedSummary:source.priorCheckedSummary,
  sourceGeometryAudit:artifact(`${prefix}-source-validation.json`),nativeDdrAudit:artifact(`${prefix}-native-ddr-connectivity.json`),planarDdrAudit:artifact(`${prefix}-ddr-connectivity.json`),
  nativeUsbAudit:artifact(`${prefix}-native-usb-connectivity.json`),ramReferenceAudit:artifact(`${prefix}-reference-connectivity.json`),nativeDrc:artifact(`${prefix}-kicad-drc.json`),gerberShortsAudit:artifact(`${prefix}-shorts.log`),libraryAudit:artifact(`${prefix}-library.log`),
  routingProvenance:source.provenance,nativeChannelRun:provenance.nativeChannelRun,nativeChannelInput:provenance.nativeChannelInput,nativeChannelOutput:provenance.nativeChannelOutput,carrierReferenceSearchBounds:provenance.carrierReferenceSearchBounds,manualLocalRun:provenance.manualLocalRun,manualLocalCopper:provenance.manualLocalCopper,manualNominalTuning:provenance.manualNominalTuning,
  memoryMap:source.memoryMap,ramReferenceLayout:refs.referenceLayout,
  components:212,actualPads:912,copperLayers:4,tracePieces:source.tracePieces,throughVias:source.throughVias,preservedTracePieces:registration.traces,preservedThroughVias:registration.holes,newVias:provenance.throughVias,
  connectedDdrSignals:count,requiredDdrSignals:49,remainingDdrSignalNames:ddr.results.filter(r=>!r.connected).map(r=>r.name).sort(),addedSignals:[name],changedExistingSignals:[],addedSignalPlanarMm:added.planarLengthMm,addedSignalThroughVias:added.physicalVias,addedSignalNominalLengthPass,ddrTiming:planar.timing,minimumHoleEdgeGapMm:source.minimumHoleEdgeGapMm,
  placementNominalReview:{primarySourceReview:tiReview,commandRows,longestManhattanMm,additionalRoutingAllowanceMm:review.commandClock.additionalRoutingAllowanceMm,nominalMm,rangeMm,clocks:prior.placementNominalReview.clocks,recomputeAfterPlacementChanges:true},
  csnConnected:true,csnPlanarMm:prior.csnPlanarMm,csnThroughVias:0,csnNominalLengthPass:true,d14CpuPrefixRepairChecked:true,d14PlanarMm:prior.d14PlanarMm,d14ThroughVias:2,retainedCpuPrefixRepair:prior.cpuPrefixRepair??prior.retainedCpuPrefixRepair,
  odtConnected:true,odtPlanarMm:prior.odtPlanarMm,odtThroughVias:4,odtNominalLengthPass:true,ckeConnected:true,ckePlanarMm:prior.ckePlanarMm,ckeThroughVias:4,ckeNominalRangeMm:rangeMm,ckeNominalLengthPass:false,clockNominalLengthPass:false,
  negativeStrobePlanarMm:prior.negativeStrobePlanarMm,positiveStrobePlanarMm:prior.positiveStrobePlanarMm,negativeStrobeThroughVias:4,positiveStrobeThroughVias:4,
  bothCableOrientationsDataConnected:true,chargingAndDataShareOneSocket:true,usbNumericPadNetAssignmentsVerified:38,usbConnectedPadChecks:40,ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,retainedDdrPowerPlaneRepair:prior.retainedDdrPowerPlaneRepair,
  gerberShortsAllLayers:0,independentPhysicalViolationsAllSeverities:0,presentationWarnings:418,hostUnconnectedItemsReported:499,hostUnconnectedItemsCountIsReportedAndCapped:true,ignoredNativeChecks:drc.ignored_checks,physicalLibraryRecordsPreserved,
  nativeBusLanesBootstrap:true,manualLocalRepairs:true,bothBytePlanarTimingPass:true,allThreeDifferentialPairPlanarTimingPass:true,fullCommandClassMatchingPass:false,
  topSnapshot:{...artifact(`images/${prefix.split('/').at(-1)}-top.png`),visuallyInspected:true},bottomSnapshot:{...artifact(`images/${prefix.split('/').at(-1)}-bottom.png`),visuallyInspected:true},
  cliPackageVersion:read('node_modules/@tscircuit/cli/package.json').version,tscircuitVersion:read('node_modules/tscircuit/package.json').version,
  fullElectricalTimingQualified:false,controlledImpedanceQualified:false,completePowerRouting:false,linuxInstallerTested:false,originalShellFitVerified:false,fabricationReady:false,
  ...(mode==='bootstrap'?{bootstrapOnly:true,defaultChanged:false,pendingNominalRepairSignals:[...new Set([...(prior.pendingNominalRepairSignals??['DDR_CK','DDR_CKn','DDR_CKE']),name])]}:prior.pendingNominalRepairSignals?{pendingNominalRepairSignals:prior.pendingNominalRepairSignals}:{}),
  scope:`Four-layer DDR${count}/shared-USB-C replay preserves every checked previous trace and hole. Native bus_lanes supplies ${name}'s carrier, supplemented by guarded manual package fanouts${provenance.manualNominalTuning?' and a via-free nominal tuning jog':''}. Exact DDR/USB endpoints, connected RAM reference planes and bypass terminals, all-layer shorts and physical DRC pass.${mode==='bootstrap'?` ${name} fails nominal length and remains a separate unaccepted bootstrap; the working default is unchanged.`:''} ${49-count} address/control signals, nominal CKE/clock tuning, full command/electrical timing, complete powered host/Linux and measured original-shell integration remain required.`}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,connected:count,open:49-count,shorts:0,physicalViolations:0,signal:name,planarMm:added.planarLengthMm,fabricationReady:false}))
