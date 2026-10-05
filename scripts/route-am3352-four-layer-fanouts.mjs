import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'

// Authored corridor allocation with native fanout copper and bus_lanes
// channels. Keep every actual component pad, drill rule and source endpoint.
// Existing source copper is kept. This trial does not grant approval.
const inputPath=process.argv[2]??'dist/am3352-four-layer-outer-reserved-attempt-27/input.simple-route.json'
const directory=process.argv[3]??'dist/am3352-four-layer-ordered-fanouts'
const seconds=Number(process.argv[4]??60)
const selectedBus=process.argv[5]
assert(Number.isFinite(seconds)&&seconds>0&&seconds<=180)
const raw=readFileSync(inputPath),original=JSON.parse(raw)
assert.equal(original.layerCount,4)
assert.equal(original.connections.length,49)
assert([0,2,41,69].includes(original.traces?.length??0),'Expected the audited source copper, including RAM reference escapes and bypass loops when present')
assert.equal(original.allowBlindAndBuriedVias,false)
const layers=['top','bottom']
assert(original.buses.every(b=>b.allowedLayers.length===1&&layers.includes(b.allowedLayers[0])),
  'Both inner reference layers are reserved in the current four-layer candidate')
const componentAtPoint=p=>original.obstacles.find(o=>o.circuitJsonMetadata?.pcb_port_id===p.pcb_port_id)?.componentId
const socId=componentAtPoint(original.connections[0].pointsToConnect[0])
const ramId=componentAtPoint(original.connections[0].pointsToConnect[1])
assert(socId&&ramId&&socId!==ramId)
assert(original.connections.every(c=>componentAtPoint(c.pointsToConnect[0])===socId&&componentAtPoint(c.pointsToConnect[1])===ramId))
if(selectedBus){
  const bus=original.buses.find(b=>b.name===selectedBus);assert(bus,'Unknown selected bus')
  const names=new Set(bus.connectionNames)
  original.connections=original.connections.filter(c=>names.has(c.name))
  original.buses=[bus]
  original.differentialPairs=original.differentialPairs.filter(p=>p.connectionNames.every(n=>names.has(n)))
}
mkdirSync(directory,{recursive:true})
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const report={status:'FOUR_LAYER_ORDERED_FANOUT_TRIAL',copperLayerCount:4,maxCopperLayers:4,
  nativeSolvers:['SOLVERS.FanoutSolver','SOLVERS.BusLanesPipelineSolver'],
  input:{path:inputPath,sha256:hash(inputPath)},actualPadObstacles:original.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,
  selectedBus:selectedBus??'all',stages:[],fabricationReady:false,scope:'DDR-only routing trial on actual host pad obstacles; power copper, planes and complete host routing remain required.'}
const finish=()=>writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
const run=(name,solver)=>{
  const start=performance.now();let steps=0,next=start+10000
  while(!solver.solved&&!solver.failed&&performance.now()-start<seconds*1000){
    solver.step();steps++
    if(performance.now()>=next){console.log(JSON.stringify({stage:name,steps,elapsedSeconds:(performance.now()-start)/1000,phase:solver.phase}));next=performance.now()+10000}
  }
  const stage={name,solved:solver.solved,failed:solver.failed,error:solver.error??null,steps,elapsedSeconds:(performance.now()-start)/1000}
  report.stages.push(stage);finish();console.log(JSON.stringify(stage));return solver.solved
}
const exitStarts={DDR_BYTE0:.5,DDR_BYTE1:-6.5,DDR_COMMAND_CLOCK:-16.5,DDR_RESET:-.9}
const exitDirections={DDR_BYTE0:'center',DDR_BYTE1:'center',DDR_COMMAND_CLOCK:'center',DDR_RESET:'center'}
const busSpecs=(sourceComponentId,side,targetY)=>original.buses.map(b=>({
  busId:b.busId,name:b.name,connectionNames:b.connectionNames,traceWidth:b.traceWidth,
  sourceComponentId,exitPosition:`${side}side_${exitDirections[b.busId]}`,
  // Fanouts may use both outer layers for local crossings. The authored
  // exit targets and downstream buses retain their specified layer.
  allowedLayers:['top','bottom'],
  // These targets guide winding only. The solver retains the original pads.
  connectionExitTargets:Object.fromEntries(b.connectionNames.map((n,i)=>[n,{x:exitStarts[b.busId]+i*.6,y:targetY,layer:b.allowedLayers[0]}])),
}))
const cpuOptions={sourceComponentId:socId,sharedBoundary:{minX:selectedBus?-8.4:-17,maxX:selectedBus?8.4:17,minY:selectedBus?-10:-12,maxY:9},
  escapeLayers:layers,maxLayerCombinations:4,compactBusTracks:false,allowBlindAndBuriedVias:false,
  buses:busSpecs(socId,'bottom',-17)}
