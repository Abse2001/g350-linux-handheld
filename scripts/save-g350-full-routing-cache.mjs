// Save actual routed copper for a fresh source replay. Saving never qualifies it.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {fanoutTracePath} from '@tscircuit/props'
const [input,srjPath,root]=process.argv.slice(2)
assert(input&&srjPath&&root&&!fs.existsSync(root));fs.mkdirSync(root)
const c=JSON.parse(fs.readFileSync(input)),srj=JSON.parse(fs.readFileSync(srjPath))
const source=new Map(c.filter(e=>e.type==='source_trace').map(e=>[e.source_trace_id,e]))
const ports=new Map(c.filter(e=>e.type==='pcb_port').map(e=>[e.source_port_id,e]))
const logical=new Map(c.filter(e=>e.type==='source_port').map(e=>[e.source_port_id,e]))
const components=new Map(c.filter(e=>e.type==='source_component').map(e=>[e.source_component_id,e.name]))
const ddr=new Set([...source].filter(([,s])=>s.name?.startsWith('DDR_')).map(([id])=>id))
assert.equal(ddr.size,49)
const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);if(parent.get(x)!==x)parent.set(x,find(parent.get(x)));return parent.get(x)}
for(const [id,s]of source)for(const member of [...s.connected_source_port_ids,...s.connected_source_net_ids])parent.set(find(id),find(member))
const connections=new Map(srj.connections.map(conn=>[conn.name,conn]))
for(const conn of srj.connections)for(const p of conn.pointsToConnect){
 const port=[...ports.values()].find(e=>e.pcb_port_id===p.pcb_port_id);assert(port)
 assert(Math.hypot(port.x-p.x,port.y-p.y)<1e-7)
 parent.set(find(conn.name),find(port.source_port_id))
}
const paths=[]
for(const id of ddr){
 const traces=c.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===id);assert.equal(traces.length,1,'Canonicalize each DDR path first')
 const s=source.get(id),cpu=s.connected_source_port_ids.find(p=>components.get(logical.get(p).source_component_id)==='U_SOC');assert(cpu)
 const route=structuredClone(traces[0].route),p=ports.get(cpu)
 assert(Math.hypot(route[0].x-p.x,route[0].y-p.y)<1e-6,'DDR route must start at CPU numeric pad')
 paths.push(fanoutTracePath.parse({connection:`U_SOC.pin${logical.get(cpu).pin_number}`,route}))
}
const traces=c.filter(e=>e.type==='pcb_trace'&&!ddr.has(e.source_trace_id)).map(t=>{
 const candidates=srj.connections.filter(conn=>find(conn.name)===find(t.source_trace_id))
 const named=connections.get(t.connection_name)
 const owner=named&&find(named.name)===find(t.source_trace_id)?named:candidates.find(conn=>conn.name.startsWith('source_net_'))??candidates.find(conn=>conn.name===t.source_trace_id)??candidates[0]
 assert(owner,'No authored connection owns '+t.pcb_trace_id)
 return {...structuredClone(t),connection_name:owner.name}
})
const cache={ports:[...ports.values()].map(p=>({id:p.pcb_port_id,x:p.x,y:p.y})),connections:srj.connections,traces}
fs.writeFileSync(root+'/ddr-paths.json',JSON.stringify(paths,null,2)+'\n')
fs.writeFileSync(root+'/rest-routing.json',JSON.stringify(cache,null,2)+'\n')
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
fs.writeFileSync(root+'/preparation.json',JSON.stringify({sourceSha256:hash(input),solverInputSha256:hash(srjPath),ddrPaths:paths.length,restTraceRecords:traces.length,requiresFreshEditableSourceAndIndependentChecks:true,fabricationReady:false},null,2)+'\n')
