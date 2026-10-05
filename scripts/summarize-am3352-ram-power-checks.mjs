import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertSourceCopper} from './lib/am3352-source-copper.mjs'

// A partial progress summary, never a release gate. Physical violations
// fail regardless of KiCad severity: same-net overlapping holes may be
// warnings. Only the four named presentation-warning types are separated.
const directory='dist/diagnostics/am3352-ram-bypass'
const prefix='checks/integrated/am3352-ram-bypass'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const circuitPath=`${directory}/circuit.json`,boardPath=`${directory}/board.kicad_pcb`
const circuit=read(circuitPath),sha256=hash(circuitPath),sourceCopper=assertSourceCopper(circuit)
assert.equal(circuit.find(e=>e.type==='pcb_board').num_layers,4)
assert.equal(circuit.filter(e=>e.type.endsWith('_error')).length,0)
const drc=read(`${prefix}-kicad-drc.json`)
const presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
const physical=drc.violations.filter(v=>!presentation.has(v.type))
assert.equal(physical.length,0,`Physical violations (any severity): ${physical.map(v=>v.type).join(', ')}`)
assert(drc.violations.every(v=>v.severity==='warning'))
const reference=read(`${prefix}-copper-connectivity.json`)
assert.equal(reference.source.sha256,sha256)
assert.equal(reference.board.sha256,hash(boardPath))
assert.equal(reference.ramSupplyBallsConnectedToDdrPlane,18)
assert.equal(reference.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(reference.ramBypassCapacitorsConnectedToPlanes,14)
assert.equal(reference.ramBypassTerminalsConnectedToPlanes,28)
assert(reference.records.every(r=>r.connected)&&reference.bypassRecords.every(r=>r.connected))
const shorts=readFileSync(`${prefix}-shorts.log`,'utf8')
assert(/^No shorts detected in circuit\.json\s*$/.test(shorts.trim()))
const sourceAudits={}
for(const kind of ['power','boot','storage']){
  const audit=read(`checks/integrated/am3352-${kind}-validation.json`)
  assert.equal((audit.source??audit.circuit).sha256,sha256)
  assert(audit.status.includes('_PASS_'))
  sourceAudits[kind]=audit.status
}
const ddr=read(`${prefix}-ddr-connectivity.json`)
assert.equal(ddr.circuitSha256,sha256);assert.equal(ddr.requiredSignals,49)
assert.equal(ddr.connectedSignals,0);assert.equal(ddr.status,'AM3352_MEMORY_FAIL')
const bootstrap=read('dist/am3352-four-layer-ram-bypass-reserved-attempt-38/result.json')
assert.equal(bootstrap.source.sha256,sha256);assert.equal(bootstrap.preparedLocalEscapes,44)
assert.equal(bootstrap.completedSignalChannels,0)
const summary={status:'RAM_REFERENCE_AND_BYPASS_COPPER_CHECKED_DDR_AND_HOST_INCOMPLETE',
  fabricationReady:false,poweredHost:false,source:{path:circuitPath,sha256,components:circuit.filter(e=>e.type==='source_component').length},
  board:{path:boardPath,sha256:hash(boardPath)},copperLayerCount:4,maxCopperLayers:4,
  signalLayers:['top','bottom'],referenceLayers:{inner1:'GND',inner2:'DDR_1V5'},
  sourceCopper,ramSupplyBallsConnectedToDdrPlane:18,ramGroundBallsConnectedToGroundPlane:21,
  ramBypassCapacitorsConnectedToPlanes:14,ramBypassTerminalsConnectedToPlanes:28,
  preparedLocalSignalEscapes:44,ddrSignalsConnected:0,requiredDdrSignals:49,
  gerberShorts:0,gerberShortsLayerScope:'all four layers',
  independentPhysicalViolationsAllSeverities:physical.length,presentationWarnings:drc.violations.length,
  allHostUnconnectedItems:drc.unconnected_items.length,sourceAudits,
  snapshot:{path:'images/am3352-ram-bypass-source.png',sha256:hash('images/am3352-ram-bypass-source.png')},
  referenceConnectivityEvidence:`${prefix}-copper-connectivity.json`,
  completeReferencePlaneConnections:false,completePowerRouting:false,fullElectricalTimingQualified:false,
  scope:'Actual RAM supply/ground escapes and bypass loops connected to the filled planes. '
    +'DDR signal channels, CPU/PMIC power routing, storage/peripherals, firmware and complete handheld fabrication remain incomplete.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify(summary))