writeFileSync(`${directory}/soc.options.json`,JSON.stringify(cpuOptions,null,2)+'\n')
const cpuSolver=new SOLVERS.FanoutSolver(original,cpuOptions)
if(!run('SOC_ORDERED_FANOUT',cpuSolver)){report.status='NATIVE_SOC_FANOUT_FAILED_OR_TIMEOUT';finish();process.exitCode=1}
else {
  const cpuOutput=cpuSolver.getOutputSimpleRouteJson()
  writeFileSync(`${directory}/soc.output.simple-route.json`,JSON.stringify(cpuOutput)+'\n')
  const ramBuses=busSpecs(ramId,'top',-12).map(b=>({...b,
    connectionExitTargets:Object.fromEntries(b.connectionNames.map(n=>{
      const c=cpuOutput.connections.find(c=>c.name===n);assert(c)
      const p=c.pointsToConnect.find(p=>p.pcb_port_id!==original.connections.find(c=>c.name===n).pointsToConnect[1].pcb_port_id)
      assert(p&&p.layer===original.buses.find(b=>b.connectionNames.includes(n)).allowedLayers[0])
      return [n,{x:p.x,y:p.y,layer:p.layer}]
    }))}))
  const ramOptions={sourceComponentId:ramId,sharedBoundary:{minX:-17,maxX:17,minY:-36,maxY:-17},
    escapeLayers:layers,maxLayerCombinations:4,compactBusTracks:false,allowBlindAndBuriedVias:false,buses:ramBuses}
  writeFileSync(`${directory}/ram.options.json`,JSON.stringify(ramOptions,null,2)+'\n')
  const ramSolver=new SOLVERS.FanoutSolver(cpuOutput,ramOptions)
  if(!run('RAM_ORDERED_FANOUT',ramSolver)){report.status='NATIVE_RAM_FANOUT_FAILED_OR_TIMEOUT';finish();process.exitCode=1}
  else {
    const channel=ramSolver.getOutputSimpleRouteJson();channel.buses=original.buses;channel.differentialPairs=original.differentialPairs
    writeFileSync(`${directory}/channel.input.simple-route.json`,JSON.stringify(channel)+'\n')
    const lanes=new SOLVERS.BusLanesPipelineSolver(channel,{fanout:'none'})
    if(!run('DDR_BUS_LANES_CHANNEL',lanes)){report.status='NATIVE_ORDERED_CHANNEL_FAILED_OR_TIMEOUT';finish();process.exitCode=1}
    else {
      const output=lanes.getOutput();assert.equal(output.layerCount,4)
      writeFileSync(`${directory}/output.simple-route.json`,JSON.stringify(output)+'\n')
      report.status='NATIVE_FOUR_LAYER_DDR_ROUTE_PENDING_INDEPENDENT_CHECKS'
      report.output={path:`${directory}/output.simple-route.json`,sha256:hash(`${directory}/output.simple-route.json`)};finish()
    }
  }
}
