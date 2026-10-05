import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'

const [nativeRunPath,directory,secondsArg='60',localLayers='single']=process.argv.slice(2)
assert(nativeRunPath&&directory&&!existsSync(`${directory}/result.json`));const seconds=Number(secondsArg);assert(seconds>0&&seconds<=180)
assert(['single','both'].includes(localLayers))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const native=read(nativeRunPath);for(const a of [native.source,native.checkedPlacementSummary,native.sourceValidation,native.input])verify(a)
const summary=read(native.checkedPlacementSummary.path);assert.equal(summary.status,'BOTTOM_RAM_PLACEMENT_REFERENCE_USB_AND_PHYSICAL_COPPER_CHECKED_DDR_UNROUTED');assert(summary.sourceEligibleForNativeDdrPlacementStudy&&!summary.fabricationReady);assert.deepEqual(summary.source,native.source)
const original=read(native.input.path),validation=read(native.sourceValidation.path)
assert.equal(original.layerCount,4);assert.equal(original.traces.length,102);assert.equal(original.connections.length,49);assert.equal(original.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,912);assert.equal(original.minViaPadDiameter,.4572);assert.equal(original.minViaHoleDiameter,.254);assert.equal(original.allowBlindAndBuriedVias,false)
for(const d of validation.ddrEndpoints)assert.deepEqual(original.connections.find(c=>c.name===d.sourceTraceId).pointsToConnect.map(({pointId,...p})=>p),d.endpoints)
const componentAt=p=>original.obstacles.find(o=>o.circuitJsonMetadata?.pcb_port_id===p.pcb_port_id)?.componentId,cpu=componentAt(original.connections[0].pointsToConnect[0]),ram=componentAt(original.connections[0].pointsToConnect[1]);assert(cpu&&ram&&cpu!==ram)
assert(original.connections.every(c=>componentAt(c.pointsToConnect[0])===cpu&&componentAt(c.pointsToConnect[1])===ram))
mkdirSync(directory,{recursive:true});const snapshot=`${directory}/ordered-helper.executed.mjs`;writeFileSync(snapshot,readFileSync('scripts/route-am3352-ram-bottom-ordered-fanouts.mjs'))
const report={status:'BOTTOM_RAM_ORDERED_FANOUT_IN_PROGRESS',source:native.source,checkedPlacementSummary:native.checkedPlacementSummary,nativeBootstrapRun:artifact(nativeRunPath),input:native.input,executionHelper:artifact(snapshot),solvers:['@tscircuit/core SOLVERS.FanoutSolver','@tscircuit/core SOLVERS.BusLanesPipelineSolver'],secondsPerStage:seconds,localLayers,commandLayer:native.commandLayer,byteAllocation:native.byteAllocation??'standard',copperLayers:4,referenceLayersReserved:['inner1','inner2'],all102FixedTracePiecesRetained:true,all89ThroughViasRetained:true,all912PadsRetained:true,all49ActualTopCpuBottomRamEndpointsRetained:true,stages:[],qualifiedNewDdrSignals:0,fullElectricalTimingQualified:false,originalShellFitVerified:false,defaultChanged:false,exportable:false,fabricationReady:false}
const finish=()=>writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
const retained=output=>{assert.equal(output.layerCount,4);assert.deepEqual(output.traces.slice(0,102),original.traces);assert.deepEqual(output.obstacles,original.obstacles)}
const run=(name,create)=>{const start=performance.now();let solver,steps=0,next=start+10000,error=null;try{solver=create();while(!solver.solved&&!solver.failed&&performance.now()-start<seconds*1000){solver.step();steps++;if(performance.now()>next){console.log(JSON.stringify({stage:name,steps,elapsedSeconds:(performance.now()-start)/1000,stats:solver.stats}));next=performance.now()+10000}}}catch(e){error=String(e)}
 const stage={name,status:solver?.solved?'SOLVED':error||solver?.failed?'FAILED':'TIMEOUT',steps,elapsedSeconds:(performance.now()-start)/1000,error:error??solver?.error??null,terminalStats:solver?.stats??null};report.stages.push(stage);finish();console.log(JSON.stringify({stage:name,status:stage.status,elapsedSeconds:stage.elapsedSeconds,error:stage.error}));return stage.status==='SOLVED'?solver:null}
