import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Reuse the exact matched native/manual CPU and channel sections from the
// independently checked default. Only the RAM-side tails will be replaced.
const [directory]=process.argv.slice(2);assert(directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const current=read('checks/integrated/am3352-ddr-usbc-native-clock-check-summary.json')
const original=read('checks/integrated/am3352-ddr-usbc-control-check-summary.json')
const preparationPath='dist/am3352-ddr-usbc-strobe-cpu-prep-attempt-417/result.json',preparation=read(preparationPath)
for(const a of [current.source,current.paths,original.source,original.sourceGeometryAndPlanarAudit,preparation.source,preparation.input])
  assert.equal(hash(a.path),a.sha256)
assert.deepEqual(preparation.source,current.source)
assert.equal(current.copperLayers,4);assert.equal(current.independentPhysicalViolationsAllSeverities,0)
assert.equal(original.independentPhysicalViolationsAllSeverities,0)
assert(original.ddrPlanarTiming.every(t=>t.pass))
const pathsPath='routing/am3352-guided-both-bytes-and-reset-paths.json',paths=read(pathsPath)
assert.equal(hash(pathsPath),'a356d0cffb8e29477d0c843b99efc91c91b1d63ff675747c72107a9fd62e2d48')
const old=read(original.source.path),source=read(current.source.path),input=read(preparation.input.path)
const sections=[]
input.connections=input.connections.map(c=>{
  const d=preparation.definitions.find(d=>d.sourceTraceId===c.name);assert(d)
  const p=paths[d.name];assert(p)
  const oldTrace=old.find(e=>e.type==='source_trace'&&e.name===d.name)
  const copper=old.find(e=>e.type==='pcb_trace'&&e.source_trace_id===oldTrace.source_trace_id);assert(copper)
  assert.equal(copper.route.length,p.length+2)
  for(const [i,q] of p.entries()){
    const actual=copper.route[i+1];assert(Math.hypot(actual.x-q.x,actual.y-q.y)<1e-8)
    if(q.via){assert.equal(actual.from_layer,q.fromLayer);assert.equal(actual.to_layer,q.toLayer)}
  }
  const last=p.findIndex(q=>q.y<=-18);assert(last>0&&p[last].y===-18)
  const prefix=p.slice(0,last+1);let layer='top'
  const route=prefix.map(q=>{
    if(!q.via)return {route_type:'wire',x:q.x,y:q.y,layer,width:.1016}
    assert.equal(q.fromLayer,layer);layer=q.toLayer
    const v=old.find(e=>e.type==='pcb_via'&&Math.hypot(e.x-q.x,e.y-q.y)<1e-8);assert(v)
    assert.equal(v.outer_diameter,.4572);assert.equal(v.hole_diameter,.254)
    return {route_type:'via',x:q.x,y:q.y,from_layer:q.fromLayer,to_layer:q.toLayer,
      layers:['top','inner1','inner2','bottom'],via_diameter:.4572,via_hole_diameter:.254}
  })
  assert.equal(layer,'top');assert(Math.hypot(route[0].x-d.pointsToConnect[0].x,route[0].y-d.pointsToConnect[0].y)<1e-8)
  assert(Math.abs(route.at(-1).x-(d.name==='DDR_DQSn1'?3.6:3.92))<1e-8)
  sections.push({type:'pcb_trace',pcb_trace_id:`local_dogbone_${c.name}_0`,source_trace_id:c.name,connection_name:c.name,route})
  return {...c,pointsToConnect:structuredClone(d.pointsToConnect)}
})
assert.equal(sections.length,2);assert.equal(input.traces.length,125)
assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false)
input.buses=input.buses.map(b=>({...b,name:'DDR_BYTE1',busId:'DDR_BYTE1',allowedLayers:['top']}))
const refs='lib/am3352/ram-reference-escapes-byte1-access.json'
mkdirSync(directory,{recursive:true})
const inputPath=`${directory}/input.simple-route.json`,sectionsPath=`${directory}/signal-escapes.native.json`
writeFileSync(inputPath,JSON.stringify(input)+'\n');writeFileSync(sectionsPath,JSON.stringify(sections)+'\n')
const report={status:'CHECKED_STROBE_CPU_CHANNEL_SECTIONS_REUSED_RAM_TAILS_OPEN',source:current.source,
  input:{path:inputPath,sha256:hash(inputPath)},preparedLocalEscapes:2,
  sourceCopper:{traces:69,totalSourceTraces:125},memoryMap:preparation.connectionMap,
  ramReferenceLayout:{path:refs,sha256:hash(refs)},preservedSavedDdr:{...current.paths,signals:23},
  checkedCpuChannelReuse:{source:original.source,paths:{path:pathsPath,sha256:hash(pathsPath)},
    checkedSummary:{path:'checks/integrated/am3352-ddr-usbc-control-check-summary.json',sha256:hash('checks/integrated/am3352-ddr-usbc-control-check-summary.json')},
    sections:{path:sectionsPath,sha256:hash(sectionsPath)},
    handoffs:sections.map(t=>({sourceTraceId:t.source_trace_id,end:t.route.at(-1),lengthMm:t.route.slice(1).reduce((s,q,i)=>s+Math.hypot(q.x-t.route[i].x,q.y-t.route[i].y),0)}))},
  nativeClockRun:current.nativeRun,actualPackagePadStartsAllowed:true,allChannelEndpointsActualTopPads:true,
  temporaryOpenSignals:['DDR_DQS1','DDR_DQSn1'],defaultChanged:false,fabricationReady:false}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,handoffs:report.checkedCpuChannelReuse.handoffs}))
