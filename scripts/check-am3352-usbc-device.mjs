import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertSavedDdrCopper} from './lib/am3352-saved-ddr-copper.mjs'

// Audit the generated numeric package connections, not JSX aliases.
// This is a netlist/placement check, never USB or fabrication qualification.
const path=process.argv[2]??'dist/experiments/am3352-usbc-device-source/circuit.json'
const routedLayoutPath=process.argv[3],reportPath=process.argv[4]??'checks/integrated/am3352-usbc-device-validation.json'
const profile=process.argv[5]??'ram180-byte0';assert(['ram180-byte0','ram0-ddr23'].includes(profile))
const active=profile==='ram0-ddr23'
const baselinePath=active?'dist/diagnostics/am3352-ddr23-checked/circuit.json':'dist/diagnostics/am3352-byte-swapped-byte0-checked/circuit.json'
const raw=readFileSync(path),circuit=JSON.parse(raw),baseline=JSON.parse(readFileSync(baselinePath))
const digest=b=>createHash('sha256').update(b).digest('hex')
assert.equal(digest(readFileSync(baselinePath)),active?'2c72f2f082db98ec4b816ac334bd0502b2f1f926abdedd5a995b0ed6bafcab04':'b2a550463ac76cec7149902942f9ad01a3c4e17df5641562f1c7cb52264f284f')
const type=t=>circuit.filter(e=>e.type===t),components=type('source_component'),ports=type('source_port'),nets=type('source_net'),traces=type('source_trace')
const component=n=>{const c=components.find(c=>c.name===n);assert(c,`Missing ${n}`);return c}
const port=(n,pin)=>{const p=ports.find(p=>p.source_component_id===component(n).source_component_id&&
  (typeof pin==='number'?p.pin_number===pin:p.name===pin));assert(p,`Missing ${n}.${pin}`);return p}
const physical=n=>{const c=type('pcb_component').find(c=>c.source_component_id===component(n).source_component_id);assert(c);return c}
const point=(n,pin)=>{const p=type('pcb_port').find(p=>p.source_port_id===port(n,pin).source_port_id);assert(p);return p}
const parent=new Map(),root=n=>{if(!parent.has(n))parent.set(n,n);if(parent.get(n)!==n)parent.set(n,root(parent.get(n)));return parent.get(n)}
for(const t of traces){const ids=[...t.connected_source_port_ids,...t.connected_source_net_ids];ids.slice(1).forEach(id=>parent.set(root(ids[0]),root(id)))}
const wired=(n,pin,net)=>assert.deepEqual(nets.filter(n2=>root(n2.source_net_id)===root(port(n,pin).source_port_id)).map(n2=>n2.name),[net],`${n}.${pin}`)
const open=(n,pin)=>{const p=port(n,pin);assert.equal(p.do_not_connect,true);assert(!traces.some(t=>t.connected_source_port_ids.includes(p.source_port_id)),`${n}.${pin} must remain open`)}
assert.equal(type('pcb_board')[0].num_layers,4)
assert.equal(circuit.filter(e=>e.type.endsWith('_error')).length,0)
assert.equal(components.length,212);assert.equal(type('pcb_smtpad').length,912)
const oldTraceIds=new Set(baseline.filter(e=>e.type==='pcb_trace').map(t=>t.pcb_trace_id))
const sameVia=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8&&a.pcb_trace_id===b.pcb_trace_id&&a.source_net_id===b.source_net_id
const oldVias=baseline.filter(e=>e.type==='pcb_via')
const existingCopper=routedLayoutPath?circuit.filter(e=>e.type==='pcb_trace'?oldTraceIds.has(e.pcb_trace_id):
  e.type==='pcb_via'?oldVias.some(v=>sameVia(e,v)):true):circuit
