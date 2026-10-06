import fs from 'node:fs'
import assert from 'node:assert/strict'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
import {normalizeG350DdrRoute} from './lib/g350-ddr-normalize-route.mjs'
const [run,root]=process.argv.slice(2);assert(run&&root&&!fs.existsSync(root));fs.mkdirSync(root)
fs.writeFileSync(`${root}/import.executed.mjs`,fs.readFileSync('scripts/import-g350-ram90-native-output.mjs'))
const read=p=>JSON.parse(fs.readFileSync(p)),result=read(`${run}/solver-result.json`);assert.equal(result.solved,true)
const circuit=read(`${run}/candidate.circuit.json`).filter(r=>!r.type.includes('error')),output=read(`${run}/output.json`)
const source=new Map(circuit.filter(r=>r.type==='source_trace').map(r=>[r.source_trace_id,r])),logical=new Map(circuit.filter(r=>r.type==='source_port').map(r=>[r.source_port_id,r])),ports=new Map(circuit.filter(r=>r.type==='pcb_port').map(r=>[r.source_port_id,r])),names=new Map(circuit.filter(r=>r.type==='source_component').map(r=>[r.source_component_id,r.name]))
const wanted=new Set(read(`${run}/solver-input.json`).connections.map(c=>c.name));let imported=0
for(const path of output.traces){
 const id=path.source_trace_id??path.connection_name;if(!wanted.has(id))continue
 const existing=circuit.filter(r=>r.type==='pcb_trace'&&r.source_trace_id===id)
 if(existing.some(t=>t.pcb_trace_id===path.pcb_trace_id))continue
 assert(existing.every(t=>t.pcb_trace_id.startsWith('local_dogbone_')),'Do not overwrite completed fixed copper')
 const s=source.get(id);assert(s);const cpuId=s.connected_source_port_ids.find(id=>names.get(logical.get(id).source_component_id)==='U_SOC'),ramId=s.connected_source_port_ids.find(id=>names.get(logical.get(id).source_component_id)==='U_RAM'),cpu=ports.get(cpuId),ram=ports.get(ramId);assert(cpu&&ram)
 let route=structuredClone(path.route)
 if(existing.length){
  assert.equal(existing.length,2)
  const head=existing.find(t=>Math.hypot(t.route[0].x-cpu.x,t.route[0].y-cpu.y)<1e-8),tail=existing.find(t=>Math.hypot(t.route[0].x-ram.x,t.route[0].y-ram.y)<1e-8);assert(head&&tail)
  const landing=head.route.at(-1)
  if(Math.hypot(route[0].x-landing.x,route[0].y-landing.y)>1e-8){assert(Math.hypot(route.at(-1).x-landing.x,route.at(-1).y-landing.y)<1e-8);route.reverse()}
  const reversed=structuredClone(tail.route.slice(0,-1)).reverse();for(const p of reversed.filter(p=>p.route_type==='via'))[p.from_layer,p.to_layer]=[p.to_layer,p.from_layer]
  const ids=new Set(existing.map(t=>t.pcb_trace_id));for(let i=circuit.length-1;i>=0;i--)if((circuit[i].type==='pcb_trace'||circuit[i].type==='pcb_via')&&ids.has(circuit[i].pcb_trace_id))circuit.splice(i,1)
  route=[...structuredClone(head.route.slice(0,-1)),...route,...reversed]
 }
 if(Math.hypot(route[0].x-cpu.x,route[0].y-cpu.y)>1e-8){assert(Math.hypot(route.at(-1).x-cpu.x,route.at(-1).y-cpu.y)<1e-8);route.reverse();for(const v of route.filter(p=>p.route_type==='via'))[v.from_layer,v.to_layer]=[v.to_layer,v.from_layer]}
 assert(Math.hypot(route[0].x-cpu.x,route[0].y-cpu.y)<1e-8&&Math.hypot(route.at(-1).x-ram.x,route.at(-1).y-ram.y)<1e-8)
 route[0]={...route[0],x:cpu.x,y:cpu.y,start_pcb_port_id:cpu.pcb_port_id};route[route.length-1]={...route.at(-1),x:ram.x,y:ram.y,end_pcb_port_id:ram.pcb_port_id};delete route.at(-1).start_pcb_port_id
 for(let i=0;i<route.length;i++)if(route[i].route_type==='via')for(const j of [i-1,i+1])if(route[j]?.route_type==='wire'&&Math.hypot(route[j].x-route[i].x,route[j].y-route[i].y)<1e-8){route[j].x=route[i].x;route[j].y=route[i].y}
 route=normalizeG350DdrRoute(route)
 const t={type:'pcb_trace',pcb_trace_id:`native_${s.name}`,source_trace_id:id,subcircuit_id:s.subcircuit_id,route};circuit.push(t)
 for(const [i,v]of route.filter(p=>p.route_type==='via').entries()){
  assert(Math.abs(v.via_diameter-.4572)<1e-8&&Math.abs(v.via_hole_diameter-.254)<1e-8)
  circuit.push({type:'pcb_via',pcb_via_id:`${t.pcb_trace_id}_${i}`,pcb_trace_id:t.pcb_trace_id,x:v.x,y:v.y,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:'top',to_layer:'bottom',subcircuit_id:t.subcircuit_id})
 }
 imported++
}
assert.equal(imported,wanted.size)
const physical=Object.fromEntries(g350DdrPhysicalChecks.map(n=>[n,checks[n](circuit)]));physical.manufacturingViaTrack=checkG350ViaTrackManufacturingClearance(circuit)
const skew=checks.checkPcbBusLengthSkew(circuit),errors=Object.values(physical).flat().length
fs.writeFileSync(`${root}/candidate.circuit.json`,JSON.stringify(circuit,null,2)+'\n');fs.writeFileSync(`${root}/physical-checks.json`,JSON.stringify(physical,null,2)+'\n');fs.writeFileSync(`${root}/native-skew-errors.json`,JSON.stringify(skew,null,2)+'\n')
const completeDdrSignals=[...source.values()].filter(s=>/^DDR_/.test(s.name)).filter(s=>{
 const endpointPorts=s.connected_source_port_ids.map(id=>ports.get(id))
 return circuit.some(t=>t.type==='pcb_trace'&&t.source_trace_id===s.source_trace_id&&endpointPorts.every(p=>[t.route[0],t.route.at(-1)].some(e=>e.route_type==='wire'&&e.layer==='top'&&Math.hypot(e.x-p.x,e.y-p.y)<1e-8)))
}).length
console.log(JSON.stringify({imported,pcbTraceRecords:circuit.filter(r=>r.type==='pcb_trace').length,completeDdrSignals,requiredDdrSignals:49,physicalErrors:errors,skewErrors:skew.map(e=>e.message),sourceReplayRequired:true,fabricationReady:false}));process.exitCode=errors?1:0
