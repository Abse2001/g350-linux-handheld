import {readFileSync,writeFileSync} from "node:fs"
import {createHash} from "node:crypto"
import assert from "node:assert/strict"

const circuitPath="dist/experiments/am3352-g350-critical-placement/circuit.json"
const baselinePath="dist/experiments/am3352-g350-harness-placement/circuit.json"
const read=p=>JSON.parse(readFileSync(p))
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const d=read(circuitPath),old=read(baselinePath),outline=read("mechanical/g350-provisional-outline.json")
const typeCache=new WeakMap(),idCache=new WeakMap()
const byType=(a,t)=>{
  if(!typeCache.has(a))typeCache.set(a,new Map())
  const m=typeCache.get(a)
  if(!m.has(t))m.set(t,a.filter(x=>x.type===t))
  return m.get(t)
}
const getElement=(a,t,id)=>{
  if(!idCache.has(a))idCache.set(a,new Map())
  const m=idCache.get(a)
  if(!m.has(t))m.set(t,new Map(byType(a,t).map(x=>[x[`${t}_id`],x])))
  return m.get(t).get(id)
}
const board=byType(d,"pcb_board")[0]
assert.equal(byType(d,"pcb_board").length,1)
assert.equal(board.width,76);assert.equal(board.height,118);assert.equal(board.num_layers,4)
assert.deepEqual(board.outline,outline.outline)
for(const type of ["pcb_trace","pcb_via","pcb_copper_pour"])assert.equal(byType(d,type).length,0,`Layout must have no stale ${type}`)
assert.equal(d.filter(x=>x.type.endsWith('_error')).length,0)

const source=byType(d,"source_component"),sourceOld=byType(old,"source_component")
assert.equal(source.length,277);assert.equal(sourceOld.length,277)
assert.equal(new Set(source.map(x=>x.name)).size,source.length)
const componentName=(a,id)=>getElement(a,"source_component",id)?.name
const portKey=(a,p)=>`${componentName(a,p.source_component_id)}:${p.pin_number??p.name}`
const ignoredPorts=new Set()
const netProjection=a=>{
  const groups=new Map()
  for(const p of byType(a,"source_port")){
    if(!sourceOld.some(s=>s.name===componentName(a,p.source_component_id)))continue
    if(ignoredPorts.has(portKey(a,p)))continue
    const key=p.subcircuit_connectivity_map_key??`ISOLATED:${portKey(a,p)}`
    if(!groups.has(key))groups.set(key,[])
    groups.get(key).push(portKey(a,p))
  }
  return [...groups.values()].map(v=>v.sort()).filter(v=>v.length>1).map(v=>v.join('|')).sort()
}
assert.deepEqual(netProjection(d),netProjection(old),"All prior terminal groups must be preserved")

const physicalPads=(a,name)=>{
  const s=byType(a,"source_component").find(x=>x.name===name)
  const c=byType(a,"pcb_component").find(x=>x.source_component_id===s.source_component_id)
  return a.filter(p=>["pcb_smtpad","pcb_plated_hole"].includes(p.type)&&p.pcb_component_id===c.pcb_component_id).map(p=>{
    const port=getElement(a,'pcb_port',p.pcb_port_id)
    const sp=getElement(a,'source_port',port?.source_port_id)
    // Rotation and assembly side can change; copper size and pin identity cannot.
    const dims=p.shape==='polygon'?[Math.max(...p.points.map(v=>v.x))-Math.min(...p.points.map(v=>v.x)),Math.max(...p.points.map(v=>v.y))-Math.min(...p.points.map(v=>v.y))]:
      [p.width??p.outer_width??2*(p.radius??p.outer_diameter/2),p.height??p.outer_height??2*(p.radius??p.outer_diameter/2)]
    // Core's generated testpoint footprint uses alias "1"; the explicit
    // footprint uses "pin1". Both must resolve to that same source pin.
    const hints=(p.port_hints??[]).filter(h=>!/^unnamed_platedhole\d+$/.test(String(h)))
      .map(h=>name.startsWith('TP_')?String(h).replace(/^pin/,''):h).sort()
    return JSON.stringify({type:p.type,pin:sp?.pin_number??sp?.name,hints,shape:p.shape,size:dims.sort((a,b)=>a-b).map(n=>+n.toFixed(5)),hole:p.hole_diameter??[p.hole_width,p.hole_height]})
  }).sort()
}
for(const s of sourceOld){
  const next=source.find(x=>x.name===s.name)
  assert(next,`Missing original host part ${s.name}`)
  for(const key of ['manufacturer_part_number','supplier_part_numbers','ftype'])assert.deepEqual(next[key],s[key],`${s.name} changed ${key}`)
  if(!new Set(['J_LCD','L_LCD_BL','U_KEYS','TP_BAT_INPUT','TP_BAT_NTC','TP_BAT_GND','TP_USB_INPUT']).has(s.name))
    assert.deepEqual(physicalPads(d,s.name),physicalPads(old,s.name),`${s.name} changed physical pad size/pin identity`)
}

