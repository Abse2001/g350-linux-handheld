import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [directory,priorPathsPath,destination]=process.argv.slice(2);assert(directory&&priorPathsPath&&destination)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const report=read(`${directory}/result.json`);assert.equal(report.status,'NATIVE_DDR_PHASE_ROUTED_PENDING_PHYSICAL_CHECKS')
assert.equal(report.mode,'full');assert.equal(report.virtualPreparationTargets.length,0)
for(const a of [report.source,report.input,report.output,report.connectionMap])assert.equal(hash(a.path),a.sha256)
const source=read(report.source.path),input=read(report.input.path),output=read(report.output.path),paths=read(priorPathsPath)
assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false)
assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces)
assert.equal(output.traces.length,input.traces.length+report.definitions.length)
const cpu=source.find(e=>e.type==='source_component'&&e.name==='U_SOC')
const pc=source.find(e=>e.type==='pcb_component'&&e.source_component_id===cpu.source_component_id)
assert.equal(pc.display_offset_x,0);assert.equal(pc.display_offset_y,0);assert.equal(pc.rotation,0)
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
for(const d of report.definitions){
  assert(!paths[d.name]);const t=output.traces.slice(input.traces.length).find(t=>t.source_trace_id===d.sourceTraceId);assert(t)
  assert(near(t.route[0],d.pointsToConnect[0])&&near(t.route.at(-1),d.pointsToConnect[1]))
  paths[d.name]=t.route.map(p=>{
    if(p.route_type==='via'){
      assert.equal(p.via_diameter,.4572);assert.equal(p.via_hole_diameter,.254)
      assert.deepEqual(new Set(p.layers),new Set(['top','inner1','inner2','bottom']))
      return {x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}
    }
    assert.equal(p.route_type,'wire');assert.equal(p.width,.1016);assert(['top','bottom'].includes(p.layer))
    return {x:p.x,y:p.y}
  })
}
writeFileSync(destination,JSON.stringify(paths,null,2)+'\n')
writeFileSync(destination.replace(/\.json$/,'.provenance.json'),JSON.stringify({
  priorPaths:{path:priorPathsPath,sha256:hash(priorPathsPath)},source:report.source,
  nativeRun:{path:`${directory}/result.json`,sha256:hash(`${directory}/result.json`)},nativeOutput:report.output,
  paths:{path:destination,sha256:hash(destination)},newSignals:report.definitions.map(d=>d.name),
  priorSignalsPreserved:Object.keys(read(priorPathsPath)).length,originalTimingRequirements:report.originalTimingRequirements,
  copperLayers:4,fullElectricalTimingQualified:false,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({signals:Object.keys(paths).length,newSignals:report.definitions.map(d=>d.name),destination}))
