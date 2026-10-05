import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const root='checks/layout/pin-allocation-variant'
const circuitPath='dist/experiments/am3352-g350-pin-allocation/circuit.json'
const baselinePath='dist/experiments/am3352-g350-critical-placement/circuit.json'
const read=p=>JSON.parse(readFileSync(p)),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const d=read(circuitPath),old=read(baselinePath)
const typeCache=new WeakMap()
const types=(a,t)=>{
 if(!typeCache.has(a)){
  const m=new Map()
  for(const x of a){if(!m.has(x.type))m.set(x.type,[]);m.get(x.type).push(x)}
  typeCache.set(a,m)
 }
 return typeCache.get(a).get(t)??[]
}
const sourceCache=new WeakMap(),pcbCache=new WeakMap(),idCache=new WeakMap()
const comp=(a,name)=>{
 if(!sourceCache.has(a))sourceCache.set(a,new Map(types(a,'source_component').map(x=>[x.name,x])))
 return sourceCache.get(a).get(name)
}
const byId=(a,type,id)=>{
 if(!idCache.has(a))idCache.set(a,new Map())
 const m=idCache.get(a)
 if(!m.has(type))m.set(type,new Map(types(a,type).map(x=>[x[`${type}_id`],x])))
 return m.get(type).get(id)
}
const pcb=(a,name)=>{
 if(!pcbCache.has(a))pcbCache.set(a,new Map(types(a,'pcb_component').map(x=>[x.source_component_id,x])))
 return pcbCache.get(a).get(comp(a,name)?.source_component_id)
}
const port=(a,name,hint)=>{
 const ps=types(a,'source_port').filter(p=>p.source_component_id===comp(a,name)?.source_component_id&&p.port_hints.includes(String(hint)))
 assert.equal(ps.length,1,`${name}.${hint} terminal must be unambiguous`);return ps[0]
}
const group=p=>p.subcircuit_connectivity_map_key
const net=(a,name)=>{
 const ns=types(a,'source_net').filter(n=>n.name===name)
 assert.equal(ns.length,1,'Missing/ambiguous net '+name);assert(group(ns[0]));return group(ns[0])
}
const toNet=(name,pin,label)=>assert.equal(group(port(d,name,pin)),net(d,label),`${name}.${pin} -> ${label}`)
const pads=(a,name)=>{
 const id=pcb(a,name)?.pcb_component_id
 return [...types(a,'pcb_smtpad'),...types(a,'pcb_plated_hole')].filter(p=>p.pcb_component_id===id)
}
const padPin=(a,p)=>{
 const pp=byId(a,'pcb_port',p.pcb_port_id)
 assert(pp,'Physical pad must have a PCB terminal')
 const sp=byId(a,'source_port',pp.source_port_id)
 assert(sp,'PCB terminal must have a source terminal');return String(sp.pin_number??sp.name)
}
const physical=(a,name)=>pads(a,name).map(p=>JSON.stringify({pin:padPin(a,p),...Object.fromEntries([
 'type','shape','x','y','width','height','radius','corner_radius','points','ccw_rotation',
 'outer_width','outer_height','hole_width','hole_height','hole_diameter','layer','layers',
 'is_covered_with_solder_mask'].map(k=>[k,p[k]]))})).sort()
const board=types(d,'pcb_board')
assert.equal(board.length,1);assert.equal(board[0].num_layers,4)
assert.equal(board[0].width,76);assert.equal(board[0].height,118);assert.equal(board[0].thickness,1.6)
assert.deepEqual(board[0],types(old,'pcb_board')[0])
assert.deepEqual(board[0].outline,read('mechanical/g350-provisional-outline.json').outline)
for(const t of ['pcb_trace','pcb_via','pcb_copper_pour'])assert.equal(types(d,t).length,0,'Placement cannot contain stale '+t)
assert.equal(d.filter(x=>x.type.endsWith('_error')).length,0)
assert.equal(types(d,'source_component').length,280)
assert.equal(types(d,'pcb_component').length,280)
assert.equal(types(old,'source_component').length,277)
assert.equal(new Set(types(d,'source_component').map(s=>s.name)).size,280)

// All 277 prior placements, copper/drills, NC declarations and procurement
// identities must survive. Only append three parts and repair the two nets.
for(const s of types(old,'source_component')){
 const n=comp(d,s.name);assert(n,'Lost prior component '+s.name)
 for(const k of ['manufacturer_part_number','supplier_part_numbers','do_not_place']){
  if(s.name==='R_LCD_BL_PD'&&k!=='do_not_place')continue
  assert.deepEqual(n[k],s[k],`${s.name}: ${k}`)
 }
 const p=pcb(d,s.name),op=pcb(old,s.name)
 for(const k of ['center','layer','rotation','width','height'])assert.deepEqual(p[k],op[k],`${s.name}: unplanned ${k} change`)
 assert.deepEqual(physical(d,s.name),physical(old,s.name),'Unplanned physical pad change '+s.name)
 for(const osp of types(old,'source_port').filter(p=>p.source_component_id===s.source_component_id)){
  const nsp=port(d,s.name,osp.pin_number??osp.name)
  assert.equal(nsp.do_not_connect,osp.do_not_connect,`${s.name}: NC declaration changed`)
 }
}

