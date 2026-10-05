import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-ddr-usbc-native-clock'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const authored=read(`${prefix}-source-validation.json`),ddr=read(`${prefix}-native-ddr-connectivity.json`)
const planar=read(`${prefix}-ddr-connectivity.json`),usb=read(`${prefix}-native-usb-connectivity.json`)
const refs=read(`${prefix}-reference-connectivity.json`),drc=read(`${prefix}-kicad-drc.json`)
const cli=read(`${prefix}-project-cli-equivalence.json`)
checked(cli.checked);checked(cli.latestCliReplay);assert.deepEqual(cli.checked,authored.source)
assert.equal(cli.cliPackageVersion,read('node_modules/@tscircuit/cli/package.json').version)
assert.equal(cli.tscircuitVersion,read('node_modules/tscircuit/package.json').version)
assert.deepEqual(read(cli.latestCliReplay.path).filter(e=>e.type!=='source_project_metadata'),
  read(authored.source.path).filter(e=>e.type!=='source_project_metadata'))
const baseline=read('checks/integrated/am3352-ddr-usbc-control-check-summary.json')
for(const a of [authored.source,authored.previousSource,authored.nativeRun,authored.paths,baseline.source,baseline.board])checked(a)
for(const a of [ddr.circuit,usb.circuit,refs.source]){checked(a);assert.deepEqual(a,authored.source)}
for(const a of [ddr.board,usb.board,refs.board]){checked(a);assert.deepEqual(a,ddr.board)}
assert.equal(planar.circuitSha256,authored.source.sha256)
const original=read(baseline.source.path),previous=read(authored.previousSource.path),source=read(authored.source.path)
const type=(c,t)=>c.filter(e=>e.type===t),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
const opened=['DDR_DQS1','DDR_DQSn1'],sourceNames=new Map(type(original,'source_trace').map(t=>[t.source_trace_id,t.name]))
const openedIds=new Set(type(original,'source_trace').filter(t=>opened.includes(t.name)).map(t=>t.source_trace_id))
assert.equal(openedIds.size,2)
for(const t of ['source_component','source_port','source_net','source_trace','source_bus','pcb_board','pcb_component','pcb_port','pcb_smtpad','pcb_plated_hole','pcb_keepout'])
  assert.deepEqual(type(previous,t),type(original,t),`Opening strobes changed ${t}`)
