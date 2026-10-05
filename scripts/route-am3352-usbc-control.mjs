import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS,getSimpleRouteJsonFromCircuitJson} from '@tscircuit/core'

const [sourcePath,directory,phase='sense',seconds='45']=process.argv.slice(2)
assert(sourcePath&&directory&&['sense','pmic-feed','sense-input','sense-cap','sense-clamp','pmic-cap'].includes(phase));assert(Number(seconds)>0&&Number(seconds)<=120)
const read=p=>JSON.parse(readFileSync(p)),source=read(sourcePath),type=t=>source.filter(e=>e.type===t)
const board=type('pcb_board')[0];assert.equal(board.num_layers,4)
assert.equal(source.filter(e=>e.type.endsWith('_error')).length,0)
const {simpleRouteJson:input}=getSimpleRouteJsonFromCircuitJson({circuitJson:source,
  minTraceWidth:board.min_trace_width,nominalTraceWidth:phase==='sense'?.15:.2,
  minTraceToPadEdgeClearance:board.min_trace_to_pad_edge_clearance,
  minTraceToHoleEdgeClearance:board.min_trace_to_hole_edge_clearance,
  minViaHoleEdgeToViaHoleEdgeClearance:board.min_via_hole_edge_to_via_hole_edge_clearance,
  minPadEdgeToPadEdgeClearance:board.min_pad_edge_to_pad_edge_clearance,
  minBoardEdgeClearance:board.min_board_edge_clearance,
  minViaPadDiameter:board.min_via_pad_diameter,minViaHoleDiameter:board.min_via_hole_diameter})
const point=(name,pin)=>{
  const component=type('source_component').find(c=>c.name===name);assert(component)
  const sp=type('source_port').find(p=>p.source_component_id===component.source_component_id&&p.pin_number===pin);assert(sp)
  const pp=type('pcb_port').find(p=>p.source_port_id===sp.source_port_id);assert(pp)
  assert.equal(pp.layers.length,1);assert(['top','bottom'].includes(pp.layers[0]))
  return {x:pp.x,y:pp.y,layer:pp.layers[0],pointId:pp.pcb_port_id,pcb_port_id:pp.pcb_port_id,sourcePortId:sp.source_port_id}
}
const viaPoint=(x,y)=>{
  const v=type('pcb_via').find(v=>Math.hypot(v.x-x,v.y-y)<1e-8);assert(v)
  const pp=type('pcb_port').find(p=>v.pcb_port_ids?.includes(p.pcb_port_id)&&p.layers[0]==='bottom');assert(pp)
  return {x:pp.x,y:pp.y,layer:'bottom',pointId:pp.pcb_port_id,pcb_port_id:pp.pcb_port_id,sourcePortId:pp.source_port_id}
}
let from,to,name,net,width,selector,signalLayer='bottom',ownerPoint
if(phase==='sense'){
  from=point('U_SOC',266);to=point('R_USB_VBUS_SENSE',2)
  name='USB_VBUS_SENSE_CPU';net='USB0_VBUS_SENSE';width=.15;selector={from:'U_SOC.pin266',to:'R_USB_VBUS_SENSE.pin2'}
  ownerPoint=from
}else if(phase==='pmic-feed'){
  from=viaPoint(-2.4001603,51.8)
  const existing=type('pcb_via').some(v=>Math.hypot(v.x+22.799979,v.y+4.5)<1e-8)
  to=existing?viaPoint(-22.799979,-4.5):point('U_PMIC',12)
  name='USB_VBUS_PMIC_FEED';net='USB_5V';width=existing?.5:.2
  selector={from:'.V_USB_VBUS_LEFT > port.bottom',to:existing?'.V_USB_PMIC_VBUS > port.bottom':'U_PMIC.pin12'}
  ownerPoint=point('U_PMIC',12)
}else if(phase==='sense-input'){
  from=viaPoint(2.3999571,51.8);to=point('R_USB_VBUS_SENSE',1)
  name='USB_VBUS_SENSE_INPUT';net='USB_5V';width=.2;selector={from:'.V_USB_VBUS_RIGHT > port.bottom',to:'R_USB_VBUS_SENSE.pin1'}
  ownerPoint=to
}else{
  const d={
    'sense-cap':{from:['R_USB_VBUS_SENSE',2],to:['C_USB_VBUS_SENSE',1],name:'USB_VBUS_SENSE_FILTER',net:'USB0_VBUS_SENSE',width:.15},
    'sense-clamp':{from:['D_USB_VBUS_SENSE',1],to:['C_USB_VBUS_SENSE',1],name:'USB_VBUS_SENSE_CLAMP',net:'USB0_VBUS_SENSE',width:.15},
    'pmic-cap':{from:['U_PMIC',12],to:['C_PMIC_USB',1],name:'USB_VBUS_PMIC_BYPASS',net:'USB_5V',width:.5}
  }[phase]
  from=point(...d.from);to=point(...d.to);name=d.name;net=d.net;width=d.width;signalLayer='top';ownerPoint=from
  selector={from:`${d.from[0]}.pin${d.from[1]}`,to:`${d.to[0]}.pin${d.to[1]}`}
  if(phase==='pmic-cap'){
    ownerPoint=from;from=viaPoint(-22.799979,-4.5);signalLayer='bottom'
    selector.from='.V_USB_PMIC_VBUS > port.bottom'
  }
}
const owner=type('source_trace').find(t=>t.connected_source_port_ids.includes(ownerPoint.sourcePortId));assert(owner)
// BusLanes' VectorScene checks fixed-trace owner IDs, rather than their
// electrical equivalence. Canonicalize only the source_trace_id alias on
// existing copper belonging to this exact source connectivity group.
// Coordinates, layers, widths, vias, original connection_name and PCB IDs
// remain unchanged; this permits a legal attachment to same-net copper.
const netId=type('source_net').find(n=>n.name===net)?.source_net_id;assert(netId)
const sameNet=type('source_trace').filter(t=>t.subcircuit_connectivity_map_key===owner.subcircuit_connectivity_map_key)
assert(sameNet.some(t=>t.connected_source_net_ids.includes(netId)))
assert(sameNet.every(t=>t.connected_source_net_ids.every(id=>id===netId)))
const aliases=[]
for(const t of input.traces){
  if(!sameNet.some(s=>s.source_trace_id===t.source_trace_id))continue
  aliases.push({pcb_trace_id:t.pcb_trace_id,originalSourceTraceId:t.source_trace_id,canonicalSourceTraceId:owner.source_trace_id})
  t.source_trace_id=owner.source_trace_id
}
for(const p of [from,to]){
  const obstacle=input.obstacles.find(o=>o.circuitJsonMetadata?.pcb_port_id===p.pcb_port_id)
  if(obstacle)assert(obstacle.connectedTo.includes(owner.source_trace_id))
}
input.connections=[{name:owner.source_trace_id,source_trace_id:owner.source_trace_id,width,nominalTraceWidth:width,pointsToConnect:[from,to]}]
input.buses=[{name,busId:name,connectionNames:[owner.source_trace_id],traceWidth:width,allowedLayers:[signalLayer]}]
input.differentialPairs=[];input.allowBlindAndBuriedVias=false
assert.equal(input.traces.length,type('pcb_trace').length)
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,type('pcb_smtpad').length)
for(const t of type('pcb_trace'))assert.deepEqual(input.traces.find(n=>n.pcb_trace_id===t.pcb_trace_id).route.map(({route_type,x,y,layer,width})=>({route_type,x,y,layer,width})),
  t.route.map(({route_type,x,y,layer,width})=>({route_type,x,y,layer,width})))
