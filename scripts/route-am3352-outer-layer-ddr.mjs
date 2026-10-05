import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS,getSimpleRouteJsonFromCircuitJson} from '@tscircuit/core'
import {ddrGroups,ddrResetLayer,ddrVia,ddrReferenceRegion} from '../lib/am3352/FourLayerDdrConstraints'
import {differentialPairs} from '../lib/am3352/DdrConstraints'
import {assertSourceCopper} from './lib/am3352-source-copper.mjs'
import {assertSavedDdrCopper} from './lib/am3352-saved-ddr-copper.mjs'
import {commandAccessOpenings} from './lib/am3352-command-openings.mjs'

// Build a fresh native input from the actual tsci-generated host, not an
// earlier two-chip fixture. Keep every pad, hole and socket keepout. The
// solver may place through-vias, but cannot route a DDR wire on either
// reference layer. A solve remains subject to independent full-board checks.
const sourcePath=process.argv[2]??'dist/experiments/am3352-powered-host/circuit.json'
const directory=process.argv[3]??'dist/am3352-four-layer-outer-attempt-26'
const seconds=Number(process.argv[4]??60)
const preparationOnly=process.argv[5]==='prepare'
const mapPath=process.argv[6]??'lib/am3352/memory-byte1-swizzled-connections.json'
const savedPathsPath=process.argv[7]==='none'?undefined:process.argv[7]
const referenceLayoutPath=process.argv[8]
const byte1Layer=process.argv[9]??'bottom';assert(['top','bottom'].includes(byte1Layer))
const commandBootstrapLayer=process.argv[10]??'top';assert(['top','bottom'].includes(commandBootstrapLayer))
assert(commandBootstrapLayer==='top'||preparationOnly,'Alternate command layer is a dogbone bootstrap only, never an accepted final channel')
const copperOptions=referenceLayoutPath?{ramReferenceEscapes:JSON.parse(readFileSync(referenceLayoutPath))}:{}
const openDqs1Pair=process.argv[11]==='open-dqs1-pair'
assert(process.argv[11]===undefined||process.argv[11]==='none'||openDqs1Pair)
if(openDqs1Pair)copperOptions.diagnosticOpenDqs1Pair=true
const openCommandChannels=Object.hasOwn(commandAccessOpenings,process.argv[12]??'')
assert(process.argv[12]===undefined||process.argv[12]==='none'||openCommandChannels)
if(openCommandChannels)copperOptions.diagnosticOpenCommandChannels=commandAccessOpenings[process.argv[12]]
const rotatedRam=process.argv[13]==='ram-rotated-180'
assert(process.argv[13]===undefined||rotatedRam)
if(rotatedRam)copperOptions.ramRotation=180
const powerBridge=process.argv[14]==='rotated-d2-power-bridge'
assert(process.argv[14]===undefined||powerBridge)
if(powerBridge){assert(rotatedRam);copperOptions.rotatedD2PowerBridge=true}
const preparationBus=process.argv[15]
assert(preparationBus===undefined||preparationOnly&&['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK'].includes(preparationBus))
assert(Number.isFinite(seconds)&&seconds>0&&seconds<=180)
const raw=readFileSync(sourcePath),source=JSON.parse(raw),type=t=>source.filter(e=>e.type===t)
const board=type('pcb_board')[0],map=JSON.parse(readFileSync(mapPath))
assert.equal(board.num_layers,4);assert.equal(board.min_via_pad_diameter,ddrVia.land)
assert.equal(board.min_via_hole_diameter,ddrVia.drill)
assert.equal(source.filter(e=>e.type.endsWith('_error')).length,0)
const sourceCopper=savedPathsPath?assertSavedDdrCopper(source,JSON.parse(readFileSync(savedPathsPath)),copperOptions):assertSourceCopper(source,copperOptions)
const alreadyRoutedNames=new Set(sourceCopper.savedDdrNames??[])
const {simpleRouteJson:input}=getSimpleRouteJsonFromCircuitJson({circuitJson:source,
  minTraceWidth:board.min_trace_width,nominalTraceWidth:.1016,
  minTraceToPadEdgeClearance:board.min_trace_to_pad_edge_clearance,
  minTraceToHoleEdgeClearance:board.min_trace_to_hole_edge_clearance,
  minViaHoleEdgeToViaHoleEdgeClearance:board.min_via_hole_edge_to_via_hole_edge_clearance,
  minPadEdgeToPadEdgeClearance:board.min_pad_edge_to_pad_edge_clearance,
  minBoardEdgeClearance:board.min_board_edge_clearance,
  minViaPadDiameter:ddrVia.land,minViaHoleDiameter:ddrVia.drill})
