// Planning only: retain the entire input and test added ground bridges against
// actual native clearance checks. Fresh source and independent fills are required.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {createG350LocalGuard} from './lib/g350-ddr-local-guard.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [input,inventory,root]=process.argv.slice(2)
assert(input&&inventory&&root&&!fs.existsSync(root));fs.mkdirSync(root)
const read=p=>JSON.parse(fs.readFileSync(p)),hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const c=read(input).filter(e=>!e.type.includes('error')),original=structuredClone(c)
const ground=c.find(e=>e.type==='source_net'&&e.name==='GND').source_net_id
const groundSources=new Set(c.filter(e=>e.type==='source_trace'&&e.connected_source_net_ids.includes(ground)).map(e=>e.source_trace_id))
const groundPorts=new Set(c.filter(e=>e.type==='source_trace'&&groundSources.has(e.source_trace_id)).flatMap(e=>e.connected_source_port_ids))
const ports=new Map(c.filter(e=>e.type==='pcb_port').map(e=>[e.pcb_port_id,e]))
const logical=new Map(c.filter(e=>e.type==='source_port').map(e=>[e.source_port_id,e]))
const names=new Map(c.filter(e=>e.type==='source_component').map(e=>[e.source_component_id,e.name]))
const owners=new Map(c.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,e.source_trace_id]))
const normalized=()=>c.map(e=>e.type==='pcb_trace'&&groundSources.has(e.source_trace_id)?{...e,source_trace_id:ground}:e)
const complete=()=>({...Object.fromEntries(g350DdrPhysicalChecks.map(n=>[n,checks[n](c).length])),checkPcbTracesOutOfBoard:checks.checkPcbTracesOutOfBoard(c).length,manufacturing:checkG350ViaTrackManufacturingClearance(normalized()).length})
assert(Object.values(complete()).every(n=>!n))
const items=read(inventory).items
// Derive pad layers from editable circuit records, not PAD.GetLayer(), whose
// nominal value need not describe the copper layer set of an SMD pad.
const portFor=r=>[...ports.values()].find(p=>{const sp=logical.get(p.source_port_id);return sp&&names.get(sp.source_component_id)===r.reference&&String(sp.pin_number)===r.pin})
for(const r of items)if(r.kind==='pad'){const p=portFor(r);assert(p);r.layers=p.layers;r.layer=p.layers[0];r.pcb_port_id=p.pcb_port_id;r.x=p.x;r.y=p.y}
const repairs=[]
for(const start of items.filter(r=>r.kind==='pad'&&!r.mainGroundConnected)){
 const port=ports.get(start.pcb_port_id),st=c.find(e=>e.type==='source_trace'&&e.connected_source_port_ids.includes(port.source_port_id)&&e.connected_source_net_ids.includes(ground));assert(st)
 const width=st.min_trace_thickness??.1016
 const target={type:'pcb_trace',pcb_trace_id:'g350_ground_island_bridge_'+start.pcb_port_id,source_trace_id:st.source_trace_id,connection_name:ground,subcircuit_id:port.subcircuit_id,route:[]}
 const foreign=c.filter(e=>!(e.type==='pcb_trace'&&groundSources.has(e.source_trace_id))&&!(e.type==='pcb_via'&&groundSources.has(owners.get(e.pcb_trace_id)))&&!(e.type==='pcb_smtpad'&&groundPorts.has(ports.get(e.pcb_port_id)?.source_port_id)))
 const guard=createG350LocalGuard(foreign,target)
 const destinations=items.filter(r=>r.mainGroundConnected&&(r.kind==='via'||r.layers.includes(start.layer))).sort((a,b)=>Math.hypot(a.x-start.x,a.y-start.y)-Math.hypot(b.x-start.x,b.y-start.y)).slice(0,30)
 let accepted=null,probes=0,guardProbes=0
 outer:for(const end of destinations){
  const candidates=[[start,end],[start,{x:end.x,y:start.y},end],[start,{x:start.x,y:end.y},end]]
  for(let d=.2;d<=6.001;d+=.2)for(const sign of [-1,1]){
   const y=start.y+sign*d,x=start.x+sign*d
   candidates.push([start,{x:start.x,y},{x:end.x,y},end],[start,{x,y:start.y},{x,y:end.y},end])
  }
  for(const ps of candidates){
   target.route=ps.filter((p,i)=>!i||Math.hypot(p.x-ps[i-1].x,p.y-ps[i-1].y)>1e-8).map(p=>({route_type:'wire',x:p.x,y:p.y,layer:start.layer,width}))
   target.route[0].start_pcb_port_id=start.pcb_port_id
   if(end.pcb_port_id)target.route.at(-1).end_pcb_port_id=end.pcb_port_id
   guardProbes++;if(!guard(target.route))continue
   c.push(target);probes++;const counts=complete();c.pop()
   if(Object.values(counts).some(n=>n))continue
   accepted={start,end,route:structuredClone(target.route),counts,probes,guardProbes};c.push(structuredClone(target));break outer
  }
 }
 // A real ground stitching barrel may reconnect a stranded pour where planar
 // bridges have no room. It is not a timing via and does not change DDR copper.
 if(!accepted){
  const prefixes=[[{route_type:'wire',x:start.x,y:start.y,layer:start.layer,width,start_pcb_port_id:start.pcb_port_id}]]
  for(const old of c.filter(e=>e.type==='pcb_trace'&&groundSources.has(e.source_trace_id))){
   const r=old.route.filter((p,i)=>!i||Math.hypot(p.x-old.route[i-1].x,p.y-old.route[i-1].y)>1e-8||p.route_type!==old.route[i-1].route_type)
   if(r.length<2||r.some(p=>p.route_type!=='wire'||p.layer!==start.layer))continue
   if(Math.hypot(r.at(-1).x-start.x,r.at(-1).y-start.y)<1e-7)prefixes.push(structuredClone(r).reverse())
   else if(Math.hypot(r[0].x-start.x,r[0].y-start.y)<1e-7)prefixes.push(structuredClone(r))
  }
  const deadline=Date.now()+60000
  stitching:for(const prefix of prefixes.reverse()){
   const a=prefix.at(-1),sites=[]
   for(let ix=-12;ix<=12;ix++)for(let iy=-12;iy<=12;iy++)sites.push({x:a.x+ix*.1,y:a.y+iy*.1})
   sites.sort((a,b)=>Math.hypot(a.x-start.x,a.y-start.y)-Math.hypot(b.x-start.x,b.y-start.y))
   for(const p of sites){
    if(Date.now()>deadline)break stitching
    const to=start.layer==='top'?'bottom':'top'
    const route=[...prefix.map(({copper_pour_id,is_inside_copper_pour,...r})=>({...r,width})),{route_type:'wire',...p,layer:start.layer,width}]
    guardProbes++;if(!guard(route))continue
    route.push({route_type:'via',...p,from_layer:start.layer,to_layer:to,layers:['top','inner1','inner2','bottom'],via_diameter:.4572,via_hole_diameter:.254},{route_type:'wire',...p,layer:to,width})
    target.route=route
    const via={type:'pcb_via',pcb_via_id:target.pcb_trace_id+'_via',pcb_trace_id:target.pcb_trace_id,source_trace_id:st.source_trace_id,...p,hole_diameter:.254,outer_diameter:.4572,layers:['top','inner1','inner2','bottom'],from_layer:start.layer,to_layer:to,subcircuit_id:port.subcircuit_id}
    c.push(target,via);probes++
    const quick=['checkViaPadClearance','checkDifferentNetViaSpacing','checkViasInPads','checkViaTraceClearance'].every(n=>checks[n](c).length===0)
    const counts=quick?complete():null;c.splice(-2)
    if(!counts||Object.values(counts).some(n=>n))continue
    accepted={start,groundStitchingVia:via,route:structuredClone(target.route),counts,probes,guardProbes};c.push(structuredClone(target),via);break stitching
   }
  }
 }
 repairs.push(accepted??{start,accepted:false,probes,guardProbes})
 console.log(JSON.stringify(repairs.at(-1)))
}
assert.deepEqual(c.slice(0,original.length),original,'Only new copper may be added')
fs.writeFileSync(root+'/candidate.circuit.json',JSON.stringify(c,null,2)+'\n')
fs.copyFileSync('scripts/repair-g350-ground-islands.mjs',root+'/repair.executed.mjs')
fs.writeFileSync(root+'/report.json',JSON.stringify({input:{path:input,sha256:hash(input)},inventory:{path:inventory,sha256:hash(inventory)},repairs,counts:complete(),existingCopperExactlyPreserved:true,addedTraces:c.length-original.length,planningOnly:true,fabricationReady:false},null,2)+'\n')
