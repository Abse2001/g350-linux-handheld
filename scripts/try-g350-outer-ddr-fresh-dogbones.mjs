// Public native package escape trial after the VTP corridor repair.
// Solved dogbones are local fanouts, not a connected DDR bundle.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {SOLVERS} from '@tscircuit/core'
const [input,prepared,root]=process.argv.slice(2);assert(input&&prepared&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),inputSha=hash(input),preparedSha=hash(prepared)
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
assert.equal(JSON.parse(fs.readFileSync('node_modules/@tscircuit/core/package.json')).version,'0.0.2107')
const base=JSON.parse(fs.readFileSync(input)),srj=JSON.parse(fs.readFileSync(prepared)),ids=new Set(base.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>e.source_trace_id));assert.equal(ids.size,49)
const carriers=base.filter(e=>e.type==='pcb_trace'&&ids.has(e.source_trace_id));assert.equal(carriers.length,49)
const fixedPath=process.env.G350_DDR_DOGBONE_FIXED_CPU_ESCAPES,fixedNames=process.env.G350_DDR_DOGBONE_FIXED_NAMES?JSON.parse(process.env.G350_DDR_DOGBONE_FIXED_NAMES):[]
assert(Array.isArray(fixedNames)&&(!fixedNames.length||fixedPath))
const names=new Map(base.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e.name])),fixedEscapes=fixedPath?JSON.parse(fs.readFileSync(fixedPath)).filter(t=>fixedNames.includes(names.get(t.source_trace_id))):[]
assert.equal(fixedEscapes.length,fixedNames.length);const fixedIds=new Set(fixedEscapes.map(t=>t.source_trace_id)),fixedSha=fixedPath?hash(fixedPath):null
const reserved=srj.traces.filter(t=>t.pcb_trace_id.endsWith('_cpu_reserved'));assert.equal(reserved.length,49)
const holes=srj.obstacles.filter(o=>!o.componentId&&o.shape==='circle'&&o.width===.4572&&o.connectedTo.length===1&&ids.has(o.connectedTo[0]));assert.equal(holes.length,49)
const fixedHoles=fixedEscapes.flatMap(t=>t.route.filter(p=>p.route_type==='via').map(v=>{assert(v.via_diameter===.4572&&v.via_hole_diameter===.254&&JSON.stringify(v.layers)===JSON.stringify(['top','inner1','inner2','bottom']));return {type:'obstacle',shape:'circle',center:{x:v.x,y:v.y},width:.4572,height:.4572,layers:v.layers,connectedTo:[t.source_trace_id]}}))
const includeTraceObstacles=process.env.G350_DDR_DOGBONE_FIXED_TRACE_OBSTACLES??'0';assert(['0','1'].includes(includeTraceObstacles))
const traceObstacles=[]
if(includeTraceObstacles==='1')for(const t of [...srj.traces.filter(t=>!reserved.includes(t)),...fixedEscapes])for(let i=1;i<t.route.length;i++){
 const a=t.route[i-1],b=t.route[i];if(a.route_type!=='wire'||b.route_type!=='wire'||a.layer!==b.layer)continue
 const length=Math.hypot(b.x-a.x,b.y-a.y);if(length<1e-8)continue
 traceObstacles.push({type:'obstacle',center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},width:length,height:b.width,ccwRotationDegrees:Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI,layers:[a.layer],connectedTo:[t.connection_name??t.source_trace_id]})
}
const problem={...srj,connections:carriers.filter(t=>!fixedIds.has(t.source_trace_id)).map(t=>({name:t.source_trace_id,source_trace_id:t.source_trace_id,nominalTraceWidth:.1016,pointsToConnect:[t.route[0],t.route.at(-1)].map((p,i)=>({x:p.x,y:p.y,layer:'top',pcb_port_id:i?p.end_pcb_port_id:p.start_pcb_port_id}))})),traces:[...srj.traces.filter(t=>!reserved.includes(t)),...fixedEscapes.map(t=>({...t,connection_name:t.source_trace_id}))],obstacles:[...srj.obstacles.filter(o=>!holes.includes(o)),...fixedHoles],buses:srj.buses.map(b=>({...b,connectionNames:b.connectionNames.filter(n=>!fixedIds.has(n))})).filter(b=>b.connectionNames.length)}
problem.obstacles.push(...traceObstacles)
fs.mkdirSync(root);fs.copyFileSync('scripts/try-g350-outer-ddr-fresh-dogbones.mjs',root+'/helper.executed.mjs')
fs.writeFileSync(root+'/input.simple-route.json',JSON.stringify(problem)+'\n')
const solver=new SOLVERS.DogboneFanoutSolver({input:problem,fanoutRoutingLayers:['bottom']})
let steps=0,exception=null
try{while(!solver.solved&&!solver.failed&&steps<200000){solver.step();steps++;fs.writeFileSync(root+'/progress.json',JSON.stringify({steps,solved:solver.solved,failed:solver.failed,error:solver.error??null,planningOnly:true,fabricationReady:false})+'\n')}}catch(e){exception=e.message}
const report={input:{path:input,sha256:inputSha},prepared:{path:prepared,sha256:preparedSha},fixedPath,fixedSha,fixedNames,includeTraceObstacles,additionalFixedCopperObstacles:traceObstacles.length,steps,solved:solver.solved,failed:solver.failed,error:exception??solver.error??null,onlyPublicStepAndSolvedOutputUsed:true,localEscapesOnly:true,physicalNativeSourceMatchingGroundAndCadUnqualified:true,fabricationReady:false}
if(solver.solved&&!exception){const output=solver.getOutput();assert(Array.isArray(output));fs.writeFileSync(root+'/solved-local-escapes.simple-route.json',JSON.stringify([...output,...fixedEscapes],null,2)+'\n')}
assert.equal(hash(input),inputSha);assert.equal(hash(prepared),preparedSha)
if(fixedPath)assert.equal(hash(fixedPath),fixedSha)
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));process.exitCode=solver.solved&&!exception?0:2