const poly=board.outline
const segDistance=(p,a,b)=>{
  const dx=b.x-a.x,dy=b.y-a.y
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)))
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)
}
const inside=p=>{
  let yes=false
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j]
    if(((a.y>p.y)!==(b.y>p.y))&&(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x))yes=!yes
  }
  return yes
}
const pointClearance=p=>Math.min(...poly.map((a,i)=>segDistance(p,a,poly[(i+1)%poly.length])))*(inside(p)?1:-1)
const rotate=(p,c,deg)=>{
  const r=deg*Math.PI/180
  return {x:c.x+p.x*Math.cos(r)-p.y*Math.sin(r),y:c.y+p.x*Math.sin(r)+p.y*Math.cos(r)}
}
const padEnvelope=p=>{
  if(p.shape==='circle')return {center:{x:p.x,y:p.y},radius:p.radius??p.outer_diameter/2}
  if(p.shape==='polygon')return {points:p.points}
  const w=p.width??p.outer_width,h=p.height??p.outer_height
  assert(Number.isFinite(w)&&Number.isFinite(h),`Unknown pad envelope ${p.shape}`)
  return {points:[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>rotate({x,y},p,p.ccw_rotation??0))}
}
// Sample each complete conservative envelope edge at <=0.1 mm. The distance
// function is 1-Lipschitz, so subtract half that step as a strict lower bound.
const envelopeClearance=e=>{
  if(e.center)return pointClearance(e.center)-e.radius
  let result=Infinity
  for(let i=0;i<e.points.length;i++){
    const a=e.points[i],b=e.points[(i+1)%e.points.length]
    const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/.1))
    for(let j=0;j<=n;j++)result=Math.min(result,pointClearance({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n}))
  }
  return result-.05
}
const copper=d.filter(x=>["pcb_smtpad","pcb_plated_hole"].includes(x.type)).map(p=>{
  const c=byType(d,"pcb_component").find(x=>x.pcb_component_id===p.pcb_component_id)
  return {name:componentName(d,c.source_component_id),pad:p.pcb_smtpad_id??p.pcb_plated_hole_id,clearanceLowerBoundMm:envelopeClearance(padEnvelope(p))}
}).sort((a,b)=>a.clearanceLowerBoundMm-b.clearanceLowerBoundMm)
assert(copper[0].clearanceLowerBoundMm>=board.min_board_edge_clearance,`Copper edge clearance failed: ${JSON.stringify(copper[0])}`)
const courts=byType(d,'pcb_courtyard_outline').map(c=>{
  const pc=byType(d,'pcb_component').find(x=>x.pcb_component_id===c.pcb_component_id)
  return {name:componentName(d,pc.source_component_id),clearanceLowerBoundMm:envelopeClearance({points:c.outline})}
})
const sd=byType(d,'pcb_keepout')
assert.equal(sd.length,2)
assert(sd.every(k=>k.layers.length===1&&k.layers[0]==='top'&&!k.allow_traces&&!k.warning_only))
const cpu=byType(d,'pcb_component').find(x=>componentName(d,x.source_component_id)==='U_SOC')
const ram=byType(d,'pcb_component').find(x=>componentName(d,x.source_component_id)==='U_RAM')
assert.deepEqual(cpu.center,{x:0,y:20});assert.deepEqual(ram.center,{x:0,y:-7})
const sdComponent=byType(d,'pcb_component').find(x=>componentName(d,x.source_component_id)==='J_SD')
assert.deepEqual(sdComponent.center,{x:29.5,y:-33})

