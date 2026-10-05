import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [priorPath,directory]=process.argv.slice(2);assert(priorPath&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const prior=read(priorPath);assert.equal(hash(prior.state.path),prior.state.sha256)
const state=read(prior.state.path),planPath='dist/am3352-ddr23-command-replan-manual-fanouts-attempt-763/manual-fanouts.nonexportable.json',plan=read(planPath)
const inputPath='dist/am3352-ddr23-command-replan-manual-bootstrap-input/input.simple-route.json',input=read(inputPath)
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-7
const reverse=route=>route.toReversed().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:{...p})
const carriers=state.carriers.map(t=>{
 const c=input.connections.find(c=>c.name===t.source_trace_id);assert(c)
 const cpu=plan.escapes.find(e=>e.pcb_trace_id===`manual_${c.name}_cpu`),ram=plan.escapes.find(e=>e.pcb_trace_id===`manual_${c.name}_ram`)
 assert(near(cpu.route.at(-1),t.route[0]));assert(near(ram.route.at(-1),t.route.at(-1)))
 // A surface carrier can continue from the top land without traversing
 // the hole. Omit that unused dogbone via in the new full-path proposal.
 const prefix=t.route[0].layer==='bottom'?cpu.route:cpu.route.filter(p=>p.route_type==='wire'&&p.layer==='top')
 const suffix=reverse(t.route.at(-1).layer==='bottom'?ram.route:ram.route.filter(p=>p.route_type==='wire'&&p.layer==='top'))
 const route=[...prefix.slice(0,-1),...t.route,...suffix.slice(1)]
 assert(near(route[0],c.pointsToConnect[0])&&route[0].layer==='top');assert(near(route.at(-1),c.pointsToConnect[1])&&route.at(-1).layer==='top')
 return {...t,pcb_trace_id:`full_${t.source_trace_id}`,route}
})
mkdirSync(directory,{recursive:true})
const path=`${directory}/carriers.nonexportable.json`;writeFileSync(path,JSON.stringify({carriers,source:plan.source,prior:artifact(priorPath),fanoutPlan:artifact(planPath),actualPadInput:artifact(inputPath),qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false})+'\n')
writeFileSync(`${directory}/result.json`,JSON.stringify({status:'REAL_PAD_COMMAND_PATHS_STAGED_UNUSED_FANOUTS_OPEN_FOR_REPLANNING',prior:artifact(priorPath),state:artifact(path),carriers:carriers.length,actualEndpointsRestored:true,original125TracePiecesAnd141ViasMustBePreserved:true,unusedUncommittedFanoutsMayBeReplanned:true,qualifiedNewDdrSignals:0,fabricationReady:false},null,2)+'\n')
console.log(`Prepared ${carriers.length} full real-pad command paths for flexible continuation`)
