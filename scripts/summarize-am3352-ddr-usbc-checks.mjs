import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-ddr-usbc-control'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)})
const logical=read(`${prefix}-logical-validation.json`),authored=read(`${prefix}-source-validation.json`)
const usb=read(`${prefix}-native-usb-connectivity.json`),ddr=read(`${prefix}-native-ddr-connectivity.json`)
const planar=read(`${prefix}-ddr-connectivity.json`),refs=read(`${prefix}-reference-connectivity.json`)
const drc=read(`${prefix}-kicad-drc.json`),circuit=read(logical.source.path),layout=read(authored.layout.path)
for(const a of [logical.source,authored.source,usb.circuit,ddr.circuit,refs.source]){
  assert.equal(hash(a.path),a.sha256);assert.equal(a.sha256,logical.source.sha256)
}
for(const a of [usb.board,ddr.board,refs.board]){
  assert.equal(hash(a.path),a.sha256);assert.equal(a.sha256,usb.board.sha256)
}
assert.equal(planar.circuitSha256,logical.source.sha256)
assert.equal(hash(authored.layout.path),authored.layout.sha256)
assert.equal(logical.ddrProfile,'ram0-ddr23');assert.equal(logical.components,212)
assert.equal(logical.sourceCopper.totalSourceTraces,92);assert.equal(logical.sourceCopper.totalThroughVias,109)
assert.equal(logical.sourceCopper.savedDdrSignals,23)
assert.equal(authored.actualPads,912);assert.equal(authored.traces,125);assert.equal(authored.throughVias,129)
assert.equal(authored.usbTracePieces,33);assert.equal(layout.traces.length,31)
assert(authored.vbusPmicFeedRouted&&authored.vbusSenseRouted)
assert(authored.connectorOrientations.every(r=>r.skewMm<=.127+1e-7))
assert.deepEqual(authored.connectorOrientations.map(r=>r.viasPerDataNet),[0,2])
assert.equal(usb.numericPadNetAssignmentsVerified,38)
assert(usb.bothCableOrientationsDataConnected&&usb.ccRdReturnsConnected&&usb.localVbusAndEsdBypassConnected)
assert(usb.vbusPmicFeedConnected&&usb.vbusSenseRouted&&usb.pmicInputBypassConnected&&usb.senseFilterClampAndGroundConnected)
assert(usb.connectivityRecords.every(r=>r.connected||r.connectedToFilledPlane))
assert.equal(usb.connectivityRecords.length,40)
assert.equal(ddr.connectedSignals,23);assert.equal(ddr.requiredSignals,49)
assert.equal(planar.connectedSignals,23);assert.equal(planar.status,'AM3352_MEMORY_FAIL')
assert.deepEqual(ddr.connectionMap,planar.connectionMap)
assert.equal(hash(ddr.connectionMap.path),ddr.connectionMap.sha256)
const commandIds=new Set(circuit.find(e=>e.type==='source_bus'&&e.name==='DDR_COMMAND_CLOCK').source_trace_ids)
const commandNames=new Set(circuit.filter(e=>e.type==='source_trace'&&commandIds.has(e.source_trace_id)).map(e=>e.name))
assert.deepEqual(new Set(ddr.results.filter(r=>!r.connected).map(r=>r.name)),commandNames)
assert.equal(commandNames.size,26)
const timing=['DDR_BYTE0','DDR_BYTE1','DDR_DQS0_PAIR','DDR_DQS1_PAIR'].map(name=>planar.timing.find(t=>t.name===name))
assert(timing.every(t=>t.pass&&t.skewMm<=t.limitMm+1e-6))
assert.equal(refs.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(refs.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(refs.ramBypassTerminalsConnectedToPlanes,28)
assert(refs.records.every(r=>r.connected)&&refs.bypassRecords.every(r=>r.connected))
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)).length,0)
assert(drc.violations.every(v=>v.severity==='warning'))
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
const library=/293 exact local footprints; all (\d+) physical records unchanged/.exec(readFileSync(`${prefix}-library.log`,'utf8'))
assert(library);assert(Number(library[1])>13583)
assert(readFileSync(`${prefix}-fabrication-guard.log`,'utf8').includes('Fabrication export blocked: integrated handheld routing, original G350 shell fit and release checks remain incomplete'))
assert(readFileSync(`${prefix}-typecheck.log`,'utf8').includes('tsc --noEmit'))

