import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const root='checks/layout/display-variant',read=p=>JSON.parse(readFileSync(p))
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const audit=read(`${root}/g350-display-placement-audit.json`)
const render=read(`${root}/g350-display-placement-render.json`)
const circuit='dist/experiments/am3352-g350-display-placement/circuit.json'
for(const [p,h] of Object.entries(audit.hashes))assert.equal(sha(p),h,`Stale placement audit ${p}`)
assert.equal(render.circuitSha256,sha(circuit))
for(const [p,h] of Object.entries(render.outputs))assert.equal(sha(p),h,`Stale render ${p}`)
assert.equal(audit.status,'PASS_PLACEMENT_ONLY')
assert(audit.displayPinMapAndBacklightSenseVerified)
const build=readFileSync('checks/layout/g350-display-placement-build.log','utf8')
assert.match(build,/Circuits\s+1 passed/)
assert.match(build,/code 0: build finished successfully/)
assert.match(readFileSync('checks/layout/g350-display-placement-shorts.log','utf8'),/No shorts detected/)
const typecheck=readFileSync('checks/layout/g350-display-placement-typecheck.log','utf8')
assert(!/error TS\d|FATAL ERROR/.test(typecheck));assert.match(typecheck,/tsc --noEmit/)
const drc=read(`${root}/g350-display-placement-kicad-drc.json`)
const warnings={},errors=drc.violations.filter(v=>v.severity==='error')
for(const v of drc.violations)if(v.severity==='warning')warnings[v.type]=(warnings[v.type]??0)+1
assert.equal(errors.length,0)
assert(drc.violations.every(v=>v.severity==='warning'))
const project=read(`${root}/g350-display-placement.kicad_pro`)
assert.equal(project.board.design_settings.drc_exclusions.length,0)
assert(!Object.values(project.board.design_settings.rule_severities).includes('ignore'))
const library=readFileSync(`${root}/kicad-library.log`,'utf8')
assert.match(library,/Exported 275 exact local footprints; all 301 physical records unchanged/)
assert.equal(readdirSync(`${root}/tscircuit.pretty`).filter(f=>f.endsWith('.kicad_mod')).length,275)
const imports=['A_0_5_54PFGPZ','TPS61165DBVR','VLCF5020T_100M1R1_1','MBR0540T1G','CL31B475KBHNNNE','CL10B224KA8NNNC','A_0603WAF150JT5E'].map(n=>`imports/${n}.tsx`)
const paths=[circuit,...Object.keys(audit.hashes),...Object.keys(render.outputs),...imports,
 `${root}/g350-display-placement-audit.json`,`${root}/g350-display-placement-render.json`,
 `${root}/g350-display-placement.kicad_pcb`,`${root}/g350-display-placement.kicad_pro`,`${root}/g350-display-placement.kicad_dru`,
 `${root}/g350-display-placement-kicad-drc.json`,`${root}/kicad-library.log`,
 'checks/layout/g350-display-placement-build.log','checks/layout/g350-display-placement-typecheck.log','checks/layout/g350-display-placement-shorts.log',
 'docs/G350_DISPLAY.md','docs/G350_SHELL_FIT.md','reference/am3352/display/ER-TFT035-7_Datasheet.pdf',
 'reference/am3352/display/ER-TFT035-7_Initial.h','reference/am3352/display/ER-CON54HB-1.pdf',
 'scripts/check-g350-display-placement.mjs','scripts/render-g350-display-placement.mjs','scripts/prepare-g350-placement-kicad.mjs',
 'scripts/prepare-kicad-library.py','scripts/summarize-g350-display-placement.mjs','index.circuit.tsx']
const summary={date:'2026-10-04',status:'CHECKED_PARTIAL_PLACEMENT_WITH_DISPLAY',fabricationReady:false,
 originalShellFitVerified:false,fullHandheldPlacementComplete:false,routingPermitted:false,
 entry:'experiments/am3352-g350-display-placement.circuit.tsx',defaultEntryRemainsHistoricalDdrFixture:true,
 dimensionsMm:audit.dimensionsMm,copperLayers:4,logicalComponents:275,newDisplayComponents:42,
 buildExitCode:0,typecheckExitCode:0,nativeErrors:0,allLayerGerberShorts:0,
 minCopperEdgeClearanceLowerBoundMm:audit.minCopperEdgeClearanceLowerBoundMm,
 displayPinMapAndBacklightSenseVerified:true,reviewedRailChange:audit.reviewedRailChange,
 independentKicad:{processExitCode:5,errors:0,warningCount:drc.violations.length,warningTypes:warnings,
   unconnectedItemsReported:drc.unconnected_items.length,unconnectedCountIsComplete:false,
   perItemExclusions:0,ignoredRuleSeverities:0,exactLocalFootprints:275,
   physicalRecordSha256:/Physical-record SHA256: (\w+)/.exec(library)[1],
   note:'Full DRC does not pass; presentation warnings and unrouted connections remain. Placement geometry only.'},
 remaining:['Measured original shell outline, mounting, ports, controls and assembled clearances',
 'Exact FPC connector/inductor land drawings and biased backlight capacitance qualification',
 'Panel supply budget and startup, Linux driver/pinmux/timings/color format',
 'Final battery/speaker harness and membrane contact finish/paste/registration',
 'Complete critical placement review before four-layer native bus_lanes DDR and host routing',
 'Routing continuity, shorts, reference planes, DDR timing and fabrication release checks'],
 hashes:Object.fromEntries([...new Set(paths)].map(p=>[p,sha(p)]))}
writeFileSync(`${root}/g350-display-placement-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({...summary,hashes:'stored in source-bound summary'},null,2))
