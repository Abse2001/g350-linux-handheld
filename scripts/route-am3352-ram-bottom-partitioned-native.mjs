import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'

// Routing partitions allocate both outer layers. They do not replace the
// single electrical command/clock class or qualify matching across partitions.
const [nativeRunPath,directory,partition='ram-columns',secondsArg='60']=process.argv.slice(2)
assert(nativeRunPath&&directory&&!existsSync(`${directory}/result.json`));assert(['ram-columns','cpu-rows','ram-alternating-columns'].includes(partition));const seconds=Number(secondsArg);assert(seconds>0&&seconds<=180)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const prior=read(nativeRunPath);for(const a of [prior.source,prior.checkedPlacementSummary,prior.sourceValidation,prior.input])verify(a)
const summary=read(prior.checkedPlacementSummary.path);assert.equal(summary.status,'BOTTOM_RAM_PLACEMENT_REFERENCE_USB_AND_PHYSICAL_COPPER_CHECKED_DDR_UNROUTED');assert(summary.sourceEligibleForNativeDdrPlacementStudy&&!summary.fabricationReady);assert.deepEqual(summary.source,prior.source)
for(const a of [summary.board,summary.nativeDdrAudit,summary.nativeUsbAudit,summary.ramReferenceAudit,summary.nativeDrc,summary.gerberShortsAudit])verify(a)
const input=read(prior.input.path),original=structuredClone(input),validation=read(prior.sourceValidation.path)
assert.equal(input.layerCount,4);assert.equal(input.traces.length,102);assert.equal(input.connections.length,49);assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,912);assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254);assert.equal(input.allowBlindAndBuriedVias,false)
for(const d of validation.ddrEndpoints)assert.deepEqual(input.connections.find(c=>c.name===d.sourceTraceId).pointsToConnect.map(({pointId,...p})=>p),d.endpoints)
const command=input.buses.find(b=>b.name==='DDR_ADDR_CTRL');assert.equal(command.connectionNames.length,24)
const commands=validation.ddrEndpoints.filter(d=>command.connectionNames.includes(d.sourceTraceId)),parts=new Map()
for(const d of commands){
 let group,layer
 if(partition==='ram-columns'){group=d.endpoints[1].x>0?'DDR_ADDR_RAM_RIGHT':'DDR_ADDR_RAM_LEFT';layer=d.endpoints[1].x>0?'bottom':'top'}
 else if(partition==='cpu-rows'){group=d.endpoints[0].y<=-6.8+1e-8?'DDR_ADDR_CPU_OUTER':'DDR_ADDR_CPU_INNER';layer=d.endpoints[0].y<=-6.8+1e-8?'top':'bottom'}
 else{const x=d.endpoints[1].x;group=`DDR_ADDR_RAM_COL_${Math.round(x*10)}`;layer=[16,-24,-32].includes(Math.round(x*10))?'top':'bottom'}
 const p=parts.get(group)??{name:group,busId:group,connectionNames:[],traceWidth:.1016,allowedLayers:[layer],maxLengthSkew:.635};assert.equal(p.allowedLayers[0],layer);p.connectionNames.push(d.sourceTraceId);parts.set(group,p)
}
input.buses=[...input.buses.filter(b=>/^DDR_BYTE/.test(b.name)),...parts.values(),{...input.buses.find(b=>b.name==='DDR_CK'),allowedLayers:['top']},input.buses.find(b=>b.name==='DDR_RESET')]
assert.equal(new Set(input.buses.flatMap(b=>b.connectionNames)).size,49);assert(input.buses.every(b=>b.allowedLayers.length===1&&['top','bottom'].includes(b.allowedLayers[0])))
assert.deepEqual(input.connections,original.connections);assert.deepEqual(input.obstacles,original.obstacles);assert.deepEqual(input.traces,original.traces);assert.deepEqual(input.differentialPairs,original.differentialPairs)
mkdirSync(directory,{recursive:true});const inputPath=`${directory}/input.simple-route.json`,snapshot=`${directory}/partitioned-helper.executed.mjs`;writeFileSync(inputPath,JSON.stringify(input)+'\n');writeFileSync(snapshot,readFileSync('scripts/route-am3352-ram-bottom-partitioned-native.mjs'))
const options={smoothTuning:true,denseSearch:true},solver=new SOLVERS.BusLanesPipelineSolver(input,options),start=performance.now();let steps=0,next=start+10000,error=null,bestPartial=null
try{while(!solver.solved&&!solver.failed&&performance.now()-start<seconds*1000){solver.step();steps++;
 if(solver.child?.traces.length>(bestPartial?.carriers.length??0)&&solver.escapes.length===49&&solver.child.input.connections.length===49){
  const childInput=solver.child.input;assert.deepEqual(childInput.obstacles,input.obstacles);assert.deepEqual(childInput.traces.slice(0,102),input.traces);assert.equal(childInput.traces.length,151)
  assert.deepEqual(childInput.traces.slice(102),solver.escapes)
  for(const t of solver.child.traces){const c=childInput.connections.find(c=>c.name===t.connection_name);assert(c);for(const [p,q]of[[t.route[0],c.pointsToConnect[0]],[t.route.at(-1),c.pointsToConnect[1]]])assert(Math.hypot(p.x-q.x,p.y-q.y)<1e-8&&p.layer===q.layer)}
  bestPartial={status:'UNSOLVED_NATIVE_PARTIAL_SEED_MANUAL_REPAIR_AND_ALL_CHECKS_REQUIRED',source:prior.source,checkedPlacementSummary:prior.checkedPlacementSummary,originalInput:artifact(inputPath),step:steps,layerAttempt:solver.attempt,childPhase:solver.child.phase,childInput:structuredClone(childInput),escapes:structuredClone(solver.escapes),carriers:structuredClone(solver.child.traces),qualifiedNewDdrSignals:0,exportable:false,fabricationReady:false}
 }
 if(performance.now()>next){console.log(JSON.stringify({steps,phase:solver.phase,elapsedSeconds:(performance.now()-start)/1000,lane:solver.stats.lane,totalLanes:solver.stats.totalLanes,bestPartialCarriers:bestPartial?.carriers.length??0}));next=performance.now()+10000}}}catch(e){error=String(e);solver.failed=true}
