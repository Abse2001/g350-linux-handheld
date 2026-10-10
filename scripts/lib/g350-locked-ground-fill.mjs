// A fresh locked native fill diagnostic, independent of stored pour tags.
// Source replay and independent numeric CAD qualification are still mandatory.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {CopperPourPipelineSolver,convertCircuitJsonToInputProblem,initializeManifoldGeometry} from '@tscircuit/copper-pour-solver'
let initialization
export async function fillG350LockedGround(input){
 const inputHash=createHash('sha256').update(JSON.stringify(input)).digest('hex')
 assert.equal(JSON.parse(fs.readFileSync('node_modules/@tscircuit/copper-pour-solver/package.json')).version,'0.0.59')
 assert.equal(createHash('sha256').update(fs.readFileSync('node_modules/@tscircuit/checks/dist/index.js')).digest('hex'),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
 initialization??=initializeManifoldGeometry();await initialization
 const c=input.filter(e=>e.type!=='pcb_copper_pour'&&!e.type.includes('error')).map(e=>e.type==='pcb_trace'?{...e,route:e.route.map(({copper_pour_id,is_inside_copper_pour,...p})=>p)}:e)
 const board=c.find(e=>e.type==='pcb_board'),ground=c.find(e=>e.type==='source_net'&&e.name==='GND')
 assert(board?.outline&&ground)
 const regions=['top','bottom','inner1','inner2'].map(layer=>({layer,source_net_id:ground.source_net_id,subcircuit_id:ground.subcircuit_id,pad_margin:.12,trace_margin:.12,pour_margin:.12,board_edge_margin:.35,cutout_margin:.2,outline:board.outline}))
 const begun=performance.now(),problem=convertCircuitJsonToInputProblem(c,regions)
 const {brep_shapes_by_region}=new CopperPourPipelineSolver(problem).getOutput()
 for(let i=0;i<regions.length;i++)for(const shape of brep_shapes_by_region[i]??[])c.push({type:'pcb_copper_pour',pcb_copper_pour_id:'g350_locked_fresh_ground_'+c.length,shape:'brep',layer:regions[i].layer,source_net_id:ground.source_net_id,subcircuit_id:ground.subcircuit_id,covered_with_solder_mask:false,brep_shape:shape})
 const errors=checks.checkEachPcbPortConnectedToPcbTraces(c)
 assert.equal(createHash('sha256').update(JSON.stringify(input)).digest('hex'),inputHash,'A diagnostic fill must not mutate its input')
 return {circuit:c,errors,portErrors:errors.length,elapsedSeconds:(performance.now()-begun)/1000,solverVersion:'0.0.59',regions}
}
