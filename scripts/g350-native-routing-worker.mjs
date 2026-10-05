import {readFileSync,writeFileSync} from 'node:fs'
import {SOLVERS} from '@tscircuit/core'

const [root,mode,budgetText]=process.argv.slice(2),budget=Number(budgetText)
const input=JSON.parse(readFileSync(`${root}/solver-input.json`,'utf8'))
const options=JSON.parse(readFileSync(`${root}/solver-options.json`,'utf8'))
const solver=mode==='dogbone'?new SOLVERS.DogboneFanoutSolver({input,fanoutRoutingLayers:['bottom']}):mode==='lanes'?new SOLVERS.BusLanesSolver(input,options):new SOLVERS.BusLanesPipelineSolver(input,options)
const start=performance.now();let lastPhase='',timedOut=false
while(!solver.solved&&!solver.failed){
 const phase=solver.phase??'unknown'
 if(phase!==lastPhase){lastPhase=phase;console.log(JSON.stringify({phase,iterations:solver.iterations,sites:solver.sites?.size??0,escapes:solver.escapes?.length??0,acceptedTraces:solver.acceptedTraces?.length??0,childPhase:solver.child?.phase,elapsedSeconds:(performance.now()-start)/1000}))}
 solver.step()
 if(performance.now()-start>budget*1000){timedOut=true;solver.tryFinalAcceptance?.();break}
 await new Promise(resolve=>setTimeout(resolve,0))
}
const output=solver.solved?solver.getOutput():null
if(output)writeFileSync(`${root}/output.json`,JSON.stringify(output,null,2)+'\n')
const carrierSolver=mode==='lanes'?solver:solver.child
const partialCarrierSnapshots=[carrierSolver?.traces??[],carrierSolver?.bestPartial??[]].filter(traces=>traces.length)
if(partialCarrierSnapshots.length)writeFileSync(`${root}/partial-carrier-snapshots.json`,JSON.stringify(partialCarrierSnapshots,null,2)+'\n')
const report={status:solver.solved?'NATIVE_SOLVER_COMPLETE_REQUIRES_REPLAY':timedOut?'NATIVE_SOLVER_BUDGET_EXPIRED':'NATIVE_SOLVER_FAILED',solved:solver.solved,failed:solver.failed,timedOut,error:solver.error??null,failureCode:solver.failureCode??null,phase:solver.phase,iterations:solver.iterations,elapsedSeconds:(performance.now()-start)/1000,sites:solver.sites?[...solver.sites].map(([index,site])=>({index,site,source:solver.sources[index]})):[],escapes:solver.escapes??[],stats:solver.stats??null,outputTraces:output?(Array.isArray(output)?output.length:output.traces.length):0,fabricationReady:false}
writeFileSync(`${root}/solver-result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,phase:report.phase,error:report.error,sites:report.sites.length,outputTraces:report.outputTraces,elapsedSeconds:report.elapsedSeconds}));process.exitCode=solver.solved?0:1
