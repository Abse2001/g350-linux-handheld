import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-ddr-usbc-clock-strobes-unmatched'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const source=read(`${prefix}-source-validation.json`),planar=read(`${prefix}-ddr-connectivity.json`)
const ddr=read(`${prefix}-native-ddr-connectivity.json`),usb=read(`${prefix}-native-usb-connectivity.json`)
const refs=read(`${prefix}-reference-connectivity.json`),drc=read(`${prefix}-kicad-drc.json`)
const clock=read('checks/integrated/am3352-ddr-usbc-native-clock-check-summary.json')
const cli=read(`${prefix}-project-cli-equivalence.json`)
for(const a of [source.source,source.previousSource,source.paths,source.provenance,clock.source,clock.board,cli.checked,cli.latestCliReplay])checked(a)
assert.deepEqual(source.previousSource,clock.source);assert.deepEqual(cli.checked,source.source)
assert.equal(cli.cliPackageVersion,read('node_modules/@tscircuit/cli/package.json').version)
assert.equal(cli.tscircuitVersion,read('node_modules/tscircuit/package.json').version)
assert.deepEqual(read(cli.latestCliReplay.path).filter(e=>e.type!=='source_project_metadata'),read(source.source.path).filter(e=>e.type!=='source_project_metadata'))
for(const a of [ddr.circuit,usb.circuit,refs.source]){checked(a);assert.deepEqual(a,source.source)}
for(const a of [ddr.board,usb.board,refs.board]){checked(a);assert.deepEqual(a,ddr.board)}
assert.equal(planar.circuitSha256,source.source.sha256)
assert.equal(source.components,212);assert.equal(source.actualPads,912);assert.equal(source.copperLayers,4)
assert.equal(source.tracePieces,127);assert.equal(source.throughVias,137)
assert.equal(source.preservedTracePieces,125);assert.equal(source.preservedThroughVias,129)
assert.deepEqual(new Set(source.addedSignals),new Set(['DDR_DQS1','DDR_DQSn1']))
const runPath='dist/am3352-ddr-usbc-strobe-connectivity-attempt-427/result.json',run=read(runPath)
for(const a of [run.source,run.channel.input,run.output,run.nativeBootstrap,run.priorLocalRun])checked(a)
assert.deepEqual(run.source,clock.source)
assert.equal(run.status,'GUIDED_NATIVE_CHANNEL_ROUTED_UNQUALIFIED');assert.equal(run.mode,'connectivity-bootstrap')
assert.equal(run.completedSignals,2);assert(run.channel.solved)
const input=read(run.channel.input.path),output=read(run.output.path)
assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces)
assert.equal(output.traces.length,input.traces.length+2);assert.equal(input.layerCount,4)
assert.equal(input.allowBlindAndBuriedVias,false)
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,912)
const expected=new Set(read(clock.nativeDdrAudit.path).results.filter(r=>r.connected).map(r=>r.name))
expected.add('DDR_DQS1');expected.add('DDR_DQSn1');assert.equal(expected.size,25)
for(const r of [planar,ddr]){
  assert.equal(r.requiredSignals,49);assert.equal(r.connectedSignals,25)
  assert.deepEqual(new Set(r.results.filter(r=>r.connected).map(r=>r.name)),expected)
}
assert.deepEqual(ddr.connectionMap,planar.connectionMap);checked(ddr.connectionMap)
assert.equal(planar.status,'AM3352_MEMORY_FAIL')
const passing=['DDR_BYTE0','DDR_DQS0_PAIR','DDR_CK_PAIR'].map(n=>planar.timing.find(t=>t.name===n))
assert(passing.every(t=>t.pass))
const failing=['DDR_BYTE1','DDR_DQS1_PAIR'].map(n=>planar.timing.find(t=>t.name===n))
assert(failing.every(t=>!t.pass&&t.skewMm>7.14))
assert.equal(usb.numericPadNetAssignmentsVerified,38);assert.equal(usb.connectivityRecords.length,40)
assert(usb.connectivityRecords.every(r=>r.connected||r.connectedToFilledPlane))
assert(usb.bothCableOrientationsDataConnected&&usb.ccRdReturnsConnected&&usb.localVbusAndEsdBypassConnected)
assert(usb.vbusPmicFeedConnected&&usb.vbusSenseRouted&&usb.pmicInputBypassConnected&&usb.senseFilterClampAndGroundConnected)
assert.equal(refs.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(refs.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(refs.ramBypassTerminalsConnectedToPlanes,28);assert(refs.records.every(r=>r.connected)&&refs.bypassRecords.every(r=>r.connected))
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)).length,0)
assert(drc.violations.every(v=>v.severity==='warning'))
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
const library=/293 exact local footprints; all (\d+) physical records unchanged/.exec(readFileSync(`${prefix}-library.log`,'utf8'))
assert(library);assert.equal(Number(library[1]),14147)
assert(readFileSync(`${prefix}-fabrication-guard.log`,'utf8').includes('Fabrication export blocked: integrated handheld routing, original G350 shell fit and release checks remain incomplete'))
const summary={status:'DDR25_AND_SHARED_USBC_COPPER_CHECKED_BYTE1_AND_STROBE_TIMING_FAIL',
  source:source.source,board:ddr.board,paths:source.paths,nativeStrobeRun:artifact(runPath),
  priorCheckedClockSummary:artifact('checks/integrated/am3352-ddr-usbc-native-clock-check-summary.json'),
  sourceGeometryAudit:artifact(`${prefix}-source-validation.json`),nativeDdrAudit:artifact(`${prefix}-native-ddr-connectivity.json`),
  planarDdrAudit:artifact(`${prefix}-ddr-connectivity.json`),nativeUsbAudit:artifact(`${prefix}-native-usb-connectivity.json`),
  ramReferenceAudit:artifact(`${prefix}-reference-connectivity.json`),nativeDrc:artifact(`${prefix}-kicad-drc.json`),
  gerberShortsAudit:artifact(`${prefix}-shorts.log`),latestProjectCliEquivalence:artifact(`${prefix}-project-cli-equivalence.json`),
  fabricationGuard:artifact(`${prefix}-fabrication-guard.log`),fabricationGuardStatus:'EXPECTED_BLOCK_BEFORE_ORDERING_FILES',
  cliPackageVersion:cli.cliPackageVersion,tscircuitVersion:cli.tscircuitVersion,
  components:212,copperLayers:4,actualPads:912,tracePieces:127,throughVias:137,
  connectedDdrSignals:25,requiredDdrSignals:49,remainingDdrSignalNames:ddr.results.filter(r=>!r.connected).map(r=>r.name).sort(),
  addedStrobeSignals:2,addedThroughVias:8,preservedTracePieces:125,preservedThroughVias:129,
  strobeLengths:source.lengths,strobePlanarSkewMm:source.skewMm,strobePlanarLimitMm:.127,
  ddrTiming:planar.timing,minimumHoleEdgeGapMm:source.minimumHoleEdgeGapMm,
  bothCableOrientationsDataConnected:true,chargingAndDataShareOneSocket:true,usbNumericPadNetAssignmentsVerified:38,
  usbConnectedPadChecks:40,ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
  gerberShortsAllLayers:0,independentPhysicalViolationsAllSeverities:0,presentationWarnings:drc.violations.length,
  hostUnconnectedItemsReported:drc.unconnected_items.length,ignoredNativeChecks:drc.ignored_checks,
  physicalLibraryRecordsPreserved:Number(library[1]),nativeBusLanesBootstrap:true,manualLocalEscapes:true,
  topSnapshot:{...artifact('images/am3352-ddr-usbc-clock-strobes-unmatched-top.png'),visuallyInspected:true},
  bottomSnapshot:{...artifact('images/am3352-ddr-usbc-clock-strobes-unmatched-bottom.png'),visuallyInspected:true},
  defaultChanged:false,fullElectricalTimingQualified:false,wholeByte1PlanarTimingPass:false,
  controlledImpedanceQualified:false,completePowerRouting:false,linuxInstallerTested:false,originalShellFitVerified:false,
  fabricationReady:false,scope:'One separate 25-channel source includes both bytes/reset and the new clock pair, with shared USB-C copper preserved. Native bus_lanes supplies the strobe continuity channels and CPU bootstrap; guarded manual local fanouts supplement it. Whole-byte1 and DQS1 matching fail, including unequal strobe via counts. This cannot replace the default until repaired and rechecked. Remaining 24 address/control signals, complete host, stackup/timing and original-shell measurements remain unfinished.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,connected:25,open:24,strobeSkewMm:summary.strobePlanarSkewMm,shorts:0,physicalViolations:0,defaultChanged:false,fabricationReady:false}))
