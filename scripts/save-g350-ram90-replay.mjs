import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import {fanoutTracePath} from '@tscircuit/props'
const [base,root,outputPath='lib/am3352/placement/g350-ram90-four-layer-manual-paths.json']=process.argv.slice(2),read=p=>JSON.parse(readFileSync(p))
assert(base&&root)
const circuit=read(`${base}/candidate.circuit.json`),carriers=read(`${root}/carriers.json`),escapes=read(`${base}/escape-paths.json`)
const ports=new Map(circuit.filter(r=>r.type==='source_port').map(r=>[r.source_port_id,r]))
const components=new Map(circuit.filter(r=>r.type==='source_component').map(r=>[r.source_component_id,r.name]))
const paths=[]
for(const signal of circuit.filter(r=>r.type==='source_trace'&&/^DDR_/.test(r.name))){
 const selectors=signal.connected_source_port_ids.map(id=>{const p=ports.get(id);return `${components.get(p.source_component_id)}.pin${p.pin_number}`})
 const cpu=escapes.find(p=>p.connection===selectors.find(s=>s.startsWith('U_SOC.'))),ram=escapes.find(p=>p.connection===selectors.find(s=>s.startsWith('U_RAM.')))
 assert(cpu&&ram)
 const carrier=carriers.find(t=>t.source_trace_id===signal.source_trace_id)
 if(!carrier){paths.push(cpu,ram);continue}
 let route=structuredClone(carrier.route)
 const lastCpu=cpu.route.at(-1)
 if(Math.hypot(route[0].x-lastCpu.x,route[0].y-lastCpu.y)>1e-8)route=route.reverse().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:p)
 assert(Math.hypot(route[0].x-lastCpu.x,route[0].y-lastCpu.y)<1e-8)
 assert(Math.hypot(route.at(-1).x-ram.route.at(-1).x,route.at(-1).y-ram.route.at(-1).y)<1e-8)
 const prefix=structuredClone(cpu.route.slice(0,-1));prefix.at(-1).to_layer=route[0].layer
 const suffix=structuredClone(ram.route.slice(0,-1)).reverse().map(p=>p.route_type==='via'?{...p,from_layer:route.at(-1).layer,to_layer:'top'}:p)
 paths.push(fanoutTracePath.parse({connection:cpu.connection,route:[...prefix,...route,...suffix]}))
}
writeFileSync(outputPath,JSON.stringify(paths,null,2)+'\n')
console.log(JSON.stringify({completePaths:carriers.length,partialSignals:49-carriers.length,sourceReplayRequired:true}))