const oldNames=new Set(types(old,'source_component').map(c=>c.name))
const terminalKey=(a,p)=>`${types(a,'source_component').find(c=>c.source_component_id===p.source_component_id).name}:${p.pin_number??p.name}`
const projection=a=>{
 const m=new Map()
 for(const p of types(a,'source_port')){
  const key=terminalKey(a,p)
  if(!oldNames.has(key.split(':')[0]))continue
  const g=group(p)??`ISOLATED:${key}`
  if(!m.has(g))m.set(g,[]);m.get(g).push(key)
 }
 return [...m.values()].filter(v=>v.length>1).map(v=>v.sort().join('|')).sort()
}
const expected=projection(old)
const merge=['U_SOC:309','J_SD:9','R_SD_CD:2','U_LCD_BL:2','R_LCD_BL_PD:1'].sort().join('|')
assert(expected.includes(merge),'The reviewed historical conflict must be reproduced exactly')
assert.equal(group(port(old,'U_SOC','U14')),undefined,'Replacement PWM ball must have been free')
expected.splice(expected.indexOf(merge),1)
expected.push(['U_SOC:309','J_SD:9','R_SD_CD:2'].sort().join('|'),['U_SOC:251','R_LCD_BL_PD:1'].sort().join('|'))
assert.deepEqual(projection(d),expected.sort(),'Only the reviewed card-detect/PWM split is permitted')

// This independent collision check detects the old bug despite passing
// physical shorts checks. Every explicit net name in this design is distinct.
const mergedNames=a=>{
 const m=new Map()
 for(const n of types(a,'source_net')){const g=group(n);assert(g);if(!m.has(g))m.set(g,[]);m.get(g).push(n.name)}
 return [...m.values()].filter(v=>v.length>1).map(v=>v.sort())
}
assert.deepEqual(mergedNames(old),[['LCD_BL_PWM','SD_CD']])
assert.deepEqual(mergedNames(d),[],'Unexpected merge of independently named functional nets')

// Independently transcribed ZCZ ball allocations from SPRS717L Tables4-2/4-5.
const allocations=[['C18','SD_CD'],['U14','LCD_BL_PWM'],['A17','LCD_SPI_CLK'],
 ['B16','LCD_SPI_MOSI'],['C15','LCD_CS1n'],['D13','LCD_RESETn'],
 ['D12','AUDIO_DIN'],['A13','AUDIO_BCLK'],['B13','AUDIO_LRCLK'],['A14','AUDIO_ENABLE'],
 ['E15','UART0_RX'],['E16','UART0_TX'],['C17','I2C0_SDA'],['C16','I2C0_SCL'],
 ['G18','SD_CMD'],['G17','SD_CLK_CPU'],['G16','SD_DAT0'],['G15','SD_DAT1'],['F18','SD_DAT2'],['F17','SD_DAT3']]
for(const [ball,label] of allocations)toNet('U_SOC',ball,label)
assert.equal(new Set(allocations.map(([ball])=>ball)).size,allocations.length)
assert.equal(new Set(allocations.map(([,label])=>net(d,label))).size,allocations.length)
toNet('J_SD',9,'SD_CD');toNet('R_SD_CD',2,'SD_CD')
toNet('U_SOC','P12','ANALOG_1V8');toNet('U_SOC','P13','ANALOG_1V8')
for(const [pin,label] of [[1,'GND'],[2,'LCD_BL_PWM'],[3,'GND'],[4,'LCD_BL_CTRL'],[5,'ANALOG_1V8']])toNet('U_LCD_PWM_BUF',pin,label)
for(const [name,pin,label] of [['C_LCD_PWM_BUF',1,'ANALOG_1V8'],['C_LCD_PWM_BUF',2,'GND'],
 ['R_LCD_CTRL_PD',1,'LCD_BL_CTRL'],['R_LCD_CTRL_PD',2,'GND'],['U_LCD_BL',2,'LCD_BL_CTRL'],
 ['R_LCD_BL_PD',1,'LCD_BL_PWM'],['R_LCD_BL_PD',2,'GND']])toNet(name,pin,label)
