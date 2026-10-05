import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS,getSimpleRouteJsonFromCircuitJson} from '@tscircuit/core'
import {selectCheckedCommandSummary,readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'

// Native phases start from all actual checked copper and real package pads.
// A connectivity bootstrap defers matching explicitly; no virtual terminals,
// removed neighboring copper or holes, hidden failure or fabrication promotion.
const [sourcePath,directory,selection='remaining',layer='top',mode='matching',secondsArg='45',fanout='auto']=process.argv.slice(2)
assert(sourcePath&&directory&&!existsSync(`${directory}/result.json`));assert(['top','bottom','both'].includes(layer));assert(['matching','bootstrap'].includes(mode));assert(['auto','none'].includes(fanout))
const seconds=Number(secondsArg);assert(seconds>0&&seconds<=60)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const checked=selectCheckedCommandSummary(artifact(sourcePath)),{summary,registration}=readCheckedCommandSummary(checked);assert.equal(registration.signals,33)
const source=read(sourcePath),type=t=>source.filter(e=>e.type===t),board=type('pcb_board')[0],mapPath='lib/am3352/memory-byte1-top-centered-swizzled-connections.json',mapping=read(mapPath)
assert.equal(board.num_layers,4);assert.equal(board.min_via_pad_diameter,.4572);assert.equal(board.min_via_hole_diameter,.254);assert.equal(source.filter(e=>e.type.endsWith('_error')).length,0)
const names=selection==='remaining'?summary.remainingDdrSignalNames:selection.split(',');assert(names.length&&new Set(names).size===names.length&&names.every(n=>summary.remainingDdrSignalNames.includes(n)))
const definitions=names.map(name=>{
 const m=mapping.find(m=>m.name===name),t=type('source_trace').find(t=>t.name===name);assert(m&&t);assert.equal(t.connected_source_port_ids.length,2);assert(!type('pcb_trace').some(p=>p.source_trace_id===t.source_trace_id))
 const pointsToConnect=[['U_SOC',m.socPin,m.socBall],['U_RAM',m.ramPin,m.ramBall]].map(([n,pin,ball])=>{
  const c=type('source_component').find(c=>c.name===n),sp=type('source_port').find(p=>p.source_component_id===c.source_component_id&&p.pin_number===Number(pin.slice(3)));assert.equal(sp.name,ball);assert(t.connected_source_port_ids.includes(sp.source_port_id))
  const p=type('pcb_port').find(p=>p.source_port_id===sp.source_port_id);assert.deepEqual(p.layers,['top']);return{x:p.x,y:p.y,layer:'top',pointId:p.pcb_port_id,pcb_port_id:p.pcb_port_id}
 });return{...m,sourceTraceId:t.source_trace_id,pointsToConnect}
})
const {simpleRouteJson:input}=getSimpleRouteJsonFromCircuitJson({circuitJson:source,minTraceWidth:board.min_trace_width,nominalTraceWidth:.1016,minTraceToPadEdgeClearance:board.min_trace_to_pad_edge_clearance,
 minTraceToHoleEdgeClearance:board.min_trace_to_hole_edge_clearance,minViaHoleEdgeToViaHoleEdgeClearance:board.min_via_hole_edge_to_via_hole_edge_clearance,minPadEdgeToPadEdgeClearance:board.min_pad_edge_to_pad_edge_clearance,
 minBoardEdgeClearance:board.min_board_edge_clearance,minViaPadDiameter:.4572,minViaHoleDiameter:.254})
assert.equal(input.traces.length,135);assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,912)
const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
for(const t of type('pcb_trace')){
 const converted=input.traces.find(n=>n.pcb_trace_id===t.pcb_trace_id);assert(converted);assert.deepEqual(geometry(converted.route),geometry(t.route))
 for(const p of converted.route.filter(p=>p.route_type==='via')){const v=type('pcb_via').find(v=>Math.hypot(v.x-p.x,v.y-p.y)<1e-8);assert(v);assert.equal(v.outer_diameter,.4572);assert.equal(v.hole_diameter,.254);assert.deepEqual(new Set(v.layers),new Set(['top','inner1','inner2','bottom']));p.via_diameter=v.outer_diameter;p.via_hole_diameter=v.hole_diameter;p.layers=[...v.layers]}
}
input.connections=definitions.map(d=>({name:d.sourceTraceId,source_trace_id:d.sourceTraceId,width:.1016,nominalTraceWidth:.1016,pointsToConnect:d.pointsToConnect}))
input.buses=[{name:'DDR_COMMAND_CLOCK',busId:'DDR_COMMAND_CLOCK',connectionNames:definitions.map(d=>d.sourceTraceId),traceWidth:.1016,allowedLayers:layer==='both'?['top','bottom']:[layer],...(mode==='matching'?{maxLengthSkew:.635}:{})}]
input.differentialPairs=[];input.allowBlindAndBuriedVias=false;input.bounds={minX:-17.5,maxX:17.5,minY:-38.5,maxY:9.5}
mkdirSync(directory,{recursive:true});const p=`${directory}/input.simple-route.json`;writeFileSync(p,JSON.stringify(input)+'\n')
const snapshot=`${directory}/native-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/route-am3352-ddr33-remaining-phase.mjs'))
const options={smoothTuning:true,denseSearch:true,...fanout==='none'?{fanout:'none'}:{}},solver=new SOLVERS.BusLanesPipelineSolver(input,options),start=performance.now();let steps=0,next=start+10000,error=null
try{while(!solver.solved&&!solver.failed&&performance.now()-start<seconds*1000){solver.step();steps++;if(performance.now()>next){console.log(JSON.stringify({steps,phase:solver.phase,elapsedSeconds:(performance.now()-start)/1000}));next=performance.now()+10000}}}catch(e){error=String(e);solver.failed=true}
const report={status:solver.solved?'NATIVE_DDR_PHASE_ROUTED_PENDING_PHYSICAL_CHECKS':solver.failed?'NATIVE_DDR_PHASE_FAILED':'NATIVE_DDR_PHASE_TIMEOUT',source:summary.source,checkedSourceSummary:checked,input:artifact(p),connectionMap:artifact(mapPath),definitions,
 selection,signalLayer:layer,mode,fanout,solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',solverOptions:options,coreVersion:read('node_modules/@tscircuit/core/package.json').version,capacityAutorouterVersion:read('node_modules/@tscircuit/capacity-autorouter/package.json').version,
 sourceTracePiecesRetained:135,actualPadObstacles:912,physicalThroughViasRetained:169,sourceGeometryPreserved:true,copperLayers:4,referenceLayersReserved:['inner1','inner2'],carrierSearchBounds:input.bounds,
 steps,elapsedSeconds:(performance.now()-start)/1000,phase:solver.phase,stats:solver.stats,error:error??solver.error??null,failureCode:solver.failureCode??null,preparedEscapes:solver.escapes.length,
 newConnectedSignals:solver.solved?definitions.length:0,originalTimingRequirements:{busMaxLengthSkewMm:.635},fullCommandClassMatchingDeferred:true,executionHelper:artifact(snapshot),fullElectricalTimingQualified:false,defaultChanged:false,fabricationReady:false}
if(solver.solved){const output=solver.getOutput();assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces);assert.equal(output.traces.length,input.traces.length+definitions.length);assert.deepEqual(output.obstacles,input.obstacles);for(const t of output.traces.slice(input.traces.length)){assert(definitions.some(d=>d.sourceTraceId===t.source_trace_id));assert(t.route.filter(p=>p.route_type==='wire').every(p=>['top','bottom'].includes(p.layer)))}const out=`${directory}/output.simple-route.json`;writeFileSync(out,JSON.stringify(output)+'\n');report.output=artifact(out)}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,selection,layer,mode,fanout,elapsedSeconds:report.elapsedSeconds,failureCode:report.failureCode,error:report.error,newConnectedSignals:report.newConnectedSignals,checkedSourceSignals:33,fabricationReady:false}));process.exitCode=solver.solved?0:1
