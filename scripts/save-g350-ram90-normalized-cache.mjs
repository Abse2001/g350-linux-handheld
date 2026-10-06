import fs from 'node:fs'
import assert from 'node:assert/strict'
import {fanoutTracePath} from '@tscircuit/props'
const [circuitPath,outputPath,referencePath]=process.argv.slice(2)
assert(circuitPath&&outputPath&&referencePath&&!fs.existsSync(outputPath))
const read=p=>JSON.parse(fs.readFileSync(p))
const c=read(circuitPath),reference=read(referencePath)
const source=new Map(c.filter(r=>r.type==='source_trace').map(r=>[r.source_trace_id,r]))
const ports=new Map(c.filter(r=>r.type==='source_port').map(r=>[r.source_port_id,r]))
const names=new Map(c.filter(r=>r.type==='source_component').map(r=>[r.source_component_id,r.name]))
const refNames=new Map(reference.filter(r=>r.type==='source_component').map(r=>[r.source_component_id,r.name]))
const refLogical=new Map(reference.filter(r=>r.type==='source_port').map(r=>[r.source_port_id,r]))
const refPorts=new Map(reference.filter(r=>r.type==='pcb_port').map(p=>{const logical=refLogical.get(p.source_port_id);return [`${refNames.get(logical.source_component_id)}.pin${logical.pin_number}`,p]}))
const selector=p=>`${names.get(p.source_component_id)}.pin${p.pin_number}`
let snapped=0
const paths=c.filter(r=>r.type==='pcb_trace').map(t=>{
 const logical=source.get(t.source_trace_id).connected_source_port_ids.map(id=>ports.get(id))
 const cpu=logical.find(p=>names.get(p.source_component_id)==='U_SOC'),ram=logical.find(p=>names.get(p.source_component_id)==='U_RAM');assert(cpu&&ram)
 const route=structuredClone(t.route)
 for(const [point,pin]of [[route[0],cpu],[route.at(-1),ram]]){const expected=refPorts.get(selector(pin));assert(expected&&Math.hypot(point.x-expected.x,point.y-expected.y)<1e-8);point.x=expected.x;point.y=expected.y}
 for(let i=0;i<route.length;i++)if(route[i].route_type==='via')for(const j of [i-1,i+1]){const p=route[j],v=route[i];if(p?.route_type==='wire'&&Math.hypot(p.x-v.x,p.y-v.y)<1e-8){if(p.x!==v.x||p.y!==v.y)snapped++;p.x=v.x;p.y=v.y}}
 return fanoutTracePath.parse({connection:selector(cpu),route})
})
assert.equal(paths.length,49)
fs.writeFileSync(outputPath,JSON.stringify(paths,null,2)+'\n')
console.log(JSON.stringify({paths:paths.length,snappedViaLandings:snapped,maxPermittedAdjustmentMm:1e-8}))
