import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const read=p=>JSON.parse(readFileSync(p))
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const audit=read('checks/layout/g350-placement-audit.json')
const render=read('checks/layout/g350-placement-render.json')
const drc=read('checks/layout/g350-placement-kicad-drc.json')
const project=read('checks/layout/g350-placement.kicad_pro')
const circuit='dist/experiments/am3352-g350-placement-study/circuit.json'
assert.equal(audit.hashes[circuit],sha(circuit))
assert.equal(render.circuitSha256,sha(circuit))
assert.equal(read('design-status.json').fabricationReady,false)
assert.equal(project.board.design_settings.drc_exclusions.length,0)
assert(!Object.values(project.board.design_settings.rule_severities).includes('ignore'))
assert.equal(drc.violations.filter(x=>x.severity==='error').length,0)
assert.match(readFileSync('checks/layout/g350-placement-build.log','utf8'),/Build exiting with code 0/)
assert.match(readFileSync('checks/layout/g350-placement-shorts.log','utf8'),/No shorts detected/)
assert.match(readFileSync('checks/layout/g350-placement-kicad-library.log','utf8'),/233 exact local footprints; all 259 physical records unchanged/)
const types=drc.violations.reduce((m,x)=>(m[x.type]=(m[x.type]??0)+1,m),{})
const files=[circuit,'mechanical/g350-provisional-outline.json','mechanical/g350-provisional-outline.svg',
  'mechanical/g350-paper-fit-template.svg','checks/layout/g350-placement-audit.json',
  'checks/layout/g350-placement-render.json','checks/layout/g350-placement.kicad_pcb',
  'checks/layout/g350-placement.kicad_pro','checks/layout/g350-placement.kicad_dru',
  'checks/layout/g350-placement-kicad-drc.json','checks/layout/g350-placement-build.log',
  'checks/layout/g350-placement-typecheck.log','checks/layout/g350-placement-shorts.log',
  'checks/layout/g350-placement-kicad-library.log','index.circuit.tsx',
  'scripts/check-g350-placement.mjs','scripts/render-g350-placement.mjs',
  'scripts/render-g350-mechanical-outline.mjs','scripts/prepare-g350-placement-kicad.mjs',
  'scripts/prepare-kicad-library.py','scripts/summarize-g350-placement.mjs']
const report={date:'2026-10-04',status:'CHECKED_PARTIAL_PLACEMENT',fabricationReady:false,
  originalShellFitVerified:false,fullHandheldPlacementComplete:false,routingPermitted:false,
  entry:'experiments/am3352-g350-placement-study.circuit.tsx',defaultEntryRemainsHistoricalDdrFixture:true,
  dimensionsMm:audit.dimensionsMm,copperLayers:4,logicalComponents:233,
  buildExitCode:0,typecheckExitCode:0,nativeErrors:0,allLayerGerberShorts:0,
  minCopperEdgeClearanceLowerBoundMm:audit.minCopperEdgeClearanceLowerBoundMm,
  hostTerminalAndPhysicalPadIdentitiesPreserved:true,oldCopperDiscardedBeforePlacement:true,
  independentKicad:{processExitCode:5,errors:0,warningCount:drc.violations.length,warningTypes:types,
    unconnectedItemsReported:drc.unconnected_items.length,unconnectedCountIsComplete:false,
    perItemExclusions:0,ignoredRuleSeverities:0,exactLocalFootprints:233,
    note:'KiCad DRC does not pass: presentation warnings and unrouted connections remain. This checks placement geometry only.'},
  remaining:['Measured original shell/PCB outline, mounting, port and control geometry',
    'Assembled display/battery/speaker volumes and component clearances',
    'Display/FPC/backlight circuit and final harness/contact selection',
    'Complete component layout and electrical/pinmux/power review before routing',
    'Four-layer native bus_lanes DDR bootstrap and complete host routing',
    'Routing continuity, shorts, reference planes, DDR timing and manufacturing qualification'],
  hashes:Object.fromEntries(files.map(p=>[p,sha(p)]))}
writeFileSync('checks/layout/g350-placement-check-summary.json',JSON.stringify(report,null,2)+'\n')
console.log('Checked partial 76 × 118 mm placement: zero native errors/shorts and zero independent KiCad errors; 443 warnings and unrouted connections remain. Original shell fit and fabrication are unverified.')
