import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertSourceCopper} from './lib/am3352-source-copper.mjs'

// Actual generated nets, pads and keepouts, independently checked against
// AM3352 Table5-10, TPS62162/TPS3808 pin tables and Hirose DM3 page9.
const path=process.argv[2]??'dist/experiments/am3352-powered-host/circuit.json'
const raw=readFileSync(path),circuit=JSON.parse(raw),type=t=>circuit.filter(e=>e.type===t)
const components=type('source_component'),ports=type('source_port'),nets=type('source_net'),traces=type('source_trace')
const component=name=>{const c=components.find(c=>c.name===name);assert(c,`Missing ${name}`);return c}
const port=(name,pin)=>{const p=ports.find(p=>p.source_component_id===component(name).source_component_id&&
  (typeof pin==='number'?p.pin_number===pin:p.name===pin));assert(p,`Missing ${name}.${pin}`);return p}
const physical=name=>{const c=type('pcb_component').find(c=>c.source_component_id===component(name).source_component_id);assert(c);return c}
const point=(name,pin)=>{const p=type('pcb_port').find(p=>p.source_port_id===port(name,pin).source_port_id);assert(p);return p}
const parent=new Map(),root=n=>{if(!parent.has(n))parent.set(n,n);if(parent.get(n)!==n)parent.set(n,root(parent.get(n)));return parent.get(n)}
for(const t of traces){const ids=[...t.connected_source_port_ids,...t.connected_source_net_ids];ids.slice(1).forEach(id=>parent.set(root(ids[0]),root(id)))}
const wired=(name,pin,net)=>assert.deepEqual(nets.filter(n=>root(n.source_net_id)===root(port(name,pin).source_port_id)).map(n=>n.name),[net],`${name}.${pin}`)
const open=(name,pin)=>{const p=port(name,pin);assert.equal(p.do_not_connect,true);assert(!traces.some(t=>t.connected_source_port_ids.includes(p.source_port_id)))}
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)
assert.equal(type('pcb_board')[0].num_layers,4)
assert.equal(circuit.filter(e=>e.type.endsWith('_error')).length,0,'Unresolved source or placement errors')
const sourceCopper=assertSourceCopper(circuit)
for(const [name,mpn,jlc] of [['J_SD','DM3D-SF','C719027'],['U_SD_REG','TPS62162DSGR','C40256'],['U_POR','TPS3808G33DBVR','C43698']]){
  assert.equal(component(name).manufacturer_part_number,mpn);assert.deepEqual(component(name).supplier_part_numbers.jlcpcb,[jlc])
}
for(const [pin,net] of Object.entries({1:'SD_DAT2',2:'SD_DAT3',3:'SD_CMD',4:'PERIPH_3V3',5:'SD_CLK_CARD',6:'GND',
  7:'SD_DAT0',8:'SD_DAT1',9:'SD_CD',10:'GND',11:'GND',12:'GND',13:'GND',14:'GND'}))wired('J_SD',Number(pin),net)