assert.equal(new Set(['LCD_BL_PWM','LCD_BL_CTRL','SD_CD','GND','ANALOG_1V8'].map(n=>net(d,n))).size,5)
for(const [name,mpn,code] of [['U_LCD_PWM_BUF','SN74LVC1G125DBVR','C23654'],
 ['C_LCD_PWM_BUF','CL05B104KO5NNNC','C1525'],['R_LCD_CTRL_PD','0402WGF3302TCE','C25779'],
 ['R_LCD_BL_PD','0402WGF3302TCE','C25779']]){
 assert.equal(comp(d,name).manufacturer_part_number,mpn)
 assert.deepEqual(comp(d,name).supplier_part_numbers.jlcpcb,[code])
 if(name!=='R_LCD_BL_PD')assert.equal(pcb(d,name).layer,'bottom')
}
assert.equal(comp(d,'R_LCD_BL_PD').resistance,33000)
assert.equal(comp(d,'R_LCD_CTRL_PD').resistance,33000)
assert.equal(comp(d,'C_LCD_PWM_BUF').capacitance,1e-7)
// TI DBV drawing rotated90deg, then mirrored in X for bottom assembly.
const expectedPads=[[1,.95,-1.3],[2,0,-1.3],[3,-.95,-1.3],[4,-.95,1.3],[5,.95,1.3]]
const buf=pcb(d,'U_LCD_PWM_BUF')
for(const [pin,x,y] of expectedPads){
 const ps=pads(d,'U_LCD_PWM_BUF').filter(p=>padPin(d,p)===String(pin));assert.equal(ps.length,1)
 const p=ps[0];assert.equal(p.shape,'rect');assert.equal(p.width,.6);assert.equal(p.height,1.1)
 assert(Math.abs(p.x-buf.center.x-x)<1e-9);assert(Math.abs(p.y-buf.center.y-y)<1e-9)
}
assert.equal(pads(d,'U_LCD_PWM_BUF').length,5)
const nearestPad=(name,pin)=>pads(d,name).find(p=>padPin(d,p)===String(pin))
const vcc=nearestPad('U_LCD_PWM_BUF',5),cp=nearestPad('C_LCD_PWM_BUF',1)
const bypassSupplyDistanceMm=Math.hypot(vcc.x-cp.x,vcc.y-cp.y)
assert(bypassSupplyDistanceMm<2.5,'Buffer capacitor must stay by its supply terminal')

const box=c=>c.outline?{minX:Math.min(...c.outline.map(p=>p.x)),maxX:Math.max(...c.outline.map(p=>p.x)),
 minY:Math.min(...c.outline.map(p=>p.y)),maxY:Math.max(...c.outline.map(p=>p.y))}:
 {minX:(c.center?.x??c.x)-(c.width??2*c.radius)/2,maxX:(c.center?.x??c.x)+(c.width??2*c.radius)/2,
 minY:(c.center?.y??c.y)-(c.height??2*c.radius)/2,maxY:(c.center?.y??c.y)+(c.height??2*c.radius)/2}
const courts=d.filter(x=>x.type.startsWith('pcb_courtyard_'))
assert(courts.filter(c=>c.layer==='bottom').length>100)
const newNames=['U_LCD_PWM_BUF','C_LCD_PWM_BUF','R_LCD_CTRL_PD']
for(const name of newNames){
 const id=pcb(d,name).pcb_component_id, own=courts.filter(c=>c.pcb_component_id===id)
 assert.equal(own.length,1)
 assert.equal(own[0].layer,'bottom')
 const b=box(own[0]);assert(Object.values(b).every(Number.isFinite))
 for(const c of courts.filter(c=>c.layer==='bottom'&&c.pcb_component_id!==id)){
  const q=box(c)
  assert(b.maxX<=q.minX||q.maxX<=b.minX||b.maxY<=q.minY||q.maxY<=b.minY,'New courtyard overlap: '+name+' / '+c.pcb_component_id)
 }
}

// Preserve old native stencil geometry, including the explicitly unqualified
// eight through-hole apertures. Only the nine pads of the three additions add paste.
const pasteProjection=a=>types(a,'pcb_solder_paste').filter(p=>{
 const c=byId(a,'pcb_component',p.pcb_component_id)
 return !c||oldNames.has(byId(a,'source_component',c.source_component_id)?.name)
}).map(p=>JSON.stringify(Object.fromEntries(['shape','x','y','width','height','radius',
 'points','ccw_rotation','layer','layers'].map(k=>[k,p[k]])))).sort()
assert.deepEqual(pasteProjection(d),pasteProjection(old),'Prior stencil geometry must be preserved')
assert.equal(types(d,'pcb_solder_paste').length-types(old,'pcb_solder_paste').length,9)

