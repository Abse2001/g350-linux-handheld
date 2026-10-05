import {readFileSync,writeFileSync} from "node:fs"
import {createHash} from "node:crypto"
import assert from "node:assert/strict"

const circuitPath="dist/experiments/am3352-g350-display-placement/circuit.json"
const baselinePath="dist/experiments/am3352-g350-placement-study/circuit.json"
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
assert.equal(source.length,275);assert.equal(sourceOld.length,233)
assert.equal(new Set(source.map(x=>x.name)).size,source.length)
const componentName=(a,id)=>getElement(a,"source_component",id)?.name
const portKey=(a,p)=>`${componentName(a,p.source_component_id)}:${p.pin_number??p.name}`
const ignoredPorts=new Set(['U_SOC:176','U_SOC:194','C_HV2_BULK:1','C_HV2_1:1','C_HV2_2:1'])
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
assert.deepEqual(netProjection(d),netProjection(old),"All original terminal groups except the explicitly checked VDDSHV2 rail migration must be preserved")

const physicalPads=(a,name)=>{
  const s=byType(a,"source_component").find(x=>x.name===name)
  const c=byType(a,"pcb_component").find(x=>x.source_component_id===s.source_component_id)
  return a.filter(p=>["pcb_smtpad","pcb_plated_hole"].includes(p.type)&&p.pcb_component_id===c.pcb_component_id).map(p=>{
    const port=getElement(a,'pcb_port',p.pcb_port_id)
    const sp=getElement(a,'source_port',port?.source_port_id)
    // Rotation and assembly side can change; copper size and pin identity cannot.
    const dims=p.shape==='polygon'?[Math.max(...p.points.map(v=>v.x))-Math.min(...p.points.map(v=>v.x)),Math.max(...p.points.map(v=>v.y))-Math.min(...p.points.map(v=>v.y))]:
      [p.width??p.outer_width??2*(p.radius??p.outer_diameter/2),p.height??p.outer_height??2*(p.radius??p.outer_diameter/2)]
    return JSON.stringify({type:p.type,pin:sp?.pin_number??sp?.name,hints:[...(p.port_hints??[])].sort(),shape:p.shape,size:dims.sort((a,b)=>a-b).map(n=>+n.toFixed(5)),hole:p.hole_diameter??[p.hole_width,p.hole_height]})
  }).sort()
}
for(const s of sourceOld){
  const next=source.find(x=>x.name===s.name)
  assert(next,`Missing original host part ${s.name}`)
  for(const key of ['manufacturer_part_number','supplier_part_numbers','ftype'])assert.deepEqual(next[key],s[key],`${s.name} changed ${key}`)
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
const report={status:'PASS_PLACEMENT_ONLY',fabricationReady:false,verifiedOriginalShellFit:false,
  dimensionsMm:{width:76,height:118,mainBodyHeight:99,speakerTongueWidth:22,thickness:board.thickness},
  numCopperLayers:4,logicalComponents:275,preservedPriorComponents:233,newDisplayComponents:42,
  nativeErrors:0,placedPadsAndPlatedHoles:copper.length,minCopperEdgeClearanceLowerBoundMm:copper[0].clearanceLowerBoundMm,
  closestPads:copper.slice(0,5),courtyardOutsideOutline:courts.filter(c=>c.clearanceLowerBoundMm<0),
  staleTraces:0,staleVias:0,originalTerminalConnectivityPreservedExceptReviewedHv2Migration:true,hostPhysicalPadIdentityPreserved:true,
  displayPinMapAndBacklightSenseVerified:true,
  reviewedRailChange:{domain:'VDDSHV2',cpuZczBalls:['P10','P11'],bypasses:['C_HV2_BULK','C_HV2_1','C_HV2_2'],from:'ANALOG_1V8',to:'IO_3V3'},
  panelLogicCurrentBudgetQualified:false,displayMechanicalFitVerified:false,
  scope:'Host, controls/audio and display/backlight placement. Final harness/contact selection, engineering qualification and measured shell fit remain; no routing or fabrication qualification.',
  hashes:Object.fromEntries([circuitPath,baselinePath,'mechanical/g350-provisional-outline.json','lib/am3352/placement/host-placements.json','lib/am3352/placement/LayoutOnly.tsx','lib/am3352/placement/ControlsAndAudio.tsx','experiments/am3352-g350-display-placement.circuit.tsx','lib/am3352/placement/Display.tsx','lib/am3352/placement/Rgb888Power.tsx'].map(p=>[p,sha(p)]))}
writeFileSync('checks/layout/display-variant/g350-display-placement-audit.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report,null,2))