const components=type('source_component'),sourcePorts=type('source_port'),ports=type('pcb_port'),traces=type('source_trace')
const names=new Map(traces.map(t=>[t.name,t.source_trace_id]))
input.connections=map.map(c=>{
  const trace=traces.find(t=>t.name===c.name);assert(trace)
  const pointsToConnect=[['U_SOC',c.socPin,c.socBall],['U_RAM',c.ramPin,c.ramBall]].map(([name,pin,ball])=>{
    const component=components.find(s=>s.name===name)
    const sp=sourcePorts.find(p=>p.source_component_id===component.source_component_id&&p.pin_number===Number(pin.slice(3)))
    assert.equal(sp.name,ball);assert(trace.connected_source_port_ids.includes(sp.source_port_id))
    const p=ports.find(p=>p.source_port_id===sp.source_port_id)
    const obstacle=input.obstacles.find(o=>o.circuitJsonMetadata?.pcb_port_id===p.pcb_port_id)
    assert(obstacle?.connectedTo.includes(trace.source_trace_id))
    assert.equal(p.layers.length,1)
    return {x:p.x,y:p.y,layer:p.layers[0],pointId:p.pcb_port_id,pcb_port_id:p.pcb_port_id}
  })
  return {name:trace.source_trace_id,source_trace_id:trace.source_trace_id,nominalTraceWidth:.1016,width:.1016,pointsToConnect}
})
assert.equal(input.connections.length,49)
assert.equal(input.traces?.length,sourceCopper.totalSourceTraces??sourceCopper.traces,'All actual source copper must be preserved')
for(const t of type('pcb_trace')){
  const native=input.traces.find(p=>p.pcb_trace_id===t.pcb_trace_id);assert(native)
  assert.equal(native.source_trace_id,t.source_trace_id)
  const geometry=route=>route.map(({route_type,x,y,layer,width})=>({route_type,x,y,layer,width}))
  assert.deepEqual(geometry(native.route),geometry(t.route))
}
input.allowBlindAndBuriedVias=false
input.bounds={minX:ddrReferenceRegion.minX+.5,maxX:ddrReferenceRegion.maxX-.5,
  minY:ddrReferenceRegion.minY+.5,maxY:ddrReferenceRegion.maxY-.5}
input.buses=[...ddrGroups.map(g=>({name:g.name,busId:g.name,
  connectionNames:g.signals.map(n=>names.get(n)),maxLengthSkew:.635,traceWidth:.1016,allowedLayers:[g.name==='DDR_BYTE1'?byte1Layer:g.name==='DDR_COMMAND_CLOCK'?commandBootstrapLayer:g.layer]})),
  {name:'DDR_RESET',busId:'DDR_RESET',connectionNames:[names.get('DDR_RESETn')],traceWidth:.1016,allowedLayers:[ddrResetLayer]}]
input.differentialPairs=differentialPairs.map(p=>({connectionNames:[names.get(p.positiveConnection),names.get(p.negativeConnection)],lengthTolerance:.127,traceGap:.12}))
assert(input.buses.every(b=>b.allowedLayers.every(l=>['top','bottom'].includes(l))))
assert.equal(new Set(input.buses.flatMap(b=>b.connectionNames)).size,49)
const routedIds=new Set([...alreadyRoutedNames].map(n=>names.get(n)))
input.connections=input.connections.filter(c=>!routedIds.has(c.name))
input.buses=input.buses.map(b=>({...b,connectionNames:b.connectionNames.filter(n=>!routedIds.has(n))})).filter(b=>b.connectionNames.length)
input.differentialPairs=input.differentialPairs.filter(p=>p.connectionNames.every(n=>!routedIds.has(n)))
if(preparationBus){
 const bus=input.buses.find(b=>b.name===preparationBus);assert(bus,'Requested preparation bus must still be open')
 const members=new Set(bus.connectionNames)
 input.connections=input.connections.filter(c=>members.has(c.name))
 input.buses=[bus]
 input.differentialPairs=input.differentialPairs.filter(p=>p.connectionNames.every(n=>members.has(n)))
 // Every physical pad, existing copper item and keepout is retained.
 // Only native preparation for the explicitly selected open phase runs.
 assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,882)
}
const expectedDogbones=input.connections.filter(c=>input.buses.some(b=>b.allowedLayers[0]==='bottom'&&b.connectionNames.includes(c.name))).length*2
const pads=type('pcb_smtpad'),obstaclePads=input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id)
assert.equal(obstaclePads.length,pads.length)
for(const pad of pads){const o=obstaclePads.find(o=>o.circuitJsonMetadata.pcb_smtpad_id===pad.pcb_smtpad_id)
  assert(o&&Math.hypot(o.center.x-pad.x,o.center.y-pad.y)<1e-6)}