const poly=board[0].outline
const inside=p=>{
 let yes=false
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j]
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes
 }
 return yes
}
const clearance=p=>{
 const distance=Math.min(...poly.map((a,i)=>{
  const b=poly[(i+1)%poly.length],x=b.x-a.x,y=b.y-a.y
  const t=Math.max(0,Math.min(1,((p.x-a.x)*x+(p.y-a.y)*y)/(x*x+y*y)))
  return Math.hypot(p.x-a.x-t*x,p.y-a.y-t*y)
 }))
 return inside(p)?distance:-distance
}
let newPadEdgeClearanceLowerBoundMm=Infinity
for(const name of newNames)for(const p of pads(d,name)){
 assert.equal(p.shape,'rect');assert.equal(p.ccw_rotation??0,0)
 const corners=[[-1,-1],[-1,1],[1,1],[1,-1]].map(([x,y])=>({x:p.x+x*p.width/2,y:p.y+y*p.height/2}))
 for(let i=0;i<4;i++){
  const a=corners[i],b=corners[(i+1)%4],n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.1)
  for(let j=0;j<=n;j++)newPadEdgeClearanceLowerBoundMm=Math.min(newPadEdgeClearanceLowerBoundMm,
   clearance({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n})-.05)
 }
}
assert(newPadEdgeClearanceLowerBoundMm>=.3,'New pads must stay inside the declared copper-to-edge allowance')

// Worst-case DC logic margins; shared VDDSHV3/buffer rail correlation matters.
// Actual routed rail drop, startup waveform and capacitive load remain open.
const vmin=1.71,vmax=1.89,rmin=33000*.99,rmax=33000*1.01
const calculations={supplyRangeV:[vmin,vmax],cpuToBufferHighMarginV:.35*vmin-.45,
 cpuToBufferLowMarginV:.35*vmin-.45,
 bufferToDriverHighMarginV:vmin-.1-1.2,bufferToDriverLowMarginV:.4-.1,
 driverDcLoadWorstA:vmax/rmin+vmax/400000,
 driverPowerOffVoltageWorstV:10e-6/(1/rmax+1/1600000),
 bufferInputResetVoltageWorstV:13e-6*rmax,
 bufferInputResetLowMarginV:.35*vmin-13e-6*rmax,
 loadBasis:'33k +/-1%, CTRL internal pulldown minimum400k; <100uA DC output load.',
 powerOffBasis:'10uA buffer Ioff, 33k +1% and CTRL maximum1600k; CTRL <0.4V.'}
assert(calculations.driverDcLoadWorstA<100e-6)
assert(calculations.driverPowerOffVoltageWorstV<.4)
for(const k of ['cpuToBufferHighMarginV','cpuToBufferLowMarginV','bufferToDriverHighMarginV','bufferToDriverLowMarginV','bufferInputResetLowMarginV'])assert(calculations[k]>0)

const inputs=[circuitPath,baselinePath,'experiments/am3352-g350-pin-allocation.circuit.tsx',
 'lib/am3352/placement/BacklightPinAllocation.tsx','imports/SN74LVC1G125DBVR.tsx','imports/A_0402WGF3302TCE.tsx',
 'imports/CL05B104KO5NNNC.tsx','reference/am3352/am3352.pdf',
 'reference/am3352/display/TPS61165-datasheet.pdf','reference/am3352/display/SN74LVC1G125-datasheet.pdf',
 'mechanical/g350-provisional-outline.json','scripts/check-g350-pin-allocation.mjs']
const report={status:'PASS_PIN_ALLOCATION_AND_PLACEMENT_ONLY',fabricationReady:false,
 routingPermitted:false,originalShellFitVerified:false,logicalComponents:280,preservedPriorComponents:277,
 addedComponents:3,copperLayers:4,dimensionsMm:{width:76,height:118,thickness:1.6},
 priorPhysicalGeometryPreserved:true,onlyReviewedTerminalSplitApplied:true,
 priorNativeAperturesPreserved:true,newPadEdgeClearanceLowerBoundMm,
 allExplicitNetNamesDistinct:true,historicalNegativeControlDetected:true,
 independentlyCheckedCpuAllocations:allocations,bufferPinoutAndManufacturerLandPatternVerified:true,
 bufferBypassSupplyPadDistanceMm:bypassSupplyDistanceMm,newBottomCourtyardsClear:true,
 nativeErrors:0,physicalPadsAndPlatedHoles:types(d,'pcb_smtpad').length+types(d,'pcb_plated_hole').length,
 logicCalculations:calculations,
 scope:'Unrouted source/PCB terminal mapping and placement. Schematic rendering, copper continuity, return loops, power sequencing, firmware, shell fit and fabrication release are not verified.',
 hashes:Object.fromEntries(inputs.map(p=>[p,sha(p)]))}
writeFileSync(`${root}/pin-allocation-audit.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({...report,hashes:'stored in source-bound audit'},null,2))
