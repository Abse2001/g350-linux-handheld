import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readRoutingSourceSnapshot} from './lib/am3352-routing-source-snapshot.mjs'

// Save the native channel plus edited local fanouts as editable tscircuit
// pcbPath points. The source still owns every component and actual pad.
const directory=process.argv[2]??'dist/am3352-guided-byte0-optimized-attempt-49'
const path=process.argv[3]??'routing/am3352-guided-byte0-paths.json'
const mapPath=process.argv[4]??'lib/am3352/memory-byte1-swizzled-connections.json'
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const report=read(`${directory}/result.json`),output=read(report.output.path),snapshot=readRoutingSourceSnapshot(report.source),source=snapshot.circuit
const input=read(report.channel.input.path),phaseIds=new Set(input.connections.map(c=>c.name))
assert.equal(hash(report.output.path),report.output.sha256)
assert.equal(hash(report.channel.input.path),report.channel.input.sha256)
const sourceBus=source.find(e=>e.type==='source_bus'&&(report.bus?e.name===report.bus:
 e.source_trace_ids.length===phaseIds.size&&e.source_trace_ids.every(n=>phaseIds.has(n))));assert(sourceBus)
assert([...phaseIds].every(n=>sourceBus.source_trace_ids.includes(n)))
assert(phaseIds.size===sourceBus.source_trace_ids.length||phaseIds.size===2&&report.temporaryOpenSignals?.length===2&&report.bus==='DDR_BYTE1')
const phaseNames=new Set(source.filter(e=>e.type==='source_trace'&&phaseIds.has(e.source_trace_id)).map(e=>e.name))
const connections=read(mapPath).filter(c=>phaseNames.has(c.name));assert.equal(connections.length,phaseIds.size)
const flip=r=>r.slice().reverse().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:{...p})
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-6
const paths=report.preservedSavedDdr?read(report.preservedSavedDdr.path):{}
if(report.preservedSavedDdr)assert.equal(hash(report.preservedSavedDdr.path),report.preservedSavedDdr.sha256)
const previousSignals=Object.keys(paths).length
const prefixCount=(report.sourceTracesRetained??source.filter(e=>e.type==='pcb_trace').length)+report.nativeBootstrap.dogbones+2*connections.length
assert.equal(output.traces.length,prefixCount+connections.length)
for(const c of connections){
  const n=source.find(e=>e.type==='source_trace'&&e.name===c.name).source_trace_id
  const native=end=>{
    const trace=output.traces.find(t=>t.pcb_trace_id===`local_dogbone_${n}_${end}`)
    if(trace)return trace.route
    assert.equal(report.manualLocalStart,'Exact top-layer numeric package pads')
    const component=source.find(e=>e.type==='source_component'&&e.name===(end?'U_RAM':'U_SOC'))
    const port=source.find(e=>e.type==='source_port'&&e.source_component_id===component.source_component_id&&e.pin_number===Number((end?c.ramPin:c.socPin).slice(3)))
    const pad=source.find(e=>e.type==='pcb_port'&&e.source_port_id===port.source_port_id)
    const start=local(end)[0];assert.equal(start.layer,'top');assert(near(start,pad),'Manual local fanout must start at its exact numeric package pad')
    return [{...start}]
  }
  const local=end=>output.traces.find(t=>t.pcb_trace_id===`guided_local_dogbone_${n}_${end}`).route
  const cpu=local(0),ram=local(1)
  const retainedNative=end=>{
    const route=native(end),start=local(end)[0]
    if(start.layer==='bottom'){
      if(route.at(-1).layer==='bottom')return route
      const index=route.findLastIndex(p=>p.route_type==='via'&&near(p,start)&&p.from_layer==='bottom'&&p.to_layer==='top')
      assert(index>=0,'Bottom channel must reuse a full-depth terminal already reached on bottom')
      return [...route.slice(0,index),{route_type:'wire',x:start.x,y:start.y,layer:'bottom',width:.1016}]
    }
    assert.equal(start.layer,'top')
    if(route.at(-1).route_type==='wire'&&route.at(-1).layer==='top'&&near(route.at(-1),start))return route
    const index=route.findIndex(p=>p.route_type==='via'&&near(p,start))
    assert(index>=0,'Top escape must reuse the exact native via location')
    return [...route.slice(0,index),{route_type:'wire',x:start.x,y:start.y,layer:'top',width:.1016}]
  }
  let channel=output.traces.slice(prefixCount).find(t=>t.source_trace_id===n).route
  if(!near(channel[0],cpu.at(-1)))channel=flip(channel)
  assert(near(channel[0],cpu.at(-1))&&near(channel.at(-1),ram.at(-1)))
  const route=[...retainedNative(0),...cpu,...channel,...flip(ram),...flip(retainedNative(1))]
  const joined=route.filter((p,i)=>!i||p.route_type==='via'||route[i-1].route_type==='via'||!near(p,route[i-1])||p.layer!==route[i-1].layer)
  let layer='top'
  paths[c.name]=joined.map(p=>{
    if(p.route_type==='wire'){assert.equal(p.layer,layer);return {x:p.x,y:p.y}}
    assert.equal(p.from_layer,layer);layer=p.to_layer
    return {x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}
  })
  assert.equal(layer,'top')
}
assert.equal(Object.keys(paths).length,previousSignals+connections.length)
writeFileSync(path,JSON.stringify(paths,null,2)+'\n')
writeFileSync(path.replace(/\.json$/,'.provenance.json'),JSON.stringify({
  source:snapshot.source,
  ...(report.channel.manuallyCompleted?{repairedRouting:report.output,nativeRoutingBootstrap:report.partialBootstrap,
    nativeBootstrapRun:report.priorNativeBootstrap}:{nativeRouting:report.output}),
  manualModification:report.manualModification,
  manualPairTuning:report.manualPairTuning,manualLocalDataTuning:report.manualLocalDataTuning,
  manualNativeEscapeCorrection:report.manualNativeEscapeCorrection,manualCpuDogboneCorrection:report.manualCpuDogboneCorrection,
  manualUnusedBranchPruning:report.manualUnusedBranchPruning,localFanoutRun:report.priorLocalRun,
  manualUnusedBranchPruningHistory:report.manualUnusedBranchPruningHistory,
  manualCpuPadStartCorrection:report.manualCpuPadStartCorrection,manualCpuStrobeViaRestoration:report.manualCpuStrobeViaRestoration,
  manualRamMaskPadStartCorrection:report.manualRamMaskPadStartCorrection,
  manualByte1AfterByte0Correction:report.manualByte1AfterByte0Correction,
  cpuPairViaHandoffCorridor:report.cpuPairViaHandoffCorridor,
  nativeRamOnlyPreparation:report.nativeRamOnlyPreparation,manualLocalStart:report.manualLocalStart,
  manualChannelLayerAllocation:report.manualChannelLayerAllocation,
  additionalCommandTerminalVias:report.additionalCommandTerminalVias,
  reusedPackageFanouts:report.reusedPackageFanouts,
  preservedSavedDdr:report.preservedSavedDdr,ramReferenceLayout:report.ramReferenceLayout,
  paths:{path,sha256:hash(path)},memoryMap:{path:mapPath,sha256:hash(mapPath)},signals:previousSignals+connections.length,copperLayers:4,timingQualified:false,pairGeometryQualified:false,
  fabricationReady:false,scope:report.channel.manuallyCompleted?
   'Native bus_lanes bootstrap with authored channel repairs and edited package fanouts; independent planar timing/physical checks and complete host qualification required.':
   'Native bus_lanes channel with edited local escapes; independent planar timing/physical checks and complete host qualification required.'},null,2)+'\n')
console.log(`Saved ${Object.keys(paths).length} editable pcbPath routes from the native bootstrap and local modifications.`)
