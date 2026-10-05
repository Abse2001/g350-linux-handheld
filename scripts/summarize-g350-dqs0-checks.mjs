import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'

const read=p=>JSON.parse(readFileSync(p,'utf8'))
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const nativeRoot='dist/g350-dqs0-shaped-corridor-repair',root='checks/integrated/g350-dqs0-repaired'
const sourcePath=`${nativeRoot}/compiled.circuit.json`,circuit=read(sourcePath)
const powerSummary=read('checks/integrated/g350-ddr-power-combined/check-summary.json'),power=read(powerSummary.source.path)
assert.equal(artifact(powerSummary.source.path).sha256,powerSummary.source.sha256)
for(const type of ['source_component','source_port','source_net','source_trace','pcb_component','pcb_smtpad','pcb_plated_hole','pcb_hole','pcb_solder_paste','pcb_port'])assert.deepEqual(circuit.filter(e=>e.type===type),power.filter(e=>e.type===type))
for(const t of power.filter(e=>['pcb_trace','pcb_via'].includes(e.type))){
 const key=t.type==='pcb_trace'?'pcb_trace_id':'pcb_via_id'
 assert.deepEqual(circuit.find(e=>e.type===t.type&&e[key]===t[key]),t)
}
const result=read(`${nativeRoot}/result.json`),execution=read(`${nativeRoot}/execution.json`)
assert(result.selectedPhaseFinished&&result.sourceDefinitionsUnchanged&&!result.forcedTimeout)
for(const d of execution.definitions){assert.equal(artifact(d.path).sha256,d.sha256);assert.equal(artifact(d.originalPath).sha256,d.sha256)}
assert.equal(artifact(execution.nativeChecks.path).sha256,execution.nativeChecks.sha256)
const nativeErrors=circuit.filter(e=>e.type.endsWith('_error')).reduce((r,e)=>{r[e.type]=(r[e.type]??0)+1;return r},{})
assert.deepEqual(nativeErrors,{pcb_port_not_connected_error:827,pcb_trace_missing_error:117})
assert.equal(circuit.filter(e=>e.type==='pcb_trace').length,103)
assert.equal(circuit.filter(e=>e.type==='pcb_via').length,101)
const board=circuit.find(e=>e.type==='pcb_board')
assert.deepEqual(board.outline,read('mechanical/g350-provisional-outline.json').outline)
assert.equal(board.num_layers,4)
const drc=read(`${root}/final-drc.json`),plane=read(`${root}/plane-connectivity.json`),stencil=read(`${root}/stencil-verified.json`),ddr=read(`${root}/ddr-connectivity.json`)
assert.equal(drc.violations.filter(v=>v.severity==='error').length,0)
assert(drc.violations.every(v=>['silk_edge_clearance','silk_overlap','silk_over_copper'].includes(v.type)))
assert.equal(plane.status,'PASS_NUMERIC_PAD_VIA_FILLED_PLANE_CONNECTIVITY')
assert.equal(plane.checkedPackageTerminals,101)
assert.equal(plane.physicalThroughVias,101)
const boardArtifact=artifact(`${root}/g350-dqs0.kicad_pcb`),circuitArtifact=artifact(sourcePath)
for(const report of [plane,ddr]){assert.equal(report.board.sha256,boardArtifact.sha256);assert.equal(report.circuit.sha256,circuitArtifact.sha256)}
assert.equal(stencil.boardSha256,boardArtifact.sha256)
assert.equal(stencil.circuitSha256,circuitArtifact.sha256)
assert(stencil.readOnlyVerification&&stencil.copperMaskDrillPlacementAndNetsUnchanged)
assert.deepEqual(ddr.results.filter(r=>r.connected).map(r=>r.name).sort(),['DDR_DQS0','DDR_DQSn0'])
assert.equal(ddr.requiredSignals,49)
assert.match(readFileSync(`${root}/shorts.log`,'utf8'),/No shorts detected/)
const project=read(`${root}/g350-dqs0.kicad_pro`)
assert.deepEqual(project.board.design_settings.drc_exclusions,[])
assert(Object.values(project.board.design_settings.rule_severities).every(s=>s!=='ignore'))
assert.match(readFileSync(`${root}/library.log`,'utf8'),/Exported 280 exact local footprints; all \d+ physical records unchanged/)
const traces=circuit.filter(e=>e.type==='pcb_trace'&&e.pcb_trace_id.startsWith('saved_phase_null_1_'))
assert.equal(traces.length,2)
const lengths=traces.map(t=>t.route.slice(1).reduce((n,p,i)=>{const q=t.route[i];return n+(p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer?Math.hypot(p.x-q.x,p.y-q.y):0)},0))
const skew=Math.abs(lengths[0]-lengths[1])
assert(skew<=.127+1e-8)
assert(traces.every(t=>t.route.filter(p=>p.route_type==='via').length===2))
const report={status:'PASS_SCOPED_SHAPED_DQS0_CONNECTIVITY_AND_PHYSICAL_CHECKS',
 entry:'experiments/am3352-g350-dqs0-shaped-replay.circuit.tsx',source:circuitArtifact,board:boardArtifact,
 sourceFunctionalRecordsAndPhysicalPlacementPreserved:true,all101PowerTracesAnd97PowerViasPreserved:true,
 dimensionsMm:{width:board.width,height:board.height,thickness:board.thickness},copperLayers:4,placedComponents:280,
 checkedConnectedDdrSignals:2,requiredDdrSignals:49,remainingDdrSignals:47,
 nativeBusLanesBootstrapUsed:true,manualRamApproachRepair:true,
 planarLengthsMm:lengths,planarSkewMm:skew,planarSkewLimitMm:.127,
 bothReferencePlanesContinuous:true,checkedPackagePowerTerminals:101,
 traces:103,physicalThroughVias:101,nativeErrors,
 independentPhysicalErrors:0,presentationWarnings:drc.violations.length,
 reportedUnconnectedItems:drc.unconnected_items.length,unconnectedItemsMayBeCapped:true,
 allLayerGerberShorts:0,noIgnoredKiCadRulesOrExclusions:true,
 evidence:[artifact(`${nativeRoot}/execution.json`),artifact(`${nativeRoot}/result.json`),artifact(`${root}/final-drc.json`),artifact(`${root}/plane-connectivity.json`),artifact(`${root}/stencil-verified.json`),artifact(`${root}/ddr-connectivity.json`),artifact(`${root}/shorts.log`),artifact(`${root}/library.log`),artifact('checks/integrated/g350-ddr-bootstrap/dqs0-native-cache.json'),artifact('checks/integrated/g350-ddr-bootstrap/dqs0-corridor-repair.json'),artifact('checks/integrated/g350-ddr-power-combined/check-summary.json')],
 snapshots:{top:artifact(`${root}/g350-dqs0-top.png`),bottom:artifact(`${root}/g350-dqs0-bottom.png`)},
 ddrTimingQualified:false,stackupImpedanceQualified:false,bypassCapacitorsRouted:false,
 originalShellFitVerified:false,fabricationReady:false,
 scope:'Only two DDR strobe pad-to-pad connections plus the 101 existing package-to-plane escapes are checked here. The rest of DDR, bypass loops, other power domains, complete timing/impedance, Linux startup and shell mounting remain unfinished.'}
writeFileSync(`${root}/check-summary.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,checkedConnectedDdrSignals:2,remainingDdrSignals:47,independentPhysicalErrors:0,planarSkewMm:skew,fabricationReady:false}))
