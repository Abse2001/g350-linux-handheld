import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS,getSimpleRouteJsonFromCircuitJson} from '@tscircuit/core'

// Fresh native DDR phases on the complete checked copper, rather than the
// historical power-only routing inputs. Plane layers stay reserved.
const [sourcePath,directory,selection='clock',layer='bottom',mode='full',seconds='45']=process.argv.slice(2)
assert(sourcePath&&directory);assert(['top','bottom'].includes(layer))
assert(['full','prepare','prepare-cpu','prepare-ram','connectivity-bootstrap'].includes(mode));assert(Number(seconds)>0&&Number(seconds)<=120)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const source=read(sourcePath),type=t=>source.filter(e=>e.type===t),board=type('pcb_board')[0]
assert.equal(board.num_layers,4);assert.equal(source.filter(e=>e.type.endsWith('_error')).length,0)
const mapPath='lib/am3352/memory-byte1-top-centered-swizzled-connections.json',map=read(mapPath)
const bus=type('source_bus').find(b=>b.name==='DDR_COMMAND_CLOCK');assert(bus);assert.equal(bus.max_length_skew,.635)
const candidates=map.filter(m=>bus.source_trace_ids.includes(type('source_trace').find(t=>t.name===m.name)?.source_trace_id))
assert.equal(candidates.length,26)
const chosen=selection==='strobe'?map.filter(m=>['DDR_DQS1','DDR_DQSn1'].includes(m.name)):
  selection==='address-control'?candidates.filter(m=>!['DDR_CK','DDR_CKn'].includes(m.name)):
  selection==='command-and-strobes'?[...candidates,...map.filter(m=>['DDR_DQS1','DDR_DQSn1'].includes(m.name))]:
  selection==='clock'?candidates.filter(m=>['DDR_CK','DDR_CKn'].includes(m.name)):
  selection==='command'?candidates:candidates.filter(m=>selection.split(',').includes(m.name))
assert(chosen.length);assert.equal(chosen.length,['clock','strobe'].includes(selection)?2:selection==='address-control'?24:selection==='command'?26:selection==='command-and-strobes'?28:selection.split(',').length)
const definitions=chosen.map(m=>{
  const t=type('source_trace').find(t=>t.name===m.name);assert(t);assert.equal(t.connected_source_port_ids.length,2)
  assert(!type('pcb_trace').some(p=>p.source_trace_id===t.source_trace_id),`${m.name} already has copper`)
  const pointsToConnect=[['U_SOC',m.socPin,m.socBall],['U_RAM',m.ramPin,m.ramBall]].map(([name,pin,ball])=>{
    const sc=type('source_component').find(c=>c.name===name)
    const sp=type('source_port').find(p=>p.source_component_id===sc.source_component_id&&p.pin_number===Number(pin.slice(3)))
    assert.equal(sp.name,ball);assert(t.connected_source_port_ids.includes(sp.source_port_id))
    const pp=type('pcb_port').find(p=>p.source_port_id===sp.source_port_id);assert.deepEqual(pp.layers,['top'])
    return {x:pp.x,y:pp.y,layer:'top',pointId:pp.pcb_port_id,pcb_port_id:pp.pcb_port_id}
  })
  return {...m,sourceTraceId:t.source_trace_id,pointsToConnect}
})
const {simpleRouteJson:input}=getSimpleRouteJsonFromCircuitJson({circuitJson:source,
  minTraceWidth:board.min_trace_width,nominalTraceWidth:.1016,
  minTraceToPadEdgeClearance:board.min_trace_to_pad_edge_clearance,
  minTraceToHoleEdgeClearance:board.min_trace_to_hole_edge_clearance,
  minViaHoleEdgeToViaHoleEdgeClearance:board.min_via_hole_edge_to_via_hole_edge_clearance,
  minPadEdgeToPadEdgeClearance:board.min_pad_edge_to_pad_edge_clearance,
  minBoardEdgeClearance:board.min_board_edge_clearance,
  minViaPadDiameter:board.min_via_pad_diameter,minViaHoleDiameter:board.min_via_hole_diameter})
assert.equal(input.traces.length,type('pcb_trace').length)
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,type('pcb_smtpad').length)
const normalizedFixedVias=[]
const geometry=t=>t.route.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
for(const t of type('pcb_trace')){
  const converted=input.traces.find(n=>n.pcb_trace_id===t.pcb_trace_id);assert(converted)
  assert.deepEqual(geometry(converted),geometry(t))
  for(const p of converted.route.filter(p=>p.route_type==='via')){
    const v=type('pcb_via').find(v=>Math.hypot(v.x-p.x,v.y-p.y)<1e-8);assert(v)
    if(p.via_diameter!==undefined)assert.equal(p.via_diameter,v.outer_diameter)
    if(p.via_hole_diameter!==undefined)assert.equal(p.via_hole_diameter,v.hole_diameter)
    assert.deepEqual(new Set(v.layers),new Set(['top','inner1','inner2','bottom']))
    p.via_diameter=v.outer_diameter;p.via_hole_diameter=v.hole_diameter;p.layers=[...v.layers]
    normalizedFixedVias.push({pcbTraceId:t.pcb_trace_id,pcbViaId:v.pcb_via_id,x:p.x,y:p.y,landMm:p.via_diameter,drillMm:p.via_hole_diameter,layers:p.layers})
  }
}
input.connections=definitions.map(d=>({name:d.sourceTraceId,source_trace_id:d.sourceTraceId,width:.1016,nominalTraceWidth:.1016,pointsToConnect:d.pointsToConnect}))
const virtualPreparationTargets=[]
if(['prepare-cpu','prepare-ram'].includes(mode)){
  assert.equal(layer,'bottom')
  const virtualIndex=mode==='prepare-cpu'?1:0
  input.connections=input.connections.map(c=>({...c,pointsToConnect:c.pointsToConnect.map((p,i)=>{
    if(i!==virtualIndex)return p
    const descriptor={x:p.x,y:p.y,layer:'bottom'}
    virtualPreparationTargets.push({connectionName:c.name,package:virtualIndex?'U_RAM':'U_SOC',descriptor})
    return descriptor
  })}))
}
const originalTiming={busMaxLengthSkewMm:.635,clockMaxLengthSkewMm:.127,clockTraceGapMm:.12}
const phaseName=selection==='clock'?'DDR_CK_PAIR':selection==='strobe'?'DDR_DQS1_PAIR':'DDR_COMMAND_CLOCK'
input.buses=[{name:phaseName,busId:phaseName,
  connectionNames:definitions.filter(d=>selection==='strobe'||!['DDR_DQS1','DDR_DQSn1'].includes(d.name)).map(d=>d.sourceTraceId),traceWidth:.1016,allowedLayers:[layer],
  ...(mode==='connectivity-bootstrap'?{}:{maxLengthSkew:['clock','strobe'].includes(selection)?.127:.635})}]
