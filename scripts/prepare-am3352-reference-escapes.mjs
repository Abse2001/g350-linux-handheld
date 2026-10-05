import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {cpuPowerConnections,ramPowerConnections} from '../lib/am3352/PowerNetworks'

// Use the documented native DDR bootstrap's local preparation to assign
// supply/ground escapes together with the actual signal escapes. Virtual
// plane terminals are only solver input: emitted copper ends at real vias.
// No virtual endpoint is added to the electrical source or manufactured PCB.
const sourcePath=process.argv[2]??'dist/experiments/am3352-powered-host/circuit.json'
const inputPath=process.argv[3]??'dist/am3352-four-layer-outer-reserved-attempt-27/input.simple-route.json'
const directory=process.argv[4]??'dist/am3352-four-layer-reference-escapes-attempt-31'
const packageScope=process.argv[5]??'both'
assert(['both','U_SOC','U_RAM'].includes(packageScope))
const source=JSON.parse(readFileSync(sourcePath)),input=JSON.parse(readFileSync(inputPath))
const type=t=>source.filter(e=>e.type===t),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
assert.equal(input.layerCount,4);assert.equal(input.connections.length,49);assert.equal(input.traces.length,2)
assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254)
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,type('pcb_smtpad').length)
mkdirSync(directory,{recursive:true})
const report={status:'REFERENCE_ESCAPES_PREPARING',source:{path:sourcePath,sha256:hash(sourcePath)},
  input:{path:inputPath,sha256:hash(inputPath)},copperLayerCount:4,
  solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver.prepare',fabricationReady:false,
  actualPadObstacles:type('pcb_smtpad').length,packageScope,signalEscapes:0,referenceEscapes:0,
  scope:'Local DDR supply and ground escape preparation only. Channels, all other power rails and complete handheld remain required.'}
const finish=()=>writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
try{
  const signalSolver=new SOLVERS.BusLanesPipelineSolver(input);signalSolver.prepare()
  assert.equal(signalSolver.escapes.length,44)
  report.signalEscapes=44
  writeFileSync(`${directory}/signal-escapes.native.json`,JSON.stringify(signalSolver.escapes)+'\n')
  const selected=[]
  for(const [name,connections] of [['U_SOC',cpuPowerConnections],['U_RAM',ramPowerConnections]]){
    if(packageScope!=='both'&&name!==packageScope)continue
    const component=type('source_component').find(c=>c.name===name);assert(component)
    for(const c of connections.filter(c=>['GND','DDR_1V5'].includes(c.net))){
      const sp=type('source_port').find(p=>p.source_component_id===component.source_component_id&&p.pin_number===Number(c.pin.slice(3)))
      assert.equal(sp.name,c.ball)
      const p=type('pcb_port').find(p=>p.source_port_id===sp.source_port_id)
      const s=type('source_trace').find(t=>t.name===`${name}_${c.function}_${c.ball}`);assert(s)
      assert(s.connected_source_port_ids.includes(sp.source_port_id))
      const layer=c.net==='GND'?'inner1':'inner2'
      selected.push({name:s.source_trace_id,source_trace_id:s.source_trace_id,width:.1016,nominalTraceWidth:.1016,
        pointsToConnect:[{x:p.x,y:p.y,layer:'top',pcb_port_id:p.pcb_port_id,pointId:p.pcb_port_id},
          {x:p.x,y:p.y-2,layer,pointId:`plane-target-${p.pcb_port_id}`}],
        localEscapeMetadata:{component:name,ball:c.ball,pin:c.pin,net:c.net,layer}})
    }
  }
  const power={...input,traces:[...input.traces,...signalSolver.escapes],connections:selected,
    buses:['GND','DDR_1V5'].map(net=>({name:`REFERENCE_${net}`,busId:`REFERENCE_${net}`,
      connectionNames:selected.filter(c=>c.localEscapeMetadata.net===net).map(c=>c.name),
      allowedLayers:[net==='GND'?'inner1':'inner2'],traceWidth:.1016})),differentialPairs:[]}
  writeFileSync(`${directory}/reference.input.simple-route.json`,JSON.stringify(power)+'\n')
  const solver=new SOLVERS.BusLanesPipelineSolver(power);solver.prepare()
  assert.equal(solver.escapes.length,selected.length)
  const output=solver.escapes.map(t=>({...t,localEscapeMetadata:selected.find(c=>c.source_trace_id===t.source_trace_id).localEscapeMetadata}))
  for(const t of output){
    const vias=t.route.filter(p=>p.route_type==='via');assert.equal(vias.length,1)
    assert.equal(vias[0].via_diameter,.4572);assert.equal(vias[0].via_hole_diameter,.254)
    assert.deepEqual(vias[0].layers,['top','inner1','inner2','bottom'])
    assert.equal(t.route.at(-1).layer,t.localEscapeMetadata.layer)
  }
  writeFileSync(`${directory}/reference-escapes.native.json`,JSON.stringify(output,null,2)+'\n')
  report.referenceEscapes=output.length;report.status='NATIVE_REFERENCE_ESCAPES_PREPARED_PENDING_PHYSICAL_CHECKS'
}catch(e){report.status='NATIVE_REFERENCE_ESCAPES_FAILED';report.error=e.message;process.exitCode=1}
finish();console.log(JSON.stringify(report))
