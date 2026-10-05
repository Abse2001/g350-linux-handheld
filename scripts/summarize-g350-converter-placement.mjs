import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const root='checks/layout/converter-placement-variant',read=p=>JSON.parse(readFileSync(p))
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const circuit='dist/experiments/am3352-g350-converter-placement/circuit.json'
const entry='experiments/am3352-g350-converter-placement.circuit.tsx'
const audit=read(`${root}/converter-placement-audit.json`),render=read(`${root}/g350-converter-placement-render.json`)
const stencil=read(`${root}/stencil-final-verification.json`),notes=read(`${root}/engineering-notes.json`)
const parentPath='checks/layout/pmic-placement-variant/g350-pmic-placement-check-summary.json',parent=read(parentPath)
const mechanical=read('mechanical/g350-outline-exchange-check.json'),pdf=read('mechanical/g350-fit-template-pdf-check.json')
for(const proof of [audit,parent,mechanical,pdf])for(const [p,h] of Object.entries(proof.hashes))assert.equal(sha(p),h,'Stale evidence '+p)
assert.equal(audit.status,'PASS_CONVERTER_PLACEMENT_ONLY')
assert(audit.exactSourceConnectivityPreserved&&audit.allExplicitNetNamesDistinct&&audit.physicalPadAndNativePasteTransformVerified)
assert(audit.movedCourtyardsClear);assert.equal(audit.movedComponents,17)
assert(audit.all280CourtyardsNonoverlapping)
assert.equal(audit.logicalComponents,280);assert.equal(audit.copperLayers,4)
assert.equal(audit.ddrBypassPlacement.length,32);assert.equal(audit.converterDistances.length,30)
assert.equal(render.circuitSha256,sha(circuit))
for(const [p,h] of Object.entries(render.outputs))assert.equal(sha(p),h)
assert.match(readFileSync(`${root}/build.log`,'utf8'),/Circuits\s+1 passed/)
assert.match(readFileSync(`${root}/build.log`,'utf8'),/code 0: build finished successfully/)
assert.match(readFileSync(`${root}/shorts.log`,'utf8'),/No shorts detected/)
const tc=readFileSync(`${root}/typecheck.log`,'utf8')
assert.match(tc,/tsc --noEmit/);assert(!/error TS\d|FATAL ERROR/.test(tc))
assert.equal(stencil.status,'PASS_SMT_STENCIL_METADATA_ONLY')
assert(stencil.readOnlyVerification&&stencil.copperMaskDrillPlacementAndNetsUnchanged&&stencil.nativePadShapeCornerRadiusAndPolygonVerticesVerified)
assert.equal(stencil.circuitSha256,sha(circuit));assert.equal(stencil.boardSha256,sha(`${root}/g350-converter-placement.kicad_pcb`))
assert.equal(stencil.helperSha256,sha('scripts/prepare-g350-stencil.py'))
for(const [k,n] of Object.entries({matchedPhysicalPads:1165,matchedNonplatedHoles:2,noPasteSmtPads:48,
 scaledSmtApertures:1104,fullSizeSmtApertures:9,unassociatedNativeApertures:8}))assert.equal(stencil[k],n)