const geometry=t=>t.route.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
const retained=type(original,'pcb_trace').filter(t=>!openedIds.has(t.source_trace_id))
assert.equal(retained.length,123);assert.equal(type(previous,'pcb_trace').length,123)
for(const t of retained){
  const p=type(previous,'pcb_trace').find(p=>p.source_trace_id===t.source_trace_id);assert(p)
  assert.deepEqual(geometry(p),geometry(t),`Changed retained ${sourceNames.get(t.source_trace_id)}`)
}
const removedViaPoints=type(original,'pcb_trace').filter(t=>openedIds.has(t.source_trace_id)).flatMap(t=>t.route.filter(p=>p.route_type==='via'))
const retainedVias=type(original,'pcb_via').filter(v=>!removedViaPoints.some(p=>near(v,p)))
assert.equal(retainedVias.length,125);assert.equal(type(previous,'pcb_via').length,125)
for(const v of retainedVias){
  const p=type(previous,'pcb_via').find(p=>near(p,v));assert(p)
  for(const k of ['outer_diameter','hole_diameter','source_net_id'])assert.equal(p[k],v[k])
  assert.deepEqual(p.layers,v.layers)
}
for(const p of type(original,'pcb_copper_pour')){
  const current=type(previous,'pcb_copper_pour').find(q=>q.pcb_copper_pour_id===p.pcb_copper_pour_id);assert(current)
  // Filled clearance cutouts follow the removed holes. Keep the reference
  // layer, net, mask coverage and entire outer boundary unchanged.
  const outline=({brep_shape,...r})=>({...r,outerRing:brep_shape.outer_ring})
  assert.deepEqual(outline(current),outline(p))
}
assert.equal(authored.selection,'clock');assert.deepEqual(new Set(authored.addedSignals),new Set(['DDR_CK','DDR_CKn']))
assert.equal(authored.components,212);assert.equal(authored.actualPads,912)
assert.equal(authored.sourceTracePieces,125);assert.equal(authored.sourceThroughVias,129)
assert.equal(authored.priorTracePiecesPreserved,123);assert.equal(authored.priorThroughViasPreserved,125)
assert.equal(authored.addedFullDepthVias,4);assert(authored.skewMm<=.127+1e-6)
const run=read(authored.nativeRun.path)
assert.equal(run.status,'NATIVE_DDR_PHASE_ROUTED_PENDING_PHYSICAL_CHECKS');assert.equal(run.mode,'full')
assert.equal(run.virtualPreparationTargets.length,0);assert.equal(run.preparedEscapes,4);assert.equal(run.newConnectedSignals,2)
for(const a of [run.source,run.input,run.output,run.connectionMap])checked(a)
assert.deepEqual(run.source,authored.previousSource)
const input=read(run.input.path),output=read(run.output.path)
assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false)
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,912)
assert.equal(input.buses.length,1);assert.equal(input.buses[0].maxLengthSkew,.127)
assert.deepEqual(input.buses[0].allowedLayers,['bottom'])
assert.equal(input.differentialPairs[0].lengthTolerance,.127);assert.equal(input.differentialPairs[0].traceGap,.12)
assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces)
assert.equal(output.traces.length,input.traces.length+2)
const paths=read(authored.paths.path),provenance=read(authored.paths.path.replace(/\.json$/,'.provenance.json'))
for(const a of [provenance.priorPaths,provenance.source,provenance.nativeRun,provenance.nativeOutput,provenance.paths])checked(a)
assert.deepEqual(provenance.nativeRun,authored.nativeRun);assert.deepEqual(provenance.paths,authored.paths)
assert.equal(Object.keys(paths).length,23);assert(opened.every(n=>!paths[n]))
checked(baseline.nativeDdrAudit)
const expected=new Set(read(baseline.nativeDdrAudit.path).results.filter(r=>r.connected&&!opened.includes(r.name)).map(r=>r.name))
expected.add('DDR_CK');expected.add('DDR_CKn');assert.equal(expected.size,23)
for(const report of [ddr,planar]){
  assert.equal(report.requiredSignals,49);assert.equal(report.connectedSignals,23)
  assert.deepEqual(new Set(report.results.filter(r=>r.connected).map(r=>r.name)),expected)
}
assert.deepEqual(ddr.connectionMap,planar.connectionMap);checked(ddr.connectionMap)
assert.equal(planar.status,'AM3352_MEMORY_FAIL')
const timing=['DDR_BYTE0','DDR_DQS0_PAIR','DDR_CK_PAIR'].map(n=>planar.timing.find(t=>t.name===n))
assert(timing.every(t=>t.pass&&t.skewMm<=t.limitMm+1e-6))
assert(planar.timing.filter(t=>['DDR_BYTE1','DDR_DQS1_PAIR','DDR_COMMAND_CLOCK'].includes(t.name)).every(t=>!t.pass))
assert.equal(usb.numericPadNetAssignmentsVerified,38);assert.equal(usb.connectivityRecords.length,40)
assert(usb.bothCableOrientationsDataConnected&&usb.ccRdReturnsConnected&&usb.localVbusAndEsdBypassConnected)
assert(usb.vbusPmicFeedConnected&&usb.vbusSenseRouted&&usb.pmicInputBypassConnected&&usb.senseFilterClampAndGroundConnected)
assert(usb.connectivityRecords.every(r=>r.connected||r.connectedToFilledPlane))
assert.equal(refs.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(refs.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(refs.ramBypassTerminalsConnectedToPlanes,28)
assert(refs.records.every(r=>r.connected)&&refs.bypassRecords.every(r=>r.connected))
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
assert.equal(drc.violations.filter(v=>!presentation.has(v.type)).length,0)
assert(drc.violations.every(v=>v.severity==='warning'))
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync(`${prefix}-shorts.log`,'utf8').trim()))
const library=/293 exact local footprints; all (\d+) physical records unchanged/.exec(readFileSync(`${prefix}-library.log`,'utf8'))
assert(library);assert.equal(Number(library[1]),13310)
assert(readFileSync(`${prefix}-typecheck.log`,'utf8').includes('tsc --noEmit'))
assert(readFileSync(`${prefix}-fabrication-guard.log`,'utf8').includes('Fabrication export blocked: integrated handheld routing, original G350 shell fit and release checks remain incomplete'))
const summary={status:'NATIVE_DDR_CLOCK_PAIR_AND_PRESERVED_USBC_COPPER_CHECKED_TWO_STROBES_OPEN',
  source:authored.source,board:ddr.board,paths:authored.paths,nativeRun:authored.nativeRun,
  sourceGeometryAudit:artifact(`${prefix}-source-validation.json`),nativeDdrAudit:artifact(`${prefix}-native-ddr-connectivity.json`),
  planarDdrAudit:artifact(`${prefix}-ddr-connectivity.json`),nativeUsbAudit:artifact(`${prefix}-native-usb-connectivity.json`),
  ramReferenceAudit:artifact(`${prefix}-reference-connectivity.json`),nativeDrc:artifact(`${prefix}-kicad-drc.json`),
  gerberShortsAudit:artifact(`${prefix}-shorts.log`),fabricationGuard:artifact(`${prefix}-fabrication-guard.log`),
  latestProjectCliEquivalence:artifact(`${prefix}-project-cli-equivalence.json`),
  cliPackageVersion:cli.cliPackageVersion,tscircuitVersion:cli.tscircuitVersion,
  originalCheckedDefault:baseline.source,openedSignals:opened,retainedOriginalDdrSignals:21,addedClockSignals:2,
  connectedDdrSignals:23,requiredDdrSignals:49,remainingDdrSignalNames:ddr.results.filter(r=>!r.connected).map(r=>r.name).sort(),
  components:212,copperLayers:4,actualPads:912,tracePieces:125,throughVias:129,
  nativeClockEscapes:4,clockLengths:authored.lengths,clockPlanarSkewMm:authored.skewMm,clockPlanarLimitMm:.127,
  minimumHoleEdgeGapMm:authored.minimumHoleEdgeGapMm,planarTimingVerified:timing,
  bothCableOrientationsDataConnected:true,chargingAndDataShareOneSocket:true,usbNumericPadNetAssignmentsVerified:38,
  usbConnectedPadChecks:40,ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
  gerberShortsAllLayers:0,independentPhysicalViolationsAllSeverities:0,presentationWarnings:drc.violations.length,
  hostUnconnectedItemsReported:drc.unconnected_items.length,ignoredNativeChecks:drc.ignored_checks,
  physicalLibraryRecordsPreserved:Number(library[1]),nativeBusLanesBootstrap:true,
  topSnapshot:{...artifact('images/am3352-ddr-usbc-native-clock-top.png'),visuallyInspected:true},
  bottomSnapshot:{...artifact('images/am3352-ddr-usbc-native-clock-bottom.png'),visuallyInspected:true},
  defaultChanged:false,fullElectricalTimingQualified:false,wholeByte1PlanarTimingPass:false,
  controlledImpedanceQualified:false,completePowerRouting:false,linuxInstallerTested:false,originalShellFitVerified:false,
  fabricationReady:false,scope:'Separate clock-access diagnostic; both byte1 strobes were opened before native routing. The 23 channels include the clock pair and do not add to the default 23. Restore both strobes and pass whole-byte matching before promotion; address/control, full host, stackup and measured original-shell geometry remain incomplete.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({status:summary.status,connected:23,open:26,clockSkewMm:summary.clockPlanarSkewMm,shorts:0,physicalViolations:0,defaultChanged:false,fabricationReady:false}))
