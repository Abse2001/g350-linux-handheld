import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const input='dist/experiments/am3352-g350-pmic-placement/circuit.json'
const d=JSON.parse(readFileSync(input)),ids=new Map(d.map(e=>[e[`${e.type}_id`],e]))
const sources=new Map(d.filter(e=>e.type==='source_component').map(e=>[e.source_component_id,e.name]))
const comps=new Map(d.filter(e=>e.type==='pcb_component').map(e=>[sources.get(e.source_component_id),e]))
const moves={
 U_IO_BOOST:{x:-26,y:51,rotation:90,layer:'top'},
 L_IO_BOOST:{x:-30,y:51,rotation:0,layer:'top'},
 C_IO_BOOST_IN:{x:-26.3,y:54.35,rotation:180,layer:'top'},
 C_IO_BOOST_OUT1:{x:-26,y:47.25,rotation:180,layer:'top'},
 C_IO_BOOST_OUT2:{x:-26,y:44.2,rotation:180,layer:'top'},
 R_IO_BOOST_HI:{x:-22.8,y:52.1,rotation:180,layer:'top'},
 R_IO_BOOST_LO:{x:-23.4,y:50,rotation:180,layer:'top'},
 C_IO_BOOST_FF:{x:-22.8,y:54.2,rotation:180,layer:'top'},
 C_SD_REG_IN:{x:19.6,y:-20,rotation:90,layer:'top'},
 C_SD_REG_HF:{x:21.8,y:-20,rotation:0,layer:'bottom'},
 L_SD_REG:{x:26.95,y:-20,rotation:0,layer:'top'},
 C_SD_REG_OUT:{x:32.3,y:-20,rotation:0,layer:'top'},
 C_LCD_BL_OUT:{x:31.4,y:3,rotation:90,layer:'top'},
 C_LCD_BL_COMP:{x:30.6,y:6.6,rotation:0,layer:'top'},
 R_LCD_BL_SENSE:{x:30.5,y:8.3,rotation:0,layer:'top'},
 C_LCD_BL_IN:{x:27,y:8.6,rotation:0,layer:'top'},
 R_LCD_BL_PD:{x:24.9,y:8.1,rotation:0,layer:'bottom'},
}
assert.equal(Object.keys(moves).length,17)
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
 const w=q.width??2*q.radius,h=q.height??2*q.radius
 const ps=q.outline??[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>({x:q.center.x+x,y:q.center.y+y}))
 const pts=ps.map(p=>point(p,name))
 assert(pts.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'Invalid courtyard '+name)
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
// Primary TI pin functions and layout figures; these limits are
// engineering placement comparisons rather than manufacturer route limits.
const metrics=[
 ['boost_switch','U_IO_BOOST',5,'L_IO_BOOST',2],
 ['boost_input','U_IO_BOOST',3,'C_IO_BOOST_IN',1],
 ['boost_input_ground','U_IO_BOOST',4,'C_IO_BOOST_IN',2],
 ['boost_output1','U_IO_BOOST',6,'C_IO_BOOST_OUT1',1],
 ['boost_output2','U_IO_BOOST',6,'C_IO_BOOST_OUT2',1],
 ['boost_output1_ground','U_IO_BOOST',4,'C_IO_BOOST_OUT1',2],
 ['boost_output2_ground','U_IO_BOOST',4,'C_IO_BOOST_OUT2',2],
 ['boost_feedback_high','U_IO_BOOST',1,'R_IO_BOOST_HI',2],
 ['boost_feedback_low','U_IO_BOOST',1,'R_IO_BOOST_LO',1],
 ['boost_feedback_ff','U_IO_BOOST',1,'C_IO_BOOST_FF',2],
 ['boost_divider','R_IO_BOOST_HI',2,'R_IO_BOOST_LO',1],
 ['boost_ff_feedback','R_IO_BOOST_HI',2,'C_IO_BOOST_FF',2],
 ['boost_ff_output','R_IO_BOOST_HI',1,'C_IO_BOOST_FF',1],
 ['sd_switch','U_SD_REG',7,'L_SD_REG',1],
 ['sd_output','L_SD_REG',2,'C_SD_REG_OUT',1],
 ['sd_input','U_SD_REG',2,'C_SD_REG_IN',1],
 ['sd_input_ground','U_SD_REG',1,'C_SD_REG_IN',2],
 ['sd_hf','U_SD_REG',2,'C_SD_REG_HF',1],
 ['sd_hf_ground','U_SD_REG',1,'C_SD_REG_HF',2],
 ['sd_sense','U_SD_REG',6,'C_SD_REG_OUT',1],
 ['bl_switch','U_LCD_BL',3,'D_LCD_BL',2],
 ['bl_output','D_LCD_BL',1,'C_LCD_BL_OUT',1],
 ['bl_output_ground','U_LCD_BL',4,'C_LCD_BL_OUT',2],
 ['bl_input','U_LCD_BL',1,'C_LCD_BL_IN',1],
 ['bl_input_ground','U_LCD_BL',4,'C_LCD_BL_IN',2],
 ['bl_comp','U_LCD_BL',5,'C_LCD_BL_COMP',1],
 ['bl_comp_ground','U_LCD_BL',4,'C_LCD_BL_COMP',2],
 ['bl_feedback','U_LCD_BL',6,'R_LCD_BL_SENSE',1],
 ['bl_sense_ground','U_LCD_BL',4,'R_LCD_BL_SENSE',2],
 ['pwm_input_pulldown','U_LCD_PWM_BUF',2,'R_LCD_BL_PD',1],
].map(([name,a,ap,b,bp])=>({name,...measure(a,ap,b,bp)}))
assert.equal(metrics.length,30)
for(const m of metrics)assert(m.newStraightPadDistanceMm<=m.oldStraightPadDistanceMm+1e-8,'Placement worsened '+m.name)
const root='checks/layout/converter-placement-variant',sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
mkdirSync(root,{recursive:true})
writeFileSync('lib/am3352/placement/converter-placements.json',JSON.stringify(moves,null,2)+'\n')
const report={status:'PLANNED_REQUIRES_NATIVE_BUILD_AND_DRC',fabricationReady:false,routingPermitted:false,originalShellFitVerified:false,
 input,inputSha256:sha(input),plannerSha256:sha('scripts/plan-g350-converter-placement.mjs'),movedComponents:17,
 placementMethod:'Manufacturer-guided explicit positions with independent pad-distance and same-side courtyard checks.',
 metrics,topLayerHighCurrentGroups:true,sdHighFrequencyBypassBottomSide:true,
 scope:'Geometric placement improvements only. The SD high-frequency bypass needs dedicated short supply/ground vias. Actual switching loops, feedback routing, planes, effective capacitance, stability, thermal performance and original-shell fit remain unverified.'}
writeFileSync(`${root}/converter-plan.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({...report,inputSha256:'stored',plannerSha256:'stored',metrics:'30 endpoint measurements stored'},null,2))
