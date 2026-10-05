import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [directory,destination]=process.argv.slice(2);assert(directory&&destination)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const runPath=`${directory}/result.json`,run=read(runPath)
assert.equal(run.status,'GUIDED_NATIVE_CHANNEL_ROUTED_UNQUALIFIED');assert(run.checkedPartialCommandPhase)
assert.equal(run.completedSignals,1);assert.equal(run.acceptedDefaultDdrSignals,26)
for(const a of [run.source,run.preservedSavedDdr,run.checkedSourceSummary,run.nativeBootstrap,run.priorLocalRun,run.output,run.channel.input])checked(a)
const prior=read(run.preservedSavedDdr.path),paths=structuredClone(prior),source=read(run.source.path),input=read(run.channel.input.path),output=read(run.output.path)
assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces)
assert.equal(output.traces.length,input.traces.length+1)
assert.equal(run.nativeBootstrap.dogbones,0)
const id=run.manualPartialCommandSelection.sourceTraceIds[0],name=run.manualPartialCommandSelection.signalNames[0]
assert.equal(name,'DDR_ODT');assert.equal(id,'source_trace_0');assert(!paths[name])
const localPath=run.priorLocalRun.path.replace(/result\.json$/,'local-escapes.json'),locals=read(localPath)
const cpu=locals.find(t=>t.source_trace_id===id&&t.route[0].y>-15),ram=locals.find(t=>t.source_trace_id===id&&t.route[0].y<-15)
const channel=output.traces.at(-1);assert.equal(channel.source_trace_id,id)
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
assert(near(cpu.route.at(-1),channel.route[0])&&near(ram.route.at(-1),channel.route.at(-1)))
const reverse=r=>r.toReversed().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:{...p})
const joined=[...cpu.route,...channel.route,...reverse(ram.route)],clean=[]
let removedCoincidentWirePoints=0
for(const p of joined){const q=clean.at(-1);if(q&&q.route_type==='wire'&&p.route_type==='wire'&&q.layer===p.layer&&near(q,p)){removedCoincidentWirePoints++;continue}clean.push(p)}
let layer='top'
paths[name]=clean.map(p=>{
  if(p.route_type==='via'){
    assert.equal(p.from_layer,layer);layer=p.to_layer;assert.equal(p.via_diameter,.4572);assert.equal(p.via_hole_diameter,.254)
    assert.deepEqual(new Set(p.layers),new Set(['top','inner1','inner2','bottom']))
    return {x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}
  }
  assert.equal(p.route_type,'wire');assert.equal(p.layer,layer);assert.equal(p.width,.1016);assert(['top','bottom'].includes(layer))
  return {x:p.x,y:p.y}
})
assert.equal(layer,'top')
for(const name of Object.keys(prior))assert.deepEqual(paths[name],prior[name])
const holes=[...source.filter(e=>e.type==='pcb_via').map(v=>({x:v.x,y:v.y})),...paths[name].filter(p=>p.via)]
let minimumHoleEdgeGapMm=Infinity
for(let i=0;i<holes.length;i++)for(let j=0;j<i;j++){const gap=Math.hypot(holes[i].x-holes[j].x,holes[i].y-holes[j].y)-.254;minimumHoleEdgeGapMm=Math.min(minimumHoleEdgeGapMm,gap);assert(gap>=.254-1e-8)}
const planarMm=paths[name].slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-paths[name][i].x,p.y-paths[name][i].y),0)
writeFileSync(destination,JSON.stringify(paths,null,2)+'\n')
const provenance={status:'DDR27_ODT_NATIVE_CHANNEL_AND_MANUAL_FANOUT_REPLAY_INDEPENDENT_CHECKS_REQUIRED',
  source:run.source,priorPaths:run.preservedSavedDdr,priorCheckedSummary:run.checkedSourceSummary,
  nativeChannelRun:artifact(runPath),nativeChannelInput:run.channel.input,nativeChannelOutput:run.output,
  manualLocalRun:run.priorLocalRun,manualLocalCopper:artifact(localPath),nativeBootstrap:run.nativeBootstrap,
  paths:artifact(destination),newSignals:[name],priorSignalsPreserved:26,connectedCandidateSignals:27,remainingUnroutedDdrSignals:22,
  planarMm,throughVias:paths[name].filter(p=>p.via).length,preservedSourceHoles:143,minimumHoleEdgeGapMm,
  removedCoincidentWirePoints,originalTimingRequirements:run.timingRequirements,fullCommandClassMatchingDeferred:true,
  nominalLengthRangeMm:[41.75,44.29],nominalLengthPass:planarMm>=41.75&&planarMm<=44.29,
  nativeBusLanesBootstrap:true,manualLocalRepairs:true,copperLayers:4,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false}
writeFileSync(destination.replace(/\.json$/,'.provenance.json'),JSON.stringify(provenance,null,2)+'\n')
console.log(JSON.stringify({status:provenance.status,signals:27,odtPlanarMm:planarMm,newVias:provenance.throughVias,minimumHoleEdgeGapMm,nominalLengthPass:provenance.nominalLengthPass,fabricationReady:false}))
