import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const root='checks/layout/critical-variant',read=p=>JSON.parse(readFileSync(p))
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const circuit='dist/experiments/am3352-g350-critical-placement/circuit.json'
const audit=read(`${root}/g350-critical-placement-audit.json`)
const render=read(`${root}/g350-critical-placement-render.json`)
const stencil=read(`${root}/stencil-final-verification.json`)
const notes=read(`${root}/engineering-notes.json`)
for(const [p,h] of Object.entries(audit.hashes))assert.equal(sha(p),h,`Stale placement audit ${p}`)
assert.equal(render.circuitSha256,sha(circuit))
for(const [p,h] of Object.entries(render.outputs))assert.equal(sha(p),h,`Stale render ${p}`)
assert.equal(audit.status,'PASS_PLACEMENT_ONLY')
assert.equal(audit.logicalComponents,277)
assert(audit.originalTerminalConnectivityPreserved && audit.displayAndHarnessPinMappingsVerified)
assert.equal(audit.bareComponentsWithNoPaste,31)
assert.equal(audit.unintendedProbeThroughHolesCorrected,4)
assert.equal(audit.capsulePadRepresentationConverted,28)
assert(audit.capsuleCopperPreserved && audit.auxiliaryCopperContainedInPrimaryLands)
assert.match(readFileSync(`${root}/build.log`,'utf8'),/Circuits\s+1 passed/)
assert.match(readFileSync(`${root}/build.log`,'utf8'),/code 0: build finished successfully/)
assert.match(readFileSync(`${root}/shorts.log`,'utf8'),/No shorts detected/)
const typecheck=readFileSync(`${root}/typecheck.log`,'utf8')
assert(!/error TS\d|FATAL ERROR/.test(typecheck));assert.match(typecheck,/tsc --noEmit/)
assert.equal(stencil.status,'PASS_SMT_STENCIL_METADATA_ONLY')
assert(stencil.readOnlyVerification && stencil.copperMaskDrillPlacementAndNetsUnchanged)
assert(stencil.nativePadShapeCornerRadiusAndPolygonVerticesVerified)
assert.equal(stencil.circuitSha256,sha(circuit))
assert.equal(stencil.boardSha256,sha(`${root}/g350-critical-placement.kicad_pcb`))
assert.equal(stencil.helperSha256,sha('scripts/prepare-g350-harness-stencil.py'))
assert.equal(stencil.matchedPhysicalPads,1156)
assert.equal(stencil.matchedNonplatedHoles,2)
assert.equal(stencil.noPasteSmtPads,48) // 42 bare contacts/probes plus 6 primary polygon lands
assert.equal(stencil.scaledSmtApertures,1095)
assert.equal(stencil.fullSizeSmtApertures,9)
assert.equal(stencil.unassociatedNativeApertures,8)
assert.equal(stencil.fullStencilQualification,false)
assert.equal(notes.fabricationReady,false)
assert.equal(audit.cpuBypassMetrics.length,59)
assert.equal(audit.ddrBypassPlacement.length,32)
const drc=read(`${root}/g350-critical-placement-kicad-drc.json`)
const warnings={},errors=drc.violations.filter(v=>v.severity==='error')
for(const v of drc.violations)if(v.severity==='warning')warnings[v.type]=(warnings[v.type]??0)+1
assert.equal(errors.length,0)
assert(drc.violations.every(v=>v.severity==='warning'))
const project=read(`${root}/g350-critical-placement.kicad_pro`)
assert.equal(project.board.design_settings.drc_exclusions.length,0)
assert(!Object.values(project.board.design_settings.rule_severities).includes('ignore'))
const library=readFileSync(`${root}/kicad-library.log`,'utf8')
assert.match(library,/Exported 277 exact local footprints; all 303 physical records unchanged/)
const localFootprints=readdirSync(`${root}/tscircuit.pretty`).filter(f=>f.endsWith('.kicad_mod')).sort()
assert.equal(localFootprints.length,277)
const paths=[circuit,...Object.keys(audit.hashes),...Object.keys(render.outputs),
 `${root}/g350-critical-placement-audit.json`,`${root}/g350-critical-placement-render.json`,
 `${root}/g350-critical-placement.kicad_pcb`,`${root}/g350-critical-placement.kicad_pro`,`${root}/g350-critical-placement.kicad_dru`,
 `${root}/g350-critical-placement-kicad-drc.json`,`${root}/kicad-library.log`,`${root}/fp-lib-table`,
 `${root}/stencil-final-verification.json`,`${root}/engineering-notes.json`,
 `${root}/build.log`,`${root}/typecheck.log`,`${root}/shorts.log`,
 'mechanical/g350-provisional-outline.svg','mechanical/g350-provisional-outline.png','mechanical/g350-paper-fit-template.svg',
 'mechanical/g350-original-shell-research.json','scripts/check-g350-critical-placement.mjs',
 'scripts/render-g350-critical-placement.mjs','scripts/prepare-g350-placement-kicad.mjs',
 'scripts/prepare-g350-harness-stencil.py','scripts/prepare-kicad-library.py',
 'scripts/summarize-g350-critical-placement.mjs','index.circuit.tsx',
 'checks/layout/harness-variant/g350-harness-placement-check-summary.json','checks/layout/harness-variant/engineering-notes.json',
 ...localFootprints.map(p=>`${root}/tscircuit.pretty/${p}`)]