for(const [ball,net] of Object.entries({G16:'SD_DAT0',G15:'SD_DAT1',F18:'SD_DAT2',F17:'SD_DAT3',G18:'SD_CMD',G17:'SD_CLK_CPU',C18:'SD_CD',H14:'PERIPH_3V3',J14:'PERIPH_3V3'}))wired('U_SOC',ball,net)
for(const name of ['DAT0','DAT1','DAT2','DAT3','CMD']){
  assert.equal(component(`R_SD_${name}`).resistance,10000)
  wired(`R_SD_${name}`,1,'PERIPH_3V3');wired(`R_SD_${name}`,2,`SD_${name}`)
}
assert.equal(component('R_SD_CD').resistance,10000);wired('R_SD_CD',1,'IO_3V3');wired('R_SD_CD',2,'SD_CD')
assert.equal(component('R_SD_CLK').resistance,33);wired('R_SD_CLK',1,'SD_CLK_CPU');wired('R_SD_CLK',2,'SD_CLK_CARD')
const clockResistorDistance=near(point('R_SD_CLK',1),point('U_SOC','G17'))
assert(clockResistorDistance<=5,'Clock series resistor must remain close to the CPU')
for(const [pin,net] of Object.entries({1:'GND',2:'VIO_BOOST5V',3:'IO_3V3',4:'GND',5:'GND',6:'PERIPH_3V3',7:'PERIPH_SW',9:'GND'}))wired('U_SD_REG',Number(pin),net)
open('U_SD_REG',8)
assert.equal(component('L_SD_REG').inductance,'2.2uH')
wired('L_SD_REG',1,'PERIPH_SW');wired('L_SD_REG',2,'PERIPH_3V3')
for(const [name,net,value] of [['C_SD_REG_IN','VIO_BOOST5V',22e-6],['C_SD_REG_HF','VIO_BOOST5V',100e-9],
  ['C_SD_REG_OUT','PERIPH_3V3',22e-6],['C_SD_SOCKET_HF','PERIPH_3V3',100e-9],['C_SD_SOCKET_BULK','PERIPH_3V3',22e-6],
  ['C_POR_BYPASS','VDDS_1V8',100e-9],['C_POR_SENSE','PERIPH_3V3',10e-9]]){
  assert.equal(component(name).capacitance,value);wired(name,1,net);wired(name,2,'GND')
}
const socketHfDistance=near(point('C_SD_SOCKET_HF',1),point('J_SD',4))
assert(socketHfDistance<=3);assert(near(point('C_SD_SOCKET_BULK',1),point('J_SD',4))<=6)
assert(near(point('C_SD_REG_HF',1),point('U_SD_REG',2))<=3)
assert(near(point('L_SD_REG',1),point('U_SD_REG',7))<=3)
for(const [pin,net] of Object.entries({1:'CPU_PORn',2:'GND',3:'PMIC_MAIN_PGOOD',5:'PERIPH_3V3',6:'VDDS_1V8'}))wired('U_POR',Number(pin),net)
open('U_POR',4)
wired('U_PMIC',26,'PMIC_MAIN_PGOOD')
assert.equal(ports.filter(p=>root(p.source_port_id)===root(port('U_PMIC',26).source_port_id)).length,2,'Push-pull PGOOD must only drive supervisor MR')
assert.notEqual(root(port('U_POR',1).source_port_id),root(port('U_PMIC',26).source_port_id),'Do not wire-AND supervisor RESET with push-pull PGOOD')
assert.equal(component('R_CPU_POR').resistance,100000)
wired('R_CPU_POR',1,'VDDS_1V8');wired('R_CPU_POR',2,'CPU_PORn')
// Socket negative-Y opening rotates toward +X/right edge. Validate the
// generated pads, not merely a JSX rotation property.
const socket=physical('J_SD'),pads=type('pcb_smtpad').filter(p=>p.pcb_component_id===socket.pcb_component_id)
assert.equal(pads.length,14);assert.equal(socket.layer,'top');assert.equal(socket.rotation,90)
assert(point('J_SD',4).x>socket.center.x+5)
const signalPads=Array.from({length:8},(_,i)=>point('J_SD',i+1))
for(let i=1;i<8;i++)assert(Math.abs(near(signalPads[i],signalPads[i-1])-1.1)<.0003,'Primary SD contact pitch')
const pin8=point('J_SD',8),land8=pads.find(p=>p.pcb_port_id===pin8.pcb_port_id||p.port_hints?.includes('pin8'))
assert(land8,'Pin8 physical land')
// At +90deg, the imported land top is to the left of its centre.
const datumX=pin8.x-1.7500092/2,datumY=pin8.y
const requirements=[{left:datumX-6.2,right:datumX-3.8,bottom:datumY-.6,top:datumY+8.3},
  {left:datumX-10.4,right:datumX-8,bottom:datumY+2.35,top:datumY+5.25}]
const keepouts=type('pcb_keepout')
assert.equal(keepouts.length,2)
for(const r of requirements){
  const k=keepouts.find(k=>Math.abs(k.center.x-(r.left+r.right)/2)<1e-5&&Math.abs(k.center.y-(r.bottom+r.top)/2)<1e-5)
  assert(k,'Missing manufacturer copper keepout');assert.deepEqual(k.layers,['top'])
  assert(k.width>=r.right-r.left-1e-5&&k.height>=r.top-r.bottom-1e-5)
  assert.equal(k.warning_only??false,false);assert.equal(k.allow_traces??false,false)
  assert.deepEqual(k.excluded_pcb_component_ids,[socket.pcb_component_id])
  for(const pad of pads){
    const rotated=Math.abs((pad.ccw_rotation??0)%180-90)<1e-3
    const w=rotated?pad.height:pad.width,h=rotated?pad.width:pad.height
    assert(!(pad.x+w/2>r.left&&pad.x-w/2<r.right&&pad.y+h/2>r.bottom&&pad.y-h/2<r.top),'Socket land intersects no-copper area')
  }
}
const report={status:'AM3352_LOGICAL_MICROSD_POWER_RESET_PASS_ROUTING_INCOMPLETE',source:{path,sha256:createHash('sha256').update(raw).digest('hex')},
  components:components.length,copperLayerCount:4,storage:{interface:'MMC0 4-bit 3.3V',socket:'DM3D-SF',contactCurrentRatingA:.5,cardDetect:'C18 GPIO0_7 active low',
    socketLandCount:14,clockSeriesOhms:33,clockResistorDistanceMm:clockResistorDistance,socketHfCapDistanceMm:socketHfDistance,manufacturerCopperKeepouts:2},
  power:{cardAndIoBankRail:'PERIPH_3V3',regulator:'TPS62162 fixed3.3V/1A',enabledBy:'IO_3V3',cpuIoBankMaxMa:50,completeLoadBudgetQualified:false},
  reset:{supervisor:'TPS3808G33',vdd:'VDDS_1V8',sense:'PERIPH_3V3',manualResetInput:'PMIC_MAIN_PGOOD',output:'CPU_PORn',nominalDelayMs:20,pushPullOutputsWireAnded:false},
  fabricationReady:false,poweredHost:false,sourceCopper,scope:'Generated source/placement/keepout audit with documented package reference escapes and bypass loops. No storage copper or tested Linux installer; remaining power copper, effective capacitance, startup/shutdown and full load/thermal budget remain required.',
  primarySources:['https://www.ti.com/lit/ds/symlink/am3352.pdf','https://www.ti.com/lit/ds/symlink/tps62162.pdf','https://www.ti.com/lit/ds/symlink/tps3808.pdf',
    'https://media.ret.hu/datasheet/DM3_Catalog_D49662_en.pdf']}
writeFileSync('checks/integrated/am3352-storage-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