const sourceCopper=assertSavedDdrCopper(existingCopper,JSON.parse(readFileSync(active?'routing/am3352-guided-both-bytes-and-reset-paths.json':'routing/am3352-ram-rotated-180-byte-swapped-byte0-pair-paths.json')),
  {ramRotation:active?0:180,rotatedD2PowerBridge:!active,ramReferenceEscapes:JSON.parse(readFileSync(active?'lib/am3352/ram-reference-escapes-byte1-access.json':'lib/am3352/ram-reference-escapes-rotated-180.json'))})
const preservedPhysicalRecords={}
for(const t of ['pcb_component','pcb_port','pcb_smtpad','pcb_plated_hole','pcb_trace']){
  const original=baseline.filter(e=>e.type===t),current=type(t)
  assert.deepEqual(current.slice(0,original.length),original,`${t}: existing geometry changed`)
  preservedPhysicalRecords[t]=original.length
}
if(routedLayoutPath){
  for(const v of oldVias){const matches=type('pcb_via').filter(c=>sameVia(c,v));assert.equal(matches.length,1)
    const {pcb_via_id:oldId,...old}=v,{pcb_via_id:newId,...current}=matches[0]
    assert.deepEqual(current,old,'Existing physical via geometry changed')}
}else assert.deepEqual(type('pcb_via'),oldVias)
preservedPhysicalRecords.pcb_via=oldVias.length
for(const [name,mpn,jlc] of [['J_USB','TYPE-C-31-M-12','C165948'],['U_USB_ESD','USBLC6-2SC6','C7519'],
  ['R_USB_CC1','0603WAF5101T5E','C23186'],['R_USB_CC2','0603WAF5101T5E','C23186'],
  ['R_USB_VBUS_SENSE','0603WAF1201T5E','C22765'],['D_USB_VBUS_SENSE','BZT52B5V1','C475656'],
  ['C_USB_ESD','CL05B104KO5NNNC','C1525'],['C_USB_VBUS_SENSE','CL05B104KO5NNNC','C1525']]){
  assert.equal(component(name).manufacturer_part_number,mpn)
  assert.deepEqual(component(name).supplier_part_numbers.jlcpcb,[jlc])
}
for(const [pin,net] of Object.entries({1:'GND',2:'GND',3:'GND',4:'GND',6:'USB_CC1',7:'USB0_DM',8:'USB0_DP',
  9:'USB0_DM',10:'USB0_DP',12:'USB_CC2',13:'GND',14:'GND',15:'USB_5V',16:'USB_5V'}))wired('J_USB',Number(pin),net)
