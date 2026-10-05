import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [sourcePath,pathsPath,reportPath]=process.argv.slice(2);assert(sourcePath&&pathsPath&&reportPath)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const provenancePath=pathsPath.replace(/\.json$/,'.provenance.json'),provenance=read(provenancePath)
for(const a of [provenance.source,provenance.priorPaths,provenance.priorCheckedSummary,provenance.paths,provenance.preparation])assert.equal(hash(a.path),a.sha256)
assert.equal(hash(pathsPath),provenance.paths.sha256)
const previous=read(provenance.source.path),source=read(sourcePath),paths=read(pathsPath),prior=read(provenance.priorPaths.path)
const changedNames=['DDR_DQSn1','DDR_D7'],changedIds=['source_trace_27','source_trace_32']
for(const name of Object.keys(paths))if(!changedNames.includes(name))assert.deepEqual(paths[name],prior[name])
assert.equal(Object.keys(paths).length,25)
const fixed=c=>c.filter(e=>e.type!=='source_project_metadata'&&!(e.type==='pcb_trace'&&changedIds.includes(e.source_trace_id)))
assert.deepEqual(fixed(source),fixed(previous),'Changed a fixed electrical, physical or presentation record')
assert.equal(source.filter(e=>e.type==='pcb_trace').length,127)
assert.equal(source.filter(e=>e.type==='pcb_via').length,135)
assert.equal(source.find(e=>e.type==='pcb_board').num_layers,4)
const lengths=[]
for(const [i,name] of changedNames.entries()){
  const t=source.find(e=>e.type==='pcb_trace'&&e.source_trace_id===changedIds[i]),p=paths[name]
  assert(t);assert.equal(t.route.length,p.length+2)
  const old=previous.find(e=>e.type==='pcb_trace'&&e.source_trace_id===changedIds[i])
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
  lengths.push({name,planarMm:t.route.slice(1).reduce((s,q,j)=>s+Math.hypot(q.x-t.route[j].x,q.y-t.route[j].y),0),throughVias:t.route.filter(q=>q.route_type==='via').length})
}
const report={status:'CKE_ACCESS_REPAIR_EXACT_GEOMETRY_AND_ALL_OTHER_RECORDS_PRESERVED_INDEPENDENT_CHECKS_REQUIRED',
  source:{path:sourcePath,sha256:hash(sourcePath)},previousSource:provenance.source,paths:provenance.paths,
  provenance:{path:provenancePath,sha256:hash(provenancePath)},priorCheckedSummary:provenance.priorCheckedSummary,
  components:212,actualPads:912,copperLayers:4,tracePieces:127,throughVias:135,changedSignals:changedNames,
  preservedTracePieces:125,preservedThroughVias:135,lengths,minimumHoleEdgeGapMm:read(provenance.priorCheckedSummary.path).minimumHoleEdgeGapMm,
  futureCkeEscapeExported:false,fullElectricalTimingQualified:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
