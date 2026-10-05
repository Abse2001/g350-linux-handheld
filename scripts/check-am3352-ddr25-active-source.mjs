import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// A fresh active build may change project metadata. Every electrical and
// physical record must equal the independently checked DDR25 source.
const [path='dist/index/circuit.json',reportPath='checks/integrated/am3352-ddr25-active-source-equivalence.json']=process.argv.slice(2)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const entry=read('design-status.json').activeEntry
const summaryPath=entry==='experiments/am3352-ddr-usbc-cke-access.circuit.tsx'?'checks/integrated/am3352-ddr-usbc-cke-access-check-summary.json':
  entry==='experiments/am3352-ddr-usbc-repaired-strobes.circuit.tsx'?'checks/integrated/am3352-ddr-usbc-repaired-strobes-check-summary.json':undefined
assert(summaryPath,'No independently checked DDR25 source is registered for this active entry')
const summary=read(summaryPath)
for(const a of [summary.source,summary.board,summary.paths,summary.nativeDdrAudit,summary.nativeUsbAudit,summary.ramReferenceAudit,
  summary.nativeDrc,summary.gerberShortsAudit,summary.sourceGeometryAudit,summary.planarDdrAudit])assert.equal(hash(a.path),a.sha256)
assert.equal(summary.connectedDdrSignals,25);assert(summary.bothBytePlanarTimingPass&&summary.allThreeDifferentialPairPlanarTimingPass)
assert.equal(summary.gerberShortsAllLayers,0);assert.equal(summary.independentPhysicalViolationsAllSeverities,0)
const filter=c=>c.filter(e=>e.type!=='source_project_metadata'),active=read(path),checked=read(summary.source.path)
assert.deepEqual(filter(active),filter(checked),'Active electrical or physical source changed: re-run the independent checks')
const report={status:'ACTIVE_DDR25_CHECKED_SOURCE_EQUIVALENCE_PASS',active:{path,sha256:hash(path)},checked:summary.source,
  checkedSummary:{path:summaryPath,sha256:hash(summaryPath)},equalNonMetadataRecords:filter(active).length,
  connectedDdrSignals:25,remainingDdrSignals:24,copperLayers:4,originalShellFitVerified:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
