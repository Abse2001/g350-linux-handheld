import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Independent checks of generated package terminals and actual component
// values against SPRS717L and SPRUH73Q, not JSX selector strings alone.
const path=process.argv[2]??'dist/experiments/am3352-powered-host/circuit.json'
const raw=readFileSync(path),circuit=JSON.parse(raw),type=t=>circuit.filter(e=>e.type===t)
const components=type('source_component'),ports=type('source_port'),nets=type('source_net'),traces=type('source_trace')
const cpu=JSON.parse(readFileSync('lib/am3352/cpu-ball-map.json')).pins
const comp=name=>{const c=components.find(c=>c.name===name);assert(c,`Missing ${name}`);return c}
const port=(name,pin)=>{const p=ports.find(p=>p.source_component_id===comp(name).source_component_id&&(typeof pin==='number'?p.pin_number===pin:p.name===pin));assert(p,`Missing ${name}.${pin}`);return p}
const parents=new Map(),root=n=>{if(!parents.has(n))parents.set(n,n);if(parents.get(n)!==n)parents.set(n,root(parents.get(n)));return parents.get(n)}
const join=(a,b)=>parents.set(root(a),root(b))
for(const t of traces){const ids=[...t.connected_source_port_ids,...t.connected_source_net_ids];ids.slice(1).forEach(id=>join(ids[0],id))}
for(const c of components)for(const ids of c.internally_connected_source_port_ids??[])ids.slice(1).forEach(id=>join(ids[0],id))
const wired=(name,pin,net)=>assert.deepEqual(nets.filter(n=>root(n.source_net_id)===root(port(name,pin).source_port_id)).map(n=>n.name),[net],`${name}.${pin}`)
const cpuFunction=fn=>{const matches=Object.entries(cpu).filter(([,f])=>f===fn);assert.equal(matches.length,1);return matches[0][0]}
assert.equal(type('pcb_board')[0].num_layers,4)
assert.equal(circuit.filter(e=>e.type.endsWith('_error')).length,0,'Source/placement errors remain')
assert.equal(comp('X_MAIN').frequency,24e6)
assert.equal(comp('X_MAIN').load_capacitance,12e-12)
assert.deepEqual(comp('X_MAIN').supplier_part_numbers.jlcpcb,['C7420736'])
wired('U_SOC','V10','XTAL_IN');wired('U_SOC','U11','XTAL_OUT')
for(const [pin,net] of [[1,'XTAL_IN'],[2,'GND'],[3,'XTAL_DRIVE'],[4,'GND']])wired('X_MAIN',pin,net)
assert.notEqual(root(port('X_MAIN',1).source_port_id),root(port('X_MAIN',3).source_port_id),'Crystal signal terminals must not be internally shorted')
assert.equal(comp('R_XTAL_DAMP').resistance,0)
wired('R_XTAL_DAMP',1,'XTAL_OUT');wired('R_XTAL_DAMP',2,'XTAL_DRIVE')
for(const [name,net] of [['C_XTAL_IN','XTAL_IN'],['C_XTAL_OUT','XTAL_DRIVE']]){
  assert.equal(comp(name).capacitance,18e-12);wired(name,1,net);wired(name,2,'GND')
}
assert.equal(comp('R_XTAL_BIAS_DNP').resistance,1e6)
wired('R_XTAL_BIAS_DNP',1,'XTAL_IN');wired('R_XTAL_BIAS_DNP',2,'XTAL_OUT')
const bias=type('pcb_component').find(p=>p.source_component_id===comp('R_XTAL_BIAS_DNP').source_component_id)
assert.equal(bias.do_not_place,true)
assert.equal(type('pcb_smtpad').filter(p=>p.pcb_component_id===bias.pcb_component_id).length,2,'DNP resistor must retain its physical lands')
// Table 26-7: 24MHz, MMC0 -> SPI0 -> UART0 -> USB0. All 16 bits
// are externally strapped; SYSBOOT bits 15:0 are LCD_DATA15:0.
const expectedWord=0x4017
for(let bit=0;bit<16;bit++){
  const name=`R_SYSBOOT${bit}`,net=`LCD_DATA${bit}`
  assert.equal(comp(name).resistance,10000)
  wired(name,1,(expectedWord>>bit)&1?'IO_3V3':'GND');wired(name,2,net)
  wired('U_SOC',cpuFunction(net),net)
}
for(const [fn,net,rail] of [['EMU0','JTAG_EMU0','IO_3V3'],['EMU1','JTAG_EMU1','IO_3V3'],['TMS','JTAG_TMS','IO_3V3'],
  ['TDI','JTAG_TDI','IO_3V3'],['TCK','JTAG_TCK','GND'],['TRSTn','JTAG_TRSTn','GND'],['WARMRSTn','WARM_RESETn','IO_3V3']]){
  wired('U_SOC',cpuFunction(fn),net);assert.equal(comp(`R_${fn}`).resistance,4700)
  wired(`R_${fn}`,1,rail);wired(`R_${fn}`,2,net)
}
for(const [fn,net] of [['TDO','JTAG_TDO'],['UART0_RXD','UART0_RX'],['UART0_TXD','UART0_TX']])wired('U_SOC',cpuFunction(fn),net)
wired('SW_RESET',1,'WARM_RESETn');wired('SW_RESET',3,'GND')
for(const fn of ['RTC_XTALIN','RTC_XTALOUT']){
  const p=port('U_SOC',cpuFunction(fn));assert.equal(p.do_not_connect,true)
  assert(!traces.some(t=>t.connected_source_port_ids.includes(p.source_port_id)))
}
const accessPads=components.filter(c=>/^TP_(JTAG_|WARM_RESETn$|GND$|IO_3V3$|UART_)/.test(c.name))
assert.equal(accessPads.length,14)
for(const c of accessPads){
  assert.equal(c.footprint_variant,'pad');assert.equal(c.pad_diameter,1.5)
  const physical=type('pcb_component').find(p=>p.source_component_id===c.source_component_id)
  assert.equal(type('pcb_smtpad').filter(p=>p.pcb_component_id===physical.pcb_component_id).length,1)
  assert.equal(type('pcb_plated_hole').filter(p=>p.pcb_component_id===physical.pcb_component_id).length,0)
}
const report={status:'AM3352_LOGICAL_CLOCK_BOOT_DEBUG_PASS_ROUTING_INCOMPLETE',
  source:{path,sha256:createHash('sha256').update(raw).digest('hex')},components:components.length,
  copperLayerCount:4,clockFrequencyHz:24e6,bootWord:'0x4017',bootOrder:['MMC0','SPI0','UART0','USB0'],
  externallyStrappedBits:16,smtDebugAccessPads:14,biasResistorDnpPadsRetained:true,
  fabricationReady:false,oscillatorStartupQualified:false,scope:'Source and placement audit only; clock routing, oscillator parasitics, boot firmware and complete PCB qualification remain required.'}
writeFileSync('checks/integrated/am3352-boot-validation.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report))