open('J_USB',5);open('J_USB',11)
for(const [ball,net] of Object.entries({N17:'USB0_DP',N18:'USB0_DM',P15:'USB0_VBUS_SENSE'}))wired('U_SOC',ball,net)
for(const ball of ['P16','M15','F16','P17','P18','F15','T18','R17','R18'])open('U_SOC',ball)
wired('U_PMIC',12,'USB_5V')
assert.notEqual(root(port('U_PMIC',12).source_port_id),root(port('U_SOC','P15').source_port_id),'VBUS sense must be isolated by R')
for(const [name,net] of [['R_USB_CC1','USB_CC1'],['R_USB_CC2','USB_CC2']]){
  assert.equal(component(name).resistance,5100);wired(name,1,net);wired(name,2,'GND')
}
assert.notEqual(root(port('J_USB',6).source_port_id),root(port('J_USB',12).source_port_id),'CC1 and CC2 must not be tied together')
for(const [pin,net] of Object.entries({1:'USB0_DM',6:'USB0_DM',3:'USB0_DP',4:'USB0_DP',2:'GND',5:'USB_5V'}))wired('U_USB_ESD',Number(pin),net)
for(const name of ['C_USB_ESD','C_USB_VBUS_SENSE']){
  assert.equal(component(name).capacitance,100e-9);wired(name,1,name==='C_USB_ESD'?'USB_5V':'USB0_VBUS_SENSE');wired(name,2,'GND')
}
assert.equal(component('R_USB_VBUS_SENSE').resistance,1200)
wired('R_USB_VBUS_SENSE',1,'USB_5V');wired('R_USB_VBUS_SENSE',2,'USB0_VBUS_SENSE')
assert.equal(port('D_USB_VBUS_SENSE',1).name,'cathode');assert.equal(port('D_USB_VBUS_SENSE',2).name,'anode')
wired('D_USB_VBUS_SENSE',1,'USB0_VBUS_SENSE');wired('D_USB_VBUS_SENSE',2,'GND')
for(const net of ['USB0_DP','USB0_DM']){
  const connected=ports.filter(p=>root(p.source_port_id)===root(nets.find(n=>n.name===net).source_net_id))
  assert.equal(connected.length,5)
  assert.deepEqual([...new Set(connected.map(p=>components.find(c=>c.source_component_id===p.source_component_id).name))].sort(),['J_USB','U_SOC','U_USB_ESD'])
  assert(traces.find(t=>t.name===net))
}
const pair=type('source_bus').find(b=>b.name==='USB0_PAIR');assert(pair);assert.equal(pair.max_length_skew,.127)
assert.equal(physical('J_USB').rotation,180);assert.equal(physical('J_USB').layer,'top')
const esdBypassDistanceMm=Math.hypot(point('C_USB_ESD',1).x-point('U_USB_ESD',5).x,point('C_USB_ESD',1).y-point('U_USB_ESD',5).y)
assert(esdBypassDistanceMm<4)
const report={status:routedLayoutPath?'AM3352_SHARED_USBC_LOGICAL_SOURCE_PASS_WITH_PARTIAL_ROUTING':'AM3352_SHARED_USBC_LOGICAL_SOURCE_PASS_ROUTING_AND_CURRENT_POLICY_INCOMPLETE',source:{path,sha256:digest(raw)},
  copperLayerCount:4,components:212,addedIndividualComponents:8,ddrProfile:profile,baseline:{path:baselinePath,sha256:digest(readFileSync(baselinePath))},sourceCopper,preservedPhysicalRecords,
  device:{interface:'USB0 USB2 device only',cpuDpBall:'N17',cpuDmBall:'N18',cpuVbusBall:'P15',idOpen:true,usb1ExplicitlyUnused:true,
    cc1Ohms:5100,cc2Ohms:5100,dataSeriesResistors:0,dataCapacitors:0,dataTestPoints:0,esd:'USBLC6-2SC6',esdBypassDistanceMm},
  charging:{input:'Same J_USB VBUS feeds TPS65217 pin12',pmicDefaultUsbLimitMa:500,legacyUsbPreEnumerationLimitMa:100,
    qualifiedAttachSuspendCurrentPolicy:false,qualifiedBatteryConnectorAndNtc:false},
  vbusSensing:{seriesOhms:1200,capacitanceF:100e-9,clamp:'BZT52B5V1 C475656',cathodePin:1,anodePin:2,
    manufacturerVzMinV:5,manufacturerVzMaxV:5.2,manufacturerTestCurrentMa:5,manufacturerTestTemperatureC:25,
    cpuAbsoluteMaximumV:5.25,allTemperatureAndTransientQualification:false},
  usbCopperCompleted:false,controlledImpedanceQualified:false,linuxInstallerTested:false,originalShellFitVerified:false,fabricationReady:false,
  scope:'Generated numeric netlist, pin polarity, source placement and exact preservation of existing DDR/power geometry. Existing standalone DDR evidence is not a combined physical qualification of this USB-extended draft.',
  primarySources:['https://www.ti.com/lit/ds/symlink/am3352.pdf','https://www.ti.com/lit/an/sprabn2a/sprabn2a.pdf',
    'https://www.ti.com/lit/ds/symlink/tps65217.pdf','https://www.st.com/resource/en/datasheet/usblc6-2.pdf',
    'https://datasheet.lcsc.com/datasheet/pdf/81463e1425491be37abd71c06459cdc9.pdf?productCode=C475656']}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report))
