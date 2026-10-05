import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const root='checks/layout/ddr-corridor-variant',read=p=>JSON.parse(readFileSync(p))
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const circuit='dist/experiments/am3352-g350-ddr-corridor/circuit.json'
const entry='experiments/am3352-g350-ddr-corridor.circuit.tsx'
const audit=read(`${root}/ddr-corridor-audit.json`),render=read(`${root}/g350-ddr-corridor-render.json`)
const stencil=read(`${root}/stencil-final-verification.json`),notes=read(`${root}/engineering-notes.json`)
const parentPath='checks/layout/pin-allocation-variant/g350-pin-allocation-check-summary.json',parent=read(parentPath)
const mechanical=read('mechanical/g350-outline-exchange-check.json'),pdf=read('mechanical/g350-fit-template-pdf-check.json')
for(const proof of [audit,parent,mechanical,pdf])for(const [p,h] of Object.entries(proof.hashes))assert.equal(sha(p),h,'Stale evidence '+p)
assert.equal(audit.status,'PASS_DDR_CORRIDOR_PLACEMENT_ONLY')
assert(audit.exactSourceConnectivityPreserved&&audit.allExplicitNetNamesDistinct&&audit.physicalPadAndNativePasteTransformVerified)
assert(audit.movedCourtyardsClear);assert.equal(audit.movedComponents,46)
assert.equal(audit.logicalComponents,280);assert.equal(audit.copperLayers,4)
assert.equal(audit.ddrBypassPlacement.length,32);assert.equal(audit.sourceDistances.length,28)
assert.equal(render.circuitSha256,sha(circuit))
for(const [p,h] of Object.entries(render.outputs))assert.equal(sha(p),h)
assert.match(readFileSync(`${root}/build.log`,'utf8'),/Circuits\s+1 passed/)
assert.match(readFileSync(`${root}/build.log`,'utf8'),/code 0: build finished successfully/)
assert.match(readFileSync(`${root}/shorts.log`,'utf8'),/No shorts detected/)
const tc=readFileSync(`${root}/typecheck.log`,'utf8')
assert.match(tc,/tsc --noEmit/);assert(!/error TS\d|FATAL ERROR/.test(tc))
assert.equal(stencil.status,'PASS_SMT_STENCIL_METADATA_ONLY')
assert(stencil.readOnlyVerification&&stencil.copperMaskDrillPlacementAndNetsUnchanged&&stencil.nativePadShapeCornerRadiusAndPolygonVerticesVerified)
assert.equal(stencil.circuitSha256,sha(circuit));assert.equal(stencil.boardSha256,sha(`${root}/g350-ddr-corridor.kicad_pcb`))
assert.equal(stencil.helperSha256,sha('scripts/prepare-g350-stencil.py'))
for(const [k,n] of Object.entries({matchedPhysicalPads:1165,matchedNonplatedHoles:2,noPasteSmtPads:48,
 scaledSmtApertures:1104,fullSizeSmtApertures:9,unassociatedNativeApertures:8}))assert.equal(stencil[k],n)
