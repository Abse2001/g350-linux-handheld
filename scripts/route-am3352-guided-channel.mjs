import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {readRoutingSourceSnapshot} from './lib/am3352-routing-source-snapshot.mjs'
import {assertRetainedPhaseCopper} from './lib/am3352-retained-phase-copper.mjs'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {assertOpenCpuTails} from './lib/am3352-open-cpu-tails.mjs'
import {assertOpenCommandPrefixes} from './lib/am3352-open-command-prefixes.mjs'

const [localDirectory,directory,mode='matched',duration='60',tuning='smooth']=process.argv.slice(2)
assert(localDirectory&&directory&&['matched','matched-handoffs','pair-matched-bootstrap','connectivity-bootstrap'].includes(mode))
assert(Number.isFinite(Number(duration))&&Number(duration)>0&&Number(duration)<=300)
assert(['smooth','octilinear'].includes(tuning))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const inputPath=`${localDirectory}/channel.input.simple-route.json`,authored=read(inputPath),input=structuredClone(authored)
const prior=read(`${localDirectory}/result.json`)
const phaseCount=input.connections.length
const localFanouts=read(`${localDirectory}/local-escapes.json`)
for(const c of input.connections){
  const cpu=localFanouts.filter(t=>t.source_trace_id===c.name&&t.route[0].y>-15)
  const ram=localFanouts.filter(t=>t.source_trace_id===c.name&&t.route[0].y<-15)
  assert.equal(cpu.length,1);assert.equal(ram.length,1)
  assert.deepEqual(c.pointsToConnect,[cpu[0],ram[0]].map(t=>{const p=t.route.at(-1);return{x:p.x,y:p.y,layer:p.layer}}),'Every native carrier terminal must be an actual saved package fanout endpoint')
}
const source=readRoutingSourceSnapshot(prior.source).circuit
const temporaryCpuTails=prior.temporaryOpenCpuTails?assertOpenCpuTails(prior,{...input,traces:input.traces.slice(0,prior.sourceTracesRetained)},source):[]
const temporaryCommandPrefixes=prior.temporaryOpenCommandPrefixes?assertOpenCommandPrefixes(prior,{...input,traces:input.traces.slice(0,prior.sourceTracesRetained)},source):[]
const sourceBus=source.find(e=>e.type==='source_bus'&&e.name===prior.bus);assert(sourceBus)
assert(input.connections.every(c=>sourceBus.source_trace_ids.includes(c.name)))
assert.equal(input.buses.length,1);assert.equal(input.buses[0].name,prior.bus)
assert.deepEqual(new Set(input.buses[0].connectionNames),new Set(input.connections.map(c=>c.name)))
const stagedPartialCommandPhase=prior.temporaryOpenRamTails?.stagedRepairOnly&&prior.bus==='DDR_COMMAND_CLOCK'&&phaseCount===1&&input.connections[0].name==='source_trace_48'
const checkedPartialCommandPhase=prior.bus==='DDR_COMMAND_CLOCK'&&phaseCount===1&&prior.manualPartialCommandSelection?.selectedChannels===1
let acceptedDefaultDdrSignals
assert(phaseCount===sourceBus.source_trace_ids.length||phaseCount===2&&prior.temporaryOpenSignals?.length===2&&prior.bus==='DDR_BYTE1'||stagedPartialCommandPhase||checkedPartialCommandPhase)
if(checkedPartialCommandPhase){
  const {summary:checked,registration}=readCheckedCommandSummary(prior.checkedSourceSummary)
  acceptedDefaultDdrSignals=registration.signals
  assert.deepEqual(checked.source,prior.source);assert.equal(hash(checked.source.path),checked.source.sha256)
  assert.equal(checked.connectedDdrSignals,registration.signals);assert(checked.bothBytePlanarTimingPass&&checked.allThreeDifferentialPairPlanarTimingPass)
  assert.equal(checked.gerberShortsAllLayers,0);assert.equal(checked.independentPhysicalViolationsAllSeverities,0)
  assert.deepEqual(prior.preservedSavedDdr,{...checked.paths,signals:registration.signals});assert.equal(hash(checked.paths.path),checked.paths.sha256)
  const selected=prior.manualPartialCommandSelection
  assert.deepEqual(selected.sourceTraceIds,input.connections.map(c=>c.name));assert.equal(selected.signalNames.length,1)
  assert(checked.remainingDdrSignalNames.includes(selected.signalNames[0]));assert.equal(selected.fullCommandClassSignals,26);assert(selected.fullClassMatchingDeferred)
  const trace=source.find(t=>t.type==='source_trace'&&t.source_trace_id===selected.sourceTraceIds[0]);assert.equal(trace.name,selected.signalNames[0])
  assert(!source.some(t=>t.type==='pcb_trace'&&t.source_trace_id===trace.source_trace_id),'A partial new phase must not open checked copper')
  assert.equal(prior.sourceTracesRetained,registration.traces);assert.equal(source.filter(t=>t.type==='pcb_via').length,registration.holes)
  const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
  for(const t of source.filter(t=>t.type==='pcb_trace')){
    const retained=input.traces.find(p=>p.pcb_trace_id===t.pcb_trace_id);assert(retained)
    assert.deepEqual(geometry(retained.route),geometry(temporaryCommandPrefixes.find(p=>p.sourceTraceId===t.source_trace_id)?.retainedTail??temporaryCpuTails.find(p=>p.sourceTraceId===t.source_trace_id)?.retainedTail??t.route))
    for(const p of retained.route.filter(p=>p.route_type==='via')){
      const v=source.find(v=>v.type==='pcb_via'&&Math.hypot(v.x-p.x,v.y-p.y)<1e-8);assert(v)
      assert.equal(p.via_diameter,v.outer_diameter);assert.equal(p.via_hole_diameter,v.hole_diameter);assert.deepEqual(new Set(p.layers),new Set(v.layers))
    }
  }
}
if(stagedPartialCommandPhase){
  const a=prior.temporaryOpenRamTails;assert.equal(hash(a.path),a.sha256);assert.deepEqual(a.originalSource,prior.source)
  const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
  for(const t of read(a.path)){
    assert.deepEqual(geometry(source.find(e=>e.type==='pcb_trace'&&e.source_trace_id===t.sourceTraceId).route),geometry(t.originalRoute))
    assert.deepEqual(input.traces.find(e=>e.source_trace_id===t.sourceTraceId).route,t.retainedPrefix)
  }
}
const retainedPhaseTraceCount=assertRetainedPhaseCopper(prior,input)
assert.equal(input.layerCount,4);assert.equal(input.traces.length,prior.sourceTracesRetained+retainedPhaseTraceCount+prior.nativeBootstrap.dogbones+2*phaseCount)
assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254)
assert.equal(input.allowBlindAndBuriedVias,false)
const requirements={buses:structuredClone(input.buses),differentialPairs:structuredClone(input.differentialPairs)}
let completedFanoutPadDescriptors=0
if(['matched-handoffs','pair-matched-bootstrap','connectivity-bootstrap'].includes(mode)){
  // routeCoupledPair finds package approaches through componentId, even
  // when its actual terminals are saved fanout exits outside the package.
  // These package pads remain fixed copper, with all geometry and owner
  // identities unchanged. They are no longer the channel's terminals.
  input.obstacles=input.obstacles.map(o=>{
    if(!['U_SOC','U_RAM'].includes(o.circuitJsonMetadata?.source_component_name))return o
    const {componentId,...fixedPad}=o
    assert.deepEqual({...fixedPad,...componentId?{componentId}:{}},o,'Only the completed-fanout component association may change')
    completedFanoutPadDescriptors++
    return fixedPad
  })
  assert.equal(completedFanoutPadDescriptors,420)
  assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,
    source.filter(e=>e.type==='pcb_smtpad').length)
  assert.deepEqual(input.buses,requirements.buses);assert.deepEqual(input.differentialPairs,requirements.differentialPairs)
}
if(mode==='pair-matched-bootstrap'){
  // A DQS-qualified intermediate channel remains subject to the original
  // whole-byte limit. Only that limit is deferred while editing fanouts.
  input.buses=input.buses.map(({maxLengthSkew,...b})=>b)
  assert.deepEqual(input.differentialPairs,requirements.differentialPairs)
}
if(mode==='connectivity-bootstrap'){
  // Establish native channel copper before manual tuning. The required
  // timing/pair constraints remain in the source, evidence and independent
  // release check; this intermediate solve cannot satisfy those checks.
  input.buses=input.buses.map(({maxLengthSkew,...b})=>b);input.differentialPairs=[]
}
let carrierReferenceSearchBounds
if(process.env.AM3352_COMMAND_CARRIER_REFERENCE_BOUNDS==='1'){
  assert(checkedPartialCommandPhase&&!temporaryCpuTails.length&&!prior.temporaryOpenRamTails)
  const planes=source.filter(e=>e.type==='pcb_copper_pour');assert.equal(planes.length,2)
  const power=planes.find(p=>p.layer==='inner2');assert(power)
  const points=power.brep_shape.outer_ring.vertices;assert(Array.isArray(points)&&points.length===4)
  const planeBounds={minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))}
  carrierReferenceSearchBounds={minX:planeBounds.minX+.3,maxX:planeBounds.maxX-.3,minY:planeBounds.minY+.3,maxY:planeBounds.maxY-.3}
  for(const c of input.connections)for(const p of c.pointsToConnect)assert(p.x>=carrierReferenceSearchBounds.minX&&p.x<=carrierReferenceSearchBounds.maxX&&p.y>=carrierReferenceSearchBounds.minY&&p.y<=carrierReferenceSearchBounds.maxY)
  input.bounds=carrierReferenceSearchBounds
}
mkdirSync(directory,{recursive:true})
writeFileSync(`${directory}/channel.input.simple-route.json`,JSON.stringify(input)+'\n')
const solverOptions={fanout:'none',smoothTuning:tuning==='smooth'}
const solver=new SOLVERS.BusLanesPipelineSolver(input,solverOptions),start=performance.now()
let iterations=0,next=start+10000
while(!solver.failed&&!solver.solved&&performance.now()-start<Number(duration)*1000){
  solver.step();iterations++
  if(performance.now()>next){console.log(JSON.stringify({iterations,elapsedSeconds:(performance.now()-start)/1000,phase:solver.phase,
    childPhase:solver.child?.phase,lanes:solver.child?.traces.length,stats:solver.stats}));next=performance.now()+10000}
}
const report={...prior,status:solver.solved?'GUIDED_NATIVE_CHANNEL_ROUTED_UNQUALIFIED':'GUIDED_NATIVE_CHANNEL_FAILED_OR_TIMEOUT',
  carrierReferenceSearchBounds,allFixedCopperAndObstaclesRetained:true,
  mode,solverOptions,completedFanoutPadDescriptors,timingRequirements:requirements,priorLocalRun:{path:`${localDirectory}/result.json`,sha256:hash(`${localDirectory}/result.json`)},
  completedSignals:solver.solved?phaseCount:0,timingQualified:false,pairGeometryQualified:false,fabricationReady:false,
  previouslySavedDdrSignals:prior.preservedSavedDdr?.signals??0,
  previouslyRetainedUnqualifiedNativeChannels:prior.retainedPhaseCopper?.completedNativeChannels??0,
  totalDdrSignalsAfterPhase:stagedPartialCommandPhase?22+(solver.solved?phaseCount:0):(solver.solved?phaseCount:0)+(prior.preservedSavedDdr?.signals??0)+(prior.retainedPhaseCopper?.completedNativeChannels??0)-temporaryCpuTails.length-temporaryCommandPrefixes.length,
  ...(temporaryCpuTails.length?{pendingCpuTailRepairs:temporaryCpuTails.length,exportable:false}:{}),
  ...(temporaryCommandPrefixes.length?{pendingCommandPrefixRepairs:temporaryCommandPrefixes.length,exportable:false}:{}),
  ...(stagedPartialCommandPhase?{stagedPartialCommandPhase:true,acceptedDefaultDdrSignals:25,pendingRamTailRepairs:3,exportable:false}:{}),
  ...(checkedPartialCommandPhase?{checkedPartialCommandPhase:true,acceptedDefaultDdrSignals,newCandidateChannelCount:solver.solved?1:0,fullCommandClassMatchingDeferred:true}:{}),
  channel:{solved:solver.solved,failed:solver.failed,error:solver.error??null,iterations,elapsedSeconds:(performance.now()-start)/1000,
    phase:solver.phase,childPhase:solver.child?.phase,stats:solver.stats,
    input:{path:`${directory}/channel.input.simple-route.json`,sha256:hash(`${directory}/channel.input.simple-route.json`)}}}
