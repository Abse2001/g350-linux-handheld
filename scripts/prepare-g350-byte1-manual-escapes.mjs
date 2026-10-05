import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {fanoutTracePath} from '@tscircuit/props'
import * as checks from '@tscircuit/checks'
import {withG350FixedCopperObstacles} from './lib/g350-fixed-copper-obstacles.mjs'

const [root]=process.argv.slice(2)
assert(root&&!existsSync(root),'Use a fresh diagnostic directory')
const read=p=>JSON.parse(readFileSync(p,'utf8'))
const artifact=p=>({path:p,sha256:createHash('sha256').update(readFileSync(p)).digest('hex')})
const basePath='dist/g350-current-index-byte0-handoff-fixed/compiled.circuit.json'
const rawPath='dist/g350-byte1-bootstrap-core2088/phase-3.input.simple-route.json'
const dataPath='lib/am3352/placement/ddr-byte0-complete-bus-paths.json'
const circuit=read(basePath),raw=read(rawPath),data=read(dataPath)
const length=r=>r.slice(1).reduce((n,p,i)=>n+(p.route_type==='wire'&&r[i].route_type==='wire'&&p.layer===r[i].layer?Math.hypot(p.x-r[i].x,p.y-r[i].y):0),0)
const d6=data.find(p=>p.connection==='U_SOC.pin50'),oldLength=length(d6.route)
const start=d6.route.findIndex(p=>p.x===3.21899&&Math.abs(p.y-5.19)<1e-8)
const end=d6.route.findIndex((p,i)=>i>start&&p.x===3.21899&&Math.abs(p.y-4.02)<1e-8)
assert(start>=0&&end>start)
// Move the diagonal's two bends and the tuning windows together. Trading
// length between the two vertical legs preserves the full planar length.
assert.equal(start,8)
for(let i=6;i<start;i++)d6.route[i].y+=1.8
for(let i=start;i<=end;i++)d6.route[i].y+=2.2
assert(Math.abs(length(d6.route)-oldLength)<1e-8)
const nativeD6=circuit.find(r=>r.type==='pcb_trace'&&r.source_trace_id==='source_trace_4')
assert(nativeD6)
const firstD6Port=nativeD6.route[0].start_pcb_port_id
const lastD6Point=d6.route.at(-1)
const lastD6Ports=circuit.filter(r=>r.type==='pcb_port'&&Math.hypot(r.x-lastD6Point.x,r.y-lastD6Point.y)<1e-8)
assert.equal(lastD6Ports.length,1)
nativeD6.route=structuredClone(d6.route)
nativeD6.route[0].start_pcb_port_id=firstD6Port
nativeD6.route.at(-1).end_pcb_port_id=lastD6Ports[0].pcb_port_id
raw.traces.find(t=>t.connection_name==='source_trace_4').route=structuredClone(d6.route)
const dqm0=data.find(p=>p.connection==='U_SOC.pin30'),oldMaskLength=length(dqm0.route)
const maskStart=dqm0.route.findIndex(p=>Math.abs(p.x-4.38101)<1e-8&&Math.abs(p.y-9.269414754699888)<1e-8)
assert(maskStart>=0)
for(let i=maskStart;i<=maskStart+1;i++)dqm0.route[i].y+=.6
assert(Math.abs(length(dqm0.route)-oldMaskLength)<1e-8)
const nativeMask=circuit.find(r=>r.type==='pcb_trace'&&r.source_trace_id==='source_trace_30')
nativeMask.route=structuredClone(dqm0.route)
raw.traces.find(t=>t.connection_name==='source_trace_30').route=structuredClone(dqm0.route)
raw.traces.find(t=>t.connection_name==='source_trace_42').route=structuredClone(circuit.find(r=>r.type==='pcb_trace'&&r.source_trace_id==='source_trace_42').route)
const names=new Map(circuit.filter(r=>r.type==='source_trace').map(r=>[r.source_trace_id,r.name]))
const sourceNames=new Map(circuit.filter(r=>r.type==='source_component').map(r=>[r.source_component_id,r.name]))
const cpu={
 DDR_D8:[[-.8,12.8]],DDR_D9:[[0,13.6]],DDR_D10:[[0,14.4]],
 DDR_D11:[[0,15.2]],DDR_D12:[[.8,15.2]],DDR_DQM1:[[-.8,14.4]],
 DDR_DQSn1:[[.8,13.6],[.8,9.1]],DDR_DQS1:[[1.2,9.6]],
 DDR_D13:[[1.6,14.4],[1.6,10.2],[1.7,10.1]],DDR_D14:[[1.6,15.2]],DDR_D15:[[2,10.7],[2.2,10.5]],
}
const ram={
 DDR_D8:[[2.8,4]],DDR_D9:[[1.2,5.6]],
 DDR_D10:[[-.42,4.4],[-.42,10.65]],DDR_D11:[[-2.8,6.4]],DDR_D12:[[1.2,3.2]],
 DDR_DQM1:[[-1.2,4]],DDR_DQSn1:[[1.2,4.8]],DDR_DQS1:[[1.2,4]],
 DDR_D13:[[-2,4]],DDR_D14:[[-2,6.4]],DDR_D15:[[2.8,4.8]],
}
const wire=(x,y,layer='top')=>({route_type:'wire',x,y,layer,width:.1016})
const escapes=[],paths=[]
for(const c of raw.connections)for(let i=0;i<2;i++){
 const port=c.pointsToConnect[i],logical=circuit.find(r=>r.type==='source_port'&&r.source_port_id===circuit.find(r=>r.type==='pcb_port'&&r.pcb_port_id===port.pcb_port_id).source_port_id)
 const pkg=sourceNames.get(logical.source_component_id),signal=names.get(c.name)
 assert.equal(pkg,i?'U_RAM':'U_SOC')
 const points=(i?ram:cpu)[signal],last=points.at(-1)
 const route=[wire(port.x,port.y),...points.map(([x,y])=>wire(x,y)),
  {route_type:'via',x:last[0],y:last[1],from_layer:'top',to_layer:'bottom',via_diameter:.4572,via_hole_diameter:.254},
  wire(last[0],last[1],'bottom')]
 const trace={type:'pcb_trace',pcb_trace_id:`manual_byte1_${port.pcb_port_id}`,source_trace_id:c.source_trace_id,
  connection_name:c.name,connectsTo:[c.source_trace_id,port.pcb_port_id],route}
 escapes.push(trace)
 paths.push(fanoutTracePath.parse({connection:`${pkg}.pin${logical.pin_number}`,route}))
 circuit.push({...trace,subcircuit_id:'subcircuit_source_group_0',route:route.map((p,j)=>j?{...p}:{...p,start_pcb_port_id:port.pcb_port_id})})
 circuit.push({type:'pcb_via',pcb_via_id:`manual_byte1_via_${port.pcb_port_id}`,pcb_trace_id:trace.pcb_trace_id,
  x:last[0],y:last[1],hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],
  from_layer:'top',to_layer:'bottom',subcircuit_id:'subcircuit_source_group_0'})
 c.pointsToConnect[i]={x:last[0],y:last[1],layer:'bottom',pointId:`manual_byte1_exit_${port.pcb_port_id}`}
}
assert.equal(escapes.length,22)
raw.traces.push(...escapes)
raw.bounds={minX:-17.5,maxX:17.5,minY:-9.5,maxY:32.5}
raw.allowedLayers=['bottom']
raw.buses=raw.buses.map(b=>({...b,allowedLayers:['bottom']}))
const prepared=withG350FixedCopperObstacles(raw,{reserveWireCapsules:false,expectedThroughVias:141})
const physicalChecks=['checkEachPcbTraceNonOverlapping','checkViaPadClearance','checkViaTraceClearance',
 'checkPcbTraceSelfShorts','checkCopperToBoardEdgeClearance','checkDifferentNetViaSpacing',
 'checkHoleTraceClearance','checkPadTraceClearance','checkViasInPads','checkViasOffBoard']