assert.equal(type('pcb_keepout').length,2)
mkdirSync(directory,{recursive:true})
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(input)+'\n')
const solver=new SOLVERS.BusLanesPipelineSolver(input),start=performance.now()
let preparationError
if(preparationOnly)try{solver.prepare()}catch(error){preparationError=error.message}
let steps=0,next=start+10000
while(!preparationOnly&&!solver.solved&&!solver.failed&&performance.now()-start<seconds*1000){
  solver.step();steps++
  if(performance.now()>=next){console.log(JSON.stringify({steps,elapsedSeconds:(performance.now()-start)/1000,phase:solver.phase,childPhase:solver.child?.phase}));next=performance.now()+10000}
}
const report={status:preparationOnly?(preparationError?'NATIVE_OUTER_SIGNAL_ESCAPES_PREPARATION_FAILED':'NATIVE_OUTER_SIGNAL_ESCAPES_PREPARED_CHANNEL_UNROUTED'):solver.solved?'OUTER_LAYER_DDR_SOLVED_PENDING_CHECKS':solver.failed?'OUTER_LAYER_DDR_FAILED':'OUTER_LAYER_DDR_TIMEOUT',
  solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',coreVersion:JSON.parse(readFileSync('node_modules/@tscircuit/core/package.json')).version,
  source:{path:sourcePath,sha256:hash(sourcePath),components:components.length},
  memoryMap:{path:mapPath,sha256:hash(mapPath)},
  ...(referenceLayoutPath?{ramReferenceLayout:{path:referenceLayoutPath,sha256:hash(referenceLayoutPath)}}:{}),
  ...(savedPathsPath?{preservedSavedDdr:{path:savedPathsPath,sha256:hash(savedPathsPath),signals:alreadyRoutedNames.size}}:{}),
  input:{path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)},
  copperLayerCount:4,signalLayers:['top','bottom'],reservedReferenceLayers:{inner1:'GND',inner2:'DDR_1V5'},
  byte1ChannelLayer:byte1Layer,
  commandChannelRequiredLayer:'top',commandDogboneBootstrapLayer:commandBootstrapLayer,
  ...(openDqs1Pair?{temporaryOpenSignals:['DDR_DQS1','DDR_DQSn1'],scopeOfOpenPair:'Isolated diagnostic source only; the checked active source is unchanged'}:{}),
  ...(openCommandChannels?{temporaryOpenCommandChannels:copperOptions.diagnosticOpenCommandChannels,scopeOfOpenCommandChannels:'Separate access diagnostic; every opened logical net is retained and requires complete rerouting. No checked source is changed.'}:{}),
  ...(rotatedRam?{ramPlacementVariant:{rotationDeg:180,center:{x:0,y:-27},referenceEscapesExplicitlyTransformed:true}}:{}),
  ...(preparationBus?{preparationBus,scopeOfPreparedBus:'Only the selected open bus receives native dogbones. Every actual obstacle and all saved source copper remain; other logical DDR nets are still unfinished.'}:{}),
  reservedDdrReferenceRegion:ddrReferenceRegion,viaGeometryMm:ddrVia,
  actualPadObstacles:pads.length,requiredSignals:49,preparedLocalEscapes:solver.escapes?.length??0,
  elapsedSeconds:(performance.now()-start)/1000,steps,error:preparationError??solver.error??null,failureCode:preparationError?'PREPARATION_EXCEPTION':solver.failureCode??null,
  nativeDiagnostics:{phase:solver.phase,childPhase:solver.child?.phase,stats:solver.stats},
  fabricationReady:false,sourceCopper,referencePlaneConnectionsComplete:false,
  scope:'Fresh integrated host source; native outer-layer DDR trial only. No completed power routing, tested boot or complete handheld qualification.'}
if(preparationOnly&&!preparationError){
  assert.equal(solver.escapes.length,expectedDogbones)
  writeFileSync(`${directory}/signal-escapes.native.json`,JSON.stringify(solver.escapes,null,2)+'\n')
  report.completedSignalChannels=0
}
if(solver.solved){
  const output=solver.getOutput();assert.equal(output.traces.length,input.connections.length+(sourceCopper.totalSourceTraces??sourceCopper.traces))
  for(const t of output.traces)assert(t.route.every(p=>p.route_type!=='wire'||['top','bottom'].includes(p.layer)))
  writeFileSync(`${directory}/output.simple-route.json`,JSON.stringify(output)+'\n')
  report.output={path:`${directory}/output.simple-route.json`,sha256:hash(`${directory}/output.simple-route.json`)}
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
process.exitCode=solver.solved||preparationOnly&&!preparationError?0:1
