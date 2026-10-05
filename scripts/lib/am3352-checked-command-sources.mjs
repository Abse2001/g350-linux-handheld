import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const registry={
  'checks/integrated/am3352-ddr-usbc-d12-spacing-repaired-check-summary.json':{sha256:'08dbd575d14495cb6c1e0c4e85617dcc9d2d3e7cb8d2702c3c3fc28eb6053c00',signals:33,traces:135,holes:169,copperBootstrapOnly:true,addedSignalNominalLengthPass:true,coupledNeighborRepairs:true,csnNominalLengthPass:true,changedExistingSignals:['DDR_D3','DDR_CSn0','DDR_RESETn','DDR_D12'],nominalRepairSignals:['DDR_CK','DDR_CKn','DDR_CKE','DDR_A3','DDR_A6']},
  'checks/integrated/am3352-ddr-usbc-casn-csn0-nominal-d3-matched-check-summary.json':{sha256:'e7a7baca61666644dab08f344aadbdf342f24be52a530e357779e2e11bfe0e98',signals:33,traces:135,holes:169,copperBootstrapOnly:true,addedSignalNominalLengthPass:true,coupledNeighborRepairs:true,csnNominalLengthPass:true,nominalRepairSignals:['DDR_CK','DDR_CKn','DDR_CKE','DDR_A3','DDR_A6']},
  'checks/integrated/am3352-ddr-usbc-casn-nominal-d3-matched-check-summary.json':{sha256:'7283fee7d498123eee094fa92ec68f211a03e799fb1bd857d485cf9a64a3fe05',signals:33,traces:135,holes:169,copperBootstrapOnly:true,addedSignalNominalLengthPass:true,coupledNeighborRepairs:true,nominalRepairSignals:['DDR_CK','DDR_CKn','DDR_CKE','DDR_A3','DDR_A6','DDR_CSn0']},
  'checks/integrated/am3352-ddr-usbc-a6-bootstrap-check-summary.json':{sha256:'dc111d31b068300ceb9f92a97923488d22ae62c8586740955e3edce640f92606',signals:32,traces:134,holes:163,copperBootstrapOnly:true,nominalRepairSignals:['DDR_CK','DDR_CKn','DDR_CKE','DDR_A3','DDR_A6']},
  // Copper-only checkpoint for subsequent staged routing. Its A3 nominal
  // failure is explicit; registration neither promotes it nor approves it.
  'checks/integrated/am3352-ddr-usbc-a3-bootstrap-check-summary.json':{sha256:'19e3669d39fa028228aa640f76e2289c38ea1d7e411872e9ea05a51140ef14cb',signals:31,traces:133,holes:161,copperBootstrapOnly:true,nominalRepairSignals:['DDR_CK','DDR_CKn','DDR_CKE','DDR_A3']},
  'checks/integrated/am3352-ddr-usbc-wen-nominal-check-summary.json':{sha256:'75acef5197ef4e1deb2a64fb867d55b294d844d5a0aaa04512924d63dae207f8',signals:30,traces:132,holes:157},
  'checks/integrated/am3352-ddr-usbc-a5-nominal-check-summary.json':{sha256:'94cb51957ff9ab95da3fadfbf8160d6170304d4940027e8a15a6b98a97118c53',signals:29,traces:131,holes:151},
  'checks/integrated/am3352-ddr-usbc-csn-joint-check-summary.json':{sha256:'3f63f2f618d5033b30a99ec9ac2b5fccc5cf0e7d952c7632ae83d37f9d1d6afc',signals:28,traces:130,holes:149},
  'checks/integrated/am3352-ddr-usbc-cke-matched-check-summary.json':{sha256:'7e0cac94ee9eeeea9b264efaf205a498afb94502a46009391cb2effa38677f60',signals:26,traces:128,holes:143},
  'checks/integrated/am3352-ddr-usbc-odt-nominal-check-summary.json':{sha256:'b5fc4c469c1c0418859d7c931f8b5cb20576f076cca900e446c6a6faba218e99',signals:27,traces:129,holes:147}
}
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
export function readCheckedCommandSummary(artifact){
  const registration=registry[artifact?.path];assert(registration,'Command phase requires a registered independently checked source')
  assert.equal(artifact.sha256,registration.sha256);assert.equal(hash(artifact.path),artifact.sha256)
  const summary=read(artifact.path)
  assert.equal(summary.connectedDdrSignals,registration.signals);assert.equal(summary.tracePieces,registration.traces);assert.equal(summary.throughVias,registration.holes)
  assert(summary.bothBytePlanarTimingPass&&summary.allThreeDifferentialPairPlanarTimingPass)
  assert.equal(summary.gerberShortsAllLayers,0);assert.equal(summary.independentPhysicalViolationsAllSeverities,0)
  if(registration.copperBootstrapOnly){
    assert(summary.bootstrapOnly&&!summary.defaultChanged)
    assert.equal(summary.addedSignalNominalLengthPass,registration.addedSignalNominalLengthPass??false)
    assert(!summary.fullCommandClassMatchingPass&&!summary.fullElectricalTimingQualified&&!summary.fabricationReady)
    assert.deepEqual(summary.pendingNominalRepairSignals,registration.nominalRepairSignals)
    if(registration.coupledNeighborRepairs){
      assert(summary.casnNominalLengthPass);assert.equal(summary.csnNominalLengthPass,registration.csnNominalLengthPass??false)
      if(registration.csnNominalLengthPass)assert(summary.manualWireShortcuts?.length===1&&summary.manualWireShortcuts[0].signal==='DDR_CSn0')
      assert(summary.manualWireTuning&&summary.additionalManualWireTunings?.length===1)
      assert.deepEqual(summary.changedExistingSignals,registration.changedExistingSignals??['DDR_D3','DDR_CSn0','DDR_RESETn'])
      assert.deepEqual(summary.pendingOpenedSignalRepairs,[])
    }
  }
  for(const a of [summary.source,summary.paths,summary.nativeDdrAudit,summary.nativeUsbAudit,summary.ramReferenceAudit,summary.nativeDrc,summary.gerberShortsAudit,summary.sourceGeometryAudit,summary.planarDdrAudit])assert.equal(hash(a.path),a.sha256)
  const source=read(summary.source.path)
  assert.equal(source.filter(e=>e.type==='pcb_trace').length,registration.traces);assert.equal(source.filter(e=>e.type==='pcb_via').length,registration.holes)
  assert.equal(source.filter(e=>e.type.endsWith('_error')).length,0)
  return {summary,registration}
}
export function selectCheckedCommandSummary(sourceArtifact){
  for(const [path,registration] of Object.entries(registry)){
    const artifact={path,sha256:registration.sha256}
    const summary=read(path)
    if(summary.source.path===sourceArtifact.path&&summary.source.sha256===sourceArtifact.sha256){readCheckedCommandSummary(artifact);return artifact}
  }
  assert.fail('Native preparation is not bound to a registered checked DDR source')
}
