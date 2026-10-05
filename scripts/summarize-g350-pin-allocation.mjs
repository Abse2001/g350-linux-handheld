import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const root='checks/layout/pin-allocation-variant',read=p=>JSON.parse(readFileSync(p))
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const circuit='dist/experiments/am3352-g350-pin-allocation/circuit.json'
const audit=read(`${root}/pin-allocation-audit.json`)
const render=read(`${root}/g350-pin-allocation-render.json`)
const stencil=read(`${root}/stencil-final-verification.json`)
const parentPath='checks/layout/critical-variant/g350-critical-placement-check-summary.json'
const parent=read(parentPath),notes=read(`${root}/engineering-notes.json`)
for(const proof of [audit,parent])for(const [p,h] of Object.entries(proof.hashes))assert.equal(sha(p),h,'Stale evidence '+p)
assert.equal(audit.status,'PASS_PIN_ALLOCATION_AND_PLACEMENT_ONLY')
assert(audit.priorPhysicalGeometryPreserved&&audit.onlyReviewedTerminalSplitApplied&&audit.priorNativeAperturesPreserved)
assert(audit.allExplicitNetNamesDistinct&&audit.historicalNegativeControlDetected)
assert(audit.bufferPinoutAndManufacturerLandPatternVerified&&audit.newBottomCourtyardsClear)
assert.equal(audit.logicalComponents,280);assert.equal(audit.preservedPriorComponents,277)
assert.equal(audit.copperLayers,4);assert.equal(audit.physicalPadsAndPlatedHoles,1165)
assert.equal(parent.ddrBypassPlacement.length,32);assert.equal(parent.cpuBypassMetrics.length,59)
assert.equal(render.circuitSha256,sha(circuit))
for(const [p,h] of Object.entries(render.outputs))assert.equal(sha(p),h,'Stale render '+p)
assert.match(readFileSync(`${root}/build.log`,'utf8'),/Circuits\s+1 passed/)
assert.match(readFileSync(`${root}/build.log`,'utf8'),/code 0: build finished successfully/)
assert.match(readFileSync(`${root}/shorts.log`,'utf8'),/No shorts detected/)
const tc=readFileSync(`${root}/typecheck.log`,'utf8')
assert.match(tc,/tsc --noEmit/);assert(!/error TS\d|FATAL ERROR/.test(tc))
assert.equal(stencil.status,'PASS_SMT_STENCIL_METADATA_ONLY')
assert(stencil.readOnlyVerification&&stencil.copperMaskDrillPlacementAndNetsUnchanged)
assert(stencil.nativePadShapeCornerRadiusAndPolygonVerticesVerified)
assert.equal(stencil.circuitSha256,sha(circuit))
assert.equal(stencil.boardSha256,sha(`${root}/g350-pin-allocation.kicad_pcb`))
assert.equal(stencil.helperSha256,sha('scripts/prepare-g350-stencil.py'))
for(const [k,n] of Object.entries({matchedPhysicalPads:1165,matchedNonplatedHoles:2,
 noPasteSmtPads:48,scaledSmtApertures:1104,fullSizeSmtApertures:9,unassociatedNativeApertures:8}))assert.equal(stencil[k],n)
