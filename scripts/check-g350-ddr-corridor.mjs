import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const root='checks/layout/ddr-corridor-variant',input='dist/experiments/am3352-g350-ddr-corridor/circuit.json'
const baseline='dist/experiments/am3352-g350-pin-allocation/circuit.json'
const read=p=>JSON.parse(readFileSync(p)),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const d=read(input),old=read(baseline),moves=read('lib/am3352/placement/ddr-corridor-placements.json')
const plan=read(`${root}/ddr-corridor-plan.json`),cache=new WeakMap()
const idx=a=>{
 if(!cache.has(a)){
  const types=new Map(),ids=new Map()
  for(const e of a){if(!types.has(e.type))types.set(e.type,[]);types.get(e.type).push(e);ids.set(e[`${e.type}_id`],e)}
  const names=new Map(types.get('source_component').map(e=>[e.name,e]))
  const pcb=new Map(types.get('pcb_component').map(e=>[ids.get(e.source_component_id).name,e]))
  cache.set(a,{types,ids,names,pcb})
 }
 return cache.get(a)
}
const types=(a,t)=>idx(a).types.get(t)??[],pcb=(a,n)=>idx(a).pcb.get(n)
const close=(a,b,label)=>assert(Math.abs(a-b)<1e-8,`${label}: ${a} != ${b}`)
const near=(a,b,label)=>{
 if(typeof a==='number'){close(a,b,label);return}
 if(Array.isArray(a)){assert.equal(a.length,b.length,label);a.forEach((v,i)=>near(v,b[i],label));return}
 if(a&&typeof a==='object'){assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),label);for(const k in a)near(a[k],b[k],label);return}
 assert.deepEqual(a,b,label)
}
const pin=(a,p)=>idx(a).ids.get(idx(a).ids.get(p.pcb_port_id)?.source_port_id)
const group=p=>p.subcircuit_connectivity_map_key
const pads=(a,n)=>[...types(a,'pcb_smtpad'),...types(a,'pcb_plated_hole')].filter(p=>p.pcb_component_id===pcb(a,n).pcb_component_id)
const board=types(d,'pcb_board')[0]
assert.equal(types(d,'pcb_board').length,1);assert.deepEqual(board,types(old,'pcb_board')[0])
assert.equal(board.width,76);assert.equal(board.height,118);assert.equal(board.num_layers,4)
assert.deepEqual(board.outline,read('mechanical/g350-provisional-outline.json').outline)
assert.equal(types(d,'source_component').length,280);assert.equal(types(d,'pcb_component').length,280)
assert.equal(types(d,'pcb_smtpad').length+types(d,'pcb_plated_hole').length,1165)
assert.equal(types(d,'pcb_solder_paste').length,1121)
assert.equal(types(d,'pcb_hole').length,2)
assert.equal(Object.keys(moves).length,46)
assert.equal(d.filter(e=>e.type.endsWith('_error')).length,0)
for(const t of ['pcb_trace','pcb_via','pcb_copper_pour'])assert.equal(types(d,t).length,0)
// Exact source equality transfers the reviewed functional pin allocation,
// procurement identities and intentional NCs without relying on net names.
for(const t of ['source_component','source_port','source_net','source_trace'])assert.deepEqual(types(d,t),types(old,t),'Source changed '+t)
const netNames=new Map()
for(const n of types(d,'source_net')){
 assert(group(n));assert(!netNames.has(group(n)),'Merged explicit functional nets')
 netNames.set(group(n),n.name)
}
const geometryKeys=['shape','x','y','width','height','radius','corner_radius','points','ccw_rotation',
 'outer_width','outer_height','outer_diameter','hole_width','hole_height','hole_diameter','layer','layers','is_covered_with_solder_mask']