const port=(name,hint)=>{
 const c=source.find(c=>c.name===name); assert(c,'Missing '+name)
 const ps=byType(d,'source_port').filter(p=>p.source_component_id===c.source_component_id&&p.port_hints.includes(String(hint)))
 assert.equal(ps.length,1,'Ambiguous/missing '+name+'.'+hint);return ps[0]
}
const group=p=>p.subcircuit_connectivity_map_key
const connected=(a,ap,b,bp)=>{
 assert(group(port(a,ap)),'Unconnected '+a+'.'+ap)
 assert.equal(group(port(a,ap)),group(port(b,bp)),a+'.'+ap+' -> '+b+'.'+bp)
}
const toNet=(name,pin,net)=>assert.equal(group(port(name,pin)),byType(d,'source_net').find(n=>n.name===net)?.subcircuit_connectivity_map_key,name+'.'+pin+' -> '+net)
// Independently transcribed SPRS717L Tables4-2/4-5 ZCZ balls and panel p10.
const balls=['R1','R2','R3','R4','T1','T2','T3','T4','U1','U2','U3','U4','V2','V3','V4','T5','U13','V13','R12','T12','U12','T11','T10','U10']
for(let i=0;i<24;i++){
 connected('U_SOC',balls[i],'R_LCD_DATA'+i,1)
 connected('R_LCD_DATA'+i,2,'J_LCD',12+i)
 assert.notEqual(group(port('R_LCD_DATA'+i,1)),group(port('R_LCD_DATA'+i,2)))
}
for(const [signal,ball,pin] of [['HSYNC','R5',36],['VSYNC','U5',37],['PCLK','V5',38],['DE','R6',52]]){
 connected('U_SOC',ball,'R_LCD_'+signal,1);connected('R_LCD_'+signal,2,'J_LCD',pin)
}
for(const [ball,pin] of [['A17',10],['B16',11],['C15',9],['D13',8]])connected('U_SOC',ball,'J_LCD',pin)
connected('U_SOC','C18','U_LCD_BL',2)
for(const ball of ['P10','P11'])toNet('U_SOC',ball,'IO_3V3')
for(const name of ['C_HV2_BULK','C_HV2_1','C_HV2_2'])toNet(name,1,'IO_3V3')
for(const [pin,net] of [[1,'LCD_LED_K'],[2,'LCD_LED_K'],[3,'LCD_LED_A'],[4,'LCD_LED_A'],[41,'IO_3V3'],[42,'IO_3V3'],[53,'GND'],[54,'GND']])toNet('J_LCD',pin,net)
for(const [pin,net] of [[1,'VIO_BOOST5V'],[2,'LCD_BL_PWM'],[3,'LCD_BL_SW'],[4,'GND'],[5,'LCD_BL_COMP'],[6,'LCD_LED_K']])toNet('U_LCD_BL',pin,net)
for(const [name,pins] of [['L_LCD_BL',['VIO_BOOST5V','LCD_BL_SW']],['D_LCD_BL',['LCD_LED_A','LCD_BL_SW']],['R_LCD_BL_SENSE',['LCD_LED_K','GND']],['C_LCD_BL_OUT',['LCD_LED_A','GND']],['C_LCD_BL_IN',['VIO_BOOST5V','GND']],['C_LCD_BL_COMP',['LCD_BL_COMP','GND']],['R_LCD_BL_PD',['LCD_BL_PWM','GND']],['R_LCD_RESET_PD',['LCD_RESETn','GND']],['R_LCD_CS_PU',['IO_3V3','LCD_CS1n']]]){
 toNet(name,1,pins[0]);toNet(name,2,pins[1])
}
assert.notEqual(group(port('J_LCD',1)),group(port('J_LCD',53)),'LED cathode must not be shorted to ground')
for(const pin of [5,6,7,39,40,43,44,45,46,47,48,49,50,51,55,56]){
 const p=port('J_LCD',pin);assert.equal(p.do_not_connect,true);assert.equal(group(p),undefined)
}
assert.equal(byType(d,'source_port').filter(p=>p.source_component_id===source.find(c=>c.name==='J_LCD').source_component_id).length,56)
for(const [name,mpn,jlc] of [
 ['J_LCD','0.5-54PFGPZ','C30732'],['U_LCD_BL','TPS61165DBVR','C58756'],
 ['L_LCD_BL','VLCF5020T-100M1R1-1','C89448'],['D_LCD_BL','MBR0540T1G','C21353'],
 ['C_LCD_BL_OUT','CL31B475KBHNNNE','C51205'],['C_LCD_BL_COMP','CL10B224KA8NNNC','C21120'],
 ['R_LCD_BL_SENSE','0603WAF150JT5E','C22810'],
]){
 const c=source.find(c=>c.name===name)
 assert.equal(c.manufacturer_part_number,mpn);assert.deepEqual(c.supplier_part_numbers.jlcpcb,[jlc])
}
// Independently check the new harness pin assignments and intentional NCs.
for(const [pin,net] of [[1,'VBAT'],[2,'BAT_NTC'],[3,'GND']])toNet('J_BAT',pin,net)
for(const [pin,net] of [[1,'SPK_P'],[2,'SPK_N']])toNet('J_SPK',pin,net)
assert.notEqual(group(port('J_SPK',1)),group(port('J_SPK',2)))
assert.notEqual(group(port('J_SPK',1)),group(port('J_BAT',3)))
assert.notEqual(group(port('J_SPK',2)),group(port('J_BAT',3)))
for(const [name,pins] of [['J_BAT',[6,7]],['J_SPK',[3,4]]])for(const pin of pins){
  assert.equal(port(name,pin).do_not_connect,true);assert.equal(group(port(name,pin)),undefined)
}
for(const [name,mpn,jlc] of [['J_BAT','DF65-3P-1.7V(21)','C3032596'],['J_SPK','SM02B-SRSS-TB(LF)(SN)','C160402']]){
 const c=source.find(c=>c.name===name);assert.equal(c.manufacturer_part_number,mpn);assert.deepEqual(c.supplier_part_numbers.jlcpcb,[jlc])
}
const pcbComponent=name=>byType(d,'pcb_component').find(c=>componentName(d,c.source_component_id)===name)
const pads=name=>byType(d,'pcb_smtpad').filter(p=>p.pcb_component_id===pcbComponent(name).pcb_component_id)
const paste=byType(d,'pcb_solder_paste')
// Allow 0.3 micrometre of EasyEDA coordinate quantization, far below the
// manufacturer's smallest dimensional tolerance (30 micrometres).
const close=(a,b,msg)=>assert(Math.abs(a-b)<3e-4,msg+': '+a+' != '+b)
const padFor=(name,pin)=>{
 const result=pads(name).filter(p=>p.pcb_port_id===byType(d,'pcb_port').find(p=>p.source_port_id===port(name,pin).source_port_id)?.pcb_port_id)
 assert.equal(result.length,1,name+'.'+pin+' physical pad');return result[0]
}
// Actual BOOMELE drawing, signal pads 0.30 x 1.30mm at 0.50mm pitch.
for(let pin=1;pin<=54;pin++){
 const p=padFor('J_LCD',pin);close(p.width,.30,'FPC pad width');close(p.height,1.30,'FPC pad height')
 close(p.x,-13.25+(pin-1)*.5,'FPC signal order/pitch')
}
for(const [pin,x] of [[55,14.95],[56,-14.95]]){
 const p=padFor('J_LCD',pin);close(p.width,2,'FPC anchor width');close(p.height,1.6,'FPC anchor height');close(p.x,x,'FPC anchor X')
}
// Hirose nominal PCB pattern is read from the manufacturer catalog, p3.
for(const [pin,x,y,w,h] of [[1,-1.7,2.7624786,.6,1],[2,0,2.7624786,.6,1],[3,1.7,2.7624786,.6,1],
  [6,3.075,-2.2875214,.7,1.8],[7,-3.075,-2.2875214,.7,1.8]]){
 const p=padFor('J_BAT',pin);close(p.x+17,x,'Battery land X');close(p.y+26,y,'Battery land Y');close(p.width,w,'Battery land width');close(p.height,h,'Battery land height')
 const sp=paste.filter(e=>e.pcb_smtpad_id===p.pcb_smtpad_id);assert.equal(sp.length,1);close(sp[0].width,w,'Battery aperture width');close(sp[0].height,h,'Battery aperture height')
}
// Every unpopulated probe and membrane electrode stays exposed, with no paste.
const bare=source.filter(c=>c.name.startsWith('TP_')||c.name.startsWith('KEY_'))
assert.equal(bare.length,31)
for(const c of bare){
 const pp=pads(c.name);assert.equal(pp.length,c.name.startsWith('KEY_')?2:1)
 for(const p of pp){assert.equal(p.is_covered_with_solder_mask,false);assert(!paste.some(e=>e.pcb_smtpad_id===p.pcb_smtpad_id),'Paste on bare pad '+c.name)}
 assert.equal(paste.filter(e=>e.pcb_component_id===pcbComponent(c.name).pcb_component_id).length,0)
}
for(const name of ['TP_BAT_INPUT','TP_BAT_NTC','TP_BAT_GND','TP_USB_INPUT'])close(pads(name)[0].radius,1,'Correct declared 2mm probe diameter')
for(const [name,x] of [['TP_BAT_INPUT',-18],['TP_BAT_NTC',-15],['TP_BAT_GND',-12]]){
 close(pads(name)[0].x,x,'Battery probe X');close(pads(name)[0].y,-38.5,'Battery probe clearance relocation')
}
// The rounded rectangle is exactly the original capsule copper, including
// pad centre, axes, radius and numeric pin identity. Its aperture is inscribed.
const oldKeys=byType(old,'pcb_smtpad').filter(p=>p.pcb_component_id===byType(old,'pcb_component').find(c=>componentName(old,c.source_component_id)==='U_KEYS').pcb_component_id)
const keyPads=pads('U_KEYS')
assert.equal(keyPads.length,28)
for(const p of keyPads){
 assert.equal(p.shape,'rect')
 const before=oldKeys.find(q=>q.port_hints[0]===p.port_hints[0]);assert(before)
 for(const key of ['width','height','x','y'])assert.equal(p[key],before[key],'U_KEYS original copper changed')
 assert.equal(p.corner_radius,(before.radius??before.corner_radius))
 close(p.corner_radius,Math.min(p.width,p.height)/2,'Capsule corner radius')
 assert.equal((before.ccw_rotation??0)%180,0,'Capsule axes')
 const apertures=paste.filter(e=>e.pcb_smtpad_id===p.pcb_smtpad_id);assert.equal(apertures.length,1)
 close(apertures[0].width,p.width*.7,'U_KEYS paste width');close(apertures[0].height,p.height*.7,'U_KEYS paste height')
 assert(apertures[0].height<=p.height-2*p.corner_radius,'Aperture leaves the straight capsule region')
}
const contains=(poly,p)=>{
 let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes
 }return yes
}
const lp=pads('L_LCD_BL'),lbase=lp.filter(p=>p.shape==='polygon'),laux=lp.filter(p=>p.shape==='rect')
assert.equal(lbase.length,2);assert.equal(laux.length,4)
for(const p of lbase){
 const xx=p.points.map(v=>v.x),yy=p.points.map(v=>v.y)
 close(Math.max(...xx)-Math.min(...xx),2.1,'TDK land axial width');close(Math.max(...yy)-Math.min(...yy),4.9,'TDK land transverse width')
 const centre=(Math.min(...xx)+Math.max(...xx))/2;close(Math.abs(centre-21.5),1.7,'TDK land centre')
 const aa=laux.filter(q=>q.pcb_port_id===p.pcb_port_id);assert.equal(aa.length,2)
 for(const a of aa){
  assert(padEnvelope(a).points.every(q=>contains(p.points,q)),'TDK inner copper/aperture outside manufacturer land')
  const ap=paste.filter(e=>e.pcb_smtpad_id===a.pcb_smtpad_id);assert.equal(ap.length,1)
  close(ap[0].width,a.width,'TDK paste width');close(ap[0].height,a.height,'TDK paste height')
 }
}
const inputFiles=[circuitPath,baselinePath,'mechanical/g350-provisional-outline.json','lib/am3352/placement/HarnessPlacement.tsx',
 'experiments/am3352-g350-harness-placement.circuit.tsx','imports/DF65_3P_1_7V_21_.tsx','imports/SM02B_SRSS_TB_LF__SN_.tsx',
 'reference/am3352/display/C30732-connector.pdf','reference/am3352/display/TDK-VLCF5020-datasheet.pdf','reference/am3352/harness/JST-SH.pdf',
 'reference/am3352/harness/DF65-3P-1.7V-21-drawing.pdf']

