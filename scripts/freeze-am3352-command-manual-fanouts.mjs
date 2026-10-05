import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {any_circuit_element} from 'circuit-json'
import {CopperPourPipelineSolver,convertCircuitJsonToInputProblem,initializeManifoldGeometry} from '@tscircuit/copper-pour-solver'

const [planPath,directory]=process.argv.slice(2);assert(planPath&&directory&&!existsSync(`${directory}/circuit.json`))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const plan=read(planPath);assert.equal(hash(plan.source.path),plan.source.sha256)
const source=read(plan.source.path),result=structuredClone(source),layers=['top','inner1','inner2','bottom']
assert.equal(plan.escapes.length,52)
for(const saved of plan.escapes){
 const t=source.find(e=>e.type==='source_trace'&&e.source_trace_id===saved.source_trace_id);assert(t&&/^DDR_/.test(t.name))
 const via=saved.route.find(p=>p.route_type==='via');assert(via);assert.equal(via.via_diameter,.4572);assert.equal(via.via_hole_diameter,.254)
 const start=saved.route[0],physical=source.find(e=>e.type==='pcb_port'&&t.connected_source_port_ids.includes(e.source_port_id)&&Math.hypot(start.x-e.x,start.y-e.y)<1e-8)
 assert(physical);assert.equal(start.layer,'top');assert.deepEqual(physical.layers,['top'])
 assert(!result.some(e=>e.type==='pcb_via'&&Math.hypot(via.x-e.x,via.y-e.y)<1e-8))
 const route=saved.route.map(p=>p.route_type==='via'?{...p,outer_diameter:.4572,hole_diameter:.254}:p)
 result.push(any_circuit_element.parse({...saved,route,subcircuit_id:t.subcircuit_id,subcircuit_connectivity_map_key:t.subcircuit_connectivity_map_key}))
 result.push(any_circuit_element.parse({type:'pcb_via',pcb_via_id:`via_${saved.pcb_trace_id}`,pcb_trace_id:saved.pcb_trace_id,x:via.x,y:via.y,layers,from_layer:'top',to_layer:'bottom',outer_diameter:.4572,hole_diameter:.254,subcircuit_id:t.subcircuit_id,subcircuit_connectivity_map_key:t.subcircuit_connectivity_map_key}))
}
assert.deepEqual(result.slice(0,source.length),source)
// Existing filled polygons predate these signal holes. Refill the original
// boundaries with the same 0.12 mm margin as the editable Host candidate.
// Keep every connected source reference via inside its continuous plane.
await initializeManifoldGeometry()
const pours=result.filter(e=>e.type==='pcb_copper_pour'),margin=.12
assert.equal(pours.length,2)
const problem=convertCircuitJsonToInputProblem(result,pours.map(p=>({layer:p.layer,subcircuit_id:p.subcircuit_id,source_net_id:p.source_net_id,outline:p.brep_shape.outer_ring.vertices,pad_margin:margin,trace_margin:margin,pour_margin:margin,board_edge_margin:0})))
const fill=new CopperPourPipelineSolver(problem).getOutput()
const inside=(point,ring)=>{const v=ring.vertices;let found=false;for(let i=0,j=v.length-1;i<v.length;j=i++)if((v[i].y>point.y)!==(v[j].y>point.y)&&point.x<(v[j].x-v[i].x)*(point.y-v[i].y)/(v[j].y-v[i].y)+v[i].x)found=!found;return found}
const contains=(shape,p)=>inside(p,shape.outer_ring)&&!shape.inner_rings.some(r=>inside(p,r)),refillEvidence=[]
for(let i=0;i<pours.length;i++){
 const boundary=pours[i].brep_shape.outer_ring.vertices
 const matches=fill.brep_shapes_by_region[i].filter(s=>s.outer_ring.vertices.length===boundary.length&&s.outer_ring.vertices.every(p=>boundary.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<1e-6)))
 assert.equal(matches.length,1,'Original continuous reference boundary must survive')
 const referenceVias=source.filter(v=>v.type==='pcb_via'&&v.source_net_id===pours[i].source_net_id)
 for(const v of referenceVias)assert(contains(matches[0],v),`Refill stranded reference via ${v.pcb_via_id}`)
 refillEvidence.push({layer:pours[i].layer,connectedSourceReferenceVias:referenceVias.length,disconnectedIslandsRemoved:fill.brep_shapes_by_region[i].length-1})
 pours[i].brep_shape=matches[0]
}
result.find(e=>e.type==='pcb_board').title='AM3352 MANUAL COMMAND FANOUTS ONLY — DO NOT FABRICATE'
mkdirSync(directory,{recursive:true});const circuitPath=`${directory}/circuit.json`
writeFileSync(circuitPath,JSON.stringify(result)+'\n')
writeFileSync(`${directory}/freeze-helper.executed.mjs`,readFileSync('scripts/freeze-am3352-command-manual-fanouts.mjs'))
writeFileSync(`${directory}/manifest.json`,JSON.stringify({status:'PARTIAL_MANUAL_FANOUT_COPPER_REQUIRES_INDEPENDENT_CHECKS',source:plan.source,plan:artifact(planPath),circuit:artifact(circuitPath),addedFanoutPieces:52,addedThroughVias:52,fixedTraces:125,fixedVias:141,referencePoursRefilled:true,pourClearanceMm:margin,refillEvidence,completeCommandCarriers:0,qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false},null,2)+'\n')
console.log('Froze 52 real-pad manual escape pieces; no completed command channels')
