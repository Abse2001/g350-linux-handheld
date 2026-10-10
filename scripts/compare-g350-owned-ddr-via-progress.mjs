// Bind source replay to an exact planned board with two scoped A0 barrel moves.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
const [input,baseline,planned,output]=process.argv.slice(2)
assert(input&&baseline&&planned&&output&&!fs.existsSync(output))
const read=p=>JSON.parse(fs.readFileSync(p)),c=read(input),b=read(baseline),p=read(planned)
const strip=v=>Array.isArray(v)?v.map(strip):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!['copper_pour_id','is_inside_copper_pour'].includes(k)).map(([k,x])=>[k,strip(x)])):v
const types=['source_trace','source_bus','source_port','source_net','source_component','pcb_board','pcb_port','pcb_smtpad','pcb_component','pcb_hole','pcb_plated_hole']
for(const type of types){assert.deepEqual(c.filter(e=>e.type===type),b.filter(e=>e.type===type),type);assert.deepEqual(p.filter(e=>e.type===type),b.filter(e=>e.type===type),type+' planning')}
const ids=new Set(b.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>e.source_trace_id));assert.equal(ids.size,49)
const foreign=j=>j.filter(e=>e.type==='pcb_trace'&&!ids.has(e.source_trace_id)).map(strip)
assert.deepEqual(foreign(c),foreign(b));assert.deepEqual(foreign(p),foreign(b))
const a0=b.find(e=>e.type==='source_trace'&&e.name==='DDR_A0').source_trace_id,a0t=b.find(e=>e.type==='pcb_trace'&&e.source_trace_id===a0)
const originalVias=b.filter(e=>e.type==='pcb_via'),plannedVias=p.filter(e=>e.type==='pcb_via'),actualVias=c.filter(e=>e.type==='pcb_via');assert.equal(originalVias.length,824)
assert.deepEqual(actualVias,plannedVias,'Fresh source must reproduce every exact planned hole record')
assert.equal(plannedVias.length,originalVias.length)
const omitXY=e=>Object.fromEntries(Object.entries(e).filter(([k])=>!['x','y'].includes(k))),moved=[]
for(let i=0;i<originalVias.length;i++){
 const old=originalVias[i],next=plannedVias[i];assert.deepEqual(omitXY(next),omitXY(old))
 if(old.x!==next.x||old.y!==next.y){assert.equal(old.pcb_trace_id,a0t.pcb_trace_id);assert(Math.hypot(next.x-old.x,next.y-old.y)<=1.5+1e-7);moved.push({pcbViaId:old.pcb_via_id,before:{x:old.x,y:old.y},after:{x:next.x,y:next.y}})}
}
assert(moved.length>0&&moved.length<=4)
const canonical=route=>{
 const points=route.map(q=>q.route_type==='wire'?{route_type:'wire',x:q.x,y:q.y,layer:q.layer,width:q.width??.1016}:q)
 return points.filter((q,i)=>i===0||q.route_type!=='wire'||points[i-1].route_type!=='wire'||JSON.stringify(q)!==JSON.stringify(points[i-1]))
}
const changed=[]
for(const id of ids){
 const get=j=>{const t=j.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===id);assert.equal(t.length,1);return strip(t[0].route)},r=get(c),old=get(b),expected=get(p)
 assert.deepEqual([r[0],r.at(-1)],[old[0],old.at(-1)])
 assert.deepEqual(canonical(r),canonical(expected),'Fresh source must reproduce the planned DDR copper, allowing only duplicate co-located wire points')
 assert.deepEqual(r.filter(e=>e.route_type==='via'),expected.filter(e=>e.route_type==='via'),'All source transitions must reproduce the checked plan')
 if(id!==a0)assert.deepEqual(r.filter(e=>e.route_type==='via'),old.filter(e=>e.route_type==='via'))
 else {const oldVia=old.filter(e=>e.route_type==='via'),newVia=r.filter(e=>e.route_type==='via');assert.equal(newVia.length,oldVia.length);assert.deepEqual(newVia[0],oldVia[0]);assert.deepEqual(newVia.at(-1),oldVia.at(-1))}
 if(JSON.stringify(r)!==JSON.stringify(old))changed.push(b.find(e=>e.type==='source_trace'&&e.source_trace_id===id).name)
}
const artifact=path=>({path,sha256:createHash('sha256').update(fs.readFileSync(path)).digest('hex')})
fs.writeFileSync(output,JSON.stringify({input:artifact(input),baseline:artifact(baseline),planned:artifact(planned),immutableTypesExactlyPreserved:types,peripheralCopperAndForeignHolesExactlyPreserved:true,allExactPlannedHoleRecordsReproduced:true,ddrEndpointPadsAndUnselectedBarrelsExactlyPreserved:true,movedOwnedA0Barrels:moved,changedDdrSignals:changed,parts:280,vias:824,passed:true},null,2)+'\n')