const moves=read('lib/am3352/placement/cpu-bypass-placements.json')
const plan=read('checks/layout/critical-variant/cpu-bypass-plan.json')
assert.equal(plan.status,'PLANNED_REQUIRES_NATIVE_BUILD_AND_DRC')
assert.equal(plan.inputSha256,sha(baselinePath))
assert.equal(plan.plannerSha256,sha('scripts/plan-g350-cpu-bypass-placement.mjs'))
assert.equal(Object.keys(moves).length,59)
const ballFunctions=read('lib/am3352/cpu-ball-map.json').pins
const supplyPads=pads('U_SOC').map(p=>{
 const po=getElement(d,'pcb_port',p.pcb_port_id),s=getElement(d,'source_port',po.source_port_id)
 const ball=s.port_hints.find(h=>ballFunctions[h]);assert(ball)
 return {...p,ball,function:ballFunctions[ball]}
})
const cpuBypassMetrics=[]
for(const item of plan.measurements){
 const c=pcbComponent(item.name),m=moves[item.name];assert(m)
 close(c.center.x,m.x,'Bypass position X');close(c.center.y,m.y,'Bypass position Y');assert.equal(c.layer,m.layer)
 const targets=supplyPads.filter(p=>p.function===item.function);assert(targets.length)
 const distance=Math.min(...targets.map(p=>Math.hypot(p.x-c.center.x,p.y-c.center.y)))
 close(distance,item.newNearestSupplyDistanceMm,'Independently rendered bypass-to-ball distance')
 const court=byType(d,'pcb_courtyard_outline').find(p=>p.pcb_component_id===c.pcb_component_id);assert(court)
 if(!item.name.endsWith('_BULK'))assert(Math.min(...court.outline.map(p=>p.y))>=19.3,'Bypass courtyard enters reserved DDR escape space')
 cpuBypassMetrics.push({...item,measuredNearestSupplyDistanceMm:distance})
}
const worldGeometry=(a,name)=>{
 const s=byType(a,'source_component').find(s=>s.name===name),c=byType(a,'pcb_component').find(c=>c.source_component_id===s.source_component_id)
 return a.filter(p=>['pcb_smtpad','pcb_plated_hole'].includes(p.type)&&p.pcb_component_id===c.pcb_component_id).map(p=>
  JSON.stringify(Object.fromEntries(['type','shape','x','y','width','height','radius','corner_radius','points','ccw_rotation','outer_width','outer_height','hole_width','hole_height','layer','layers'].map(k=>[k,p[k]])))).sort()
}
for(const s of sourceOld)if(!moves[s.name]){
 const c=pcbComponent(s.name),oc=byType(old,'pcb_component').find(c=>componentName(old,c.source_component_id)===s.name)
 assert.deepEqual(c.center,oc.center,'Unplanned component move '+s.name);assert.equal(c.layer,oc.layer)
 assert.deepEqual(worldGeometry(d,s.name),worldGeometry(old,s.name),'Unplanned copper move '+s.name)
}
// TI SPRS717L Table 7-65 distances are measured to capacitor centers and
// both the nearest supply and ground terminals. Copper paths are not implied.
const ddrBypassPlacement=[]
for(const [name,count,limit] of [['U_SOC',20,10.16],['U_RAM',12,3.81]]){
 const chipPads=pads(name).map(p=>{
  const po=getElement(d,'pcb_port',p.pcb_port_id),s=getElement(d,'source_port',po.source_port_id)
  return {...p,net:group(s)}
 })
 const rail=byType(d,'source_net').find(n=>n.name==='DDR_1V5').subcircuit_connectivity_map_key
 const ground=byType(d,'source_net').find(n=>n.name==='GND').subcircuit_connectivity_map_key
 const supply=chipPads.filter(p=>p.net===rail),grounds=chipPads.filter(p=>p.net===ground)
 assert(supply.length&&grounds.length)
 for(let i=1;i<=count;i++){
  const cap=pcbComponent(`C_DDR_${name==='U_SOC'?'CPU':'RAM'}_${i}`)
  const powerDistance=Math.min(...supply.map(p=>Math.hypot(p.x-cap.center.x,p.y-cap.center.y)))
  const groundDistance=Math.min(...grounds.map(p=>Math.hypot(p.x-cap.center.x,p.y-cap.center.y)))
  assert(Math.max(powerDistance,groundDistance)<=limit,`TI DDR bypass distance failed ${i} ${name}`)
  ddrBypassPlacement.push({capacitor:componentName(d,cap.source_component_id),powerDistanceMm:powerDistance,groundDistanceMm:groundDistance,limitMm:limit})
 }
}
const proximityScope='General CPU proximity bounds are engineering search choices, not datasheet limits. These are geometric distances, not routed loop lengths, impedance, DC-biased capacitance or PDN signoff.'
inputFiles.push('lib/am3352/placement/CriticalPlacement.tsx','lib/am3352/placement/cpu-bypass-placements.json',
 'experiments/am3352-g350-critical-placement.circuit.tsx','scripts/plan-g350-cpu-bypass-placement.mjs',
 'checks/layout/critical-variant/cpu-bypass-plan.json','lib/am3352/cpu-ball-map.json','reference/am3352/am3352.pdf')