const report={status:solver.solved?'BOTTOM_RAM_PARTITIONED_NATIVE_DDR_ROUTED_REPLAY_AND_CLASS_MATCHING_REQUIRED':solver.failed?'BOTTOM_RAM_PARTITIONED_NATIVE_DDR_FAILED':'BOTTOM_RAM_PARTITIONED_NATIVE_DDR_TIMEOUT',source:prior.source,checkedPlacementSummary:prior.checkedPlacementSummary,sourceValidation:prior.sourceValidation,nativeBootstrapRun:artifact(nativeRunPath),priorInput:prior.input,input:artifact(inputPath),executionHelper:artifact(snapshot),solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',solverOptions:options,coreVersion:read('node_modules/@tscircuit/core/package.json').version,partition,routingPartitions:[...parts.values()],electricalCommandClockClassNames:validation.ddrEndpoints.filter(d=>/^DDR_(A\d+|BA\d+|CASn|RASn|WEn|CSn0|CKE|ODT|CK|CKn)$/.test(d.name)).map(d=>d.name),crossPartitionCommandClockMatchingDeferred:true,byteAllocation:prior.byteAllocation??'standard',copperLayers:4,referenceLayersReserved:['inner1','inner2'],all102FixedTracePiecesRetained:true,all89ThroughViasRetained:true,all912PadsRetained:true,all49ActualTopCpuBottomRamEndpointsRetained:true,preparedEscapes:solver.escapes.length,steps,elapsedSeconds:(performance.now()-start)/1000,phase:solver.phase,stats:solver.stats,error:error??solver.error??null,failureCode:solver.failureCode??null,qualifiedNewDdrSignals:0,fullElectricalTimingQualified:false,defaultChanged:false,originalShellFitVerified:false,fabricationReady:false}
assert.equal(report.electricalCommandClockClassNames.length,26)
if(bestPartial&&!solver.solved){const path=`${directory}/partial-seed.nonexportable.json`;writeFileSync(path,JSON.stringify(bestPartial)+'\n');report.partialSeed=artifact(path);report.partialNativeCarrierCount=bestPartial.carriers.length;report.partialSeedQualifiedSignals=0;report.partialSeedExportable=false}
if(solver.solved){const output=solver.getOutput();assert.deepEqual(output.traces.slice(0,102),input.traces);assert.equal(output.traces.length,151);assert.deepEqual(output.obstacles,input.obstacles);for(const d of validation.ddrEndpoints)assert.equal(output.traces.slice(102).filter(t=>t.source_trace_id===d.sourceTraceId).length,1);const path=`${directory}/output.simple-route.json`;writeFileSync(path,JSON.stringify(output)+'\n');report.output=artifact(path);report.nativeRoutedSignals=49}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,partition,elapsedSeconds:report.elapsedSeconds,preparedEscapes:report.preparedEscapes,error:report.error,qualifiedNewDdrSignals:0,fabricationReady:false}));process.exitCode=solver.solved?0:1
