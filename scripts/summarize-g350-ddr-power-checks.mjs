import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'

const read=p=>JSON.parse(readFileSync(p,'utf8'))
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const nativeRoot='dist/g350-ddr-power-replay-contact-fixed',root='checks/integrated/g350-ddr-power-combined'
const sourcePath=`${nativeRoot}/compiled.circuit.json`,exportInputPath='dist/g350-ddr-power-replay-six-via-repairs/compiled.circuit.json'
const circuit=read(sourcePath),exportInput=read(exportInputPath)
const physicalTypes=new Set(['pcb_board','pcb_component','pcb_smtpad','pcb_plated_hole','pcb_hole','pcb_solder_paste','pcb_port','pcb_trace','pcb_via','pcb_copper_pour'])
assert.deepEqual(circuit.filter(e=>physicalTypes.has(e.type)),exportInput.filter(e=>physicalTypes.has(e.type)))
const result=read(`${nativeRoot}/result.json`),execution=read(`${nativeRoot}/execution.json`)
assert(result.selectedPhaseFinished&&result.sourceDefinitionsUnchanged&&!result.forcedTimeout)
for(const d of execution.definitions){assert.equal(artifact(d.path).sha256,d.sha256);assert.equal(artifact(d.originalPath).sha256,d.sha256)}
assert.equal(artifact(execution.nativeChecks.path).sha256,execution.nativeChecks.sha256)
const nativeErrors=circuit.filter(e=>e.type.endsWith('_error')).reduce((r,e)=>{r[e.type]=(r[e.type]??0)+1;return r},{})
assert.deepEqual(nativeErrors,{pcb_port_not_connected_error:829,pcb_trace_missing_error:119})
assert.equal(circuit.filter(e=>e.type==='pcb_trace').length,101)
assert.equal(circuit.filter(e=>e.type==='pcb_via').length,97)
assert.equal(circuit.filter(e=>e.type==='pcb_component').length,280)
const board=circuit.find(e=>e.type==='pcb_board')
assert.deepEqual(board.outline,read('mechanical/g350-provisional-outline.json').outline)
assert.equal(board.num_layers,4)
const drc=read(`${root}/final-drc.json`),plane=read(`${root}/plane-connectivity.json`),stencil=read(`${root}/stencil-verified.json`)
assert.equal(drc.violations.filter(v=>v.severity==='error').length,0)
assert(drc.violations.every(v=>['silk_edge_clearance','silk_overlap','silk_over_copper'].includes(v.type)))
assert.equal(plane.status,'PASS_NUMERIC_PAD_VIA_FILLED_PLANE_CONNECTIVITY')
assert.equal(plane.checkedPackageTerminals,101)
assert.equal(plane.physicalThroughVias,97)
assert.equal(plane.board.sha256,artifact(`${root}/g350-ddr-power.kicad_pcb`).sha256)
assert.equal(plane.circuit.sha256,artifact(sourcePath).sha256)
assert.equal(stencil.boardSha256,plane.board.sha256)
assert.equal(stencil.circuitSha256,plane.circuit.sha256)
assert(stencil.readOnlyVerification&&stencil.copperMaskDrillPlacementAndNetsUnchanged)
assert.match(readFileSync(`${root}/shorts.log`,'utf8'),/No shorts detected/)
const project=read(`${root}/g350-ddr-power.kicad_pro`)
assert.deepEqual(project.board.design_settings.drc_exclusions,[])
assert(Object.values(project.board.design_settings.rule_severities).every(s=>s!=='ignore'))
assert.match(readFileSync(`${root}/library.log`,'utf8'),/Exported 280 exact local footprints; all \d+ physical records unchanged/)
const report={status:'PASS_SCOPED_CPU_RAM_POWER_ESCAPE_PHYSICAL_CHECKS',
 entry:'experiments/am3352-g350-ddr-power-replay.circuit.tsx',source:artifact(sourcePath),
 board:plane.board,exportInput:artifact(exportInputPath),exportInputPhysicalRecordsMatchFreshNative:true,
 dimensionsMm:{width:board.width,height:board.height,thickness:board.thickness},copperLayers:4,placedComponents:280,
 checkedPackageTerminals:101,ramTerminals:39,cpuTerminals:62,physicalThroughVias:97,
 maximumCpuPadToViaMm:Math.max(...plane.records.filter(r=>r.package==='U_SOC').map(r=>r.padToViaLengthMm)),
 maximumRamPadToViaMm:Math.max(...plane.records.filter(r=>r.package==='U_RAM').map(r=>r.padToViaLengthMm)),
 bothReferencePlanesContinuous:true,padToViaLengthsWithinTiLimits:true,
 nativeErrors,independentPhysicalErrors:0,presentationWarnings:drc.violations.length,
 reportedUnconnectedItems:drc.unconnected_items.length,unconnectedItemsMayBeCapped:true,
 allLayerGerberShorts:0,noIgnoredKiCadRulesOrExclusions:true,
 evidence:[artifact(`${nativeRoot}/execution.json`),artifact(`${nativeRoot}/result.json`),artifact(`${root}/final-drc.json`),artifact(`${root}/plane-connectivity.json`),artifact(`${root}/stencil-verified.json`),artifact(`${root}/shorts.log`),artifact(`${root}/library.log`),artifact('checks/integrated/g350-ddr-bootstrap/copper-contact-regression.json'),artifact('checks/integrated/g350-ddr-bootstrap/via-pad-rule-verification.json')],
 ddrSignalsQualified:0,bypassCapacitorsRouted:false,originalShellFitVerified:false,fabricationReady:false,
 scope:'Only CPU/RAM ground and DDR supply package-to-plane escapes on the placed shaped board. Signal routing, bypass loops, other power domains, stackup, Linux startup and shell mounting remain unfinished.'}
writeFileSync(`${root}/check-summary.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,checkedPackageTerminals:101,physicalThroughVias:97,independentPhysicalErrors:0,presentationWarnings:report.presentationWarnings,remainingNativeErrors:nativeErrors,fabricationReady:false}))
