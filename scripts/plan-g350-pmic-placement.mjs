import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const input='dist/experiments/am3352-g350-ddr-corridor/circuit.json'
const d=JSON.parse(readFileSync(input)),ids=new Map(d.map(e=>[e[`${e.type}_id`],e]))
const sources=new Map(d.filter(e=>e.type==='source_component').map(e=>[e.source_component_id,e.name]))
const comps=new Map(d.filter(e=>e.type==='pcb_component').map(e=>[sources.get(e.source_component_id),e]))
const moves={
 L_DDR:{x:-17,y:17.4,rotation:0,layer:'top'},
 L_MPU:{x:-17,y:22.2,rotation:0,layer:'top'},
 L_CORE:{x:-24.2,y:27.4,rotation:90,layer:'top'},
 C_PMIC_SYS:{x:-22.4,y:18,rotation:0,layer:'bottom'},
 C_PMIC_DCDC1_IN:{x:-23.1,y:21,rotation:0,layer:'bottom'},
 C_PMIC_DCDC2_IN:{x:-23.1,y:24,rotation:0,layer:'bottom'},
 C_PMIC_DCDC3_IN:{x:-28.9,y:24,rotation:0,layer:'bottom'},
 C_PMIC_DDR_OUT:{x:-20.9,y:13,rotation:270,layer:'top'},
 C_PMIC_MPU_OUT:{x:-17,y:27.4,rotation:90,layer:'top'},
 C_PMIC_CORE_OUT:{x:-29.4,y:27.4,rotation:180,layer:'top'},
 C_PMIC_ANALOG_OUT:{x:-31.8,y:23.8,rotation:180,layer:'top'},
 C_PMIC_IO_OUT:{x:-34.5,y:20.6,rotation:180,layer:'top'},
 C_PMIC_BYPASS:{x:-30.7,y:16.8,rotation:90,layer:'bottom'},
 C_PMIC_VINLDO:{x:-26.3,y:16.2,rotation:90,layer:'bottom'},
 C_PMIC_USB:{x:-20,y:14.7,rotation:180,layer:'bottom'},
 C_PMIC_LDO1:{x:-29.4,y:18,rotation:180,layer:'top'},
 C_PMIC_LDO2:{x:-29.4,y:15.8,rotation:180,layer:'top'},
 C_PMIC_INT_LDO:{x:-29.4,y:20,rotation:180,layer:'top'},
}
assert.equal(Object.keys(moves).length,18)
const point=(p,name)=>{
 const o=comps.get(name),n=moves[name]??{x:o.center.x,y:o.center.y,rotation:o.rotation,layer:o.layer}
 const r0=-o.rotation*Math.PI/180,r1=n.rotation*Math.PI/180
 const dx=p.x-o.center.x,dy=p.y-o.center.y
 let x=dx*Math.cos(r0)-dy*Math.sin(r0),y=dx*Math.sin(r0)+dy*Math.cos(r0)
 if(o.layer!==n.layer)x=-x
 return {x:n.x+x*Math.cos(r1)-y*Math.sin(r1),y:n.y+x*Math.sin(r1)+y*Math.cos(r1)}
}
const courts=d.filter(e=>e.type.startsWith('pcb_courtyard')).map(q=>{
 const c=ids.get(q.pcb_component_id),name=sources.get(c.source_component_id)
 const ps=q.outline??[[-q.width/2,-q.height/2],[q.width/2,-q.height/2],[q.width/2,q.height/2],[-q.width/2,q.height/2]].map(([x,y])=>({x:q.center.x+x,y:q.center.y+y}))
 const pts=ps.map(p=>point(p,name))
 return {name,layer:moves[name]?.layer??q.layer,minX:Math.min(...pts.map(p=>p.x)),maxX:Math.max(...pts.map(p=>p.x)),minY:Math.min(...pts.map(p=>p.y)),maxY:Math.max(...pts.map(p=>p.y))}
})
const overlap=(a,b)=>a.layer===b.layer&&a.minX<b.maxX+.02&&a.maxX>b.minX-.02&&a.minY<b.maxY+.02&&a.maxY>b.minY-.02
for(const q of courts.filter(q=>moves[q.name]))for(const other of courts.filter(c=>c.name!==q.name))assert(!overlap(q,other),'Planned courtyard overlap '+q.name+' / '+other.name)
const pad=(name,pin)=>{
 const ps=d.filter(e=>e.type==='pcb_smtpad'&&e.pcb_component_id===comps.get(name).pcb_component_id&&ids.get(ids.get(e.pcb_port_id)?.source_port_id)?.pin_number===pin)
 assert.equal(ps.length,1);return ps[0]
}
const measure=(a,ap,b,bp)=>{
 const olda=pad(a,ap),oldb=pad(b,bp),na=point(olda,a),nb=point(oldb,b)
 return {from:`${a}.${ap}`,to:`${b}.${bp}`,oldStraightPadDistanceMm:Math.hypot(olda.x-oldb.x,olda.y-oldb.y),newStraightPadDistanceMm:Math.hypot(na.x-nb.x,na.y-nb.y)}
}
// Independently transcribed TPS65217 SLVSB64I pin functions and Fig78.
const switches=[measure('U_PMIC',20,'L_DDR',1),measure('U_PMIC',23,'L_MPU',1),measure('U_PMIC',31,'L_CORE',1)]
assert(switches.every(m=>m.newStraightPadDistanceMm<4.5&&m.newStraightPadDistanceMm<m.oldStraightPadDistanceMm))
const outputs=[measure('L_DDR',2,'C_PMIC_DDR_OUT',1),measure('L_MPU',2,'C_PMIC_MPU_OUT',1),measure('L_CORE',2,'C_PMIC_CORE_OUT',1)]
assert(outputs.every(m=>m.newStraightPadDistanceMm<6))
const feedback=[measure('U_PMIC',19,'C_PMIC_DDR_OUT',1),measure('U_PMIC',24,'C_PMIC_MPU_OUT',1),measure('U_PMIC',29,'C_PMIC_CORE_OUT',1)]
assert(feedback.every(m=>m.newStraightPadDistanceMm<6.5&&m.newStraightPadDistanceMm<m.oldStraightPadDistanceMm))
const inputs=[measure('U_PMIC',21,'C_PMIC_DCDC1_IN',1),measure('U_PMIC',22,'C_PMIC_DCDC2_IN',1),measure('U_PMIC',32,'C_PMIC_DCDC3_IN',1),measure('U_PMIC',2,'C_PMIC_VINLDO',1)]
assert(inputs.every(m=>m.newStraightPadDistanceMm<3.1))
const support=[[7,'C_PMIC_SYS'],[8,'C_PMIC_SYS'],[12,'C_PMIC_USB'],[3,'C_PMIC_LDO1'],[1,'C_PMIC_LDO2'],[40,'C_PMIC_ANALOG_OUT'],[43,'C_PMIC_IO_OUT'],[47,'C_PMIC_BYPASS'],[48,'C_PMIC_INT_LDO']].map(([pin,name])=>measure('U_PMIC',pin,name,1))
assert(support.every(m=>m.newStraightPadDistanceMm<m.oldStraightPadDistanceMm))
const root='checks/layout/pmic-placement-variant',sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
mkdirSync(root,{recursive:true})
writeFileSync('lib/am3352/placement/pmic-placements.json',JSON.stringify(moves,null,2)+'\n')
const report={status:'PLANNED_REQUIRES_NATIVE_BUILD_AND_DRC',fabricationReady:false,routingPermitted:false,originalShellFitVerified:false,
 input,inputSha256:sha(input),plannerSha256:sha('scripts/plan-g350-pmic-placement.mjs'),movedComponents:18,
 placementMethod:'Manufacturer-guided explicit positions with independent pad-distance and same-side courtyard checks.',
 switches,outputs,feedback,inputs,support,topLayerInductorsAndOutputCapacitors:true,inputAndSysBypassBottomSide:true,
 scope:'Distances are straight-line geometric placement measurements and engineering search bounds, not manufacturer trace-length limits or power-loop signoff. Bottom input capacitors require short dedicated power and GND vias; all three Lx/inductor/output paths must remain top-side without vias. Reference planes, current capacity, effective capacitance and thermal paths remain unfinished.'}
writeFileSync(`${root}/pmic-plan.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({...report,inputSha256:'stored',plannerSha256:'stored',support:'9 support pad-distance measurements stored'},null,2))
