import assert from 'node:assert/strict'

// These are unmanufactured TOP-only bootstrap branches, not source copper.
// Replacing a branch with its actual-pad descriptor removes no drilled hole.
export function assertRamByte1TipCorrection(original,edited,source){
  assert.equal(original.length,96);assert.equal(edited.length,96)
  const bus=source.find(e=>e.type==='source_bus'&&e.name==='DDR_BYTE1')
  assert.equal(bus.source_trace_ids.length,11)
  const ids=new Set(bus.source_trace_ids),changed=[]
  const ram=source.find(e=>e.type==='source_component'&&e.name==='U_RAM')
  for(let i=0;i<96;i++){
    const old=original[i],next=edited[i]
    if(ids.has(old.source_trace_id)&&old.pcb_trace_id.endsWith('_1')){
      assert.equal(old.route.length,2)
      assert(old.route.every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.1016))
      assert.deepEqual(next,{...old,route:old.route.slice(0,1)})
      const trace=source.find(e=>e.type==='source_trace'&&e.source_trace_id===old.source_trace_id)
      const port=source.find(e=>e.type==='source_port'&&e.source_component_id===ram.source_component_id&&trace.connected_source_port_ids.includes(e.source_port_id))
      const pcb=source.find(e=>e.type==='pcb_port'&&e.source_port_id===port.source_port_id)
      assert(Math.hypot(old.route[0].x-pcb.x,old.route[0].y-pcb.y)<1e-6)
      assert.deepEqual(pcb.layers,['top'])
      changed.push(old.pcb_trace_id)
    }else assert.deepEqual(next,old)
  }
  assert.equal(changed.length,11)
  for(const traces of [original,edited])assert.equal(traces.flatMap(t=>t.route.filter(p=>p.route_type==='via')).length,85)
  return changed
}
