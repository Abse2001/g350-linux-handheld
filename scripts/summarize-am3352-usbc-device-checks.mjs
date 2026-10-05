import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-usbc-device',read=p=>JSON.parse(readFileSync(p))
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const logical=read(`${prefix}-validation.json`),usb=read(`${prefix}-native-usb-netlist.json`),ddr=read(`${prefix}-native-ddr-connectivity.json`)
const refs=read(`${prefix}-reference-connectivity.json`),drc=read(`${prefix}-kicad-drc.json`)
for(const a of [logical.source,usb.circuit,ddr.circuit,refs.source]){
  assert.equal(hash(a.path),a.sha256);assert.equal(a.sha256,logical.source.sha256)
}
for(const a of [usb.board,ddr.board,refs.board]){
  assert.equal(hash(a.path),a.sha256);assert.equal(a.sha256,usb.board.sha256)
}
assert.equal(logical.components,212);assert.equal(logical.sourceCopper.totalSourceTraces,81)
assert.equal(logical.sourceCopper.totalThroughVias,93);assert.equal(logical.sourceCopper.savedDdrSignals,11)
assert.equal(usb.numericPadNetAssignmentsVerified,36);assert.equal(usb.usbCopperTrackCount,0)
assert.equal(ddr.connectedSignals,11);assert.equal(ddr.requiredSignals,49)
assert.equal(refs.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(refs.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(refs.ramBypassTerminalsConnectedToPlanes,28)
assert(refs.records.every(r=>r.connected)&&refs.bypassRecords.every(r=>r.connected))
assert.deepEqual(refs.explicitInnerPowerBridge,{ball:'D2',connectedNativeSegments:3,newHoles:0})
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)).length,0)
assert(drc.violations.every(v=>v.severity==='warning'))
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
assert(readFileSync(`${prefix}-library.log`,'utf8').includes('281 exact local footprints; all 2089 physical records unchanged'))
assert(readFileSync(`${prefix}-fabrication-guard.log`,'utf8').includes('Fabrication export blocked: integrated handheld routing, original G350 shell fit and release checks remain incomplete'))
const baseline=read('checks/integrated/am3352-ram-rotated-180-byte-swapped-byte0-pair-check-summary.json')
assert.equal(hash(baseline.source.path),baseline.source.sha256)
assert.equal(baseline.ddrSignalsConnected,11);assert.equal(baseline.byte0PlanarMatchPass,false)
const summary={status:'SHARED_USBC_SOURCE_AND_EXPORTED_PAD_CHECKS_PASS_USB_ROUTING_AND_HOST_INCOMPLETE',
  source:logical.source,board:usb.board,logicalAudit:artifact(`${prefix}-validation.json`),nativeUsbAudit:artifact(`${prefix}-native-usb-netlist.json`),
  nativeDdrAudit:artifact(`${prefix}-native-ddr-connectivity.json`),ramReferenceAudit:artifact(`${prefix}-reference-connectivity.json`),
  nativeDrc:artifact(`${prefix}-kicad-drc.json`),gerberShortsAudit:artifact(`${prefix}-shorts.log`),
  fabricationGuard:artifact(`${prefix}-fabrication-guard.log`),fabricationGuardStatus:'EXPECTED_BLOCK_BEFORE_ORDERING_FILES',
  components:212,individualJlcPartsAdded:8,copperLayers:4,actualPads:912,sourceTracePieces:81,sourceThroughVias:93,
  usbNumericPadNetAssignmentsVerified:36,usbCopperTrackCount:0,chargingAndDataShareOneSocket:true,
  independentPhysicalViolationsAllSeverities:0,gerberShortsAllLayers:0,presentationWarnings:drc.violations.length,
  hostUnconnectedItems:drc.unconnected_items.length,ignoredNativeChecks:drc.ignored_checks,
  preservedDdrChannelsConnected:11,remainingDdrSignals:38,ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
  existingPlanarByteSkewMm:baseline.byte0PlanarSkewMm,existingPlanarByteLimitMm:.635,existingPlanarByteMatchPass:false,
  usbCurrentPolicyQualified:false,usbVbusAllTemperatureAndTransientQualified:false,controlledImpedanceQualified:false,
  completePowerRouting:false,linuxInstallerTested:false,originalShellFitVerified:false,fabricationReady:false,
  snapshot:{...artifact('images/am3352-usbc-device-source-top.png'),visuallyInspected:true},
  scope:'Four-layer USB-C hardware source draft with fresh exported numeric-pad, existing DDR/reference copper and clearance checks. USB data/power/CC/sense traces, charger current policy, full powered host, timing and measured original-shell placement remain unfinished.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify(summary))
