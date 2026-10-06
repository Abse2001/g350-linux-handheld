import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {fanoutTracePath} from '@tscircuit/props'

const [root]=process.argv.slice(2)
assert(root&&!existsSync(root),'Use a fresh output directory')
const base='dist/g350-ram90-four-layer-source-01'
const read=p=>JSON.parse(readFileSync(p,'utf8'))
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const circuit=read(`${base}/board.source-and-pcb.circuit.json`)
const input=read(`${base}/phase-1.input.simple-route.json`)
const logical=new Map(circuit.filter(r=>r.type==='source_port').map(r=>[r.source_port_id,r]))
const ports=new Map(circuit.filter(r=>r.type==='pcb_port').map(r=>[r.source_port_id,r]))
const components=new Map(circuit.filter(r=>r.type==='source_component').map(r=>[r.source_component_id,r.name]))
const signals=circuit.filter(r=>r.type==='source_trace'&&/^DDR_/.test(r.name))
assert.equal(signals.length,49)
const traces=[],paths=[],connections=[]
const wire=(x,y,layer)=>({route_type:'wire',x,y,layer,width:.1016})
for(const signal of signals){
 assert.equal(signal.connected_source_port_ids.length,2)
 const target=/^DDR_D(?:[0-7]|QM0|QS0|QSn0)$/.test(signal.name)?'inner1':/^DDR_D/.test(signal.name)?'inner2':'bottom'
 const endpoints=[]
 for(const id of signal.connected_source_port_ids){
  const port=ports.get(id),source=logical.get(id);assert(port&&source)
  assert(['U_SOC','U_RAM'].includes(components.get(source.source_component_id)))
  const x=Number((port.x+.4).toFixed(8)),y=Number((port.y+.4).toFixed(8))
  const route=[wire(port.x,port.y,'top'),wire(x,y,'top'),
   {route_type:'via',x,y,from_layer:'top',to_layer:target,layers:['top','inner1','inner2','bottom'],via_diameter:.4572,via_hole_diameter:.254},wire(x,y,target)]
  const trace={type:'pcb_trace',pcb_trace_id:`ram90_escape_${port.pcb_port_id}`,source_trace_id:signal.source_trace_id,connection_name:signal.source_trace_id,route}
  traces.push(trace)
  paths.push(fanoutTracePath.parse({connection:`${components.get(source.source_component_id)}.pin${source.pin_number}`,route}))
  circuit.push({...trace,subcircuit_id:signal.subcircuit_id,route:route.map((p,i)=>i?{...p}:{...p,start_pcb_port_id:port.pcb_port_id})},
   {type:'pcb_via',pcb_via_id:`ram90_via_${port.pcb_port_id}`,pcb_trace_id:trace.pcb_trace_id,x,y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:signal.subcircuit_id})
  endpoints.push({x,y,layer:target})
 }
 connections.push({name:signal.source_trace_id,source_trace_id:signal.source_trace_id,pointsToConnect:endpoints,nominalTraceWidth:.1016})
}
const physicalChecks=['checkEachPcbTraceNonOverlapping','checkViaPadClearance','checkViaTraceClearance','checkPcbTraceSelfShorts','checkCopperToBoardEdgeClearance','checkDifferentNetViaSpacing','checkHoleTraceClearance','checkPadTraceClearance','checkViasInPads','checkViasOffBoard']
const errors=physicalChecks.flatMap(name=>checks[name](circuit).map(e=>({check:name,...e})))
const viaObstacles=traces.map((t,i)=>{const v=t.route.find(p=>p.route_type==='via');return {type:'rect',shape:'circle',center:{x:v.x,y:v.y},width:.4572,height:.4572,layers:['top','inner1','inner2','bottom'],connectedTo:[t.connection_name],obstacleId:`ram90_via_${i}`}})
const byte0Names=new Set(input.connections.map(c=>c.name))
const prepared={...input,outline:undefined,bounds:{minX:-18,maxX:18,minY:-10,maxY:33},connections:connections.filter(c=>byte0Names.has(c.name)),traces,allowedLayers:['inner1'],buses:input.buses.map(b=>({...b,allowedLayers:['inner1']})),obstacles:[...input.obstacles,...viaObstacles]}
mkdirSync(root)
const objects={'candidate.circuit.json':circuit,'solver-input.json':prepared,'solver-options.json':{smoothTuning:false,denseSearch:true,maxSearchIterations:50000},'escape-paths.json':paths,'all-ddr-connections.json':connections,'physical-errors.json':errors}
for(const [name,data]of Object.entries(objects))writeFileSync(`${root}/${name}`,JSON.stringify(data,null,2)+'\n')
writeFileSync(`${root}/prepare.executed.mjs`,readFileSync('scripts/prepare-g350-ram90-four-layer.mjs'))
const report={physicalErrors:errors.length,physicalChecks,manualEscapes:traces.length,ddrSignals:49,source:artifact(`${base}/board.source-and-pcb.circuit.json`),files:[...Object.keys(objects),'prepare.executed.mjs'].map(p=>artifact(`${root}/${p}`)),qualifiedNewSignals:0,fabricationReady:false}
writeFileSync(`${root}/preparation.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({escapes:traces.length,errors:errors.length,firstErrors:errors.slice(0,6)}))
process.exitCode=errors.length?1:0
