import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readRoutingSourceSnapshot} from './lib/am3352-routing-source-snapshot.mjs'

// DQ-only permutation derived from disjoint physical package fanout exits.
// Rebuild the actual tscircuit source before this can become channel copper.
const [localDirectory,mapPath,newBootstrap,directory]=process.argv.slice(2)
assert(localDirectory&&mapPath)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${localDirectory}/result.json`),oldSource=readRoutingSourceSnapshot(prior.source).circuit
const escapeProvenance=read(prior.nativeBootstrap.path.replace(/signal-escapes\.native\.json$/,'result.json'))
assert.equal(prior.status,'DISJOINT_PACKAGE_FANOUTS_READY_FOR_DQ_MAP_REBIND');assert.equal(prior.firstPackage,'U_RAM')
const names=new Map(oldSource.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e.name]))
const byteIndex=prior.bus==='DDR_BYTE1'?1:0
assert(['DDR_BYTE0','DDR_BYTE1'].includes(prior.bus))
const original=read(prior.memoryMap?.path??'lib/am3352/memory-byte1-swizzled-connections.json'),selected=structuredClone(original)
const aliases=new Map(prior.localExitPermutation.map(e=>[e.firstPackageName,e.secondPackageName]))
assert.equal(aliases.size,8);assert.equal(new Set(aliases.values()).size,8)
for(const e of prior.localExitPermutation){
  const cpu=selected.find(c=>c.name===names.get(e.secondPackageName)),ram=original.find(c=>c.name===names.get(e.firstPackageName))
  const inByte=n=>/^DDR_D\d+$/.test(n)&&Math.floor(Number(n.slice(5))/8)===byteIndex
  assert(inByte(cpu.name)&&inByte(ram.name))
  for(const key of ['ramPin','ramBall','ramFunction'])cpu[key]=ram[key]
}
assert.equal(new Set(selected.map(c=>c.ramPin)).size,49)
if(!newBootstrap){
  writeFileSync(mapPath,JSON.stringify(selected,null,2)+'\n')
  writeFileSync(mapPath.replace(/\.json$/,'.provenance.json'),JSON.stringify({source:prior.source,
    localFanouts:{path:`${localDirectory}/result.json`,sha256:hash(`${localDirectory}/result.json`)},
    scope:`Within byte${byteIndex} DQ-only permutation; DQS/DM, the other byte and command/clock unchanged. No routed-channel or fabrication approval.`},null,2)+'\n')
  console.log('Saved the physical-exit DQ map; rebuild the actual source next.');process.exit(0)
}
assert.deepEqual(read(mapPath),selected)
assert(directory)
const bootstrap=read(`${newBootstrap}/result.json`),snapshot=readRoutingSourceSnapshot(bootstrap.source),source=snapshot.circuit
const input=read(`${newBootstrap}/input.simple-route.json`),oldInput=read(`${prior.nativeBootstrap.path.replace(/signal-escapes\.native\.json$/,'input.simple-route.json')}`)
for(const type of ['pcb_component','pcb_smtpad','pcb_trace','pcb_via','pcb_copper_pour'])
  assert.deepEqual(source.filter(e=>e.type===type),oldSource.filter(e=>e.type===type),`Actual ${type} geometry must remain unchanged`)
assert.deepEqual(input.traces,oldInput.traces)
const newIds=new Map(source.filter(e=>e.type==='source_trace').map(e=>[e.name,e.source_trace_id]))
const memoryNames=new Set(selected.map(c=>c.name))
for(const [id,name] of names)if(memoryNames.has(name))assert.equal(newIds.get(name),id,'Trace declaration order must retain CPU signal identifiers')
const native=read(prior.nativeBootstrap.path),local=read(`${localDirectory}/local-escapes.json`)
const rebind=t=>{
  const result=structuredClone(t),isRam=t.pcb_trace_id.endsWith('_1')
  if(isRam&&aliases.has(t.source_trace_id)){
    const old=t.source_trace_id,next=aliases.get(old)
    result.source_trace_id=next;result.connection_name=next;result.pcb_trace_id=t.pcb_trace_id.replace(old,next)
  }
  return result
}
const boundNative=native.map(rebind),boundLocal=local.map(rebind),names0=new Set(input.buses.find(b=>b.name===prior.bus).connectionNames)
for(const c of input.connections.filter(c=>names0.has(c.name)))for(let end=0;end<2;end++){
  const stub=boundNative.find(t=>t.pcb_trace_id===`local_dogbone_${c.name}_${end}`)
  const localStart=boundLocal.find(t=>t.pcb_trace_id===`guided_local_dogbone_${c.name}_${end}`).route[0]
  if(stub)assert(Math.hypot(stub.route[0].x-c.pointsToConnect[end].x,stub.route[0].y-c.pointsToConnect[end].y)<1e-6)
  else {
    assert.equal(boundNative.length,0,'A missing dogbone is permitted only for exact top-pad preparation')
    assert.equal(c.pointsToConnect[end].layer,'top');assert.equal(localStart.layer,'top')
    assert(Math.hypot(localStart.x-c.pointsToConnect[end].x,localStart.y-c.pointsToConnect[end].y)<1e-6)
  }
}
const connections=input.connections.filter(c=>names0.has(c.name)).map(c=>{
  const endpoints=[0,1].map(end=>boundLocal.find(t=>t.pcb_trace_id===`guided_local_dogbone_${c.name}_${end}`).route.at(-1))
  assert(Math.abs(endpoints[0].x-endpoints[1].x)<1e-6)
  return {...c,pointsToConnect:endpoints.map(p=>({x:p.x,y:p.y,layer:p.layer}))}
})
const channel={...input,traces:[...input.traces,...boundNative,...boundLocal],connections,
  buses:input.buses.filter(b=>b.name===prior.bus),differentialPairs:input.differentialPairs.filter(p=>p.connectionNames.every(n=>names0.has(n)))}
mkdirSync(directory,{recursive:true})
const nativePath=`${directory}/signal-escapes.native.json`,channelPath=`${directory}/channel.input.simple-route.json`
const bootstrapInputPath=`${directory}/input.simple-route.json`
writeFileSync(bootstrapInputPath,JSON.stringify(input)+'\n')
writeFileSync(nativePath,JSON.stringify(boundNative,null,2)+'\n');writeFileSync(`${directory}/local-escapes.json`,JSON.stringify(boundLocal,null,2)+'\n')
writeFileSync(channelPath,JSON.stringify(channel)+'\n')
writeFileSync(`${directory}/result.json`,JSON.stringify({...prior,status:'DQ_REBOUND_SOURCE_AND_FANOUTS_CHECKED_CHANNEL_UNROUTED',
  source:snapshot.source,memoryMap:{path:mapPath,sha256:hash(mapPath)},nativeBootstrap:{path:nativePath,sha256:hash(nativePath),dogbones:boundNative.length},
  sourceCopper:bootstrap.sourceCopper,preparedLocalEscapes:boundNative.length,
  ramPlacementVariant:bootstrap.ramPlacementVariant,
  input:{path:bootstrapInputPath,sha256:hash(bootstrapInputPath)},
  localEscapes:prior.localEscapes.map(e=>({...e,name:e.package==='U_RAM'&&aliases.has(e.name)?aliases.get(e.name):e.name})),
  dqPermutationAppliedToPhysicalOwners:true,
  manualCpuDogboneCorrection:prior.manualCpuDogboneCorrection??escapeProvenance.manualCpuDogboneCorrection,
  sourceSnapshot:snapshot.source,channel:{input:{path:channelPath,sha256:hash(channelPath)},solved:false},completedSignals:0,
  scope:'Actual numeric-pin source rebuilt with a permitted DQ-only permutation. Native channel routing and independent checks still required.'},null,2)+'\n')
console.log('Rebound actual source and all local copper owners; native channel input ready.')