if(selection==='command-and-strobes')input.buses.push({name:'DDR_DQS1_PAIR',busId:'DDR_DQS1_PAIR',
  connectionNames:definitions.filter(d=>['DDR_DQS1','DDR_DQSn1'].includes(d.name)).map(d=>d.sourceTraceId),
  traceWidth:.1016,allowedLayers:[layer],maxLengthSkew:.127})
const pair=definitions.filter(d=>['DDR_CK','DDR_CKn'].includes(d.name))
input.differentialPairs=pair.length===2?[{connectionNames:pair.map(d=>d.sourceTraceId),lengthTolerance:.127,traceGap:.12}]:[]
if(['command-and-strobes','strobe'].includes(selection))input.differentialPairs.push({
  connectionNames:definitions.filter(d=>['DDR_DQS1','DDR_DQSn1'].includes(d.name)).map(d=>d.sourceTraceId),lengthTolerance:.127,traceGap:.12})
input.allowBlindAndBuriedVias=false
mkdirSync(directory,{recursive:true});const inputPath=`${directory}/input.simple-route.json`
writeFileSync(inputPath,JSON.stringify(input)+'\n')
const solver=new SOLVERS.BusLanesPipelineSolver(input),start=performance.now();let steps=0,next=start+10000,error=null
try{
  if(mode.startsWith('prepare'))solver.prepare()
  else while(!solver.solved&&!solver.failed&&performance.now()-start<Number(seconds)*1000){
    solver.step();steps++
    if(performance.now()>next){console.log(JSON.stringify({steps,phase:solver.phase,childPhase:solver.child?.phase,
      lanes:solver.child?.traces.length,elapsedSeconds:(performance.now()-start)/1000}));next=performance.now()+10000}
  }
}catch(e){error=String(e);solver.failed=true}
const prepared=mode.startsWith('prepare')&&!solver.failed
const report={status:solver.solved?'NATIVE_DDR_PHASE_ROUTED_PENDING_PHYSICAL_CHECKS':prepared?'NATIVE_DDR_LOCAL_ESCAPES_PREPARED_CHANNELS_UNROUTED':
  solver.failed?'NATIVE_DDR_PHASE_FAILED':'NATIVE_DDR_PHASE_TIMEOUT',source:{path:sourcePath,sha256:hash(sourcePath)},
  input:{path:inputPath,sha256:hash(inputPath)},connectionMap:{path:mapPath,sha256:hash(mapPath)},definitions,
  selection,signalLayer:layer,mode,originalTimingRequirements:originalTiming,solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',
  coreVersion:read('node_modules/@tscircuit/core/package.json').version,
  capacityAutorouterVersion:read('node_modules/@tscircuit/capacity-autorouter/package.json').version,
  sourceTracePiecesRetained:type('pcb_trace').length,actualPadObstacles:type('pcb_smtpad').length,
  physicalThroughViasRetained:type('pcb_via').length,copperLayers:4,referenceLayersReserved:['inner1','inner2'],
  normalizedFixedViaGeometry:normalizedFixedVias,
  virtualPreparationTargets,virtualTargetsExportable:false,
  steps,elapsedSeconds:(performance.now()-start)/1000,phase:solver.phase,childPhase:solver.child?.phase,
  error:error??solver.error??null,failureCode:solver.failureCode??null,
  preparedEscapes:solver.escapes.length,newConnectedSignals:solver.solved?definitions.length:0,
  fullElectricalTimingQualified:false,fabricationReady:false}
if(solver.escapes.length){
  const path=`${directory}/signal-escapes.native.json`;writeFileSync(path,JSON.stringify(solver.escapes)+'\n')
  report.localEscapes={path,sha256:hash(path)}
}
if(solver.solved){
  const output=solver.getOutput();assert.equal(output.traces.length,input.traces.length+definitions.length)
  for(let i=0;i<input.traces.length;i++)assert.deepEqual(output.traces[i],input.traces[i])
  const path=`${directory}/output.simple-route.json`;writeFileSync(path,JSON.stringify(output)+'\n');report.output={path,sha256:hash(path)}
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
process.exitCode=solver.solved||prepared?0:1
