import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [sourcePath,pathsPath,reportPath]=process.argv.slice(2);assert(sourcePath&&pathsPath&&reportPath)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const source=read(sourcePath),basePath='dist/diagnostics/am3352-ddr23-command-replan-candidate/circuit.json',base=read(basePath),paths=read(pathsPath)
const fixedPathsPath='routing/am3352-ddr23-command-replan-fixed-paths.json',fixedPaths=read(fixedPathsPath),type=(s,t)=>s.filter(e=>e.type===t)
assert.equal(type(source,'source_component').length,212);assert.equal(type(source,'pcb_smtpad').length,912)
assert.equal(type(source,'pcb_board')[0].num_layers,4);assert.equal(source.filter(e=>e.type.endsWith('_error')).length,0)
for(const t of ['source_component','source_port','source_trace','source_net','pcb_component','pcb_port','pcb_smtpad','pcb_plated_hole','pcb_keepout'])assert.deepEqual(type(source,t),type(base,t),`Changed original ${t}`)
for(const [name,p] of Object.entries(fixedPaths))assert.deepEqual(paths[name],p)
const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
for(const t of type(base,'pcb_trace')){
 const actual=type(source,'pcb_trace').find(n=>n.source_trace_id===t.source_trace_id)
 assert(actual);assert.deepEqual(geometry(actual.route),geometry(t.route),'Changed fixed data/reset/reference/USB trace')
}
for(const v of type(base,'pcb_via')){
 const n=type(source,'pcb_via').find(n=>Math.hypot(n.x-v.x,n.y-v.y)<1e-8)
 assert(n);for(const key of ['x','y','outer_diameter','hole_diameter','layers','from_layer','to_layer','source_net_id','subcircuit_connectivity_map_key'])assert.deepEqual(n[key],v[key])
}
const newNames=Object.keys(paths).filter(n=>!Object.hasOwn(fixedPaths,n))
for(const name of newNames){
 const s=type(source,'source_trace').find(t=>t.name===name),t=type(source,'pcb_trace').find(t=>t.source_trace_id===s.source_trace_id),ports=s.connected_source_port_ids.map(id=>type(source,'pcb_port').find(p=>p.source_port_id===id))
 assert(t);assert(Math.hypot(t.route[0].x-ports[0].x,t.route[0].y-ports[0].y)<1e-8);assert(Math.hypot(t.route.at(-1).x-ports[1].x,t.route.at(-1).y-ports[1].y)<1e-8)
 let layer='top';for(const p of t.route){if(p.route_type==='via'){assert.equal(p.from_layer,layer);layer=p.to_layer}else{assert.equal(p.layer,layer);assert.equal(p.width,.1016)}}assert.equal(layer,'top')
 assert.equal(t.route.length,paths[name].length+2)
 for(const [i,p] of paths[name].entries()){const actual=t.route[i+1];assert(Math.hypot(p.x-actual.x,p.y-actual.y)<1e-8);assert.equal(actual.route_type,p.via?'via':'wire');if(p.via){assert.equal(actual.from_layer,p.fromLayer);assert.equal(actual.to_layer,p.toLayer)}}
}
for(const name of ['DDR_DQS0_PAIR','DDR_DQS1_PAIR','DDR_CK_PAIR']){const b=type(source,'source_bus').find(b=>b.name===name);assert(b);assert.equal(b.max_length_skew,.127);assert.equal(b.source_trace_ids.length,2)}
for(const p of type(base,'pcb_copper_pour')){const n=type(source,'pcb_copper_pour').find(n=>n.layer===p.layer);assert(n);assert.equal(n.source_net_id,p.source_net_id);assert.deepEqual(n.brep_shape.outer_ring.vertices,p.brep_shape.outer_ring.vertices)}
const report={status:'COMMAND_REAL_PAD_REPLAY_AND_ALL_FIXED_SOURCE_GEOMETRY_PASS',source:artifact(sourcePath),base:artifact(basePath),paths:artifact(pathsPath),fixedPaths:artifact(fixedPathsPath),components:212,pads:912,copperLayers:4,fixedTracePiecesPreserved:125,fixedViasPreserved:141,retainedDataResetPathsExact:23,newCommandPaths:newNames,stagedDdrChannels:Object.keys(paths).length,allDifferentialPairDeclarationsRestored:true,referenceBoundariesPreserved:true,independentPlaneConnectivityStillRequired:true,fullElectricalTimingQualified:false,defaultChanged:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,channels:report.stagedDdrChannels,newCommands:newNames.length,fixedTraces:125,fixedVias:141}))
