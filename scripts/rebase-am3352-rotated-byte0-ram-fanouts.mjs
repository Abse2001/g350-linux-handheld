import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Reuse only already-authored RAM geometry while restoring eleven early CPU
// reservations. This creates no channel and changes no actual source copper.
const [bootstrap,localDirectory,directory]=process.argv.slice(2)
assert(bootstrap&&localDirectory&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const next=read(`${bootstrap}/result.json`),old=read(`${localDirectory}/result.json`)
assert.equal(old.bus,'DDR_BYTE0');assert.equal(old.freeDqExitPermutation,false)
assert.equal(next.source.sha256,old.source.sha256)
for(const s of [next.source,old.source])assert.equal(hash(s.path),s.sha256)
assert.equal(next.memoryMap.sha256,old.memoryMap.sha256)
assert.equal(next.ramPlacementVariant.rotationDeg,180)
assert.equal(next.manualUnusedBranchPruning.retainedByte1CpuThroughDogbones,11)
assert.equal(next.sourceCopper.traces,69);assert.equal(next.sourceCopper.throughVias,69)
const input=read(`${bootstrap}/input.simple-route.json`),native=read(`${bootstrap}/signal-escapes.native.json`)
assert.equal(native.length,96);assert.equal(input.traces.length,69)
const oldInputPath=old.nativeBootstrap.path.replace('signal-escapes.native.json','input.simple-route.json')
assert.deepEqual(input,read(oldInputPath),'Every source pad, copper item, logical endpoint and final layer remains fixed')
const priorNative=read(old.nativeBootstrap.path)
assert.equal(hash(old.nativeBootstrap.path),old.nativeBootstrap.sha256)
const byte1=new Set(input.buses.find(b=>b.name==='DDR_BYTE1').connectionNames)
for(const t of native){
  const previous=priorNative.find(p=>p.pcb_trace_id===t.pcb_trace_id);assert(previous)
  if(byte1.has(t.source_trace_id)&&t.route[0].y>-15){
    assert(t.route.every(p=>p.y>-10))
    assert.deepEqual({...t,route:t.route.slice(0,2)},previous,'Only early CPU byte1 via branches may return')
  }else assert.deepEqual(t,previous)
}
const paths=read(`${localDirectory}/local-escapes.json`).filter(t=>t.route[0].y<-15)
const records=old.localEscapes.filter(r=>r.package==='U_RAM'&&!r.error)
assert.equal(paths.length,11);assert.equal(records.length,11)
const phase=new Set(input.buses.find(b=>b.name==='DDR_BYTE0').connectionNames)
assert.deepEqual(new Set(paths.map(t=>t.source_trace_id)),phase)
for(const t of paths){
  assert(t.route.every(p=>p.y<=-18+1e-6),'Reused RAM paths stay clear of newly reserved CPU holes')
  const stub=native.find(p=>p.pcb_trace_id===t.pcb_trace_id.replace('guided_',''))
  assert(stub);assert(Math.hypot(t.route[0].x-stub.route.at(-1).x,t.route[0].y-stub.route.at(-1).y)<1e-6)
}
mkdirSync(directory,{recursive:true})
writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(input)+'\n')
writeFileSync(`${directory}/signal-escapes.native.json`,JSON.stringify(native,null,2)+'\n')
writeFileSync(`${directory}/local-escapes.json`,JSON.stringify(paths,null,2)+'\n')
const nativePath=`${directory}/signal-escapes.native.json`
const report={...old,status:'ROTATED_BYTE0_RAM_FANOUTS_REBASED_CPU_BYTE1_ESCAPES_RESERVED',
  source:next.source,sourceCopper:next.sourceCopper,preparedLocalEscapes:96,ramPlacementVariant:next.ramPlacementVariant,
  input:{path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)},
  nativeBootstrap:{path:nativePath,sha256:hash(nativePath),dogbones:96},localEscapes:records,
  manualUnusedBranchPruning:next.manualUnusedBranchPruning,
  retainedEarlyCpuByte1Reservations:11,
  rebasedRamFanouts:{path:`${localDirectory}/local-escapes.json`,sha256:hash(`${localDirectory}/local-escapes.json`),count:11},
  completedSignals:0,fabricationReady:false,timingQualified:false,pairGeometryQualified:false}
delete report.channel;delete report.output;delete report.localReplans
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,reusedRamFanouts:11,nativeTerminals:96,earlyCpuByte1Vias:11}))
