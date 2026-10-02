import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {ddrGroups,differentialPairs} from '../lib/am3352/DdrConstraints'

// Prepare all signal escapes together, then replay only these short local
// routes through the documented pcbTracePaths interface. Each global phase
// still uses native bus_lanes. This does not import a completed PCB or modify
// the solver. All results remain unqualified until the entire board is checked.
const sourcePath=process.argv[2]??'dist/experiments/am3352-ddr-byte1-swizzled/circuit.json'
const srjPath=process.argv[3]??'dist/am3352-ddr-coordinated-bytes-attempt-15/phase-1.input.simple-route.json'
const mapPath='lib/am3352/memory-byte1-swizzled-connections.json'
const outputPath='lib/am3352/native-coordinated-dogbones.json'
const reportPath='checks/integrated/am3352-native-dogbone-bootstrap.json'
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const read=p=>JSON.parse(readFileSync(p))
const source=read(sourcePath),input=read(srjPath),map=read(mapPath)
const type=t=>source.filter(e=>e.type===t)
const sources=type('source_trace'),ports=type('pcb_port'),sourcePorts=type('source_port')
const components=type('source_component'),physicalComponents=type('pcb_component')
const layers=['top','inner1','inner2','inner3','inner4','inner5','inner6','bottom']
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-6
assert.equal(type('pcb_smtpad').length,420)
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,420)
assert.equal(input.layerCount,8)
assert.equal(input.minViaPadDiameter,.35)
assert.equal(input.minViaHoleDiameter,.15)
assert.equal(input.minTraceToHoleEdgeClearance,.2)
assert.equal(input.allowBlindAndBuriedVias,false)
assert.equal(sources.length,49)
assert.equal(map.length,49)
assert.equal(type('pcb_trace').length,0,'Bootstrap from exact pads, before channel copper')
const names=new Map(sources.map(s=>[s.name,s.source_trace_id]))
const componentByName=name=>components.find(c=>c.name===name)
const pcbComponent=name=>physicalComponents.find(c=>c.source_component_id===componentByName(name).source_component_id)
assert.deepEqual(pcbComponent('U_SOC').center,{x:0,y:0})
assert.deepEqual(pcbComponent('U_RAM').center,{x:0,y:-27})
input.traces=[]
input.connections=map.map(c=>{
  const s=sources.find(s=>s.name===c.name)
  assert(s,`Missing actual source ${c.name}`)
  assert.equal(s.connected_source_port_ids.length,2)
  const pointsToConnect=[['U_SOC',c.socPin,c.socBall],['U_RAM',c.ramPin,c.ramBall]].map(([chip,pin,ball])=>{
    const sp=sourcePorts.find(p=>p.source_component_id===componentByName(chip).source_component_id&&p.pin_number===Number(pin.slice(3)))
    assert.equal(sp.name,ball)
    assert(s.connected_source_port_ids.includes(sp.source_port_id))
    const p=ports.find(p=>p.source_port_id===sp.source_port_id)
    const o=input.obstacles.find(o=>o.circuitJsonMetadata?.pcb_port_id===p.pcb_port_id)
    assert(o&&near(o.center,p)&&o.connectedTo.includes(s.source_trace_id),'SRJ pad membership must match the actual source')
    assert.deepEqual(p.layers,['top'])
    return {x:p.x,y:p.y,layer:'top',pointId:p.pcb_port_id,pcb_port_id:p.pcb_port_id}
  })
  return {name:s.source_trace_id,source_trace_id:s.source_trace_id,nominalTraceWidth:.1016,width:.1016,pointsToConnect}
})
input.buses=[{busId:'DDR_RESET',name:'DDR_RESET',connectionNames:[names.get('DDR_RESETn')],traceWidth:.1016,allowedLayers:['inner4']},
  ...ddrGroups.map(g=>({busId:g.name,name:g.name,connectionNames:g.signals.map(n=>names.get(n)),maxLengthSkew:.635,traceWidth:.1016,allowedLayers:[g.layer]}))]
input.differentialPairs=differentialPairs.map(p=>({connectionNames:[names.get(p.positiveConnection),names.get(p.negativeConnection)],lengthTolerance:.127,traceGap:.12}))
const allMembers=input.buses.flatMap(b=>b.connectionNames)
assert.equal(new Set(allMembers).size,49)
assert(allMembers.every(n=>n))
mkdirSync('dist/am3352-native-coordinated-dogbones',{recursive:true})
const inputPath='dist/am3352-native-coordinated-dogbones/input.simple-route.json'
writeFileSync(inputPath,JSON.stringify(input,null,2)+'\n')
const solver=new SOLVERS.BusLanesPipelineSolver(input)
// Only local escape preparation: defer global channels to four CLI phases.
solver.prepare()
assert.equal(solver.escapes.length,98)
const paths={U_SOC:[],U_RAM:[]},vias=[]
for(const c of map) {
  const id=names.get(c.name),escapes=solver.escapes.filter(t=>t.source_trace_id===id)
  assert.equal(escapes.length,2)
  for(const [chip,pin] of [['U_SOC',c.socPin],['U_RAM',c.ramPin]]) {
    const center=pcbComponent(chip).center
    const sp=sourcePorts.find(p=>p.source_component_id===componentByName(chip).source_component_id&&p.pin_number===Number(pin.slice(3)))
    const port=ports.find(p=>p.source_port_id===sp.source_port_id)
    const escape=escapes.find(t=>near(t.route[0],port)&&t.route[0].layer==='top')
    assert(escape,`Native escape starts on ${chip}.${pin}`)
    const expectedLayer=c.name==='DDR_RESETn'?'inner4':ddrGroups.find(g=>g.signals.includes(c.name)).layer
    assert.equal(escape.route.at(-1).layer,expectedLayer)
    const route=escape.route.map(p=>({...p,x:p.x-center.x,y:p.y-center.y}))
    const localVias=escape.route.filter(p=>p.route_type==='via')
    assert.equal(localVias.length,1)
    for(const v of localVias) {
      assert.equal(v.via_diameter,.35)
      assert.equal(v.via_hole_diameter,.15)
      assert.deepEqual(v.layers,layers)
      assert(!vias.some(p=>near(p,v)),'Each signal escape has a distinct physical drill')
      vias.push(v)
    }
    paths[chip].push({connection:`.${chip} > port.${pin}`,route})
  }
}
writeFileSync(outputPath,JSON.stringify(paths,null,2)+'\n')
const report={status:'NATIVE_SIGNAL_DOGBONES_PREPARED_CHANNEL_UNROUTED',source:{path:sourcePath,sha256:hash(sourcePath)},srjTemplate:{path:srjPath,sha256:hash(srjPath)},
  map:{path:mapPath,sha256:hash(mapPath)},nativeInput:{path:inputPath,sha256:hash(inputPath)},output:{path:outputPath,sha256:hash(outputPath)},
  solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver.prepare',coreVersion:JSON.parse(readFileSync('node_modules/@tscircuit/core/package.json')).version,
  signalEscapes:98,physicalThroughVias:98,signalConnections:49,connectedChannels:0,fabricationReady:false,
  scope:'Native local signal escapes only. No global channel, supply/ground escapes, reference planes, SI qualification, or fabrication approval.'}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,escapes:98,physicalThroughVias:98}))
