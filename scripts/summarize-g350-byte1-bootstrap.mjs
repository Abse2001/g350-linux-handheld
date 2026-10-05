import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync,existsSync} from 'node:fs'

const [nativeRoot,root,mode]=process.argv.slice(2)
assert(nativeRoot&&root&&['escapes','strobes'].includes(mode))
const read=p=>JSON.parse(readFileSync(p,'utf8'))
const artifact=p=>({path:p,sha256:createHash('sha256').update(readFileSync(p)).digest('hex')})
const sourcePath=`${nativeRoot}/compiled.circuit.json`,circuit=read(sourcePath)
const basePath='dist/g350-current-index-byte0-handoff-fixed/compiled.circuit.json',base=read(basePath)
const byType=(c,t)=>c.filter(e=>e.type===t)
for(const type of ['source_component','source_port','source_net','pcb_component','pcb_smtpad','pcb_plated_hole','pcb_hole','pcb_solder_paste','pcb_port'])assert.deepEqual(byType(circuit,type),byType(base,type),'Functional/physical records changed: '+type)
const functional=t=>({id:t.source_trace_id,name:t.name,ports:t.connected_source_port_ids,nets:t.connected_source_net_ids})
assert.deepEqual(byType(circuit,'source_trace').map(functional),byType(base,'source_trace').map(functional))
const result=read(`${nativeRoot}/result.json`),execution=read(`${nativeRoot}/execution.json`)
assert(result.selectedPhaseFinished&&result.freshCompiledSource&&result.sourceDefinitionsUnchanged&&!result.forcedTimeout)
for(const d of execution.definitions){assert.equal(artifact(d.path).sha256,d.sha256);assert.equal(artifact(d.originalPath).sha256,d.sha256)}
assert.equal(artifact(execution.nativeChecks.path).sha256,execution.nativeChecks.sha256)
const baseSummary=read('checks/integrated/g350-byte0-complete-bus/check-summary.json')
assert.equal(baseSummary.source.sha256,artifact(basePath).sha256)
const powerSource=read('checks/integrated/g350-ddr-power-combined/check-summary.json').source
assert.equal(artifact(powerSource.path).sha256,powerSource.sha256)
for(const t of read(powerSource.path).filter(e=>['pcb_trace','pcb_via'].includes(e.type))){
 const id=t.type==='pcb_trace'?'pcb_trace_id':'pcb_via_id'
 assert.deepEqual(circuit.find(e=>e.type===t.type&&e[id]===t[id]),t,'Old power copper changed: '+t[id])
}
const baseVias=byType(base,'pcb_via')
for(const v of baseVias)assert.deepEqual(circuit.find(e=>e.type==='pcb_via'&&e.pcb_via_id===v.pcb_via_id),v,'Old signal/power via changed')
const length=route=>route.slice(1).reduce((n,p,i)=>n+(p.route_type==='wire'&&route[i].route_type==='wire'&&p.layer===route[i].layer?Math.hypot(p.x-route[i].x,p.y-route[i].y):0),0)
const changedOldSignals=[]
for(const t of byType(base,'pcb_trace')){
 const current=circuit.find(e=>e.type==='pcb_trace'&&e.pcb_trace_id===t.pcb_trace_id);assert(current)
 assert.equal(current.source_trace_id,t.source_trace_id)
 assert(Math.abs(length(current.route)-length(t.route))<1e-8,'Old planar length changed')
 if(JSON.stringify(current.route)!==JSON.stringify(t.route))changedOldSignals.push(byType(base,'source_trace').find(s=>s.source_trace_id===t.source_trace_id)?.name)
}
assert.deepEqual(changedOldSignals.sort(),['DDR_D6','DDR_DQM0'])
for(const name of ['DDR_BYTE0','DDR_BYTE1']){
 const bus=byType(circuit,'source_bus').find(b=>b.name===name)
 assert.equal(bus.source_trace_ids.length,11);assert.equal(bus.max_length_skew,.635)
}
for(const name of ['DDR_DQS0_PAIR','DDR_DQS1_PAIR']){
 const pair=byType(circuit,'source_bus').find(b=>b.name===name)
 assert.equal(pair.source_trace_ids.length,2);assert.equal(pair.max_length_skew,.127)
}
const board=byType(circuit,'pcb_board')[0]
assert.deepEqual(board.outline,read('mechanical/g350-provisional-outline.json').outline)
assert.equal(board.width,76);assert.equal(board.height,118);assert.equal(board.thickness,1.6);assert.equal(board.num_layers,4)
assert.equal(byType(circuit,'pcb_component').length,280)
assert.equal(byType(circuit,'pcb_via').length,141)
assert.equal(byType(circuit,'pcb_trace').length,mode==='strobes'?132:134)
const nativeErrors=circuit.filter(e=>e.type.endsWith('_error')).reduce((q,e)=>(q[e.type]=(q[e.type]??0)+1,q),{})
assert.deepEqual(nativeErrors,{pcb_port_not_connected_error:807,pcb_trace_missing_error:97,pcb_bus_length_skew_error:mode==='strobes'?1:2})
const boardPath=`${root}/${mode==='strobes'?'g350-seeded-strobes':'g350-byte1-escapes'}.kicad_pcb`,boardArtifact=artifact(boardPath),source=artifact(sourcePath)
const drc=read(`${root}/drc.json`),planes=read(`${root}/reference-plane-connectivity.json`),ddr=read(`${root}/ddr-connectivity.json`),escapes=read(`${root}/package-escape-connectivity.json`),stencil=read(`${root}/stencil-verification.json`),timing=read(`${root}/full-ddr-timing.json`)
assert.equal(drc.violations.filter(v=>v.severity==='error').length,0)
assert(drc.violations.every(v=>['via_dangling','silk_edge_clearance','silk_overlap','silk_over_copper'].includes(v.type)))
assert(!drc.violations.some(v=>v.excluded===true))
for(const report of [planes,ddr,escapes]){assert.equal(report.board.sha256,boardArtifact.sha256);assert.equal(report.circuit.sha256,source.sha256)}
assert.equal(planes.checkedPackageTerminals,101);assert.equal(planes.physicalThroughVias,141);assert(planes.bothReferencePlanesContinuous)
assert.equal(escapes.checkedPackagePads,22);assert.equal(escapes.connectedByte1Channels,mode==='strobes'?2:0)
const expected=[...Array.from({length:8},(_,i)=>`DDR_D${i}`),'DDR_DQM0','DDR_DQS0','DDR_DQSn0',...(mode==='strobes'?['DDR_DQS1','DDR_DQSn1']:[])].sort()
assert.deepEqual(ddr.results.filter(r=>r.connected).map(r=>r.name).sort(),expected)
assert.equal(timing.connectedSignals,expected.length)
assert.equal(timing.circuitSha256,source.sha256)
const byte0=timing.timing.find(t=>t.name==='DDR_BYTE0'),pair0=timing.timing.find(t=>t.name==='DDR_DQS0_PAIR'),pair1=timing.timing.find(t=>t.name==='DDR_DQS1_PAIR')
assert(byte0.pass&&pair0.pass)
if(mode==='strobes')assert(pair1.pass)
assert.equal(stencil.boardSha256,boardArtifact.sha256);assert.equal(stencil.circuitSha256,source.sha256)
assert(stencil.readOnlyVerification&&stencil.copperMaskDrillPlacementAndNetsUnchanged)
assert.match(readFileSync(`${root}/shorts.log`,'utf8'),/No shorts detected/)
const projectPath=boardPath.replace(/\.kicad_pcb$/,'.kicad_pro')
if(existsSync(projectPath)){
 const settings=read(projectPath).board.design_settings
 assert.deepEqual(settings.drc_exclusions??[],[])
 assert(Object.values(settings.rule_severities??{}).every(s=>s!=='ignore'))
}
const evidenceNames=['drc.json','reference-plane-connectivity.json','ddr-connectivity.json','package-escape-connectivity.json','stencil-verification.json','full-ddr-timing.json','shorts.log','escape-checker.executed.py','plane-checker.executed.py','ddr-checker.executed.py','stencil-checker.executed.py','kicad-adapter.executed.mjs','library-adapter.executed.py']
const escapeExecuted=artifact(`${root}/escape-checker.executed.py`)
assert.equal(escapeExecuted.sha256,escapes.checker.sha256)
const report={status:mode==='strobes'?'PASS_SCOPED_BYTE1_STROBE_CONTINUITY_PLANAR_SKEW_AND_22_ESCAPES':'PASS_SCOPED_22_BYTE1_PACKAGE_ESCAPES',source,board:boardArtifact,base:artifact(basePath),
 sourceFunctionalRecordsAndAll280PlacementsPreserved:true,all101PowerTracesAnd119OldViasPreserved:true,changedOldSignalRoutes:changedOldSignals,oldPlanarLengthsPreserved:true,
 dimensionsMm:{width:76,height:118,thickness:1.6},copperLayers:4,traces:byType(circuit,'pcb_trace').length,physicalThroughVias:141,
 checkedNewPackageEscapes:22,checkedConnectedDdrSignals:expected.length,requiredDdrSignals:49,remainingDdrSignals:49-expected.length,
 completeByte0AndByte1SourceBuses:true,byte0PlanarSkewMm:byte0.skewMm,byte0PlanarSkewPass:true,
 byte1StrobePairPlanarSkewMm:pair1.skewMm,byte1StrobePairPlanarSkewPass:mode==='strobes',byte1FullBusMatched:false,
 nativeBusLanesBootstrapUsedForRetainedByte0:true,nativeErrors,independentPhysicalErrors:0,
 presentationWarnings:drc.violations.filter(v=>v.type.startsWith('silk_')).length,danglingEscapeViaWarnings:drc.violations.filter(v=>v.type==='via_dangling').length,
 reportedUnconnectedItems:drc.unconnected_items.length,unconnectedItemsMayBeCapped:true,allLayerGerberShorts:0,
 bothReferencePlanesContinuous:true,checkedPackagePowerTerminals:101,
 fullDrcPass:false,noPerItemDrcExclusions:true,ddrElectricalTimingQualified:false,stackupImpedanceQualified:false,fullStencilQualification:false,
 bypassAndConverterLoopsQualified:false,linuxBringupVerified:false,originalShellFitVerified:false,defaultChanged:false,fabricationReady:false,
 evidence:[artifact(`${nativeRoot}/execution.json`),artifact(`${nativeRoot}/result.json`),...evidenceNames.map(n=>artifact(`${root}/${n}`))],
 scope:'Numeric pad-to-via escapes, retained byte0 and optional byte1 strobe continuity/planar skew, physical copper/drill checks and the existing 101 package-to-plane connections. Nine byte1 data/mask carriers, other DDR signals, full timing/impedance/coupling, host power/peripherals, Linux, stencil and measured original-shell fit remain unfinished.'}
writeFileSync(`${root}/check-summary.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,connectedDdrSignals:expected.length,remainingDdrSignals:49-expected.length,physicalErrors:0,byte1PairSkewMm:pair1.skewMm}))