const visited=new Set(),nativeControlRuns=[]
function checkProvenance(path){
  if(visited.has(path))return;visited.add(path)
  const p=read(path)
  for(const key of ['priorLayout','priorProvenance','source','nativeControlRun','nativeCcRun','nativePairRun','layout']){
    const a=p[key];if(a)assert.equal(hash(a.path),a.sha256,`Changed ${key}: ${a.path}`)
  }
  if(p.nativeControlRun){
    const r=read(p.nativeControlRun.path)
    assert.equal(r.status,'NATIVE_USB_CONTROL_ROUTED_PENDING_PHYSICAL_CHECKS')
    for(const a of [r.source,r.input,r.output])assert.equal(hash(a.path),a.sha256)
    const original=read(r.source.path),input=read(r.input.path),output=read(r.output.path)
    const old=original.filter(e=>e.type==='pcb_trace')
    assert.equal(old.length,input.traces.length);assert.equal(output.traces.length,input.traces.length+1)
    assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false)
    for(const [i,t] of input.traces.entries()){
      assert.deepEqual(output.traces[i],t)
      const physical=old.find(o=>o.pcb_trace_id===t.pcb_trace_id);assert(physical)
      const geometry=q=>q.route.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
      assert.deepEqual(geometry(t),geometry(physical))
    }
    for(const alias of r.sameNetFixedCopperOwnerAliases??[]){
      const a=original.find(e=>e.type==='source_trace'&&e.source_trace_id===alias.originalSourceTraceId)
      const b=original.find(e=>e.type==='source_trace'&&e.source_trace_id===alias.canonicalSourceTraceId)
      assert(a&&b);assert.equal(a.subcircuit_connectivity_map_key,b.subcircuit_connectivity_map_key)
      const t=old.find(t=>t.pcb_trace_id===alias.pcb_trace_id);assert.equal(t.source_trace_id,a.source_trace_id)
    }
    const saved=layout.traces.find(t=>t.name===r.definition.name);assert(saved)
    assert.deepEqual(saved.globalPoints,output.traces.at(-1).route.map(p=>p.route_type==='via'?
      {x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}:{x:p.x,y:p.y}))
    assert.equal(saved.width,r.definition.width)
    nativeControlRuns.push({...p.nativeControlRun,phase:r.phase,solver:r.solver,steps:r.steps,
      preservedTracePieces:old.length,sameNetOwnerAliases:r.sameNetFixedCopperOwnerAliases?.length??0})
  }
  if(p.priorProvenance)checkProvenance(p.priorProvenance.path)
  else if(p.priorLayout){
    // The manual escape stage predates the explicit sidecar pointer. Its
    // predecessor sidecar must identify the exact hash-checked prior layout.
    const previous=p.priorLayout.path.replace(/\.json$/,'.provenance.json')
    assert.deepEqual(read(previous).layout,p.priorLayout);checkProvenance(previous)
  }
}
checkProvenance(authored.layout.path.replace(/\.json$/,'.provenance.json'))
assert.deepEqual(new Set(nativeControlRuns.map(r=>r.phase)),new Set(['sense','pmic-feed','sense-input','sense-cap','sense-clamp','pmic-cap']))
const snapshot=artifact('images/am3352-ddr-usbc-control-top.png')
const bottomSnapshot=artifact('images/am3352-ddr-usbc-control-bottom.png')
const summary={status:'DDR23_AND_SHARED_USBC_DATA_CHARGING_FEED_SENSE_COPPER_CHECKED_HOST_INCOMPLETE',
  source:logical.source,board:usb.board,layout:authored.layout,
  logicalAudit:artifact(`${prefix}-logical-validation.json`),sourceGeometryAndPlanarAudit:artifact(`${prefix}-source-validation.json`),
  nativeUsbAudit:artifact(`${prefix}-native-usb-connectivity.json`),nativeDdrAudit:artifact(`${prefix}-native-ddr-connectivity.json`),
  planarDdrAudit:artifact(`${prefix}-ddr-connectivity.json`),ramReferenceAudit:artifact(`${prefix}-reference-connectivity.json`),
  nativeDrc:artifact(`${prefix}-kicad-drc.json`),gerberShortsAudit:artifact(`${prefix}-shorts.log`),
  fabricationGuard:artifact(`${prefix}-fabrication-guard.log`),fabricationGuardStatus:'EXPECTED_BLOCK_BEFORE_ORDERING_FILES',
  components:212,copperLayers:4,actualPads:912,sourceTracePieces:125,sourceThroughVias:129,
  existingTracePiecesPreserved:92,existingThroughViasPreserved:109,usbTracePiecesAdded:33,usbThroughViasAdded:20,
  bothCableOrientationsDataConnected:true,ccRdReturnsConnected:true,chargingAndDataShareOneSocket:true,
  localVbusAndEsdBypassConnected:true,vbusPmicFeedConnected:true,vbusSenseRouted:true,pmicInputBypassConnected:true,
  senseFilterClampAndGroundConnected:true,usbNumericPadNetAssignmentsVerified:38,usbConnectedPadChecks:40,
  usbNativeTrackAndViaRecords:usb.usbCopperTrackCount,cpuToEsdPlanar:authored.cpuToEsdPlanar,
  connectorOrientations:authored.connectorOrientations,planarLimitMm:.127,nativeControlRuns,
  provenanceArtifacts:[...visited].map(artifact),
  nativeBusLanesBootstrap:true,manualLocalRepairs:true,manualCpuDmLoopAdditionMm:.0635,
  independentPhysicalViolationsAllSeverities:0,gerberShortsAllLayers:0,presentationWarnings:drc.violations.length,
  hostUnconnectedItemsReported:drc.unconnected_items.length,ignoredNativeChecks:drc.ignored_checks,
  physicalLibraryRecordsPreserved:Number(library[1]),preservedDdrChannelsConnected:23,remainingDdrSignals:26,
  remainingDdrSignalNames:[...commandNames].sort(),ddrPlanarTiming:timing,
  ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
  usbCurrentPolicyQualified:false,usbVbusAllTemperatureAndTransientQualified:false,controlledImpedanceQualified:false,
  fullElectricalTimingQualified:false,completePowerRouting:false,linuxInstallerTested:false,
  originalShellFitVerified:false,fabricationReady:false,snapshot:{...snapshot,visuallyInspected:true},
  bottomSnapshot:{...bottomSnapshot,visuallyInspected:true},
  scope:'One combined four-layer board retains both DDR bytes/reset and adds shared USB-C data, CC, charging input, CPU VBUS filter/clamp and ground returns. Native bus_lanes routes with manual local escapes pass independent copper connectivity, physical DRC and all-layer shorts. Remaining DDR command/clock, full host power/peripherals, USB current and transient qualification, stackup/timing, Linux provisioning and measured original-shell geometry remain unfinished.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,connectedDdr:23,unroutedDdr:26,traces:125,vias:129,shorts:0,physicalViolations:0,fabricationReady:false}))
