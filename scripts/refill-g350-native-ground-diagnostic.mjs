// Fast, isolated locked-solver diagnostic; not a substitute for source replay.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {CopperPourPipelineSolver,convertCircuitJsonToInputProblem,initializeManifoldGeometry} from '@tscircuit/copper-pour-solver'
import * as checks from '@tscircuit/checks'
const [input,root]=process.argv.slice(2);assert(input&&root&&!fs.existsSync(root));fs.mkdirSync(root)
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
assert.equal(JSON.parse(fs.readFileSync('node_modules/@tscircuit/copper-pour-solver/package.json')).version,'0.0.59')
assert.equal(hash('node_modules/@tscircuit/checks/dist/index.js'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const original=JSON.parse(fs.readFileSync(input))
const c=original.filter(e=>e.type!=='pcb_copper_pour'&&!e.type.includes('error')).map(e=>e.type==='pcb_trace'?{...e,route:e.route.map(({copper_pour_id,is_inside_copper_pour,...p})=>p)}:e)
const board=c.find(e=>e.type==='pcb_board'),ground=c.find(e=>e.type==='source_net'&&e.name==='GND');assert(board.outline&&ground)
const regions=['top','bottom','inner1','inner2'].map(layer=>({layer,source_net_id:ground.source_net_id,subcircuit_id:ground.subcircuit_id,pad_margin:.12,trace_margin:.12,pour_margin:.12,board_edge_margin:.35,cutout_margin:.2,outline:board.outline}))
const problem=convertCircuitJsonToInputProblem(c,regions)
fs.copyFileSync('scripts/refill-g350-native-ground-diagnostic.mjs',root+'/refill.executed.mjs')
fs.writeFileSync(root+'/problem.json',JSON.stringify(problem,null,2)+'\n')
await initializeManifoldGeometry();const start=performance.now()
const {brep_shapes_by_region}=new CopperPourPipelineSolver(problem).getOutput()
for(let i=0;i<regions.length;i++)for(const shape of brep_shapes_by_region[i]??[])c.push({type:'pcb_copper_pour',pcb_copper_pour_id:'g350_diagnostic_native_fill_'+c.length,shape:'brep',layer:regions[i].layer,source_net_id:ground.source_net_id,subcircuit_id:ground.subcircuit_id,covered_with_solder_mask:false,brep_shape:shape})
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
const errors=checks.checkEachPcbPortConnectedToPcbTraces(c)
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:hash(input)},resultSha256:hash(root+'/candidate.circuit.json'),solver:'0.0.59',elapsedSeconds:(performance.now()-start)/1000,portErrors:errors.length,errors,planningOnly:true,requiresFreshSourceAndIndependentChecks:true,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({portErrors:errors.length,elapsedSeconds:(performance.now()-start)/1000}))
