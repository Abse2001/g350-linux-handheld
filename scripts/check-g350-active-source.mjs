import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'

const [path='dist/index/circuit.json',reportPath='checks/integrated/am3352-ddr-active-source-equivalence.json']=process.argv.slice(2)
const read=p=>JSON.parse(readFileSync(p,'utf8'))
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const status=read('design-status.json')
const summaryPath=status.currentWork.currentRoutingCheckSummary,summary=read(summaryPath)
assert.equal(summary.entry,status.activeEntry)
assert.equal(status.currentWork.entry,status.activeEntry)
assert(['PASS_SCOPED_SHAPED_DQS0_CONNECTIVITY_AND_PHYSICAL_CHECKS','PASS_SCOPED_SHAPED_BYTE0_PHYSICAL_CONNECTIVITY_AND_PLANAR_SKEW'].includes(summary.status))
assert.equal(summary.independentPhysicalErrors,0)
for(const a of [summary.source,summary.board,...summary.evidence])assert.equal(artifact(a.path).sha256,a.sha256)
const active=read(path),checked=read(summary.source.path)
const records=c=>c.filter(e=>e.type!=='source_project_metadata')
assert.deepEqual(records(active),records(checked),'Current source changed from the checked shaped routing entry')
const board=active.find(e=>e.type==='pcb_board')
assert.equal(board.width,76);assert.equal(board.height,118);assert.equal(board.thickness,1.6);assert.equal(board.num_layers,4)
assert.equal(active.filter(e=>e.type==='pcb_component').length,280)
const report={status:'CURRENT_SHAPED_G350_SCOPED_SOURCE_EQUIVALENCE_PASS',active:artifact(path),checked:summary.source,
 checkedSummary:artifact(summaryPath),equalNonMetadataRecords:true,
 placedComponents:280,dimensionsMm:{width:76,height:118,thickness:1.6},copperLayers:4,
 checkedConnectedDdrSignals:summary.checkedConnectedDdrSignals,remainingDdrSignals:summary.remainingDdrSignals,
 sourceContainsUnfinishedConnections:true,fabricationReady:false,originalShellFitVerified:false,
 scope:'Matches only the current checked routing subset. This is a source-freshness gate for shorts checks, not complete-board approval.'}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,checkedConnectedDdrSignals:summary.checkedConnectedDdrSignals,remainingDdrSignals:summary.remainingDdrSignals,fabricationReady:false}))
