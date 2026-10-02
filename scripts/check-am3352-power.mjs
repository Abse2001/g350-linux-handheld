import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Audit actual generated source-port/net connectivity against primary
// requirements. This is a logical power check, never a routed-PCB release.
const path=process.argv[2]??'dist/experiments/am3352-powered-host/circuit.json'
const raw=readFileSync(path),circuit=JSON.parse(raw),type=t=>circuit.filter(e=>e.type===t)
const components=type('source_component'),ports=type('source_port'),nets=type('source_net'),traces=type('source_trace')
const board=type('pcb_board')[0],pcbComponents=type('pcb_component'),pcbPorts=type('pcb_port')
const cpu=JSON.parse(readFileSync('lib/am3352/cpu-ball-map.json')).pins
const ram=JSON.parse(readFileSync('lib/am3352/ram-ball-map.json')).pins
const parent=new Map(),root=id=>{if(!parent.has(id))parent.set(id,id);if(parent.get(id)!==id)parent.set(id,root(parent.get(id)));return parent.get(id)}
const join=(a,b)=>parent.set(root(a),root(b))
for(const t of traces) {
  const members=[...t.connected_source_port_ids,...t.connected_source_net_ids]
  members.forEach(id=>join(members[0],id))
}
const component=name=>{const c=components.find(c=>c.name===name);assert(c,`Missing ${name}`);return c}
const port=(name,pin)=>{const p=ports.find(p=>p.source_component_id===component(name).source_component_id&&
  (typeof pin==='number'?p.pin_number===pin:p.name===pin||p.port_hints.includes(pin)));assert(p,`Missing ${name}.${pin}`);return p}
const netNames=p=>nets.filter(n=>root(n.source_net_id)===root(p.source_port_id)).map(n=>n.name)
const wired=(name,pin,net)=>assert.deepEqual(netNames(port(name,pin)),[net],`Actual rail mismatch on ${name}.${pin}`)
const open=(name,pin)=>{
  const p=port(name,pin)
  assert(!traces.some(t=>t.connected_source_port_ids.includes(p.source_port_id)),`Unexpected external connection ${name}.${pin}`)
  assert.equal(p.do_not_connect,true,`Missing explicit no-connect ${name}.${pin}`)
}
assert.equal(board.num_layers,8)
assert.equal(component('U_SOC').manufacturer_part_number,'AM3352BZCZ100')
assert.equal(component('U_RAM').manufacturer_part_number,'MT41K256M16TW-107:P')
assert.equal(component('U_PMIC').manufacturer_part_number,'TPS65217CRSLR')
const counts={cpuSupply:0,cpuGround:0,ramSupply:0,ramGround:0}
// Table 5-10 domains and the AM335x-specific TPS65217C connection diagram.
const fixedCpu={VDDS:'VDDS_1V8',VDDS_RTC:'VDDS_1V8',VDDS_DDR:'DDR_1V5',VDD_CORE:'VDD_CORE',VDD_MPU:'VDD_MPU',VDD_MPU_MON:'VDD_MPU',
  VDDS_OSC:'ANALOG_1V8',VDDS_PLL_DDR:'ANALOG_1V8',VDDS_PLL_CORE_LCD:'ANALOG_1V8',VDDS_PLL_MPU:'ANALOG_1V8',
  VDDS_SRAM_CORE_BG:'ANALOG_1V8',VDDS_SRAM_MPU_BB:'ANALOG_1V8',VDDA1P8V_USB0:'ANALOG_1V8',VDDA1P8V_USB1:'ANALOG_1V8',
  VDDA3P3V_USB0:'IO_3V3',VDDA3P3V_USB1:'IO_3V3',VDDSHV1:'ANALOG_1V8',VDDSHV2:'ANALOG_1V8',VDDSHV3:'ANALOG_1V8',
  VDDSHV4:'IO_3V3',VDDSHV5:'IO_3V3',VDDSHV6:'IO_3V3',VDDA_ADC:'GND',VREFP:'GND',VREFN:'GND',RTC_KALDO_ENn:'GND'}