const project=e=>Object.fromEntries(geometryKeys.filter(k=>e[k]!==undefined).map(k=>[k,e[k]]))
const transformed=(e,name)=>{
 const result=project(e),o=pcb(old,name),n=pcb(d,name)
 const angle=n.rotation-o.rotation,r=angle*Math.PI/180
 const point=p=>({x:n.center.x+(p.x-o.center.x)*Math.cos(r)-(p.y-o.center.y)*Math.sin(r),
  y:n.center.y+(p.x-o.center.x)*Math.sin(r)+(p.y-o.center.y)*Math.cos(r)})
 if(e.points)result.points=e.points.map(point)
 if(e.x!==undefined)Object.assign(result,point(e))
 if(Math.abs(angle)%180===90){[result.width,result.height]=[result.height,result.width]}
 return result
}
const movedCourts=[]
for(const s of types(old,'source_component')){
 const n=pcb(d,s.name),o=pcb(old,s.name),m=moves[s.name]
 if(m){assert.deepEqual(n.center,{x:m.x,y:m.y});assert.equal(n.layer,m.layer);assert.equal(n.rotation,m.rotation)}
 else for(const k of ['center','layer','rotation','width','height'])assert.deepEqual(n[k],o[k],'Unplanned move '+s.name)
 const np=pads(d,s.name),op=pads(old,s.name);assert.equal(np.length,op.length)
 for(const p of op){
  const q=np.find(q=>q[`${q.type}_id`]===p[`${p.type}_id`]);assert(q,'Lost pad '+s.name)
  assert.equal(pin(d,q).pin_number,pin(old,p).pin_number,'Physical pin changed')
  near(project(q),m?transformed(p,s.name):project(p),'Pad geometry '+s.name)
 }
 const npaste=types(d,'pcb_solder_paste').filter(p=>p.pcb_component_id===n.pcb_component_id)
 const opaste=types(old,'pcb_solder_paste').filter(p=>p.pcb_component_id===o.pcb_component_id)
 assert.equal(npaste.length,opaste.length)
 for(const p of opaste){
  const q=npaste.find(q=>q.pcb_solder_paste_id===p.pcb_solder_paste_id);assert(q)
  near(project(q),m?transformed(p,s.name):project(p),'Native paste '+s.name)
 }
 if(m)movedCourts.push(n.pcb_component_id)
}
assert.deepEqual(types(d,'pcb_hole'),types(old,'pcb_hole'))
assert.deepEqual(types(d,'pcb_plated_hole'),types(old,'pcb_plated_hole'))
const box=c=>c.outline?{minX:Math.min(...c.outline.map(p=>p.x)),maxX:Math.max(...c.outline.map(p=>p.x)),minY:Math.min(...c.outline.map(p=>p.y)),maxY:Math.max(...c.outline.map(p=>p.y))}:
 {minX:c.center.x-c.width/2,maxX:c.center.x+c.width/2,minY:c.center.y-c.height/2,maxY:c.center.y+c.height/2}
