import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Reuse the native bootstrap and recorded manual dogbone corrections after
// assigning the byte1 global channel to the other outer signal layer. The
// actual component/pad/power/byte0 geometry must remain identical.
const [priorDirectory,newBootstrap,directory]=process.argv.slice(2)
assert(priorDirectory&&newBootstrap&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${priorDirectory}/result.json`),fresh=read(`${newBootstrap}/result.json`)
for(const r of [prior,fresh])assert.equal(hash(r.source.path),r.source.sha256)
const old=read(prior.source.path),source=read(fresh.source.path)
for(const type of ['pcb_component','pcb_smtpad','pcb_port','pcb_trace','pcb_via','pcb_copper_pour','pcb_keepout'])
  assert.deepEqual(source.filter(e=>e.type===type),old.filter(e=>e.type===type),`Existing ${type} geometry must be identical`)
assert.deepEqual(fresh.memoryMap,prior.memoryMap);assert.deepEqual(fresh.preservedSavedDdr,prior.preservedSavedDdr)
const input=read(`${newBootstrap}/input.simple-route.json`),native=read(`${priorDirectory}/signal-escapes.native.json`)
assert.equal(native.length,22);assert.deepEqual(input.buses.find(b=>b.name==='DDR_BYTE1').allowedLayers,['top'])
for(const t of native){
  const c=input.connections.find(c=>c.name===t.source_trace_id);assert(c)
  const endpoint=t.route[0].y<-15?1:0
  assert(Math.hypot(t.route[0].x-c.pointsToConnect[endpoint].x,t.route[0].y-c.pointsToConnect[endpoint].y)<1e-6)
}
mkdirSync(directory,{recursive:true})
writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(input)+'\n')
writeFileSync(`${directory}/signal-escapes.native.json`,JSON.stringify(native,null,2)+'\n')
const report={...fresh,status:'NATIVE_BYTE1_ESCAPES_REUSED_FOR_TOP_CHANNEL_LOCAL_MODIFICATION',preparedLocalEscapes:22,
  nativeEscapesReusedFrom:{path:`${priorDirectory}/signal-escapes.native.json`,sha256:hash(`${priorDirectory}/signal-escapes.native.json`)},
  freshSourcePreparedEscapes:fresh.preparedLocalEscapes,manualNativeEscapeCorrection:prior.manualNativeEscapeCorrection,
  input:{path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)},
  scope:'Original native bus_lanes dogbones with documented manual edits, reused against identical physical source geometry; top-channel fanouts and native matching remain pending.'}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,reusedNativeEscapes:22,channelLayer:'top'}))
