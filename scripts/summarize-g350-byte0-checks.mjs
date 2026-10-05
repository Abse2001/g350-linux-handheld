import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
const [nativeRoot,root,entry,mode]=process.argv.slice(2),matched=['matched','complete-bus'].includes(mode)
assert(nativeRoot&&root&&entry)
const read=p=>JSON.parse(readFileSync(p,'utf8'))
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const sourcePath=`${nativeRoot}/compiled.circuit.json`,circuit=read(sourcePath)
const powerSummary=read('checks/integrated/g350-ddr-power-combined/check-summary.json'),power=read(powerSummary.source.path)
assert.equal(artifact(powerSummary.source.path).sha256,powerSummary.source.sha256)
for(const type of ['source_component','source_port','source_net','pcb_component','pcb_smtpad','pcb_plated_hole','pcb_hole','pcb_solder_paste','pcb_port'])assert.deepEqual(circuit.filter(e=>e.type===type),power.filter(e=>e.type===type),'Changed functional records or placement: '+type)
const functionalTrace=t=>({id:t.source_trace_id,name:t.name,ports:t.connected_source_port_ids,nets:t.connected_source_net_ids})
assert.deepEqual(circuit.filter(e=>e.type==='source_trace').map(functionalTrace),power.filter(e=>e.type==='source_trace').map(functionalTrace))
for(const t of power.filter(e=>['pcb_trace','pcb_via'].includes(e.type))){
 const key=t.type==='pcb_trace'?'pcb_trace_id':'pcb_via_id'
 assert.deepEqual(circuit.find(e=>e.type===t.type&&e[key]===t[key]),t,'Changed power copper '+t[key])
}
const result=read(`${nativeRoot}/result.json`),execution=read(`${nativeRoot}/execution.json`)
assert(result.selectedPhaseFinished&&result.sourceDefinitionsUnchanged&&!result.forcedTimeout)
for(const d of execution.definitions){assert.equal(artifact(d.path).sha256,d.sha256);assert.equal(artifact(d.originalPath).sha256,d.sha256)}
assert.equal(artifact(execution.nativeChecks.path).sha256,execution.nativeChecks.sha256)
const nativeErrors=circuit.filter(e=>e.type.endsWith('_error')).reduce((r,e)=>{r[e.type]=(r[e.type]??0)+1;return r},{})
assert.deepEqual(nativeErrors,{pcb_port_not_connected_error:818,pcb_trace_missing_error:108})
assert.equal(circuit.filter(e=>e.type==='pcb_trace').length,112)
assert.equal(circuit.filter(e=>e.type==='pcb_via').length,119)
const board=circuit.find(e=>e.type==='pcb_board')
assert.deepEqual(board.outline,read('mechanical/g350-provisional-outline.json').outline)
assert.equal(board.num_layers,4);assert.equal(board.width,76);assert.equal(board.height,118)
const drc=read(`${root}/final-drc.json`),plane=read(`${root}/plane-connectivity.json`),stencil=read(`${root}/stencil-verified.json`),ddr=read(`${root}/ddr-connectivity.json`),timing=read(`${root}/full-ddr-timing.json`)
assert.equal(drc.violations.filter(v=>v.severity==='error').length,0)
assert(drc.violations.every(v=>['silk_edge_clearance','silk_overlap','silk_over_copper'].includes(v.type)))
assert.equal(plane.status,'PASS_NUMERIC_PAD_VIA_FILLED_PLANE_CONNECTIVITY')
assert.equal(plane.checkedPackageTerminals,101);assert.equal(plane.physicalThroughVias,119)
const boardArtifact=artifact(`${root}/g350-byte0.kicad_pcb`),sourceArtifact=artifact(sourcePath)
for(const report of [plane,ddr]){assert.equal(report.board.sha256,boardArtifact.sha256);assert.equal(report.circuit.sha256,sourceArtifact.sha256)}
assert.equal(stencil.boardSha256,boardArtifact.sha256);assert.equal(stencil.circuitSha256,sourceArtifact.sha256)
assert(stencil.readOnlyVerification&&stencil.copperMaskDrillPlacementAndNetsUnchanged)
const expected=[...Array.from({length:8},(_,i)=>`DDR_D${i}`),'DDR_DQM0','DDR_DQS0','DDR_DQSn0'].sort()
const byteBus=circuit.find(e=>e.type==='source_bus'&&e.name==='DDR_BYTE0')
const byteBusNames=byteBus.source_trace_ids.map(id=>circuit.find(e=>e.type==='source_trace'&&e.source_trace_id===id).name).sort()
const completeByteBus=JSON.stringify(byteBusNames)===JSON.stringify(expected)
if(mode==='complete-bus'){
 assert(completeByteBus,'Complete byte0 source-bus membership is required')
 assert.equal(byteBus.max_length_skew,.635)
 assert.equal(read(`${root}/core-upgrade-and-bus-check.json`).source.sha256,sourceArtifact.sha256)
}
assert.deepEqual(ddr.results.filter(r=>r.connected).map(r=>r.name).sort(),expected)
assert.equal(ddr.requiredSignals,49);assert.equal(timing.connectedSignals,11)
assert.equal(timing.circuitSha256,sourceArtifact.sha256)
const byte=timing.timing.find(t=>t.name==='DDR_BYTE0'),pair=timing.timing.find(t=>t.name==='DDR_DQS0_PAIR')
assert(pair.pass)
if(matched)assert(byte.pass,'Byte0 planar skew does not pass')
assert.match(readFileSync(`${root}/shorts.log`,'utf8'),/No shorts detected/)
const project=read(`${root}/g350-byte0.kicad_pro`)
assert.deepEqual(project.board.design_settings.drc_exclusions,[])
assert(Object.values(project.board.design_settings.rule_severities).every(s=>s!=='ignore'))
assert.match(readFileSync(`${root}/library.log`,'utf8'),/Exported 280 exact local footprints; all \d+ physical records unchanged/)
const nativeSeven=read('lib/am3352/placement/ddr-byte0-seven-native-paths.json')
const stageTraces=circuit.filter(e=>e.type==='pcb_trace'&&e.pcb_trace_id.startsWith('saved_phase_null_2_'))
assert.equal(stageTraces.length,9)
const samePoint=(a,b)=>a.route_type===b.route_type&&Math.hypot(a.x-b.x,a.y-b.y)<1e-8&&(a.route_type==='wire'?a.layer===b.layer:a.from_layer===b.from_layer&&a.to_layer===b.to_layer)
for(let i=0;i<7;i++){
 let cursor=0
 for(const point of nativeSeven[i].route){
  while(cursor<stageTraces[i].route.length&&!samePoint(point,stageTraces[i].route[cursor]))cursor++
  assert(cursor<stageTraces[i].route.length,'Lost native bootstrap waypoint');cursor++
 }
}
const report={status:matched?'PASS_SCOPED_SHAPED_BYTE0_PHYSICAL_CONNECTIVITY_AND_PLANAR_SKEW':'PASS_SCOPED_SHAPED_BYTE0_PHYSICAL_CONNECTIVITY_UNMATCHED',entry,source:sourceArtifact,board:boardArtifact,
 sourceFunctionalRecordsAndPhysicalPlacementPreserved:true,all101PowerTracesAnd97PowerViasPreserved:true,
 dimensionsMm:{width:board.width,height:board.height,thickness:board.thickness},copperLayers:4,placedComponents:280,
 checkedConnectedDdrSignals:11,requiredDdrSignals:49,remainingDdrSignals:38,
 completeByte0SourceBus:completeByteBus,byte0SourceBusSignals:byteBusNames,
 nativeBusLanesBootstrapUsed:true,nativeFullNineLaneSolve:false,nativeSevenCarrierWaypointsRetained:true,
 manualLastTwoCarriers:true,manualStrobeAndDataLengthRepairs:matched,
 byte0PlanarSkewMm:byte.skewMm,byte0PlanarSkewLimitMm:byte.limitMm,byte0PlanarSkewPass:byte.pass,
 strobePairPlanarSkewMm:pair.skewMm,strobePairPlanarSkewPass:true,
 bothReferencePlanesContinuous:true,checkedPackagePowerTerminals:101,traces:112,physicalThroughVias:119,nativeErrors,
 independentPhysicalErrors:0,presentationWarnings:drc.violations.length,reportedUnconnectedItems:drc.unconnected_items.length,unconnectedItemsMayBeCapped:true,
 allLayerGerberShorts:0,noIgnoredKiCadRulesOrExclusions:true,ddrElectricalTimingQualified:false,
 stackupImpedanceQualified:false,bypassCapacitorsRouted:false,originalShellFitVerified:false,fabricationReady:false,
 evidence:[artifact(`${nativeRoot}/execution.json`),artifact(`${nativeRoot}/result.json`),artifact(`${root}/final-drc.json`),artifact(`${root}/plane-connectivity.json`),artifact(`${root}/stencil-verified.json`),artifact(`${root}/ddr-connectivity.json`),artifact(`${root}/full-ddr-timing.json`),artifact(`${root}/shorts.log`),artifact(`${root}/library.log`),artifact('checks/integrated/g350-ddr-bootstrap/byte0-seven-native-cache.json'),artifact('checks/integrated/g350-ddr-power-combined/check-summary.json'),
  ...(mode==='complete-bus'?['core-upgrade-and-bus-check.json','plane-checker.executed.py','ddr-checker.executed.py','stencil-checker.executed.py'].map(p=>artifact(`${root}/${p}`)):[])],
 scope:'Only byte0 numeric-pad continuity, physical copper/drill clearance, and the existing 101 package-to-plane connections. Planar skew is reported separately. Complete DDR timing/impedance, 38 signals, bypass and converter loops, remaining host connectivity, Linux and original-shell fit remain unfinished.'}
writeFileSync(`${root}/check-summary.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,connectedDdrSignals:11,remainingDdrSignals:38,independentPhysicalErrors:0,planarSkewMm:byte.skewMm}))
