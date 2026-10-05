import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [directory,path]=process.argv.slice(2);assert(directory&&path)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const reportPath=`${directory}/result.json`,report=read(reportPath)
assert.equal(report.status,'RAM_FANOUTS_REACHED_CHECKED_CPU_CHANNEL_HANDOFFS')
assert(report.firstPackageOnly&&report.checkedCpuChannelReuse&&report.manualRamEscape)
const checked=a=>assert.equal(hash(a.path),a.sha256)
for(const a of [report.source,report.preservedSavedDdr,report.nativeBootstrap,
  report.checkedCpuChannelReuse.source,report.checkedCpuChannelReuse.paths,report.checkedCpuChannelReuse.sections,
  report.manualRamEscape.bootstrap,report.manualRamEscape.escapes])checked(a)
assert.equal(report.manualRamEscape.preflight.status,'MANUAL_RAM_ESCAPE_PREFLIGHT_PASS_PENDING_EXACT_REPLAY_DRC')
const native=read(report.nativeBootstrap.path),local=read(`${directory}/local-escapes.json`),source=read(report.source.path)
const paths=read(report.preservedSavedDdr.path);assert.equal(Object.keys(paths).length,23)
assert.equal(native.length,3);assert.equal(local.length,2)
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-6
const flip=r=>r.slice().reverse().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:{...p})
const lengths=[]
for(const n of ['source_trace_27','source_trace_28']){
  const cpu=native.find(t=>t.pcb_trace_id===`local_dogbone_${n}_0`).route
  const ram=native.find(t=>t.pcb_trace_id===`local_dogbone_${n}_1`)?.route
  const tail=local.find(t=>t.source_trace_id===n).route
  assert(near(cpu.at(-1),tail.at(-1)));assert.equal(tail.at(-1).layer,'top')
  if(ram){assert(near(ram.at(-1),tail[0]));assert.equal(ram.at(-1).layer,tail[0].layer)}
  else{const port=source.find(e=>e.type==='pcb_port'&&e.pcb_port_id==='pcb_port_373');assert(near(tail[0],port));assert.equal(tail[0].layer,'top')}
  const joined=[...cpu,...flip(tail),...(ram?flip(ram):[])]
  const route=joined.filter((p,i)=>!i||p.route_type==='via'||joined[i-1].route_type==='via'||!near(p,joined[i-1])||p.layer!==joined[i-1].layer)
  let layer='top'
  const signal=source.find(e=>e.type==='source_trace'&&e.source_trace_id===n).name
  paths[signal]=route.map(p=>{
    if(p.route_type==='wire'){assert.equal(p.layer,layer);return {x:p.x,y:p.y}}
    assert.equal(p.from_layer,layer);layer=p.to_layer
    return {x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}
  });assert.equal(layer,'top')
  lengths.push({name:signal,planarMm:route.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-route[i].x,p.y-route[i].y),0),
    throughVias:route.filter(p=>p.route_type==='via').length})
}
assert.equal(Object.keys(paths).length,25)
writeFileSync(path,JSON.stringify(paths,null,2)+'\n')
const provenance={source:report.source,paths:{path,sha256:hash(path)},preservedSavedDdr:report.preservedSavedDdr,
  memoryMap:{path:report.memoryMap.path,sha256:report.memoryMap.sha256},ramReferenceLayout:report.ramReferenceLayout,
  checkedCpuChannelReuse:report.checkedCpuChannelReuse,manualRamEscape:report.manualRamEscape,
  nativeBootstrap:report.nativeBootstrap,ramTailRun:{path:reportPath,sha256:hash(reportPath)},
  ramTails:{path:`${directory}/local-escapes.json`,sha256:hash(`${directory}/local-escapes.json`)},
  signals:25,copperLayers:4,lengths,skewMm:Math.abs(lengths[0].planarMm-lengths[1].planarMm),
  nativeBusLanesBootstrap:true,authoredManualRamRepair:true,timingQualified:false,pairGeometryQualified:false,fabricationReady:false,
  scope:'Exact checked native/manual CPU and channel sections joined to guarded manual RAM repairs; source replay, full byte timing, Gerber shorts and independent physical checks required.'}
writeFileSync(path.replace(/\.json$/,'.provenance.json'),JSON.stringify(provenance,null,2)+'\n')
console.log(JSON.stringify({signals:25,lengths,skewMm:provenance.skewMm,fabricationReady:false}))
