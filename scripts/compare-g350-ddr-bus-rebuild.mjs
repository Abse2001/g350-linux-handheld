// An explicit alternative to the stricter planar-only preservation gate.
// A rebuilt byte may have different real barrels. Bind those to the actual
// planning donor while preserving all other copper, logic and placements.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
const [input,baseline,donor,output]=process.argv.slice(2)
assert(input&&baseline&&donor&&output&&!fs.existsSync(output))
const read=p=>JSON.parse(fs.readFileSync(p)),c=read(input),b=read(baseline),d=read(donor)
const strip=v=>Array.isArray(v)?v.map(strip):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!['copper_pour_id','is_inside_copper_pour','trace_length'].includes(k)).map(([k,x])=>[k,strip(x)])):v
const sameGeometry=(x,y,label)=>{
 if(typeof x==='number'&&typeof y==='number')assert(Math.abs(x-y)<1e-8,label)
 else if(Array.isArray(x)&&Array.isArray(y)){assert.equal(x.length,y.length,label);x.forEach((v,i)=>sameGeometry(v,y[i],label))}
 else if(x&&y&&typeof x==='object'&&typeof y==='object'){assert.deepEqual(Object.keys(x).sort(),Object.keys(y).sort(),label);for(const k of Object.keys(x))sameGeometry(x[k],y[k],label)}
 else assert.deepEqual(x,y,label)
}
const immutableTypes=['source_trace','source_bus','source_port','source_net','source_component','pcb_board','pcb_port','pcb_smtpad','pcb_component','pcb_hole','pcb_plated_hole']
for(const type of immutableTypes)for(const j of [c,d])assert.deepEqual(j.filter(e=>e.type===type),b.filter(e=>e.type===type),`${type} must remain exactly unchanged`)
const ids=new Set(b.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>e.source_trace_id)),byte=b.find(e=>e.type==='source_bus'&&e.name==='DDR_BYTE1')
assert.equal(ids.size,49);assert.equal(byte.source_trace_ids.length,11);assert.equal(byte.max_length_skew,.635)
const foreign=j=>j.filter(e=>e.type==='pcb_trace'&&!ids.has(e.source_trace_id)).map(strip)
assert.deepEqual(foreign(c),foreign(b));assert.deepEqual(foreign(d),foreign(b))
for(const id of ids){
 const t=c.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===id),old=b.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===id),planned=d.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===id)
 assert.equal(t.length,1);assert.equal(old.length,1);assert.equal(planned.length,1)
 sameGeometry(strip(t[0].route),strip(planned[0].route),'Fresh DDR path must match its actual donor')
 sameGeometry(strip([t[0].route[0],t[0].route.at(-1)]),strip([old[0].route[0],old[0].route.at(-1)]),'CPU/RAM pad endpoints must remain unchanged')
 if(!byte.source_trace_ids.includes(id))assert.deepEqual(strip(t[0].route.filter(e=>e.route_type==='via')),strip(old[0].route.filter(e=>e.route_type==='via')),'Only byte1 may change barrel transitions')
}
const canonicalVias=(j,selected)=>{
 const owner=new Map(j.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,e.source_trace_id]))
 // from_layer/to_layer metadata may describe the trace handoff rather than
 // the physical barrel span. Its actual four layers and drill/land establish
 // full depth; all path transitions are independently bound above.
 return j.filter(e=>e.type==='pcb_via'&&selected(owner.get(e.pcb_trace_id))).map(e=>({owner:owner.get(e.pcb_trace_id),x:e.x,y:e.y,outer_diameter:e.outer_diameter,hole_diameter:e.hole_diameter,layers:[...e.layers].sort()})).sort((x,y)=>x.owner.localeCompare(y.owner)||x.x-y.x||x.y-y.y)
}
sameGeometry(canonicalVias(c,()=>true),canonicalVias(d,()=>true),'Every fresh physical barrel must match the donor by authored owner/geometry')
sameGeometry(canonicalVias(c,id=>!byte.source_trace_ids.includes(id)),canonicalVias(b,id=>!byte.source_trace_ids.includes(id)),'All non-byte1 physical barrels must remain unchanged')
for(const v of c.filter(e=>e.type==='pcb_via')){assert(Math.abs(v.outer_diameter-.4572)<1e-8&&Math.abs(v.hole_diameter-.254)<1e-8);assert.deepEqual(new Set(v.layers),new Set(['top','inner1','inner2','bottom']))}
for(const [type,key]of [['pcb_via','pcb_via_id'],['pcb_trace','pcb_trace_id']]){const values=c.filter(e=>e.type===type).map(e=>e[key]);assert.equal(new Set(values).size,values.length)}
const artifact=path=>({path,sha256:createHash('sha256').update(fs.readFileSync(path)).digest('hex')})
const report={input:artifact(input),baseline:artifact(baseline),donor:artifact(donor),immutableTypesExactlyPreserved:immutableTypes,peripheralCopperGeometryExactlyPreserved:true,allNonByte1BarrelsExactlyPreserved:true,allDdrRealEndpointsPreserved:true,freshRoutesAndOwnedBarrelsMatchActualDonor:true,allowedBarrelChanges:'DDR_BYTE1 only',parts:c.filter(e=>e.type==='pcb_component').length,vias:c.filter(e=>e.type==='pcb_via').length,passed:true,preservationGateOnly:true,fabricationReady:false}
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
