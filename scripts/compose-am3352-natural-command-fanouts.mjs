import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Preserve completed natural BGA escapes, then align their outboard ends.
// CPU and RAM fanouts occupy disjoint boxes. Unused native bottom branches
// are pruned only when the saved fanout starts at their top land.
const [bootstrap,cpuDirectory,ramDirectory,directory]=process.argv.slice(2)
assert(bootstrap&&cpuDirectory&&ramDirectory&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),input=read(`${bootstrap}/input.simple-route.json`)
const nativePath=`${bootstrap}/signal-escapes.native.json`,native=read(nativePath)
assert.equal(native.length,96);assert.equal(prior.sourceCopper.traces,69)
const bus=input.buses.find(b=>b.name==='DDR_COMMAND_CLOCK');assert.deepEqual(bus.allowedLayers,['top'])
const phaseIds=new Set(bus.connectionNames),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-6
const edits=new Map(),evidence=[]
for(const [endpoint,path] of [[0,cpuDirectory],[1,ramDirectory]]){
 const report=read(`${path}/result.json`);assert.deepEqual(report.source,prior.source)
 assert.equal(report.nativeBootstrap.sha256,hash(nativePath));assert.equal(report.bus,bus.name)
 const localPath=`${path}/local-escapes.json`,paths=read(localPath).filter(t=>(t.route[0].y<-15)===(endpoint===1))
 const records=report.localEscapes.filter(r=>r.package===(endpoint?'U_RAM':'U_SOC')&&!r.error)
 assert.equal(paths.length,26);assert.equal(records.length,26)
 assert.deepEqual(new Set(paths.map(t=>t.source_trace_id)),phaseIds)
 for(const t of paths){
  const original=native.find(n=>n.pcb_trace_id===`local_dogbone_${t.source_trace_id}_${endpoint}`);assert(original)
  assert(near(t.route[0],original.route.at(-1)))
  assert(t.route.every(p=>endpoint?p.y<=-18+1e-6:p.y>=-10.5-1e-6),'Natural package boxes must be disjoint')
  const start=t.route[0]
  const prefix=start.layer==='bottom'?original.route:original.route.slice(0,2)
  assert.equal(prefix.at(-1).layer,start.layer)
  const route=[...structuredClone(prefix),...structuredClone(t.route.slice(1))]
  assert.equal(route.at(-1).layer,'top')
  assert(near(route.at(-1),records.find(r=>r.name===t.source_trace_id).end))
  edits.set(original.pcb_trace_id,{...original,route})
 }
 evidence.push({package:endpoint?'U_RAM':'U_SOC',paths:{path:localPath,sha256:hash(localPath)},report:{path:`${path}/result.json`,sha256:hash(`${path}/result.json`)},completedNaturalFanouts:26})
}
const edited=native.map(t=>edits.get(t.pcb_trace_id)??t);assert.equal(edits.size,52)
for(let i=0;i<native.length;i++)if(!edits.has(native[i].pcb_trace_id))assert.deepEqual(edited[i],native[i])
const holes=edited.flatMap(t=>t.route.filter(p=>p.route_type==='via'))
for(let i=0;i<holes.length;i++)for(let j=0;j<i;j++)assert(Math.hypot(holes[i].x-holes[j].x,holes[i].y-holes[j].y)-.254>=.254-1e-6)
mkdirSync(directory,{recursive:true})
writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(input)+'\n')
writeFileSync(`${directory}/signal-escapes.native.json`,JSON.stringify(edited,null,2)+'\n')
const report={...prior,status:'NATURAL_COMMAND_FANOUTS_COMPOSED_PENDING_OUTBOARD_ALIGNMENT',
 input:{path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)},
 manualNativeEscapeCorrection:{original:{path:nativePath,sha256:hash(nativePath)},naturalFanouts:evidence,
  modifiedCommandEscapeDescriptors:52,otherNativeDogbonesUnchanged:44,signalViasReserved:holes.length,
  actualSourceCopperUnchanged:true,completedSignalChannels:0,
  scope:'All 52 natural CPU/RAM fanouts retained as fixed copper. Outboard alignment and native channel routing are still required; no complete DDR signal is claimed.'},
 fabricationReady:false}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,modifiedCommandEscapeDescriptors:52,signalViasReserved:holes.length}))
