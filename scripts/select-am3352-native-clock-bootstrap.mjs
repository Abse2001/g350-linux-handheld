import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [bootstrap,directory,reboundDirectory,warmCandidatePath]=process.argv.slice(2);assert(bootstrap&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),original=read(prior.channel.input.path),partial=read(prior.partialBootstrap.path)
let input=original,rebound,terminalModification
if(reboundDirectory){
 rebound=read(`${reboundDirectory}/result.json`);input=read(rebound.channel.input.path)
 terminalModification=rebound.additionalCommandTerminalVias??rebound.additionalRamTerminalVias
 assert.equal(hash(rebound.channel.input.path),rebound.channel.input.sha256)
 assert.equal(rebound.source.sha256,prior.source.sha256)
 // Match native channel preparation: remove only completed package-group
 // associations, retaining every physical pad and its ownership data.
 input.obstacles=input.obstacles.map(o=>{
  if(!['U_SOC','U_RAM'].includes(o.circuitJsonMetadata?.source_component_name))return o
  const {componentId,...rest}=o;return rest
 })
 assert.deepEqual(input.obstacles,original.obstacles);assert.deepEqual(input.bounds,original.bounds)
 assert.deepEqual(input.differentialPairs,original.differentialPairs);assert.equal(input.layerCount,4)
 assert.equal(input.traces.length,original.traces.length)
 const changed=new Set(terminalModification.changedTraceIds)
 for(let i=0;i<input.traces.length;i++)if(!changed.has(input.traces[i].pcb_trace_id))assert.deepEqual(input.traces[i],original.traces[i])
 for(const c of original.connections)if(!terminalModification.selectedSignals.includes(c.name))assert.deepEqual(input.connections.find(n=>n.name===c.name),c)
}
assert.equal(hash(prior.partialBootstrap.path),prior.partialBootstrap.sha256)
const pair=input.differentialPairs[0],seed=partial.traces.slice(original.traces.length)
const clock=seed.filter(t=>pair.connectionNames.includes(t.source_trace_id??t.connection_name))
assert.equal(clock.length,2);assert.equal(new Set(clock.map(t=>t.source_trace_id)).size,2)
mkdirSync(directory,{recursive:true})
const inputPath=`${directory}/channel.input.simple-route.json`
writeFileSync(inputPath,JSON.stringify(input)+'\n')
const path=`${directory}/partial-bootstrap.simple-route.json`
writeFileSync(path,JSON.stringify({...input,traces:[...input.traces,...clock]})+'\n')
const report={...prior,status:'NATIVE_CLOCK_CHANNEL_BOOTSTRAP_SELECTED_UNQUALIFIED',
 ...(rebound?{source:rebound.source,nativeBootstrap:rebound.nativeBootstrap,localEscapes:rebound.localEscapes,
  additionalCommandTerminalVias:terminalModification,
  channel:{input:{path:inputPath,sha256:hash(inputPath)},nativeCompleted:false},
  terminalRebinding:{run:{path:`${reboundDirectory}/result.json`,sha256:hash(`${reboundDirectory}/result.json`)},
   actualSourceAndNativeClocksUnchanged:true,accepted:false}}:{}),
 priorNativeRun:{path:`${bootstrap}/result.json`,sha256:hash(`${bootstrap}/result.json`)},
 manualUnusedNativeChannelPruning:{original:prior.partialBootstrap,removedUnmanufacturedSignals:seed.filter(t=>!clock.includes(t)).map(t=>t.source_trace_id)},
 partialBootstrap:{path,sha256:hash(path),nativeChannels:2,accepted:false,timingQualified:false},
 completedSignals:0,timingQualified:false,fabricationReady:false}
if(warmCandidatePath){
 const warm=read(warmCandidatePath);assert.equal(warm.traces.length,input.traces.length+26)
 const channels=warm.traces.slice(input.traces.length)
 for(const t of clock)assert.deepEqual(channels.find(c=>c.source_trace_id===t.source_trace_id),t)
 const candidate=`${directory}/warm-repair-candidate.simple-route.json`
 writeFileSync(candidate,JSON.stringify({...input,traces:[...input.traces,...channels]})+'\n')
 report.reboundWarmCandidate={path:candidate,sha256:hash(candidate),original:{path:warmCandidatePath,sha256:hash(warmCandidatePath)},
  accepted:false,scope:'Temporary authored bridges only; changed package terminals must be rerouted before any candidate acceptance.'}
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,nativeClockChannels:2}))