const regions={DDR_BYTE0:'right',DDR_BYTE1:'center',DDR_ADDR_CTRL:'left',DDR_CK:'left',DDR_RESET:'center'}
const targets={DDR_BYTE0:3.5,DDR_BYTE1:-2.8,DDR_ADDR_CTRL:-16,DDR_CK:-16.8,DDR_RESET:1.8}
const specs=(componentId,edge,targetY)=>original.buses.map(b=>({busId:b.busId,name:b.name,connectionNames:b.connectionNames,traceWidth:.1016,sourceComponentId:componentId,exitPosition:`${edge}side_${regions[b.name]}`,allowedLayers:localLayers==='both'?['top','bottom']:b.allowedLayers,connectionExitTargets:Object.fromEntries(b.connectionNames.map((n,i)=>[n,{x:targets[b.name]+i*.5588,y:targetY,layer:b.allowedLayers[0]}]))}))
const common={escapeLayers:['top','bottom'],maxLayerCombinations:4,compactBusTracks:false,allowBlindAndBuriedVias:false,traceWidth:.1016,clearance:.1016,viaDiameter:.4572,viaHoleDiameter:.254}
const cpuOptions={...common,sourceComponentId:cpu,sharedBoundary:{minX:-17.5,maxX:17.5,minY:-11,maxY:9.5},buses:specs(cpu,'bottom',-18)};const cpuOptionsPath=`${directory}/cpu.options.json`;writeFileSync(cpuOptionsPath,JSON.stringify(cpuOptions,null,2)+'\n');report.cpuOptions=artifact(cpuOptionsPath)
const cpuSolver=run('CPU_ORDERED_FANOUT',()=>new SOLVERS.FanoutSolver(original,cpuOptions))
if(!cpuSolver){report.status='BOTTOM_RAM_CPU_ORDERED_FANOUT_FAILED_OR_TIMEOUT';finish();process.exitCode=1}
else {
 const cpuOutput=cpuSolver.getOutputSimpleRouteJson();retained(cpuOutput);const path=`${directory}/cpu.output.simple-route.json`;writeFileSync(path,JSON.stringify(cpuOutput)+'\n');report.cpuFanout=artifact(path)
 const ramBuses=specs(ram,'top',-11).map(b=>({...b,connectionExitTargets:Object.fromEntries(b.connectionNames.map(n=>{const connection=cpuOutput.connections.find(c=>c.name===n),originalRam=original.connections.find(c=>c.name===n).pointsToConnect[1],p=connection.pointsToConnect.find(p=>p.pcb_port_id!==originalRam.pcb_port_id),targetLayer=original.buses.find(o=>o.connectionNames.includes(n)).allowedLayers[0];assert(p&&p.layer===targetLayer);return[n,{x:p.x,y:p.y,layer:p.layer}]}))}))
 const ramOptions={...common,sourceComponentId:ram,sharedBoundary:{minX:-17.5,maxX:17.5,minY:-38.5,maxY:-18},buses:ramBuses},ramOptionsPath=`${directory}/ram.options.json`;writeFileSync(ramOptionsPath,JSON.stringify(ramOptions,null,2)+'\n');report.ramOptions=artifact(ramOptionsPath)
 const ramSolver=run('RAM_ORDERED_FANOUT',()=>new SOLVERS.FanoutSolver(cpuOutput,ramOptions))
 if(!ramSolver){report.status='BOTTOM_RAM_RAM_ORDERED_FANOUT_FAILED_OR_TIMEOUT';finish();process.exitCode=1}
 else {
  const channel=ramSolver.getOutputSimpleRouteJson();retained(channel);channel.buses=original.buses;channel.differentialPairs=original.differentialPairs;const channelPath=`${directory}/channel.input.simple-route.json`;writeFileSync(channelPath,JSON.stringify(channel)+'\n');report.channelInput=artifact(channelPath)
  const solver=run('NATIVE_BUS_LANES_CHANNEL',()=>new SOLVERS.BusLanesPipelineSolver(channel,{fanout:'none',smoothTuning:true,denseSearch:true}))
  if(!solver){report.status='BOTTOM_RAM_ORDERED_CHANNEL_FAILED_OR_TIMEOUT';finish();process.exitCode=1}
  else{const output=solver.getOutput();retained(output);const path=`${directory}/output.simple-route.json`;writeFileSync(path,JSON.stringify(output)+'\n');report.output=artifact(path);report.status='BOTTOM_RAM_ORDERED_FULL_DDR_ROUTED_REPLAY_AND_CHECKS_REQUIRED';finish()}
 }
}
