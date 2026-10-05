import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-usbc-routed',read=p=>JSON.parse(readFileSync(p))
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const logical=read(`${prefix}-logical-validation.json`),authored=read(`${prefix}-source-validation.json`)
const usb=read(`${prefix}-native-usb-connectivity.json`),ddr=read(`${prefix}-native-ddr-connectivity.json`)
const refs=read(`${prefix}-reference-connectivity.json`),drc=read(`${prefix}-kicad-drc.json`)
for(const a of [logical.source,authored.source,usb.circuit,ddr.circuit,refs.source]){
  assert.equal(hash(a.path),a.sha256);assert.equal(a.sha256,logical.source.sha256)
}
for(const a of [usb.board,ddr.board,refs.board]){
  assert.equal(hash(a.path),a.sha256);assert.equal(a.sha256,usb.board.sha256)
}
assert.equal(hash(authored.layout.path),authored.layout.sha256)
assert.equal(logical.components,212);assert.equal(logical.sourceCopper.totalSourceTraces,81)
assert.equal(logical.sourceCopper.totalThroughVias,93);assert.equal(logical.sourceCopper.savedDdrSignals,11)
assert.equal(authored.traces,104);assert.equal(authored.throughVias,105);assert.equal(authored.actualPads,912)
assert.equal(authored.usbTracePieces,23)
assert.equal(usb.numericPadNetAssignmentsVerified,36);assert.equal(usb.usbCopperTrackCount,136)
assert.equal(usb.connectivityRecords.length,28)
assert(usb.bothCableOrientationsDataConnected&&usb.ccRdReturnsConnected&&usb.localVbusAndEsdBypassConnected)
assert(usb.connectivityRecords.every(r=>r.connected||r.connectedToFilledPlane))
assert.equal(usb.vbusPmicFeedConnected,false);assert.equal(usb.vbusSenseRouted,false)
assert(authored.connectorOrientations.every(r=>r.skewMm<.127))
assert.deepEqual(authored.connectorOrientations.map(r=>r.viasPerDataNet),[0,2])
assert.equal(ddr.connectedSignals,11);assert.equal(ddr.requiredSignals,49)
assert.equal(refs.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(refs.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(refs.ramBypassTerminalsConnectedToPlanes,28)
assert(refs.records.every(r=>r.connected)&&refs.bypassRecords.every(r=>r.connected))
assert.deepEqual(refs.explicitInnerPowerBridge,{ball:'D2',connectedNativeSegments:3,newHoles:0})
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)).length,0)
assert(drc.violations.every(v=>v.severity==='warning'))
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
assert(readFileSync(`${prefix}-library.log`,'utf8').includes('289 exact local footprints; all 2245 physical records unchanged'))
assert(readFileSync(`${prefix}-fabrication-guard.log`,'utf8').includes('Fabrication export blocked: integrated handheld routing, original G350 shell fit and release checks remain incomplete'))
assert(readFileSync(`${prefix}-typecheck.log`,'utf8').includes('tsc --noEmit'))
const baseline=read('checks/integrated/am3352-ram-rotated-180-byte-swapped-byte0-pair-check-summary.json')
assert.equal(hash(baseline.source.path),baseline.source.sha256);assert.equal(baseline.byte0PlanarMatchPass,false)
const provenance=read('routing/am3352-usbc-routes.provenance.json')
for(const a of [provenance.source,provenance.nativeCcRun,provenance.nativePairRun,provenance.layout])assert.equal(hash(a.path),a.sha256)
assert.equal(provenance.layout.sha256,authored.layout.sha256)
const toolchain=read('checks/integrated/am3352-usbc-toolchain-verification.json')
assert(toolchain.nativePairInputAndOutputUnchanged&&toolchain.nativeCcInputAndOutputUnchanged&&toolchain.typecheckPassed)
for(const [fresh,original] of [[toolchain.nativePairRun,provenance.nativePairRun],[toolchain.nativeCcRun,provenance.nativeCcRun]]){
  assert.equal(hash(fresh.path),fresh.sha256);assert.equal(hash(original.path),original.sha256)
  const current=read(fresh.path),previous=read(original.path)
  for(const a of [current.source,current.input,current.output,previous.source,previous.input,previous.output])assert.equal(hash(a.path),a.sha256)
  assert.equal(current.source.sha256,previous.source.sha256)
  assert.equal(current.input.sha256,previous.input.sha256);assert.equal(current.output.sha256,previous.output.sha256)
}
for(const [name,version] of Object.entries(toolchain.latest)){
  assert.equal(read(`node_modules/${name}/package.json`).version,version)
  assert.equal(read('package.json').devDependencies[name],version)
}
const summary={status:'USBC_DATA_CC_LOCAL_POWER_AND_GROUND_COPPER_CHECKED_FULL_HOST_INCOMPLETE',
  source:logical.source,board:usb.board,layout:authored.layout,
  logicalAudit:artifact(`${prefix}-logical-validation.json`),sourceGeometryAndPlanarAudit:artifact(`${prefix}-source-validation.json`),
  nativeUsbAudit:artifact(`${prefix}-native-usb-connectivity.json`),nativeDdrAudit:artifact(`${prefix}-native-ddr-connectivity.json`),
  ramReferenceAudit:artifact(`${prefix}-reference-connectivity.json`),nativeDrc:artifact(`${prefix}-kicad-drc.json`),
  gerberShortsAudit:artifact(`${prefix}-shorts.log`),fabricationGuard:artifact(`${prefix}-fabrication-guard.log`),
  fabricationGuardStatus:'EXPECTED_BLOCK_BEFORE_ORDERING_FILES',toolchainVerification:artifact('checks/integrated/am3352-usbc-toolchain-verification.json'),
  components:212,copperLayers:4,actualPads:912,sourceTracePieces:104,sourceThroughVias:105,
  existingTracePiecesPreserved:81,existingThroughViasPreserved:93,usbTracePiecesAdded:23,usbThroughViasAdded:12,
  usbNumericPadNetAssignmentsVerified:36,usbConnectedPadChecks:28,usbNativeTrackAndViaRecords:136,
  bothCableOrientationsDataConnected:true,ccRdReturnsConnected:true,localVbusAndEsdBypassConnected:true,
  chargingAndDataShareOneSocket:true,vbusPmicFeedConnected:false,vbusSenseRouted:false,
  cpuToEsdPlanar:authored.cpuToEsdPlanar,connectorOrientations:authored.connectorOrientations,planarLimitMm:.127,
  nativeBusLanesBootstrap:true,manualLocalRepairs:true,manualCpuDmLoopAdditionMm:.0635,
  independentPhysicalViolationsAllSeverities:0,gerberShortsAllLayers:0,presentationWarnings:drc.violations.length,
  hostUnconnectedItemsReported:drc.unconnected_items.length,ignoredNativeChecks:drc.ignored_checks,
  preservedDdrChannelsConnected:11,remainingDdrSignals:38,ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
  existingPlanarByteSkewMm:baseline.byte0PlanarSkewMm,existingPlanarByteMatchPass:false,
  usbCurrentPolicyQualified:false,usbVbusAllTemperatureAndTransientQualified:false,controlledImpedanceQualified:false,
  completePowerRouting:false,linuxInstallerTested:false,originalShellFitVerified:false,fabricationReady:false,
  snapshots:[{...artifact('images/am3352-usbc-routed-top.png'),visuallyInspected:true},
    {...artifact('images/am3352-usbc-routed-detail.png'),visuallyInspected:true}],
  scope:'Separate four-layer replay with CPU-to-socket USB data, two CC/Rd returns, local VBUS/ESD bypass and ground copper. Native bus_lanes routes and manual repairs pass source, native connectivity, physical DRC and shorts checks. PMIC input feed, CPU VBUS sensing, stackup/return paths, current policy, remaining DDR/host and measured original-shell layout remain unfinished.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,usbTracePieces:23,usbThroughVias:12,physicalViolations:0,shorts:0,
  connectedDdr:11,fabricationReady:false}))