const errors=physicalChecks.flatMap(name=>checks[name](circuit).map(e=>({check:name,...e})))
mkdirSync(root,{recursive:true})
for(const [name,obj]of Object.entries({'byte0-data-paths.json':data,'byte1-escape-paths.json':paths,'byte1-escapes.traces.json':escapes,
 'solver-input.json':prepared.input,'solver-options.json':{smoothTuning:false,denseSearch:true,maxSearchIterations:50000},
 'candidate.circuit.json':circuit,'physical-errors.json':errors}))writeFileSync(`${root}/${name}`,JSON.stringify(obj,null,2)+'\n')
writeFileSync(`${root}/prepare.executed.mjs`,readFileSync('scripts/prepare-g350-byte1-manual-escapes.mjs'))
const report={status:errors.length?'MANUAL_ESCAPE_CANDIDATE_PHYSICAL_ERRORS':'MANUAL_ESCAPE_CANDIDATE_NATIVE_GEOMETRY_CHECKED_REPLAY_REQUIRED',
 nativeBusLanesNext:true,manualEscapes:22,fullThroughVias:141,fixedTraces:134,
 d6MeanderShiftYmm:2.2,d6ApproachShiftYmm:1.8,dqm0ApproachShiftYmm:.6,
 d6AndDqm0PlanarLengthsUnchanged:true,physicalErrors:errors.length,
 allPlacedComponentObstaclesRetained:true,signalLayers:['top','bottom'],nativeCarrierLayers:['bottom'],
 base:artifact(basePath),rawSource:artifact(rawPath),originalByte0:artifact(dataPath),
 files:['byte0-data-paths.json','byte1-escape-paths.json','byte1-escapes.traces.json','solver-input.json','solver-options.json','candidate.circuit.json','physical-errors.json','prepare.executed.mjs'].map(p=>artifact(`${root}/${p}`)),
 physicalChecks,completeByte1Connected:false,qualifiedNewSignals:0,fabricationReady:false}
writeFileSync(`${root}/preparation.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,physicalErrors:errors.length,errors:errors.map(e=>({check:e.check,message:e.message})).slice(0,12)}))
process.exitCode=errors.length?1:0