for(const [ball,fn] of Object.entries(cpu)) {
  if(fn==='VPP'){open('U_SOC',ball);continue}
  const expected=fn.startsWith('VSS')||/^AIN[0-7]$/.test(fn)?'GND':fixedCpu[fn]
  if(/^VDD/.test(fn))assert(expected,`Unreviewed CPU supply ${ball}/${fn}`)
  if(expected){wired('U_SOC',ball,expected);if(fn.startsWith('VSS'))counts.cpuGround++;else if(/^VDD/.test(fn))counts.cpuSupply++}
}
for(const [ball,fn] of Object.entries(ram)) {
  if(fn==='NC'){open('U_RAM',ball);continue}
  const net=fn.startsWith('VDD')?'DDR_1V5':fn.startsWith('VSS')?'GND':fn.startsWith('VREF')?'DDR_VREF':fn==='ZQ'?'DDR_ZQ':undefined
  if(net){wired('U_RAM',ball,net);if(fn.startsWith('VDD'))counts.ramSupply++;if(fn.startsWith('VSS'))counts.ramGround++}
}
assert.equal(counts.ramSupply,18)
assert.equal(counts.ramGround,21)
const pmicPins={1:'LDO2_3V3',2:'VIO_BOOST5V',3:'VDDS_1V8',4:'VBAT',5:'VBAT',6:'VBAT',7:'VSYS',8:'VSYS',9:'PMIC_ENABLE',11:'BAT_NTC',12:'USB_5V',13:'PMIC_WAKEUPn',
  18:'VDDS_1V8',19:'DDR_1V5',20:'SW_DDR',21:'VSYS',22:'VSYS',23:'SW_MPU',24:'VDD_MPU',25:'PMIC_BUTTONn',26:'CPU_PORn',27:'I2C0_SDA',28:'I2C0_SCL',
  29:'VDD_CORE',30:'GND',31:'SW_CORE',32:'VSYS',33:'GND',34:'GND',39:'VSYS',40:'ANALOG_1V8',41:'GND',42:'VIO_BOOST5V',43:'IO_3V3',44:'PMIC_RESETn',45:'PMIC_INTn',46:'RTC_PORn',47:'PMIC_BYPASS',48:'PMIC_INT_LDO',49:'GND'}
for(const [pin,net] of Object.entries(pmicPins))wired('U_PMIC',Number(pin),net)
for(const pin of [10,14,15,16,17,35,36,37,38])open('U_PMIC',pin)
for(const [fn,net] of Object.entries({PMIC_POWER_EN:'PMIC_ENABLE',PWRONRSTn:'CPU_PORn',RTC_PWRONRSTn:'RTC_PORn',EXT_WAKEUP:'PMIC_WAKEUPn',EXTINTn:'PMIC_INTn',I2C0_SDA:'I2C0_SDA',I2C0_SCL:'I2C0_SCL',DDR_VREF:'DDR_VREF',DDR_VTP:'DDR_VTP'}))
  wired('U_SOC',Object.entries(cpu).find(([,f])=>f===fn)[0],net)
const signalMap=JSON.parse(readFileSync('lib/am3352/memory-byte1-swizzled-connections.json'))
for(const m of signalMap) {
  const s=traces.find(t=>t.name===m.name)
  assert(s&&s.connected_source_port_ids.length===2)
  assert(s.connected_source_port_ids.includes(port('U_SOC',m.socBall).source_port_id))
  assert(s.connected_source_port_ids.includes(port('U_RAM',m.ramBall).source_port_id))
}
const cap=(name,net,value)=>{
  assert.equal(component(name).capacitance,value)
  wired(name,1,net);wired(name,2,'GND')
}
for(const fn of ['CAP_VDD_SRAM_CORE','CAP_VDD_SRAM_MPU','CAP_VBB_MPU','CAP_VDD_RTC']) {
  const ball=Object.entries(cpu).find(([,f])=>f===fn)[0]
  wired('U_SOC',ball,fn);cap(`C_${fn}`,fn,1e-6)
  const attached=ports.filter(p=>root(p.source_port_id)===root(port('U_SOC',ball).source_port_id))
  assert.equal(attached.length,2,`${fn} must power no external load`)
}
for(const [name,net,value] of [['C_PMIC_INT_LDO','PMIC_INT_LDO',1e-7],['C_PMIC_BYPASS','PMIC_BYPASS',22e-6]]) {
  cap(name,net,value)
  const members=ports.filter(p=>netNames(p).includes(net))
  assert.equal(members.length,2,`${net} internal bias cannot supply an external load`)
}
const railCaps=[['CORE','VDD_CORE',8],['MPU','VDD_MPU',5],['VDDS','VDDS_1V8',4],['SRAM_CORE','ANALOG_1V8',1],['SRAM_MPU','ANALOG_1V8',1],
  ...Array.from({length:6},(_,i)=>[`HV${i+1}`,i<3?'ANALOG_1V8':'IO_3V3',i===5?6:2])]
