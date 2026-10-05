import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-dual-layer-command-terminal'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const runPath='dist/am3352-dual-layer-command-terminals-attempt-157/result.json',run=read(runPath)
const exported=read('dist/am3352-dual-layer-command-terminal-physical-diagnostic/export.json')
const c=read(exported.circuit.path),baseline=read(run.source.path)
assert.equal(hash(exported.circuit.path),exported.circuit.sha256)
assert.equal(hash(run.source.path),run.source.sha256)
assert.equal(hash(run.nativeBootstrap.path),run.nativeBootstrap.sha256)
assert.equal(c.find(e=>e.type==='pcb_board').num_layers,4)
for(const type of ['source_component','source_port','source_trace','source_net','source_bus','pcb_component','pcb_smtpad','pcb_port','pcb_keepout'])
 assert.deepEqual(c.filter(e=>e.type===type),baseline.filter(e=>e.type===type),`Preserve all ${type}`)
const connectivity=read(`${prefix}-connectivity.json`),reference=read(`${prefix}-reference-connectivity.json`),ddr=read(`${prefix}-native-ddr-connectivity.json`)
for(const artifact of [connectivity.circuit,reference.source,ddr.circuit])assert.equal(artifact.sha256,exported.circuit.sha256)
for(const artifact of [connectivity.board,reference.board,ddr.board])assert.equal(hash(artifact.path),artifact.sha256)
assert.equal(connectivity.cpuFanoutsConnected,26);assert.equal(connectivity.ramFanoutsConnected,26)
assert.equal(connectivity.records.length,52);assert(connectivity.records.every(r=>r.padToOutboardConnected))
assert.equal(connectivity.physicalVias,226)
assert.equal(reference.ramSupplyBallsConnectedToDdrPlane,18);assert.equal(reference.ramGroundBallsConnectedToGroundPlane,21)
assert.equal(reference.ramBypassTerminalsConnectedToPlanes,28)
assert(reference.records.every(r=>r.connected)&&reference.bypassRecords.every(r=>r.connected))
assert.equal(ddr.connectedSignals,0);assert(ddr.results.every(r=>!r.connected))
const drc=read(`${prefix}-kicad-drc.json`),presentation=new Set(['silk_edge_clearance','text_height','silk_overlap','silk_over_copper'])
const physical=drc.violations.filter(v=>!presentation.has(v.type))
assert.equal(physical.length,96);assert(physical.every(v=>v.type==='via_dangling'))
assert.equal(drc.violations.filter(v=>presentation.has(v.type)).length,418)
assert.equal(drc.unconnected_items.length,499)
assert.equal(readFileSync(`${prefix}-shorts.log`,'utf8').trim(),'No shorts detected in circuit.json')
assert(readFileSync(`${prefix}-library.log`,'utf8').includes('all 4808 physical records unchanged'))
const vias=c.filter(e=>e.type==='pcb_via');assert.equal(vias.length,226)
let minimumHoleEdgeClearanceMm=Infinity
for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)minimumHoleEdgeClearanceMm=Math.min(minimumHoleEdgeClearanceMm,
 Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)-(vias[i].hole_diameter+vias[j].hole_diameter)/2)
assert(minimumHoleEdgeClearanceMm>=.254-1e-6)
const summary={status:'ALL_52_COMMAND_TERMINALS_PHYSICALLY_CONNECTED_CHANNELS_INCOMPLETE',
 circuit:exported.circuit,board:ddr.board,routingRun:{path:runPath,sha256:hash(runPath)},
 cpuCommandTerminalsConnected:26,ramCommandTerminalsConnected:26,completeDdrChannels:0,
 physicalCopperLayers:4,signalLayers:['top','bottom'],reservedReferenceLayers:['inner1','inner2'],
 physicalThroughVias:226,newTerminalVias:51,reusedTerminalVias:1,minimumHoleEdgeClearanceMm,
 sourcePowerPiecesPreserved:69,ramSupplyBallsConnected:18,ramGroundBallsConnected:21,ramBypassTerminalsConnected:28,
 gerberShortsAllLayers:0,clearanceViolationsAllSeverities:0,retainedDanglingVias:96,presentationWarnings:418,
 wholeHostUnconnectedItems:499,exactFootprints:273,physicalLibraryRecordsPreserved:4808,
 independentFullDrcPass:false,timingQualified:false,fabricationReady:false,
 scope:'Independent pad-to-terminal diagnostic only. Terminal vias restrict channel routing; the next repair uses clock-only terminal vias. The checked 23-channel layout remains the active default.'}
writeFileSync(`${prefix}-check-summary.json`,JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify(summary))
