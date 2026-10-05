import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [sourcePath,reportPath]=process.argv.slice(2);assert(sourcePath&&reportPath)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const pathsPath='routing/am3352-ddr-usbc-cke-matched-paths.json',provenancePath=pathsPath.replace(/\.json$/,'.provenance.json'),provenance=read(provenancePath)
for(const a of [provenance.source,provenance.priorPaths,provenance.priorCheckedSummary,provenance.paths,provenance.repairRun,provenance.shortcutDiagnostic])checked(a)
const priorSummary=read(provenance.priorCheckedSummary.path),source=read(sourcePath),previous=read(provenance.source.path),paths=read(pathsPath),prior=read(provenance.priorPaths.path)
assert.deepEqual(priorSummary.source,provenance.source);assert.deepEqual(priorSummary.paths,provenance.priorPaths)
assert.deepEqual(provenance.changedSignals,['DDR_DQSn1'])
assert.equal(Object.keys(paths).length,26)
for(const name of Object.keys(paths))if(name!=='DDR_DQSn1')assert.deepEqual(paths[name],prior[name])
const fixed=c=>c.filter(e=>e.type!=='source_project_metadata'&&!(e.type==='pcb_trace'&&e.source_trace_id==='source_trace_27'))
assert.deepEqual(fixed(source),fixed(previous),'Changed another electrical, physical, plane or presentation record')
assert.equal(source.filter(e=>e.type==='source_component').length,212)
assert.equal(source.filter(e=>e.type==='pcb_smtpad').length,912)
assert.equal(source.filter(e=>e.type==='pcb_trace').length,128)
assert.equal(source.filter(e=>e.type==='pcb_via').length,143)
assert.equal(source.find(e=>e.type==='pcb_board').num_layers,4)
const t=source.find(e=>e.type==='pcb_trace'&&e.source_trace_id==='source_trace_27'),old=previous.find(e=>e.type==='pcb_trace'&&e.source_trace_id==='source_trace_27'),p=paths.DDR_DQSn1
assert.equal(t.route.length,p.length+2)
assert.deepEqual(t.route[0],old.route[0]);assert.deepEqual(t.route.at(-1),old.route.at(-1))
let layer='top'
for(const [j,q] of p.entries()){
  const actual=t.route[j+1];assert(Math.hypot(q.x-actual.x,q.y-actual.y)<1e-8)
  if(q.via){assert.equal(actual.route_type,'via');assert.equal(actual.from_layer,layer);assert.equal(actual.to_layer,q.toLayer);layer=q.toLayer}
  else{assert.equal(actual.route_type,'wire');assert.equal(actual.width,.1016);assert.equal(actual.layer,layer)}
  assert(['top','bottom'].includes(layer))
}
assert.equal(layer,'top')
assert.deepEqual(t.route.filter(q=>q.route_type==='via'),old.route.filter(q=>q.route_type==='via'))
const length=r=>r.slice(1).reduce((s,q,i)=>s+Math.hypot(q.x-r[i].x,q.y-r[i].y),0)
assert(Math.abs(length(p)-provenance.negativeStrobePlanarMm)<1e-8)
assert(provenance.strobePlanarSkewMm<=.127&&provenance.byte1PlanarSkewMm<=.635+1e-8)
const report={status:'DDR26_STROBE_REPAIR_EXACT_SOURCE_AND_ALL_OTHER_RECORDS_PRESERVED_INDEPENDENT_CHECKS_REQUIRED',
  source:artifact(sourcePath),previousSource:provenance.source,paths:provenance.paths,provenance:artifact(provenancePath),priorCheckedSummary:provenance.priorCheckedSummary,
  components:212,actualPads:912,copperLayers:4,tracePieces:128,throughVias:143,changedSignals:['DDR_DQSn1'],preservedTracePieces:127,preservedThroughVias:143,
  negativeStrobePlanarMm:length(p),positiveStrobePlanarMm:length(paths.DDR_DQS1),strobePlanarSkewMm:provenance.strobePlanarSkewMm,byte1PlanarSkewMm:provenance.byte1PlanarSkewMm,
  minimumHoleEdgeGapMm:priorSummary.minimumHoleEdgeGapMm,ddrPowerPlaneRepair:priorSummary.ddrPowerPlaneRepair,
  newVias:0,ckeConnected:true,ckePlanarMm:length(paths.DDR_CKE),ckeNominalLengthPass:false,fullElectricalTimingQualified:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,negativeStrobePlanarMm:report.negativeStrobePlanarMm,strobeSkewMm:report.strobePlanarSkewMm,preservedThroughVias:143,newVias:0,fabricationReady:false}))
