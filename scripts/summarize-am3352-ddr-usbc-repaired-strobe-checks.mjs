import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-ddr-usbc-repaired-strobes'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const source=read(`${prefix}-source-validation.json`),planar=read(`${prefix}-ddr-connectivity.json`)
const ddr=read(`${prefix}-native-ddr-connectivity.json`),usb=read(`${prefix}-native-usb-connectivity.json`)
const refs=read(`${prefix}-reference-connectivity.json`),drc=read(`${prefix}-kicad-drc.json`)
const clockSummaryPath='checks/integrated/am3352-ddr-usbc-native-clock-check-summary.json',clock=read(clockSummaryPath)
for(const a of [source.source,source.previousSource,source.paths,source.provenance,clock.source,clock.board])checked(a)
assert.deepEqual(source.previousSource,clock.source)
for(const a of [ddr.circuit,usb.circuit,refs.source]){checked(a);assert.deepEqual(a,source.source)}
for(const a of [ddr.board,usb.board,refs.board]){checked(a);assert.deepEqual(a,ddr.board)}
assert.equal(planar.circuitSha256,source.source.sha256)
assert.equal(source.components,212);assert.equal(source.actualPads,912);assert.equal(source.copperLayers,4)
assert.equal(source.tracePieces,127);assert.equal(source.throughVias,135)
assert.equal(source.preservedTracePieces,125);assert.equal(source.preservedThroughVias,129)
assert.deepEqual(new Set(source.addedSignals),new Set(['DDR_DQS1','DDR_DQSn1']))
const provenance=read(source.provenance.path)
for(const a of [provenance.ramTailRun,provenance.ramTails,provenance.nativeBootstrap,provenance.priorJoinedPaths,provenance.priorJoinedProvenance])checked(a)
for(const k of ['source','paths','checkedSummary','sections'])checked(provenance.checkedCpuChannelReuse[k])
for(const k of ['bootstrap','escapes'])checked(provenance.manualRamEscape[k])
const ram=read(provenance.ramTailRun.path)
assert.equal(ram.status,'RAM_FANOUTS_REACHED_CHECKED_CPU_CHANNEL_HANDOFFS')
assert(ram.firstPackageOnly);assert.deepEqual(ram.source,clock.source)
assert.equal(ram.actualPadObstacles,912);assert.equal(ram.sourceTracesRetained,125)
assert.equal(ram.localEscapes.length,2);assert(ram.localEscapes.every(r=>!r.error&&r.package==='U_RAM'))
assert.equal(provenance.manualRamEscape.preflight.status,'MANUAL_RAM_ESCAPE_PREFLIGHT_PASS_PENDING_EXACT_REPLAY_DRC')
assert.equal(provenance.manualRamEscape.nativeGenerated,false)
const prior=read(provenance.priorJoinedPaths.path),paths=read(source.paths.path),repair=provenance.manualChannelShortening
const [a,b]=repair.originalIndices
assert.deepEqual(paths.DDR_DQS1,[...prior.DDR_DQS1.slice(0,a+1),...prior.DDR_DQS1.slice(b)])
for(const name of Object.keys(paths).filter(n=>n!=='DDR_DQS1'))assert.deepEqual(paths[name],prior[name])
assert.equal(repair.newHoles,0);assert(repair.pairSkewMm<=.127);assert(repair.wholeBytePlanarSkewMm<=.635+1e-8)
const expected=new Set(read(clock.nativeDdrAudit.path).results.filter(r=>r.connected).map(r=>r.name))
expected.add('DDR_DQS1');expected.add('DDR_DQSn1');assert.equal(expected.size,25)
for(const r of [planar,ddr]){
  assert.equal(r.requiredSignals,49);assert.equal(r.connectedSignals,25)
  assert.deepEqual(new Set(r.results.filter(r=>r.connected).map(r=>r.name)),expected)
}
assert.deepEqual(ddr.connectionMap,planar.connectionMap);checked(ddr.connectionMap)
assert.equal(planar.status,'AM3352_MEMORY_FAIL')
for(const name of ['DDR_BYTE0','DDR_BYTE1','DDR_DQS0_PAIR','DDR_DQS1_PAIR','DDR_CK_PAIR'])assert(planar.timing.find(t=>t.name===name).pass)
assert(!planar.timing.find(t=>t.name==='DDR_COMMAND_CLOCK').pass)
assert.equal(planar.problems.length,25)
assert(planar.problems.every(p=>p.startsWith('Unconnected memory signal: ')||p==='Incomplete or unmatched planar timing group: DDR_COMMAND_CLOCK'))
assert.equal(usb.numericPadNetAssignmentsVerified,38);assert.equal(usb.connectivityRecords.length,40)
assert(usb.connectivityRecords.every(r=>r.connected||r.connectedToFilledPlane))
for(const k of ['bothCableOrientationsDataConnected','ccRdReturnsConnected','localVbusAndEsdBypassConnected',
  'vbusPmicFeedConnected','vbusSenseRouted','pmicInputBypassConnected','senseFilterClampAndGroundConnected'])assert(usb[k])
