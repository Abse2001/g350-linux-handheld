import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertAm3352UpgradeSourceEquivalence} from './lib/am3352-upgrade-source-equivalence.mjs'

// Project metadata and the narrowly reviewed core schema migration may change
// on a fresh build. Every copper and connectivity record remains exact.
const [path='dist/index/circuit.json',reportPath='checks/integrated/am3352-ddr-active-source-equivalence.json']=process.argv.slice(2)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const entry=read('design-status.json').activeEntry
if(['experiments/am3352-g350-dqs0-shaped-replay.circuit.tsx','experiments/am3352-g350-byte0-matched-replay.circuit.tsx','experiments/am3352-g350-byte0-complete-bus.circuit.tsx'].includes(entry)){
  await import('./check-g350-active-source.mjs')
  process.exit(0)
}
const registry={
  'experiments/am3352-ddr-usbc-wen-nominal.circuit.tsx':['checks/integrated/am3352-ddr-usbc-wen-nominal-check-summary.json',30],
  'experiments/am3352-ddr-usbc-a5-nominal.circuit.tsx':['checks/integrated/am3352-ddr-usbc-a5-nominal-check-summary.json',29],
  'experiments/am3352-ddr-usbc-csn-joint.circuit.tsx':['checks/integrated/am3352-ddr-usbc-csn-joint-check-summary.json',28],
  'experiments/am3352-ddr-usbc-odt-nominal.circuit.tsx':['checks/integrated/am3352-ddr-usbc-odt-nominal-check-summary.json',27],
  'experiments/am3352-ddr-usbc-cke-matched.circuit.tsx':['checks/integrated/am3352-ddr-usbc-cke-matched-check-summary.json',26],
  'experiments/am3352-ddr-usbc-cke-access.circuit.tsx':['checks/integrated/am3352-ddr-usbc-cke-access-check-summary.json',25],
  'experiments/am3352-ddr-usbc-repaired-strobes.circuit.tsx':['checks/integrated/am3352-ddr-usbc-repaired-strobes-check-summary.json',25]
}
const registered=registry[entry];assert(registered,'No independently checked partial DDR source is registered for this active entry')
const [summaryPath,expectedCount]=registered,summary=read(summaryPath)
for(const a of [summary.source,summary.board,summary.paths,summary.nativeDdrAudit,summary.nativeUsbAudit,summary.ramReferenceAudit,
  summary.nativeDrc,summary.gerberShortsAudit,summary.sourceGeometryAudit,summary.planarDdrAudit])assert.equal(hash(a.path),a.sha256)
assert.equal(summary.connectedDdrSignals,expectedCount)
assert(summary.bothBytePlanarTimingPass&&summary.allThreeDifferentialPairPlanarTimingPass)
assert.equal(summary.gerberShortsAllLayers,0);assert.equal(summary.independentPhysicalViolationsAllSeverities,0)
const filter=c=>c.filter(e=>e.type!=='source_project_metadata'),active=read(path),checked=read(summary.source.path)
const upgradeEquivalence=assertAm3352UpgradeSourceEquivalence(active,checked)
const report={status:`ACTIVE_DDR${expectedCount}_CHECKED_SOURCE_EQUIVALENCE_PASS`,active:{path,sha256:hash(path)},checked:summary.source,
  checkedSummary:{path:summaryPath,sha256:hash(summaryPath)},equalNonMetadataRecords:upgradeEquivalence.equalElectricalAndPhysicalRecords,
  rawNonMetadataRecordCount:filter(active).length,comparison:'STRICT_EQUIVALENCE_WITH_REVIEWED_CORE_SCHEMA_MIGRATION',
  upgradeEquivalence,connectedDdrSignals:expectedCount,remainingDdrSignals:49-expectedCount,copperLayers:4,originalShellFitVerified:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
