import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS,getSimpleRouteJsonFromCircuitJson} from '@tscircuit/core'
import {selectCheckedCommandSummary,readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'

// Explicit nonexportable command or complete-DDR replan. In command scope both
// byte lanes and RESETn remain fixed. In either scope every reference escape,
// USB trace, pad and keepout stays fixed; all opened signals must be restored.
const [sourcePath,directory,layer='top',secondsArg='45',mode='bootstrap',scope='command']=process.argv.slice(2)
assert(sourcePath&&directory&&!existsSync(`${directory}/result.json`));assert(['top','bottom','both'].includes(layer));assert(['bootstrap','matching'].includes(mode))
assert(['command','all-ddr'].includes(scope))
const seconds=Number(secondsArg);assert(seconds>0&&seconds<=180)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const checked=selectCheckedCommandSummary(artifact(sourcePath)),{summary,registration}=readCheckedCommandSummary(checked);assert.equal(registration.signals,33)
const source=read(sourcePath),mappingPath='lib/am3352/memory-byte1-top-centered-swizzled-connections.json',mapping=read(mappingPath)
const command=scope==='all-ddr'?mapping:mapping.filter(m=>/^DDR_(A\d+|BA\d+|CASn|RASn|WEn|CSn0|CKE|ODT|CKn?)$/.test(m.name));assert.equal(command.length,scope==='all-ddr'?49:26)
const logical=command.map(m=>source.find(t=>t.type==='source_trace'&&t.name===m.name));assert(logical.every(t=>t?.connected_source_port_ids.length===2))
const openedIds=new Set(logical.map(t=>t.source_trace_id)),openedTraces=source.filter(t=>t.type==='pcb_trace'&&openedIds.has(t.source_trace_id)),openedPcbIds=new Set(openedTraces.map(t=>t.pcb_trace_id))
const openedHoles=source.filter(v=>v.type==='pcb_via'&&openedPcbIds.has(v.pcb_trace_id));assert.equal(openedTraces.length,scope==='all-ddr'?33:10)
assert(openedHoles.every(v=>v.layers.length===4&&v.outer_diameter===.4572&&v.hole_diameter===.254))
const staged=source.filter(t=>!openedTraces.includes(t)&&!openedHoles.includes(t))
const retainedCount=135-openedTraces.length
assert.equal(staged.filter(t=>t.type==='pcb_trace').length,retainedCount);assert.equal(staged.filter(t=>t.type==='pcb_smtpad').length,912)
const board=source.find(t=>t.type==='pcb_board');assert.equal(board.num_layers,4)
const {simpleRouteJson:input}=getSimpleRouteJsonFromCircuitJson({circuitJson:staged,minTraceWidth:board.min_trace_width,nominalTraceWidth:.1016,minTraceToPadEdgeClearance:board.min_trace_to_pad_edge_clearance,minTraceToHoleEdgeClearance:board.min_trace_to_hole_edge_clearance,minViaHoleEdgeToViaHoleEdgeClearance:board.min_via_hole_edge_to_via_hole_edge_clearance,minPadEdgeToPadEdgeClearance:board.min_pad_edge_to_pad_edge_clearance,minBoardEdgeClearance:board.min_board_edge_clearance,minViaPadDiameter:.4572,minViaHoleDiameter:.254})
const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
assert.equal(input.traces.length,retainedCount);assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,912)
for(const t of staged.filter(t=>t.type==='pcb_trace')){
 const converted=input.traces.find(n=>n.pcb_trace_id===t.pcb_trace_id);assert(converted);assert.deepEqual(geometry(converted.route),geometry(t.route))
 for(const p of converted.route.filter(p=>p.route_type==='via')){const v=staged.find(v=>v.type==='pcb_via'&&Math.hypot(v.x-p.x,v.y-p.y)<1e-8);assert(v);p.via_diameter=v.outer_diameter;p.via_hole_diameter=v.hole_diameter;p.layers=[...v.layers]}
}
const definitions=command.map((m,i)=>({name:m.name,sourceTraceId:logical[i].source_trace_id,pointsToConnect:[['U_SOC',m.socPin,m.socBall],['U_RAM',m.ramPin,m.ramBall]].map(([name,pin,ball])=>{
 const c=source.find(c=>c.type==='source_component'&&c.name===name),sp=source.find(p=>p.type==='source_port'&&p.source_component_id===c.source_component_id&&p.pin_number===Number(pin.slice(3)));assert.equal(sp.name,ball);assert(logical[i].connected_source_port_ids.includes(sp.source_port_id))
 const p=source.find(p=>p.type==='pcb_port'&&p.source_port_id===sp.source_port_id);assert.deepEqual(p.layers,['top']);const o=input.obstacles.find(o=>o.circuitJsonMetadata?.pcb_port_id===p.pcb_port_id);assert(o&&o.connectedTo.includes(logical[i].source_trace_id)&&Math.hypot(o.center.x-p.x,o.center.y-p.y)<1e-8)
 return{x:p.x,y:p.y,layer:'top',pointId:p.pcb_port_id,pcb_port_id:p.pcb_port_id}
})}))
input.connections=definitions.map(d=>({name:d.sourceTraceId,source_trace_id:d.sourceTraceId,width:.1016,nominalTraceWidth:.1016,pointsToConnect:d.pointsToConnect}))
const busGroups=[['DDR_ADDR_CTRL',definitions.filter(d=>/^DDR_(A\d+|BA\d+|CASn|RASn|WEn|CSn0|CKE|ODT)$/.test(d.name)),layer==='both'?['top','bottom']:[layer]],['DDR_CK',definitions.filter(d=>/^DDR_CKn?$/.test(d.name)),layer==='both'?['top','bottom']:[layer]]]
if(scope==='all-ddr')busGroups.push(['DDR_BYTE0',definitions.filter(d=>/^DDR_D[0-7]$|^DDR_DQM0$|^DDR_DQS[n]?0$/.test(d.name)),['bottom']],['DDR_BYTE1',definitions.filter(d=>/^DDR_D(8|9|1[0-5])$|^DDR_DQM1$|^DDR_DQS[n]?1$/.test(d.name)),['top']],['DDR_RESET',definitions.filter(d=>d.name==='DDR_RESETn'),['top']])
input.buses=busGroups.map(([name,members,allowedLayers])=>({name,busId:name,connectionNames:members.map(d=>d.sourceTraceId),traceWidth:.1016,allowedLayers,...(mode==='matching'&&name!=='DDR_RESET'?{maxLengthSkew:name==='DDR_CK'?.127:.635}:{})}))
assert.equal(new Set(input.buses.flatMap(b=>b.connectionNames)).size,command.length)
input.differentialPairs=mode==='matching'?[{connectionNames:definitions.filter(d=>/^DDR_CKn?$/.test(d.name)).map(d=>d.sourceTraceId),lengthTolerance:.127,traceGap:.12}]:[]
input.allowBlindAndBuriedVias=false;input.bounds={minX:-17.5,maxX:17.5,minY:-38.5,maxY:9.5}
mkdirSync(directory,{recursive:true});const inputPath=`${directory}/input.simple-route.json`,openPath=`${directory}/explicit-opened-command-copper.json`,snapshot=`${directory}/native-helper.executed.mjs`
writeFileSync(inputPath,JSON.stringify(input)+'\n');writeFileSync(openPath,JSON.stringify({source:summary.source,checkedSourceSummary:checked,scope,openedTraces,openedHoles,openedNames:openedTraces.map(t=>source.find(s=>s.type==='source_trace'&&s.source_trace_id===t.source_trace_id).name),selectedNames:command.map(m=>m.name),preservedTracePieces:retainedCount,preservedThroughVias:169-openedHoles.length,logicalConnectionsAndPadsUnchanged:true,exportable:false,pendingOpenedSignalRepairs:openedTraces.length},null,2)+'\n');writeFileSync(snapshot,readFileSync('scripts/route-am3352-command-coordinated.mjs'))
const options={smoothTuning:true,denseSearch:true},solver=new SOLVERS.BusLanesPipelineSolver(input,options),start=performance.now();let steps=0,next=start+10000,error=null
try{while(!solver.solved&&!solver.failed&&performance.now()-start<seconds*1000){solver.step();steps++;if(performance.now()>next){console.log(JSON.stringify({steps,phase:solver.phase,elapsedSeconds:(performance.now()-start)/1000}));next=performance.now()+10000}}}catch(e){error=String(e);solver.failed=true}
const result={status:solver.solved?'COORDINATED_COMMAND_NATIVE_ROUTED_ALL_OPENED_SIGNALS_RECONSTRUCT_CHECKS_REQUIRED':solver.failed?'COORDINATED_COMMAND_NATIVE_FAILED_NONEXPORTABLE_STAGE':'COORDINATED_COMMAND_NATIVE_TIMEOUT_NONEXPORTABLE_STAGE',source:summary.source,checkedSourceSummary:checked,input:artifact(inputPath),openedCopper:artifact(openPath),executionHelper:artifact(snapshot),connectionMap:artifact(mappingPath),definitions,scope,signalLayer:layer,mode,solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',solverOptions:options,coreVersion:read('node_modules/@tscircuit/core/package.json').version,actualPadObstacles:912,preservedTracePieces:retainedCount,preservedThroughVias:169-openedHoles.length,openedTracePieces:openedTraces.length,openedThroughVias:openedHoles.length,copperLayers:4,referenceLayersReserved:['inner1','inner2'],elapsedSeconds:(performance.now()-start)/1000,steps,phase:solver.phase,stats:solver.stats,error:error??solver.error??null,failureCode:solver.failureCode??null,preparedEscapes:solver.escapes.length,newConnectedSignals:0,pendingOpenedSignalRepairs:openedTraces.length,exportable:false,fullCommandClassMatchingDeferred:true,fullElectricalTimingQualified:false,defaultChanged:false,fabricationReady:false}
if(solver.solved){const output=solver.getOutput();assert.deepEqual(output.traces.slice(0,retainedCount),input.traces);assert.equal(output.traces.length,retainedCount+definitions.length);assert.deepEqual(output.obstacles,input.obstacles);for(const d of definitions)assert.equal(output.traces.slice(retainedCount).filter(t=>t.source_trace_id===d.sourceTraceId).length,1);const outputPath=`${directory}/output.simple-route.json`;writeFileSync(outputPath,JSON.stringify(output)+'\n');result.output=artifact(outputPath);result.nativeRoutedClassSignals=definitions.length;result.requiresReconstructionOfAllOpenedSignals=true}
writeFileSync(`${directory}/result.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,layer,mode,elapsedSeconds:result.elapsedSeconds,failureCode:result.failureCode,error:result.error,openedHoles:openedHoles.length,newQualifiedSignals:0,fabricationReady:false}));process.exitCode=solver.solved?0:1