for(const [prefix,net,count] of railCaps){cap(`C_${prefix}_BULK`,net,22e-6);for(let n=1;n<=count;n++)cap(`C_${prefix}_${n}`,net,1e-8)}
for(const [fn,net] of Object.entries(fixedCpu).filter(([fn])=>/^VDDS_(OSC|PLL_DDR|PLL_CORE_LCD|PLL_MPU|RTC)$|^VDDA[13]P[83]V_USB[01]$/.test(fn)))cap(`C_${fn}`,net,1e-8)
const bypass=[]
for(const [chip,count,maxDistance] of [['CPU',20,10.16],['RAM',12,3.81]]) {
  const name=chip==='CPU'?'U_SOC':'U_RAM',map=chip==='CPU'?cpu:ram,componentId=component(name).source_component_id
  const power=ports.filter(p=>p.source_component_id===componentId&&(/^VDD/.test(map[p.name])&&(chip==='RAM'||map[p.name]==='VDDS_DDR')))
  const ground=ports.filter(p=>p.source_component_id===componentId&&map[p.name]?.startsWith('VSS'))
  const points=ps=>ps.map(p=>pcbPorts.find(pp=>pp.source_port_id===p.source_port_id))
  let under=0,maxNearestPower=0,maxNearestGround=0
  const packagePcb=pcbComponents.find(p=>p.source_component_id===componentId)
  for(let i=1;i<=count;i++) {
    const n=`C_DDR_${chip}_${i}`;cap(n,'DDR_1V5',1e-7)
    assert.deepEqual(component(n).supplier_part_numbers.jlcpcb,['C1525'])
    const physical=pcbComponents.find(p=>p.source_component_id===component(n).source_component_id),center=physical.center
    const nearest=ps=>Math.min(...points(ps).map(p=>Math.hypot(center.x-p.x,center.y-p.y)))
    const dp=nearest(power),dg=nearest(ground)
    assert(dp<=maxDistance&&dg<=maxDistance,`${n} too far from actual power/ground terminals`)
    maxNearestPower=Math.max(maxNearestPower,dp);maxNearestGround=Math.max(maxNearestGround,dg)
    if(physical.layer!==packagePcb.layer&&Math.abs(center.x-packagePcb.center.x)<packagePcb.width/2&&Math.abs(center.y-packagePcb.center.y)<packagePcb.height/2)under++
  }
  if(chip==='CPU')assert(under>=3,'At least three CPU DDR capacitors must be underneath the package')
  for(let i=1;i<=2;i++)cap(`C_DDR_${chip}_BULK${i}`,'DDR_1V5',22e-6)
  bypass.push({device:chip,hsCapacitors:count,nominalHsUf:count*.1,bulkCapacitors:2,nominalBulkUf:44,underPackage:under,maxNearestPowerMm:maxNearestPower,maxNearestGroundMm:maxNearestGround})
}
for(const n of ['CPU','RAM_CA','RAM_DQ'])cap(`C_VREF_${n}`,'DDR_VREF',1e-7)
for(const [name,value,a,b] of [['R_DDR_VTP',49.9,'DDR_VTP','GND'],['R_DDR_ZQ',240,'DDR_ZQ','GND'],
  ['R_VREF_HI',10000,'DDR_1V5','DDR_VREF'],['R_VREF_LO',10000,'DDR_VREF','GND'],['R_PMIC_SDA',4700,'IO_3V3','I2C0_SDA'],['R_PMIC_SCL',4700,'IO_3V3','I2C0_SCL']]) {
  assert.equal(component(name).resistance,value);wired(name,1,a);wired(name,2,b)
}
for(const [name,a,b] of [['L_DDR','SW_DDR','DDR_1V5'],['L_MPU','SW_MPU','VDD_MPU'],['L_CORE','SW_CORE','VDD_CORE'],['L_IO_BOOST','VSYS','IO_BOOST_SW']]) {
  const value=component(name).inductance
  assert(value===2.2e-6||value==='2.2uH',`${name} must be 2.2uH`);wired(name,1,a);wired(name,2,b)
}
for(const [pin,net] of Object.entries({VIN:'VSYS',EN:'VSYS',GND:'GND',VOUT:'VIO_BOOST5V',FB:'IO_BOOST_FB',SW:'IO_BOOST_SW'}))wired('U_IO_BOOST',pin,net)
assert.equal(component('R_IO_BOOST_HI').resistance,732000)
assert.equal(component('R_IO_BOOST_LO').resistance,100000)
const nativeErrors=circuit.filter(e=>e.type.endsWith('_error'))
assert.equal(nativeErrors.length,0,`Source/placement errors: ${nativeErrors.map(e=>e.message).join('; ')}`)
assert.equal(type('pcb_trace').length,0,'This verifier covers an explicitly unrouted source draft only')
const report={status:'AM3352_LOGICAL_POWER_AND_BYPASS_PASS_ROUTING_INCOMPLETE',circuit:{path,sha256:createHash('sha256').update(raw).digest('hex')},
  toolchain:Object.fromEntries(['tscircuit','@tscircuit/cli','@tscircuit/core','@tscircuit/capacity-autorouter'].map(name=>[name,JSON.parse(readFileSync(`node_modules/${name}/package.json`)).version])),
  components:components.length,memorySignalsDeclared:49,actualConnectedMemoryChannels:0,counts,bypass,explicitNoConnectVpp:true,
  nativeSourcePlacementErrors:0,routedPower:false,completeHost:false,fabricationReady:false,
  scope:'Actual generated logical connections, package supply domains, reset/control connections, bypass values/counts and nominal placement distances. No powered PCB, via topology, impedance, SI, effective-capacitance, startup, USB/battery, peripheral-load or thermal approval.',
  primarySources:['https://www.ti.com/lit/ds/symlink/am3352.pdf','https://www.ti.com/lit/ug/slvu551i/slvu551i.pdf','https://www.ti.com/lit/an/slva686c/slva686c.pdf','https://www.ti.com/lit/an/sprabn2a/sprabn2a.pdf','https://e2e.ti.com/support/processors-group/processors/f/processors-forum/649479/am3352-vpp-pin-connection']}
writeFileSync('checks/integrated/am3352-power-validation.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,components:components.length,counts,bypass,fabricationReady:false}))