mkdirSync(directory,{recursive:true})
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),inputPath=`${directory}/input.simple-route.json`
writeFileSync(inputPath,JSON.stringify(input)+'\n')
const solver=new SOLVERS.BusLanesPipelineSolver(input),start=performance.now()
let steps=0,next=start+10000
while(!solver.failed&&!solver.solved&&performance.now()-start<Number(seconds)*1000){
  solver.step();steps++
  if(performance.now()>=next){console.log(JSON.stringify({steps,phase:solver.phase,elapsedSeconds:(performance.now()-start)/1000}));next=performance.now()+10000}
}
const report={status:solver.solved?'NATIVE_USB_CONTROL_ROUTED_PENDING_PHYSICAL_CHECKS':solver.failed?'NATIVE_USB_CONTROL_FAILED':'NATIVE_USB_CONTROL_TIMEOUT',
  source:{path:sourcePath,sha256:hash(sourcePath)},input:{path:inputPath,sha256:hash(inputPath)},
  definition:{name,net,width,...selector},phase,solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver',
  sourceTracesRetained:input.traces.length,actualPadsRetained:type('pcb_smtpad').length,
  sameNetFixedCopperOwnerAliases:aliases,physicalCopperGeometryRetained:true,
  coreVersion:read('node_modules/@tscircuit/core/package.json').version,
  capacityAutorouterVersion:read('node_modules/@tscircuit/capacity-autorouter/package.json').version,
  steps,elapsedSeconds:(performance.now()-start)/1000,error:solver.error??null,failureCode:solver.failureCode??null,
  chargingCurrentPolicyQualified:false,linuxInstallerTested:false,fabricationReady:false}
if(solver.solved){
  const output=solver.getOutput();assert.equal(output.traces.length,input.traces.length+1)
  for(let i=0;i<input.traces.length;i++)assert.deepEqual(output.traces[i],input.traces[i])
  const outputPath=`${directory}/output.simple-route.json`;writeFileSync(outputPath,JSON.stringify(output)+'\n')
  report.output={path:outputPath,sha256:hash(outputPath)}
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report));process.exitCode=solver.solved?0:1