assert.equal(stencil.fullStencilQualification,false)
const drc=read(`${root}/g350-ddr-corridor-kicad-drc.json`),warningTypes={}
assert.equal(drc.violations.filter(v=>v.severity==='error').length,0)
for(const v of drc.violations){assert.equal(v.severity,'warning');warningTypes[v.type]=(warningTypes[v.type]??0)+1}
const project=read(`${root}/g350-ddr-corridor.kicad_pro`)
assert.equal(project.board.design_settings.drc_exclusions.length,0)
assert(!Object.values(project.board.design_settings.rule_severities).includes('ignore'))
const library=readFileSync(`${root}/kicad-library.log`,'utf8')
assert.match(library,/Exported 280 exact local footprints; all 306 physical records unchanged/)
const footprints=readdirSync(`${root}/tscircuit.pretty`).filter(p=>p.endsWith('.kicad_mod')).sort()
assert.equal(footprints.length,280)
assert.equal(mechanical.entry,entry);assert.equal(pdf.entry,entry)
assert(mechanical.exactDxfRoundTrip&&mechanical.exactCompiledOutlinePreserved&&pdf.savedVectorOutlineMatchesCircuit)
assert.equal(notes.fabricationReady,false)
const paths=[circuit,entry,...Object.keys(audit.hashes),...Object.keys(render.outputs),...Object.keys(mechanical.hashes),...Object.keys(pdf.hashes),
 parentPath,`${root}/ddr-corridor-audit.json`,`${root}/g350-ddr-corridor-render.json`,`${root}/engineering-notes.json`,
 `${root}/g350-ddr-corridor.kicad_pcb`,`${root}/g350-ddr-corridor.kicad_pro`,`${root}/g350-ddr-corridor.kicad_dru`,
 `${root}/g350-ddr-corridor-kicad-drc.json`,`${root}/stencil-final-verification.json`,`${root}/fp-lib-table`,`${root}/kicad-library.log`,
 `${root}/build.log`,`${root}/typecheck.log`,`${root}/shorts.log`,'mechanical/g350-outline-exchange-check.json',
 'mechanical/g350-fit-template-pdf-check.json','scripts/render-g350-ddr-corridor.mjs','scripts/summarize-g350-ddr-corridor.mjs',
 'scripts/prepare-g350-placement-kicad.mjs','scripts/prepare-g350-stencil.py','scripts/prepare-kicad-library.py',
 ...footprints.map(p=>`${root}/tscircuit.pretty/${p}`)]
const summary={status:'CHECKED_DDR_CORRIDOR_COMPONENT_PLACEMENT',fabricationReady:false,originalShellFitVerified:false,
 routingPermitted:false,fullHandheldPlacementComplete:false,entry,defaultEntryRemainsHistoricalDdrFixture:true,
 logicalComponents:280,movedComponents:46,ramGroupTranslatedParts:18,lcdSourceResistorsRelocated:28,
 dimensionsMm:audit.dimensionsMm,cpuToRamCenterDistanceMm:20,copperLayers:4,nativeErrors:0,
 buildExitCode:0,typecheckExitCode:0,allLayerGerberShorts:0,exactFunctionalSourcePreserved:true,
 allExplicitNetNamesDistinct:true,physicalPadsAndNativePasteTransformVerified:true,movedCourtyardsClear:true,
 minCopperEdgeClearanceLowerBoundMm:audit.minCopperEdgeClearanceLowerBoundMm,
 ddrBypassPlacement:audit.ddrBypassPlacement,sourceDistances:audit.sourceDistances,
 parentCpuBypassMetrics:parent.parentCpuBypassMetrics,
 smtStencil:{matchedPads:1165,matchedNonplatedHoles:2,scaledApertures:1104,fullSizeApertures:9,noPastePads:48,
  geometryPreserved:true,nativeThroughHoleAperturesUnqualified:8,fullStencilQualification:false},
 independentKicad:{processExitCode:5,errors:0,warningCount:drc.violations.length,warningTypes,
  unconnectedItemsReported:drc.unconnected_items.length,unconnectedCountIsComplete:false,
  perItemExclusions:0,ignoredRuleSeverities:0,exactLocalFootprints:280,
  physicalRecordSha256:/Physical-record SHA256: (\w+)/.exec(library)[1],fullDrcPass:false,
  scope:'Unrouted placement. Full DRC fails because open connections and silkscreen warnings remain.'},
 mechanical:{outlineExchangeVerified:true,actualSizePdfVerified:true,shellFitVerified:false,mountingGeometryVerified:false},
 remaining:notes.remaining,scope:audit.scope,
 hashes:Object.fromEntries([...new Set(paths)].map(p=>[p,sha(p)]))}
writeFileSync(`${root}/g350-ddr-corridor-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({...summary,ddrBypassPlacement:'32 measured',sourceDistances:'28 measured',parentCpuBypassMetrics:'59 preserved',hashes:'stored in summary'},null,2))
