// Counterfactual planning only: isolate which retained length edits break the
// actual locked ground fill. Every subset also runs unchanged full physics.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {gunzipSync} from 'node:zlib'
import * as checks from '@tscircuit/checks'
import {CopperPourPipelineSolver,convertCircuitJsonToInputProblem,initializeManifoldGeometry} from '@tscircuit/copper-pour-solver'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
const [base,donorPath,root]=process.argv.slice(2)
assert(base&&donorPath&&root&&!fs.existsSync(root));fs.mkdirSync(root)
const hash=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p))
assert.equal(read('node_modules/@tscircuit/copper-pour-solver/package.json').version,'0.0.59')
assert.equal(hash(fs.readFileSync('node_modules/@tscircuit/checks/dist/index.js')),'1a8af4949af444b5c5488c554e1c1fef9efad0fe5e4c9497554038d0453788cc')
const entry=read('.cloud-tools/g350-timing-snapshots/compressed-completed-byte1-trials-294.json').files.find(e=>e.compressedPath===donorPath);assert(entry)
const compressed=fs.readFileSync(donorPath);assert.equal(hash(compressed),entry.compressedSha256)
const raw=gunzipSync(compressed);assert.equal(hash(raw),entry.sha256);assert.equal(raw.length,entry.bytes)
const baseline=read(base).filter(e=>!e.type.includes('error')),donor=JSON.parse(raw).filter(e=>!e.type.includes('error'))
const byId=new Map(donor.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,e]))
const strip=c=>c.filter(e=>e.type!=='pcb_copper_pour').map(e=>e.type==='pcb_trace'?{...e,route:e.route.map(({copper_pour_id,is_inside_copper_pour,...p})=>p)}:e)
for(const type of ['source_trace','source_bus','source_port','source_net','source_component','pcb_component','pcb_smtpad','pcb_port','pcb_board','pcb_hole','pcb_via'])assert.deepEqual(baseline.filter(e=>e.type===type),donor.filter(e=>e.type===type))
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const s of baseline.filter(e=>e.type==='source_trace'))for(const p of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(s.source_trace_id),find(p))
fs.copyFileSync('scripts/evaluate-g350-ground-safe-timing-subsets.mjs',root+'/planner.executed.mjs')
await initializeManifoldGeometry()
const selections=process.env.G350_SUBSET_NAMES?.split(';').map(s=>s.split(','))??[['DDR_BYTE0'],['DDR_BYTE1'],['DDR_COMMAND_CLOCK'],['DDR_BYTE0','DDR_COMMAND_CLOCK']]
const summary=[]
for(const selection of selections){
 const buses=baseline.filter(e=>e.type==='source_bus'&&selection.includes(e.name))
 const selected=new Set([...buses.flatMap(b=>b.source_trace_ids),...baseline.filter(e=>e.type==='source_trace'&&selection.includes(e.name)).map(e=>e.source_trace_id)])
 assert(selected.size>0)
 const c=strip(structuredClone(baseline)).map(e=>e.type==='pcb_trace'&&selected.has(e.source_trace_id)?strip([structuredClone(byId.get(e.pcb_trace_id))])[0]:e)
 const counts=Object.fromEntries([...g350DdrPhysicalChecks,'checkPcbTracesOutOfBoard','checkSourceTracesMatchPcbTraceThickness','checkTracesAreContiguous','checkPcbTraceViaCounts','checkPcbRoutingConstraints'].map(n=>[n,checks[n](c).length]))
 counts.manufacturing=checkG350ViaTrackManufacturingClearance(c.map(e=>e.type==='pcb_trace'?{...e,source_trace_id:find(e.source_trace_id)}:e)).length
 const board=c.find(e=>e.type==='pcb_board'),ground=c.find(e=>e.type==='source_net'&&e.name==='GND')
 const regions=['top','bottom','inner1','inner2'].map(layer=>({layer,source_net_id:ground.source_net_id,subcircuit_id:ground.subcircuit_id,pad_margin:.12,trace_margin:.12,pour_margin:.12,board_edge_margin:.35,cutout_margin:.2,outline:board.outline}))
 const begun=performance.now(),problem=convertCircuitJsonToInputProblem(c,regions)
 const {brep_shapes_by_region}=new CopperPourPipelineSolver(problem).getOutput()
 for(let i=0;i<regions.length;i++)for(const shape of brep_shapes_by_region[i]??[])c.push({type:'pcb_copper_pour',pcb_copper_pour_id:'g350_subset_ground_'+c.length,shape:'brep',layer:regions[i].layer,source_net_id:ground.source_net_id,subcircuit_id:ground.subcircuit_id,covered_with_solder_mask:false,brep_shape:shape})
 const errors=checks.checkEachPcbPortConnectedToPcbTraces(c),path=root+'/'+selection.join('-')+'.circuit.json'
 fs.writeFileSync(path,JSON.stringify(c,null,2)+'\n')
 const groups=baseline.filter(e=>e.type==='source_bus'&&['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(e.name)).map(b=>{const lengths=c.filter(e=>e.type==='pcb_trace'&&b.source_trace_ids.includes(e.source_trace_id)).map(t=>ddrRouteLength(t.route));return {name:b.name,skewMm:Math.max(...lengths)-Math.min(...lengths),limitMm:b.max_length_skew}})
 summary.push({selection,path,sha256:hash(fs.readFileSync(path)),counts,portErrors:errors.length,errors,groups,elapsedSeconds:(performance.now()-begun)/1000,nativePhysicalAndGroundPassed:errors.length===0&&Object.values(counts).every(n=>n===0)})
 fs.writeFileSync(root+'/report.json',JSON.stringify({base:{path:base,sha256:hash(fs.readFileSync(base))},donor:entry,summary,allSourceConstraintsAndExistingHolesPreserved:true,planningOnly:true,requiresFreshSourceNumericCadAndGerberQualification:true,fabricationReady:false},null,2)+'\n')
 console.log(JSON.stringify({...summary.at(-1),errors:undefined}))
}