const courts=d.filter(e=>e.type.startsWith('pcb_courtyard_')).map(c=>({...box(c),layer:c.layer,id:c.pcb_component_id}))
assert.equal(courts.length,280)
const overlaps=(a,b)=>a.layer===b.layer&&a.minX<b.maxX&&a.maxX>b.minX&&a.minY<b.maxY&&a.maxY>b.minY
for(const c of courts.filter(c=>movedCourts.includes(c.id)))assert(!courts.some(q=>q.id!==c.id&&overlaps(c,q)),'Moved courtyard collision '+c.id)
for(const name of plan.ramGroupParts){
 close(moves[name].y-pcb(old,name).center.y,7,'RAM translation '+name)
 const q=courts.find(c=>c.id===pcb(d,name).pcb_component_id),r=plan.reservation
 assert(q.minX>=r.minX&&q.maxX<=r.maxX&&q.minY>=r.minY&&q.maxY<=r.maxY)
}
assert.deepEqual(pcb(d,'U_RAM').center,{x:0,y:0});assert.deepEqual(pcb(d,'U_SOC').center,{x:0,y:20})
assert.equal(Math.hypot(pcb(d,'U_RAM').center.x-pcb(d,'U_SOC').center.x,pcb(d,'U_RAM').center.y-pcb(d,'U_SOC').center.y),20)
const sourceDistances=[]
for(const p of plan.sourcePadDistances){
 const resistor=pads(d,p.name).find(p=>pin(d,p).pin_number===1)
 const cpu=pads(d,'U_SOC').find(q=>pin(d,q).port_hints.includes(p.ball));assert(cpu&&resistor)
 const distance=Math.hypot(cpu.x-resistor.x,cpu.y-resistor.y)
 close(distance,p.newDistanceMm,'LCD source distance '+p.name)
 const court=courts.find(q=>q.id===pcb(d,p.name).pcb_component_id)
 assert(court.minX>=plan.reservation.maxX+plan.nonDdrClearanceMm)
 assert(resistor.x<pcb(d,p.name).center.x,'LCD source terminal must face CPU')
 sourceDistances.push({...p,measuredDistanceMm:distance})
}
assert.equal(sourceDistances.length,28)
// Check every copper envelope against the actual nonrectangular outline.
const poly=board.outline
const clearance=p=>{
 let inside=false
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j]
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside
 }
 const distance=Math.min(...poly.map((a,i)=>{
  const b=poly[(i+1)%poly.length],x=b.x-a.x,y=b.y-a.y
  const t=Math.max(0,Math.min(1,((p.x-a.x)*x+(p.y-a.y)*y)/(x*x+y*y)))
  return Math.hypot(p.x-a.x-t*x,p.y-a.y-t*y)
 }))
 return inside?distance:-distance
}
let minCopperEdgeClearanceLowerBoundMm=Infinity
for(const p of [...types(d,'pcb_smtpad'),...types(d,'pcb_plated_hole')]){
 if(p.shape==='circle'){
  minCopperEdgeClearanceLowerBoundMm=Math.min(minCopperEdgeClearanceLowerBoundMm,clearance(p)-(p.radius??p.outer_diameter/2));continue
 }
 const w=p.width??p.outer_width,h=p.height??p.outer_height,r=(p.ccw_rotation??0)*Math.PI/180
 const points=p.points??[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>({x:p.x+x*Math.cos(r)-y*Math.sin(r),y:p.y+x*Math.sin(r)+y*Math.cos(r)}))
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.1))
  for(let j=0;j<=n;j++)minCopperEdgeClearanceLowerBoundMm=Math.min(minCopperEdgeClearanceLowerBoundMm,clearance({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n})-.05)
 }
}
assert(minCopperEdgeClearanceLowerBoundMm>=board.min_board_edge_clearance,'Copper reaches outline')
const ddrBypassPlacement=[]
const rail=types(d,'source_net').find(n=>n.name==='DDR_1V5'),gnd=types(d,'source_net').find(n=>n.name==='GND')
for(const [chip,count,limit] of [['U_SOC',20,10.16],['U_RAM',12,3.81]]){
 const chipPads=pads(d,chip),supply=chipPads.filter(p=>group(pin(d,p))===group(rail)),ground=chipPads.filter(p=>group(pin(d,p))===group(gnd))
 assert(supply.length&&ground.length)
 for(let i=1;i<=count;i++){
  const name=`C_DDR_${chip==='U_SOC'?'CPU':'RAM'}_${i}`,cap=pcb(d,name)
  const distance=ps=>Math.min(...ps.map(p=>Math.hypot(p.x-cap.center.x,p.y-cap.center.y)))
  const powerDistanceMm=distance(supply),groundDistanceMm=distance(ground)
  assert(Math.max(powerDistanceMm,groundDistanceMm)<=limit,'DDR bypass '+name)
  ddrBypassPlacement.push({capacitor:name,powerDistanceMm,groundDistanceMm,limitMm:limit})
 }
}
const parent='checks/layout/pin-allocation-variant/g350-pin-allocation-check-summary.json',proof=read(parent)
for(const [p,h] of Object.entries(proof.hashes))assert.equal(sha(p),h,'Stale parent '+p)
const paths=[input,baseline,parent,'mechanical/g350-provisional-outline.json',
 'experiments/am3352-g350-ddr-corridor.circuit.tsx','lib/am3352/placement/DdrCorridorPlacement.tsx',
 'lib/am3352/placement/ddr-corridor-placements.json','scripts/plan-g350-ddr-corridor-placement.mjs',
 'scripts/check-g350-ddr-corridor.mjs',`${root}/ddr-corridor-plan.json`,'reference/am3352/am3352.pdf']
assert.equal(plan.inputSha256,sha(baseline));assert.equal(plan.plannerSha256,sha('scripts/plan-g350-ddr-corridor-placement.mjs'))
const report={status:'PASS_DDR_CORRIDOR_PLACEMENT_ONLY',fabricationReady:false,originalShellFitVerified:false,routingPermitted:false,
 logicalComponents:280,movedComponents:46,ramGroupParts:18,lcdSourceResistors:28,copperLayers:4,
 dimensionsMm:{width:76,height:118,thickness:1.6},cpuToRamCenterDistanceMm:20,
 exactSourceConnectivityPreserved:true,allExplicitNetNamesDistinct:true,physicalPadAndNativePasteTransformVerified:true,
 unchangedComponentPlacements:234,movedCourtyardsClear:true,ddrBypassPlacement,sourceDistances,
 minCopperEdgeClearanceLowerBoundMm,
 scope:'Placement only. DDR reservation is an engineering plan, not copper isolation/return-path or signal-integrity qualification. Original-shell geometry and routing remain incomplete.',
 hashes:Object.fromEntries(paths.map(p=>[p,sha(p)]))}
writeFileSync(`${root}/ddr-corridor-audit.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({...report,ddrBypassPlacement:'32 freshly checked',sourceDistances:'28 freshly checked',hashes:'stored in audit'},null,2))
