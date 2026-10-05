import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'

// Native bus_lanes remains the bootstrap. Pipeline9 repairs its incomplete
// channel topology in a two-signal-layer view of the four-layer board.
// Every resulting via is restored to a physical full-depth through-via.
const [bootstrap,directory,secondsArg='60',pipeline='9']=process.argv.slice(2);assert(bootstrap&&directory)
assert(['8','9'].includes(pipeline))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),physical=read(prior.channel.input.path),partial=read(prior.partialBootstrap.path)
assert.equal(hash(prior.partialBootstrap.path),prior.partialBootstrap.sha256)
assert.equal(hash(prior.channel.input.path),prior.channel.input.sha256)
const prefix=partial.traces,seed=prefix.slice(physical.traces.length),seedNames=new Set(seed.map(t=>t.source_trace_id??t.connection_name))
assert.equal(physical.layerCount,4);assert.equal(physical.traces.length,217);assert([2,4].includes(seedNames.size))
const outer=['top','bottom'],viewTrace=t=>({...t,route:t.route.map(p=>p.route_type==='via'?{...p,layers:outer}:p)})
const input={...physical,layerCount:2,
 obstacles:physical.obstacles.map(o=>({...o,layers:o.layers.filter(l=>outer.includes(l))})).filter(o=>o.layers.length),
 traces:prefix.map(viewTrace),buses:[],differentialPairs:[],
 connections:physical.connections.filter(c=>!seedNames.has(c.name)).map(c=>({...c,
  pointsToConnect:c.pointsToConnect.map(p=>{
   const through=prefix.some(t=>t.source_trace_id===c.name&&t.route.some(v=>v.route_type==='via'&&Math.hypot(v.x-p.x,v.y-p.y)<1e-6))
   if(!through)return p
   const {layer,...point}=p;return {...point,layers:outer}
  })}))}
assert.equal(input.connections.length,26-seedNames.size)
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,882)
mkdirSync(directory,{recursive:true})
const path=`${directory}/signal-view.input.simple-route.json`;writeFileSync(path,JSON.stringify(input)+'\n')
const options={effort:2,cacheProvider:null}
const Solver=pipeline==='9'?SOLVERS.AutoroutingPipelineSolver9_PreloadedTraceGraph:SOLVERS.AutoroutingPipelineSolver8
const solver=new Solver(input,options)
const begun=performance.now();let iterations=0,next=begun+10000
let caughtError
while(!solver.solved&&!solver.failed&&performance.now()-begun<Number(secondsArg)*1000){
 try{solver.step()}catch(e){caughtError=e.message;break}iterations++
 if(performance.now()>next){console.log(JSON.stringify({iterations,phase:solver.getCurrentPhase(),progress:solver.progress}));next=performance.now()+10000}
}
const report={...prior,status:solver.solved?'CAPACITY_COMMAND_REPAIR_SOLVED_UNQUALIFIED':'CAPACITY_COMMAND_REPAIR_FAILED_OR_TIMEOUT',
 priorNativeBootstrap:{path:`${bootstrap}/result.json`,sha256:hash(`${bootstrap}/result.json`)},
 capacityRepair:{solver:`SOLVERS.AutoroutingPipelineSolver${pipeline}${pipeline==='9'?'_PreloadedTraceGraph':''}`,options,solved:solver.solved,failed:solver.failed,
  error:caughtError??solver.error??null,phase:solver.getCurrentPhase(),iterations,elapsedSeconds:(performance.now()-begun)/1000,
  physicalCopperLayers:4,solverSignalViewLayers:2,physicalSignalLayers:outer,reservedPhysicalReferenceLayers:['inner1','inner2'],
  input:{path,sha256:hash(path)},deferredTiming:{command:prior.deferredCommandClassTimingRequirement,clockSkewMm:.127}},
 completedSignals:0,timingQualified:false,fabricationReady:false}
if(solver.solved){
 const raw=solver.getOutputSimpleRouteJson(),rawPath=`${directory}/signal-view.output.simple-route.json`
 writeFileSync(rawPath,JSON.stringify(raw)+'\n');report.capacityRepair.rawOutput={path:rawPath,sha256:hash(rawPath)}
 const updated=solver.getUpdatedPreloadedTraces?.()??[],newTraces=solver.getOutputSimplifiedPcbTraces()
 const restore=t=>({...t,route:t.route.map(p=>p.route_type==='via'?{...p,layers:['top','inner1','inner2','bottom'],via_diameter:.4572,via_hole_diameter:.254}:p)})
 const fixedById=new Map(updated.map(t=>[t.pcb_trace_id,restore(t)]))
 const fixed=prefix.map(t=>fixedById.get(t.pcb_trace_id)??t)
 for(let i=0;i<69;i++)assert.deepEqual(fixed[i],prefix[i],'General repair must preserve every source power/reference piece')
 // Keep updated native fanouts explicit; never silently retain an old path
 // while the capacity solver has moved its physical copper.
 const output={...physical,traces:[...fixed,...newTraces.map(restore)]}
 const outputPath=`${directory}/candidate.output.simple-route.json`;writeFileSync(outputPath,JSON.stringify(output)+'\n')
 report.capacityRepair.candidateOutput={path:outputPath,sha256:hash(outputPath),fixedPieces:fixed.length,newPieces:newTraces.length,
  changedFixedPieces:fixed.filter((t,i)=>JSON.stringify(t)!==JSON.stringify(prefix[i])).length}
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,capacityRepair:report.capacityRepair}));process.exitCode=solver.solved?0:1