const report={cpuBypassMetrics,ddrBypassPlacement,proximityScope,status:'PASS_PLACEMENT_ONLY',fabricationReady:false,verifiedOriginalShellFit:false,
 dimensionsMm:{width:76,height:118,mainBodyHeight:99,speakerTongueWidth:22,thickness:board.thickness},numCopperLayers:4,
 logicalComponents:277,preservedPriorComponents:277,newHarnessComponents:0,nativeErrors:0,
 placedPadsAndPlatedHoles:copper.length,minCopperEdgeClearanceLowerBoundMm:copper[0].clearanceLowerBoundMm,
 courtyardOutsideOutline:courts.filter(c=>c.clearanceLowerBoundMm<0),staleTraces:0,staleVias:0,
 originalTerminalConnectivityPreserved:true,displayAndHarnessPinMappingsVerified:true,
 bareComponentsWithNoPaste:bare.length,exposedBareCopperPads:42,unintendedProbeThroughHolesCorrected:4,
 capsulePadRepresentationConverted:28,capsuleCopperPreserved:true,inductorAuxiliaryPadCount:4,auxiliaryCopperContainedInPrimaryLands:true,
 scope:'Unrouted provisional full-handheld component placement; mechanical fit, complete critical review, power/driver qualification, routing and manufacturing release remain incomplete.',
 hashes:Object.fromEntries(inputFiles.map(p=>[p,sha(p)]))}
writeFileSync('checks/layout/critical-variant/g350-critical-placement-audit.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report,null,2))
