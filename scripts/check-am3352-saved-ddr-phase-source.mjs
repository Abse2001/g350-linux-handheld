import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [sourcePath,previousPath,pathsPath,namesString,reportPath]=process.argv.slice(2)
assert(sourcePath&&previousPath&&pathsPath&&namesString&&reportPath)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const source=read(sourcePath),previous=read(previousPath),paths=read(pathsPath),names=namesString.split(',')
const type=(c,t)=>c.filter(e=>e.type===t),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
assert.equal(type(source,'pcb_board')[0].num_layers,4)
assert.equal(source.filter(e=>e.type.endsWith('_error')).length,0)
for(const t of ['source_component','source_port','source_net','source_trace','source_bus','pcb_board','pcb_component','pcb_port','pcb_smtpad','pcb_plated_hole','pcb_keepout'])
  assert.deepEqual(type(source,t),type(previous,t),`Changed fixed ${t}`)
const geometry=t=>t.route.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
for(const old of type(previous,'pcb_trace')){
  const current=type(source,'pcb_trace').find(t=>t.source_trace_id===old.source_trace_id);assert(current)
  assert.deepEqual(geometry(current),geometry(old),`Changed fixed trace ${old.source_trace_id}`)
}
for(const old of type(previous,'pcb_via')){
  const current=type(source,'pcb_via').find(v=>near(v,old));assert(current)
  for(const k of ['outer_diameter','hole_diameter','source_net_id'])assert.equal(current[k],old[k])
  assert.deepEqual(current.layers,old.layers)
}
const cpu=type(source,'source_component').find(c=>c.name==='U_SOC')
const pc=type(source,'pcb_component').find(c=>c.source_component_id===cpu.source_component_id)
assert.equal(pc.display_offset_x,0);assert.equal(pc.display_offset_y,0);assert.equal(pc.rotation,0)
const mapPath='lib/am3352/memory-byte1-top-centered-swizzled-connections.json',map=read(mapPath),lengths=[]
let addedThroughVias=0
for(const name of names){
  const d=map.find(d=>d.name===name);assert(d)
  const t=type(source,'source_trace').find(t=>t.name===name);assert(t)
  assert(!type(previous,'pcb_trace').some(p=>p.source_trace_id===t.source_trace_id))
  const current=type(source,'pcb_trace').find(p=>p.source_trace_id===t.source_trace_id);assert(current)
  const path=paths[name];assert(path);assert.equal(current.route.length,path.length+2)
  for(const [i,p] of path.entries()){
    const actual=current.route[i+1];assert(near(p,actual))
    if(p.via){assert.equal(actual.route_type,'via');assert.equal(p.fromLayer,actual.from_layer);assert.equal(p.toLayer,actual.to_layer)}
    else{assert.equal(actual.route_type,'wire');assert.equal(actual.width,.1016);assert(['top','bottom'].includes(actual.layer))}
  }
  const endpoints=[['U_SOC',d.socPin],['U_RAM',d.ramPin]].map(([component,pin])=>{
    const sc=type(source,'source_component').find(c=>c.name===component)
    const sp=type(source,'source_port').find(p=>p.source_component_id===sc.source_component_id&&p.pin_number===Number(pin.slice(3)))
    assert(t.connected_source_port_ids.includes(sp.source_port_id))
    return type(source,'pcb_port').find(p=>p.source_port_id===sp.source_port_id)
  })
  assert(near(current.route[0],endpoints[0])&&near(current.route.at(-1),endpoints[1]))
  assert.equal(current.route[0].layer,'top');assert.equal(current.route.at(-1).layer,'top')
  const planarMm=current.route.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-current.route[i].x,p.y-current.route[i].y),0)
  const throughVias=current.route.filter(p=>p.route_type==='via').length;addedThroughVias+=throughVias
  lengths.push({name,planarMm,throughVias})
}
assert.equal(type(source,'pcb_trace').length,type(previous,'pcb_trace').length+names.length)
const vias=type(source,'pcb_via');assert.equal(vias.length,type(previous,'pcb_via').length+addedThroughVias)
let minimumHoleEdgeGapMm=Infinity
for(const [i,v] of vias.entries()){
  assert.equal(v.outer_diameter,.4572);assert.equal(v.hole_diameter,.254)
  assert.deepEqual(new Set(v.layers),new Set(['top','inner1','inner2','bottom']))
  for(const w of vias.slice(0,i)){
    const gap=Math.hypot(v.x-w.x,v.y-w.y)-.254;minimumHoleEdgeGapMm=Math.min(minimumHoleEdgeGapMm,gap)
    assert(gap>=.254-1e-8,'Too-close drill holes')
  }
}
const provenancePath=pathsPath.replace(/\.json$/,'.provenance.json'),provenance=read(provenancePath)
for(const key of ['source','nativeRouting','nativeRoutingBootstrap','repairedRouting','nativeBootstrapRun','localFanoutRun','paths','memoryMap','preservedSavedDdr','ramReferenceLayout',
  'nativeBootstrap','ramTailRun','ramTails','priorJoinedPaths','priorJoinedProvenance'])
  if(provenance[key])assert.equal(hash(provenance[key].path),provenance[key].sha256)
if(provenance.checkedCpuChannelReuse)for(const key of ['source','paths','checkedSummary','sections']){
  const a=provenance.checkedCpuChannelReuse[key];assert.equal(hash(a.path),a.sha256)
}
if(provenance.manualRamEscape)for(const key of ['bootstrap','escapes']){
  const a=provenance.manualRamEscape[key];assert.equal(hash(a.path),a.sha256)
}
assert.equal(provenance.source.sha256,hash(previousPath));assert.equal(provenance.paths.sha256,hash(pathsPath))
const skewMm=Math.max(...lengths.map(l=>l.planarMm))-Math.min(...lengths.map(l=>l.planarMm))
const report={status:'SAVED_DDR_PHASE_EXACT_GEOMETRY_AND_FIXED_COPPER_PASS_PHYSICAL_AND_TIMING_CHECKS_REQUIRED',
  source:{path:sourcePath,sha256:hash(sourcePath)},previousSource:{path:previousPath,sha256:hash(previousPath)},
  paths:{path:pathsPath,sha256:hash(pathsPath)},provenance:{path:provenancePath,sha256:hash(provenancePath)},
  addedSignals:names,components:type(source,'source_component').length,actualPads:type(source,'pcb_smtpad').length,
  copperLayers:4,tracePieces:type(source,'pcb_trace').length,throughVias:vias.length,
  preservedTracePieces:type(previous,'pcb_trace').length,preservedThroughVias:type(previous,'pcb_via').length,
  addedThroughVias,lengths,skewMm,minimumHoleEdgeGapMm,fullElectricalTimingQualified:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
