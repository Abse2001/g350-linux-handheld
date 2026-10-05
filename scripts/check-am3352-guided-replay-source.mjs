import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertSavedDdrCopper} from './lib/am3352-saved-ddr-copper.mjs'

const path=process.argv[2]??'dist/experiments/am3352-guided-byte0-replay/circuit.json',raw=readFileSync(path),circuit=JSON.parse(raw)
const pathsPath=process.argv[3]??'routing/am3352-guided-byte0-paths.json'
const reportPath=process.argv[4]??'checks/integrated/am3352-guided-byte0-replay-source-validation.json'
const saved=JSON.parse(readFileSync(pathsPath))
const referenceLayoutPath=process.argv[5]
const copperOptions=referenceLayoutPath?{ramReferenceEscapes:JSON.parse(readFileSync(referenceLayoutPath))}:{}
const ramRotation=Number(process.argv[6]??0);assert([0,180].includes(ramRotation))
copperOptions.ramRotation=ramRotation
const powerBridge=process.argv[7]==='rotated-d2-power-bridge'
assert(process.argv[7]===undefined||powerBridge)
if(powerBridge){assert.equal(ramRotation,180);copperOptions.rotatedD2PowerBridge=true}
assert.equal(circuit.filter(e=>e.type.endsWith('_error')).length,0)
assert.equal(circuit.filter(e=>e.type==='source_component').length,204)
assert.equal(circuit.filter(e=>e.type==='pcb_smtpad').length,882)
const audited=assertSavedDdrCopper(circuit,saved,copperOptions)
const {savedDdrSignals,savedDdrVias:expectedDdrVias,totalThroughVias,...existing}=audited
const report={status:'GUIDED_REPLAY_SOURCE_GEOMETRY_PASS_HOST_INCOMPLETE',
  circuit:{path,sha256:createHash('sha256').update(raw).digest('hex')},components:204,actualPadObstacles:882,
  copperLayers:4,signalLayers:['top','bottom'],ddrSignalTraces:savedDdrSignals,ddrThroughVias:expectedDdrVias,physicalThroughVias:totalThroughVias,
  existingPowerCopper:existing,...(referenceLayoutPath?{referenceLayout:{path:referenceLayoutPath,sha256:createHash('sha256').update(readFileSync(referenceLayoutPath)).digest('hex')},ramRotation}:{}),timingQualified:false,pairGeometryQualified:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,ddrSignalTraces:savedDdrSignals,ddrThroughVias:expectedDdrVias,powerCopperRetained:existing.traces}))
