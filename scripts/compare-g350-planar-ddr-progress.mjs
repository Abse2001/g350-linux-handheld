// Bind a planar-only timing candidate to the already checked whole board.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
const [input,baseline,output]=process.argv.slice(2)
assert(input&&baseline&&output&&!fs.existsSync(output))
const read=p=>JSON.parse(fs.readFileSync(p)),c=read(input),b=read(baseline)
const strip=v=>Array.isArray(v)?v.map(strip):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!['copper_pour_id','is_inside_copper_pour'].includes(k)).map(([k,x])=>[k,strip(x)])):v
const immutableTypes=['source_trace','source_bus','source_port','source_net','source_component','pcb_board','pcb_port','pcb_smtpad','pcb_component','pcb_via','pcb_hole','pcb_plated_hole']
for(const type of immutableTypes)assert.deepEqual(c.filter(e=>e.type===type),b.filter(e=>e.type===type),`${type} must remain exactly unchanged`)
const ids=new Set(b.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>e.source_trace_id))
assert.equal(ids.size,49)
const foreign=j=>j.filter(e=>e.type==='pcb_trace'&&!ids.has(e.source_trace_id)).map(strip)
assert.deepEqual(foreign(c),foreign(b),'All peripheral copper geometry must remain exactly unchanged')
const changed=[]
for(const id of ids){
 const traces=c.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===id),previous=b.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===id)
 assert.equal(traces.length,1);assert.equal(previous.length,1)
 const r=strip(traces[0].route),p=strip(previous[0].route)
 assert.deepEqual(r.filter(x=>x.route_type==='via'),p.filter(x=>x.route_type==='via'),'All original DDR transitions must remain unchanged')
 assert.deepEqual([r[0],r.at(-1)],[p[0],p.at(-1)],'DDR terminal pad endpoints must remain unchanged')
 if(JSON.stringify(r)!==JSON.stringify(p))changed.push(b.find(e=>e.type==='source_trace'&&e.source_trace_id===id).name)
}
const artifact=path=>({path,sha256:createHash('sha256').update(fs.readFileSync(path)).digest('hex')})
const report={input:artifact(input),baseline:artifact(baseline),immutableTypesExactlyPreserved:immutableTypes,peripheralCopperGeometryExactlyPreserved:true,ddrEndpointsAndTransitionsExactlyPreserved:true,changedDdrSignals:changed,parts:c.filter(e=>e.type==='pcb_component').length,vias:c.filter(e=>e.type==='pcb_via').length,passed:true}
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
