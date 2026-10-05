import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-ddr-usbc-cke-access'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const source=read(`${prefix}-source-validation.json`),planar=read(`${prefix}-ddr-connectivity.json`)
const ddr=read(`${prefix}-native-ddr-connectivity.json`),usb=read(`${prefix}-native-usb-connectivity.json`)
const refs=read(`${prefix}-reference-connectivity.json`),drc=read(`${prefix}-kicad-drc.json`)
const prior=read(source.priorCheckedSummary.path),provenance=read(source.provenance.path)
for(const a of [source.source,source.previousSource,source.paths,source.provenance,source.priorCheckedSummary])checked(a)
assert.deepEqual(source.previousSource,prior.source)
assert.deepEqual(source.changedSignals,['DDR_DQSn1','DDR_D7'])
assert.equal(source.tracePieces,127);assert.equal(source.throughVias,135)
assert.equal(source.preservedTracePieces,125);assert.equal(source.preservedThroughVias,135)
for(const a of [ddr.circuit,usb.circuit,refs.source]){checked(a);assert.deepEqual(a,source.source)}
for(const a of [ddr.board,usb.board,refs.board]){checked(a);assert.deepEqual(a,ddr.board)}
assert.equal(planar.circuitSha256,source.source.sha256)
for(const r of [planar,ddr]){
  assert.equal(r.requiredSignals,49);assert.equal(r.connectedSignals,25)
  assert.deepEqual(r.results.map(x=>({name:x.name,connected:x.connected})),read(prior.nativeDdrAudit.path).results.map(x=>({name:x.name,connected:x.connected})))
}
assert.equal(planar.problems.length,25)
assert(planar.problems.every(p=>p.startsWith('Unconnected memory signal: ')||p==='Incomplete or unmatched planar timing group: DDR_COMMAND_CLOCK'))
for(const name of ['DDR_BYTE0','DDR_BYTE1','DDR_DQS0_PAIR','DDR_DQS1_PAIR','DDR_CK_PAIR'])assert(planar.timing.find(t=>t.name===name).pass)
assert(!planar.timing.find(t=>t.name==='DDR_COMMAND_CLOCK').pass)
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
assert(library);assert.equal(Number(library[1]),13683)
assert.equal(provenance.futureCkeEscape.actuallyExported,false)
assert(provenance.futureCkeEscape.minimumPadHoleGapMm>=.2&&provenance.futureCkeEscape.minimumHoleEdgeGapMm>=.254&&provenance.futureCkeEscape.minimumViaCopperGapMm>=.1016)
const nativePath='dist/am3352-ddr25-cke-native-bottom-attempt-454/result.json',native=read(nativePath)
checked(native.input);checked(native.localEscapes);assert.deepEqual(native.source,source.source)
assert.equal(native.preparedEscapes,2);assert.equal(native.newConnectedSignals,0)
const escapes=read(native.localEscapes.path),ram=escapes.find(e=>e.pcb_trace_id==='local_dogbone_source_trace_48_1')
assert(ram&&ram.route[0].x===3.2&&ram.route[0].y===-28.2)
assert(Math.hypot(ram.route.at(-1).x-3.6,ram.route.at(-1).y+27.8)<1e-8)
const summary={status:'DDR25_CKE_ACCESS_REPAIR_COPPER_AND_PLANAR_MATCHING_CHECKED_HOST_INCOMPLETE',
  source:source.source,board:ddr.board,paths:source.paths,priorCheckedSummary:source.priorCheckedSummary,
  sourceGeometryAudit:artifact(`${prefix}-source-validation.json`),nativeDdrAudit:artifact(`${prefix}-native-ddr-connectivity.json`),planarDdrAudit:artifact(`${prefix}-ddr-connectivity.json`),
  nativeUsbAudit:artifact(`${prefix}-native-usb-connectivity.json`),ramReferenceAudit:artifact(`${prefix}-reference-connectivity.json`),nativeDrc:artifact(`${prefix}-kicad-drc.json`),gerberShortsAudit:artifact(`${prefix}-shorts.log`),
  nativeCkeBootstrap:artifact(nativePath),libraryAudit:artifact(`${prefix}-library.log`),
  components:212,actualPads:912,copperLayers:4,tracePieces:127,throughVias:135,
  connectedDdrSignals:25,requiredDdrSignals:49,remainingDdrSignalNames:ddr.results.filter(r=>!r.connected).map(r=>r.name).sort(),
  changedSignals:source.changedSignals,ddrTiming:planar.timing,minimumHoleEdgeGapMm:source.minimumHoleEdgeGapMm,
  manualStrobeElbow:provenance.manualModification,manualDataTail:provenance.manualDataTailModification,
  ckeNativeDogbonesPrepared:2,ckeConnected:false,newConnectedDdrSignals:0,
  bothCableOrientationsDataConnected:true,chargingAndDataShareOneSocket:true,usbNumericPadNetAssignmentsVerified:38,usbConnectedPadChecks:40,
  ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
  gerberShortsAllLayers:0,independentPhysicalViolationsAllSeverities:0,presentationWarnings:drc.violations.length,hostUnconnectedItemsReported:drc.unconnected_items.length,ignoredNativeChecks:drc.ignored_checks,
  physicalLibraryRecordsPreserved:Number(library[1]),nativeBusLanesBootstrap:true,bothBytePlanarTimingPass:true,allThreeDifferentialPairPlanarTimingPass:true,
  topSnapshot:{...artifact('images/am3352-ddr-usbc-cke-access-top.png'),visuallyInspected:true},bottomSnapshot:{...artifact('images/am3352-ddr-usbc-cke-access-bottom.png'),visuallyInspected:true},
  cliPackageVersion:read('node_modules/@tscircuit/cli/package.json').version,tscircuitVersion:read('node_modules/tscircuit/package.json').version,
  fullElectricalTimingQualified:false,controlledImpedanceQualified:false,completePowerRouting:false,linuxInstallerTested:false,originalShellFitVerified:false,fabricationReady:false,
  scope:'Only the negative RAM strobe elbow and DDR_D7 tail/channel are changed. All original holes and every other source record are preserved. Both byte groups and all three available differential pairs retain their relative planar matching. CKE now has a native pad-to-via bootstrap but its complete channel remains open. Original shell measurements, 24 address/control signals, TI nominal clock tuning and the complete host remain required.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,connected:25,open:24,byte0SkewMm:planar.timing.find(t=>t.name==='DDR_BYTE0').skewMm,shorts:0,physicalViolations:0,fabricationReady:false}))
