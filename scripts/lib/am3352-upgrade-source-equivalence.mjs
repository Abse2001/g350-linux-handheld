import assert from 'node:assert/strict'

// Core 0.0.2080 represents the two USB VBUS voltage requirements as numbers
// and emits MPN warnings for bare testpoint pads. Accept only that migration;
// every other source record, including all PCB copper, remains exact.
const testpointNames=[
  'TP_BAT_INPUT','TP_BAT_NTC','TP_BAT_GND','TP_USB_INPUT','TP_JTAG_TMS',
  'TP_JTAG_TDI','TP_JTAG_TDO','TP_JTAG_TCK','TP_JTAG_TRSTn','TP_JTAG_EMU0',
  'TP_JTAG_EMU1','TP_WARM_RESETn','TP_GND','TP_IO_3V3','TP_UART_GND',
  'TP_UART_UART0_RX','TP_UART_UART0_TX','TP_UART_IO_3V3',
]
export function assertAm3352UpgradeSourceEquivalence(actual,checked){
  const components=new Map(actual.filter(e=>e.type==='source_component').map(e=>[e.source_component_id,e]))
  const warnings=actual.filter(e=>e.type==='source_missing_manufacturer_part_number_warning')
  if(warnings.length){
    assert.deepEqual(warnings.map(w=>components.get(w.source_component_id)?.name),testpointNames)
    for(const w of warnings){assert.equal(components.get(w.source_component_id).ftype,'simple_test_point');assert.equal(w.warning_type,'source_missing_manufacturer_part_number_warning')}
  }
  const changes=[]
  const normalize=(records,isActual)=>records.filter(e=>e.type!=='source_project_metadata'&&e.type!=='source_missing_manufacturer_part_number_warning').map(e=>{
    if(e.type==='source_port'&&['source_port_1038','source_port_1039'].includes(e.source_port_id)){
      assert.equal(e.source_component_id,'source_component_204')
      assert(['5V',5].includes(e.requires_voltage))
      if(isActual&&e.requires_voltage===5)changes.push({portId:e.source_port_id,from:'5V',to:5})
      return {...e,requires_voltage:5}
    }
    return e
  })
  const a=normalize(actual,true),b=normalize(checked,false)
  assert.deepEqual(a,b,'Electrical or physical source changed beyond the reviewed core voltage/testpoint-warning migration')
  return {equalElectricalAndPhysicalRecords:a.length,voltageRepresentationChanges:changes,newBareTestpointWarnings:warnings.length,allPcbRecordsExact:true,allNetConnectivityExact:true}
}