const summary={date:'2026-10-04',status:'CHECKED_CPU_BYPASS_PLACEMENT',fabricationReady:false,
 originalShellFitVerified:false,fullHandheldPlacementComplete:false,routingPermitted:false,
 entry:'experiments/am3352-g350-critical-placement.circuit.tsx',defaultEntryRemainsHistoricalDdrFixture:true,
 cpuBypassMetrics:audit.cpuBypassMetrics,ddrBypassPlacement:audit.ddrBypassPlacement,proximityScope:audit.proximityScope,
 proximityTradeoff:notes.proximityTradeoff,
 dimensionsMm:audit.dimensionsMm,copperLayers:4,logicalComponents:277,cpuBypassComponentsRepositioned:59,
 buildExitCode:0,typecheckExitCode:0,nativeErrors:0,allLayerGerberShorts:0,
 minCopperEdgeClearanceLowerBoundMm:audit.minCopperEdgeClearanceLowerBoundMm,
 originalTerminalConnectivityPreserved:true,displayAndHarnessPinMappingsVerified:true,
 bareComponentsWithNoPaste:31,exposedBarePads:42,unintendedProbeThroughHolesCorrected:4,
 capsuleCopperPreserved:true,capsulePadRepresentationConverted:28,
 inductorAuxiliaryPadCount:4,auxiliaryCopperContainedInPrimaryLands:true,
 smtStencil:{status:stencil.status,matchedPads:1156,matchedNonplatedHoles:2,noPasteSmtPads:48,
   scaledApertures:1095,fullSizeApertures:9,copperMaskDrillPlacementAndNetsUnchanged:true,
   nativePadShapeCornerRadiusAndPolygonVerticesVerified:true,
   nativeThroughHoleAperturesUnqualified:8,fullStencilQualification:false},
 independentKicad:{processExitCode:5,errors:0,warningCount:drc.violations.length,warningTypes:warnings,
   unconnectedItemsReported:drc.unconnected_items.length,unconnectedCountIsComplete:false,
   perItemExclusions:0,ignoredRuleSeverities:0,exactLocalFootprints:277,
   physicalRecordSha256:/Physical-record SHA256: (\w+)/.exec(library)[1],
   note:'Full DRC does not pass. Presentation/courtyard warnings and unrouted connections remain. Placement geometry only.'},
 remaining:['Measured original shell perimeter, mounting, ports, membrane registration and assembled clearances',
 'Battery protection, NTC, current rating and dimensions; speaker load and mating cable qualification',
 'Current exact connector assembly drawings, backlight biased capacitance and full stencil qualification',
 'Panel supply budget and startup, Linux driver/pinmux/timings/color format',
 'Complete critical placement review before four-layer native bus_lanes DDR and host routing',
 'Routing continuity, shorts, reference planes, DDR timing and fabrication release checks'],
 hashes:Object.fromEntries([...new Set(paths)].map(p=>[p,sha(p)]))}
writeFileSync(`${root}/g350-critical-placement-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({...summary,hashes:'stored in source-bound summary'},null,2))