assert.equal(refs.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(refs.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(refs.ramBypassTerminalsConnectedToPlanes,28);assert(refs.records.every(r=>r.connected)&&refs.bypassRecords.every(r=>r.connected))
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)).length,0)
assert.equal(drc.violations.length,418);assert(drc.violations.every(v=>v.severity==='warning'))
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
const library=/293 exact local footprints; all (\d+) physical records unchanged/.exec(readFileSync(`${prefix}-library.log`,'utf8'))
assert(library);assert.equal(Number(library[1]),13831)
assert(readFileSync(`${prefix}-fabrication-guard.log`,'utf8').includes('Fabrication export blocked: integrated handheld routing, original G350 shell fit and release checks remain incomplete'))
const summary={status:'DDR25_AND_SHARED_USBC_COPPER_AND_PLANAR_MATCHING_CHECKED_HOST_INCOMPLETE',
  source:source.source,board:ddr.board,paths:source.paths,priorCheckedClockSummary:artifact(clockSummaryPath),
  sourceGeometryAudit:artifact(`${prefix}-source-validation.json`),nativeDdrAudit:artifact(`${prefix}-native-ddr-connectivity.json`),
  planarDdrAudit:artifact(`${prefix}-ddr-connectivity.json`),nativeUsbAudit:artifact(`${prefix}-native-usb-connectivity.json`),
  ramReferenceAudit:artifact(`${prefix}-reference-connectivity.json`),nativeDrc:artifact(`${prefix}-kicad-drc.json`),
  gerberShortsAudit:artifact(`${prefix}-shorts.log`),ramRepairRun:provenance.ramTailRun,manualChannelShortening:repair,
  fabricationGuard:artifact(`${prefix}-fabrication-guard.log`),fabricationGuardStatus:'EXPECTED_BLOCK_BEFORE_ORDERING_FILES',
  cliPackageVersion:read('node_modules/@tscircuit/cli/package.json').version,
  tscircuitVersion:read('node_modules/tscircuit/package.json').version,
  components:212,copperLayers:4,actualPads:912,tracePieces:127,throughVias:135,
  connectedDdrSignals:25,requiredDdrSignals:49,remainingDdrSignalNames:ddr.results.filter(r=>!r.connected).map(r=>r.name).sort(),
  addedStrobeSignals:2,addedThroughVias:6,preservedTracePieces:125,preservedThroughVias:129,
  strobeLengths:source.lengths,strobePlanarSkewMm:source.skewMm,strobePlanarLimitMm:.127,ddrTiming:planar.timing,
  minimumHoleEdgeGapMm:source.minimumHoleEdgeGapMm,
  bothCableOrientationsDataConnected:true,chargingAndDataShareOneSocket:true,usbNumericPadNetAssignmentsVerified:38,
  usbConnectedPadChecks:40,ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
  gerberShortsAllLayers:0,independentPhysicalViolationsAllSeverities:0,presentationWarnings:drc.violations.length,
  hostUnconnectedItemsReported:drc.unconnected_items.length,ignoredNativeChecks:drc.ignored_checks,
  physicalLibraryRecordsPreserved:Number(library[1]),nativeBusLanesBootstrap:true,checkedCpuChannelReuse:true,manualRamEscapes:true,
  topSnapshot:{...artifact('images/am3352-ddr-usbc-repaired-strobes-top.png'),visuallyInspected:true},
  bottomSnapshot:{...artifact('images/am3352-ddr-usbc-repaired-strobes-bottom.png'),visuallyInspected:true},
  bothBytePlanarTimingPass:true,allThreeDifferentialPairPlanarTimingPass:true,
  fullElectricalTimingQualified:false,controlledImpedanceQualified:false,completePowerRouting:false,
  linuxInstallerTested:false,originalShellFitVerified:false,fabricationReady:false,
  scope:'One source contains both DDR byte lanes, reset and clock with shared USB-C preserved. Native bus_lanes supplies the clock and original byte bootstrap; checked CPU/channel sections are reused with guarded manual RAM escapes and a shortened positive strobe turn. All available planar matching groups pass. Unequal strobe via counts, package delays, coupling and real stackup remain unqualified. The 24 address/control signals, complete host, Linux and measured original shell remain unfinished.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,connected:25,open:24,strobeSkewMm:source.skewMm,shorts:0,physicalViolations:0,fabricationReady:false}))