assert.equal(stencil.fullStencilQualification,false)
assert.equal(notes.fabricationReady,false)
const drc=read(`${root}/g350-pin-allocation-kicad-drc.json`),warnings={}
assert.equal(drc.violations.filter(v=>v.severity==='error').length,0)
for(const v of drc.violations){assert.equal(v.severity,'warning');warnings[v.type]=(warnings[v.type]??0)+1}
const project=read(`${root}/g350-pin-allocation.kicad_pro`)
assert.equal(project.board.design_settings.drc_exclusions.length,0)
assert(!Object.values(project.board.design_settings.rule_severities).includes('ignore'))
const library=readFileSync(`${root}/kicad-library.log`,'utf8')
assert.match(library,/Exported 280 exact local footprints; all 306 physical records unchanged/)
const footprints=readdirSync(`${root}/tscircuit.pretty`).filter(p=>p.endsWith('.kicad_mod')).sort()
assert.equal(footprints.length,280)
const paths=[circuit,...Object.keys(audit.hashes),...Object.keys(render.outputs),parentPath,
 `${root}/pin-allocation-audit.json`,`${root}/g350-pin-allocation-render.json`,
 `${root}/g350-pin-allocation.kicad_pcb`,`${root}/g350-pin-allocation.kicad_pro`,`${root}/g350-pin-allocation.kicad_dru`,
 `${root}/g350-pin-allocation-kicad-drc.json`,`${root}/fp-lib-table`,`${root}/kicad-library.log`,
 `${root}/stencil-final-verification.json`,`${root}/engineering-notes.json`,
 `${root}/build.log`,`${root}/typecheck.log`,`${root}/shorts.log`,
 'scripts/render-g350-pin-allocation.mjs','scripts/prepare-g350-placement-kicad.mjs',
 'scripts/prepare-g350-stencil.py','scripts/prepare-kicad-library.py',
 'scripts/summarize-g350-pin-allocation.mjs',...footprints.map(p=>`${root}/tscircuit.pretty/${p}`)]
const summary={status:'CHECKED_BACKLIGHT_AND_SD_PIN_ALLOCATION',fabricationReady:false,
 originalShellFitVerified:false,routingPermitted:false,fullHandheldPlacementComplete:false,
 entry:'experiments/am3352-g350-pin-allocation.circuit.tsx',defaultEntryRemainsHistoricalDdrFixture:true,
 logicalComponents:280,preservedPriorPlacements:277,addedComponents:3,
 dimensionsMm:audit.dimensionsMm,copperLayers:4,nativeErrors:0,buildExitCode:0,typecheckExitCode:0,
 allLayerGerberShorts:0,allExplicitNetNamesDistinct:true,historicalCollisionDetectedByNegativeControl:true,
 cardDetectBall:'C18 / GPIO0_7 mode7',backlightPwmBall:'U14 / eHRPWM1A mode6, VDDSHV3=1.8V',
 buffer:'SN74LVC1G125DBVR C23654, 1.8V, always enabled',
 inputPulldownValueChange:'R_LCD_BL_PD: 100k -> 33k C25779 on unchanged lands',
 priorPhysicalGeometryAndNativeAperturesPreserved:true,
 minCopperEdgeClearanceLowerBoundMm:Math.min(parent.minCopperEdgeClearanceLowerBoundMm,audit.newPadEdgeClearanceLowerBoundMm),
 logicCalculations:audit.logicCalculations,bufferBypassSupplyPadDistanceMm:audit.bufferBypassSupplyPadDistanceMm,
 parentCpuBypassMetrics:parent.cpuBypassMetrics,parentDdrBypassPlacement:parent.ddrBypassPlacement,
 previousVariantElectricalLimitation:'The parent remains useful placement evidence, but its C18 SD_CD/PWM net merge is corrected only in this new entry.',
 smtStencil:{matchedPads:1165,matchedNonplatedHoles:2,scaledApertures:1104,fullSizeApertures:9,
   noPastePads:48,geometryPreserved:true,nativeThroughHoleAperturesUnqualified:8,fullStencilQualification:false},
 independentKicad:{processExitCode:5,errors:0,warningCount:drc.violations.length,warningTypes:warnings,
   unconnectedItemsReported:drc.unconnected_items.length,unconnectedCountIsComplete:false,
   perItemExclusions:0,ignoredRuleSeverities:0,exactLocalFootprints:280,
   physicalRecordSha256:/Physical-record SHA256: (\w+)/.exec(library)[1],
   fullDrcPass:false,scope:'Unrouted placement. Full DRC fails because silkscreen warnings and open connections remain.'},
 remaining:notes.remaining,
 scope:'Pin allocation and unrouted placement; actual power sequencing, routed returns, firmware, shell fit and fabrication are incomplete.',
 hashes:Object.fromEntries([...new Set(paths)].map(p=>[p,sha(p)]))}
writeFileSync(`${root}/g350-pin-allocation-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({...summary,parentCpuBypassMetrics:'59 preserved, stored in summary',
 parentDdrBypassPlacement:'32 preserved, stored in summary',hashes:'stored in source-bound summary'},null,2))