assert.equal(stencil.fullStencilQualification,false)
const drc=read(`${root}/g350-converter-placement-kicad-drc.json`),warningTypes={}
assert.equal(drc.violations.filter(v=>v.severity==='error').length,0)
for(const v of drc.violations){assert.equal(v.severity,'warning');warningTypes[v.type]=(warningTypes[v.type]??0)+1}
const project=read(`${root}/g350-converter-placement.kicad_pro`)
assert.equal(project.board.design_settings.drc_exclusions.length,0)
assert(!Object.values(project.board.design_settings.rule_severities).includes('ignore'))
const library=readFileSync(`${root}/kicad-library.log`,'utf8')
assert.match(library,/Exported 280 exact local footprints; all 306 physical records unchanged/)
const footprints=readdirSync(`${root}/tscircuit.pretty`).filter(p=>p.endsWith('.kicad_mod')).sort()
assert.equal(footprints.length,280)
assert.equal(mechanical.entry,parent.mechanical.inheritedFrom);assert.equal(pdf.entry,parent.mechanical.inheritedFrom)
assert(mechanical.exactDxfRoundTrip&&mechanical.exactCompiledOutlinePreserved&&pdf.savedVectorOutlineMatchesCircuit)
assert.equal(notes.fabricationReady,false)
const paths=[circuit,entry,...Object.keys(audit.hashes),...Object.keys(render.outputs),...Object.keys(mechanical.hashes),...Object.keys(pdf.hashes),
 parentPath,`${root}/converter-placement-audit.json`,`${root}/g350-converter-placement-render.json`,`${root}/engineering-notes.json`,
 `${root}/g350-converter-placement.kicad_pcb`,`${root}/g350-converter-placement.kicad_pro`,`${root}/g350-converter-placement.kicad_dru`,
 `${root}/g350-converter-placement-kicad-drc.json`,`${root}/stencil-final-verification.json`,`${root}/fp-lib-table`,`${root}/kicad-library.log`,
 `${root}/build.log`,`${root}/typecheck.log`,`${root}/shorts.log`,'mechanical/g350-outline-exchange-check.json',
 'mechanical/g350-fit-template-pdf-check.json','scripts/render-g350-converter-placement.mjs','scripts/summarize-g350-converter-placement.mjs',
 'scripts/prepare-g350-placement-kicad.mjs','scripts/prepare-g350-stencil.py','scripts/prepare-kicad-library.py',
 ...footprints.map(p=>`${root}/tscircuit.pretty/${p}`)]
const summary={status:'CHECKED_CONVERTER_COMPONENT_PLACEMENT',fabricationReady:false,originalShellFitVerified:false,
 routingPermitted:false,fullHandheldPlacementComplete:false,entry,defaultEntryRemainsHistoricalDdrFixture:true,
 logicalComponents:280,movedComponents:17,converterSupportComponentsRelocated:17,
 dimensionsMm:audit.dimensionsMm,cpuToRamCenterDistanceMm:20,copperLayers:4,nativeErrors:0,
 buildExitCode:0,typecheckExitCode:0,allLayerGerberShorts:0,exactFunctionalSourcePreserved:true,
 allExplicitNetNamesDistinct:true,physicalPadsAndNativePasteTransformVerified:true,movedCourtyardsClear:true,
 all280CourtyardsNonoverlapping:true,
 minCopperEdgeClearanceLowerBoundMm:audit.minCopperEdgeClearanceLowerBoundMm,
 ddrBypassPlacement:audit.ddrBypassPlacement,converterDistances:audit.converterDistances,
 parentCpuBypassMetrics:parent.parentCpuBypassMetrics,
 parentPmicDistances:parent.pmicDistances,
 smtStencil:{matchedPads:1165,matchedNonplatedHoles:2,scaledApertures:1104,fullSizeApertures:9,noPastePads:48,
  geometryPreserved:true,nativeThroughHoleAperturesUnqualified:8,fullStencilQualification:false},
 independentKicad:{processExitCode:5,errors:0,warningCount:drc.violations.length,warningTypes,
  unconnectedItemsReported:drc.unconnected_items.length,unconnectedCountIsComplete:false,
  perItemExclusions:0,ignoredRuleSeverities:0,exactLocalFootprints:280,
  physicalRecordSha256:/Physical-record SHA256: (\w+)/.exec(library)[1],fullDrcPass:false,
  scope:'Unrouted placement. Full DRC fails because open connections and silkscreen warnings remain.'},
 nativePolygonPastePolicyPreserved:audit.nativePolygonPastePolicyPreserved,
 toolchain:{tscircuit:"0.0.2744",core:"0.0.2085",capacityAutorouter:"0.0.958",cli:"0.1.2237"},
 mechanical:{inheritedFrom:parent.mechanical.inheritedFrom,outlineExchangeVerified:true,actualSizePdfVerified:true,shellFitVerified:false,mountingGeometryVerified:false},
 remaining:notes.remaining,scope:audit.scope,
 hashes:Object.fromEntries([...new Set(paths)].map(p=>[p,sha(p)]))}
writeFileSync(`${root}/g350-converter-placement-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({...summary,ddrBypassPlacement:'32 measured',converterDistances:'30 measured',parentCpuBypassMetrics:'59 preserved',hashes:'stored in summary'},null,2))