if(solver.solved){
  const output=solver.getOutput();assert.equal(output.traces.length,input.traces.length+phaseCount)
  for(let i=0;i<input.traces.length;i++)assert.deepEqual(output.traces[i],input.traces[i])
  const path=`${directory}/output.simple-route.json`;writeFileSync(path,JSON.stringify(output)+'\n');report.output={path,sha256:hash(path)}
}
if(!solver.solved&&solver.child?.traces?.length){
  const traces=structuredClone(solver.child.traces)
  const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-6
  for(const trace of traces){
    const connection=input.connections.find(c=>c.name===(trace.source_trace_id??trace.connection_name));assert(connection)
    const endpoints=[trace.route[0],trace.route.at(-1)]
    assert(endpoints.every(p=>connection.pointsToConnect.some(q=>near(p,q)&&p.layer===q.layer)))
    assert(!near(...endpoints))
    assert(trace.route.every(p=>p.route_type!=='wire'||['top','bottom'].includes(p.layer)))
  }
  const path=`${directory}/partial-bootstrap.simple-route.json`
  writeFileSync(path,JSON.stringify({...input,traces:[...input.traces,...traces]})+'\n')
  report.partialBootstrap={path,sha256:hash(path),nativeChannels:traces.length,accepted:false,timingQualified:false}
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,mode,channel:report.channel}))
process.exitCode=solver.solved?0:1
