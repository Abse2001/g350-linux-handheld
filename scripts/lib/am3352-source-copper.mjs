import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

// Source audits accept the authored bypass loop and exact native RAM
// reference escapes, never arbitrary copper. Bottom-side X is mirrored.
// DDR/power continuity and physical clearance still need separate checks.
export const assertSourceCopper=(circuit,{ramReferenceEscapes,ramRotation=0,rotatedD2PowerBridge=false}={})=>{
  assert([0,180].includes(ramRotation),'Only the explicitly rebuilt 0/180 degree RAM placements are supported')
  if(ramRotation!==0)assert(ramReferenceEscapes,'Rotated RAM requires explicitly transformed reference escapes')
  const type=t=>circuit.filter(e=>e.type===t),traces=type('pcb_trace'),vias=type('pcb_via')
  const canonicalEscapes=JSON.parse(readFileSync('lib/am3352/ram-reference-escapes.json'))
  const escapes=ramReferenceEscapes??canonicalEscapes
  if(ramReferenceEscapes){
    const expected=structuredClone(canonicalEscapes)
    const c1=expected.find(e=>e.localEscapeMetadata.ball==='C1');assert(c1)
    for(const p of c1.route.slice(1)){p.x=-3.8;p.y=-22.2}
    if(ramRotation===180)for(const t of expected)for(const p of t.route){p.x=-p.x;p.y=-54-p.y}
    assert.deepEqual(escapes,expected,'Reference geometry must match the documented C1 move and exact RAM placement transform')
  }
  const loops=JSON.parse(readFileSync('lib/am3352/ram-bypass-loop-layout.json'))
  assert.equal(escapes.length,39)
  assert.equal(loops.length,14)
  assert.equal(new Set(loops.map(l=>l.capacitor)).size,14)
  assert.equal(traces.length,2+escapes.length+loops.length*2+(rotatedD2PowerBridge?1:0),'Only documented bypass, package reference and explicitly requested bridge copper is allowed in this source audit')
  assert.equal(vias.length,2+escapes.length+loops.length*2)
  let minimumDrillEdgeClearanceMm=Infinity
  for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++){
    const gap=Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)-(vias[i].hole_diameter+vias[j].hole_diameter)/2
    minimumDrillEdgeClearanceMm=Math.min(minimumDrillEdgeClearanceMm,gap)
    assert(gap>=.254-1e-6,'Drill separation applies to same-net vias too')
  }
  const cap=type('source_component').find(c=>c.name==='C_DDR_CPU_1');assert(cap)
  for(const [name,pin,net,x] of [['DDR_CPU1_POWER_LOOP',1,'DDR_1V5',-4.8],['DDR_CPU1_GROUND_LOOP',2,'GND',-6.4]]){
    const source=type('source_trace').find(t=>t.name===name);assert(source)
    const trace=traces.find(t=>t.source_trace_id===source.source_trace_id);assert(trace)
    const sp=type('source_port').find(p=>p.source_component_id===cap.source_component_id&&p.pin_number===pin)
    assert(source.connected_source_port_ids.includes(sp.source_port_id))
    const port=type('pcb_port').find(p=>p.source_port_id===sp.source_port_id);assert(port)
    const via=vias.find(v=>Math.hypot(v.x-x,v.y+2.4)<1e-6);assert(via)
    const sourceNet=type('source_net').find(n=>n.name===net);assert.equal(via.source_net_id,sourceNet.source_net_id)
    assert.equal(via.outer_diameter,.4572);assert.equal(via.hole_diameter,.254)
    assert.deepEqual(via.layers,['top','inner1','inner2','bottom'])
    assert.equal(via.tented_on_top,true);assert.equal(via.tented_on_bottom,true)
    assert.equal(trace.route.length,2)
    assert(trace.route.every(p=>p.route_type==='wire'&&p.layer==='bottom'&&p.width===.2))
    assert(Math.hypot(trace.route[0].x-port.x,trace.route[0].y-port.y)<1e-6)
    assert(Math.hypot(trace.route[1].x-via.x,trace.route[1].y-via.y)<1e-6)
    assert(trace.trace_length>0&&trace.trace_length<1.2)
  }
  const ram=type('source_component').find(c=>c.name==='U_RAM');assert(ram)
  const pcbRam=type('pcb_component').find(c=>c.source_component_id===ram.source_component_id)
  assert.deepEqual(pcbRam.center,{x:0,y:-27});assert.equal(pcbRam.rotation,ramRotation)
  const referenceCounts={DDR_1V5:0,GND:0},seen=new Set()
  for(const native of escapes){
    const m=native.localEscapeMetadata;assert.equal(m.component,'U_RAM')
    assert(['DDR_1V5','GND'].includes(m.net));assert.equal(m.layer,m.net==='GND'?'inner1':'inner2')
    assert(!seen.has(m.ball));seen.add(m.ball);referenceCounts[m.net]++
    const sp=type('source_port').find(p=>p.source_component_id===ram.source_component_id&&p.pin_number===Number(m.pin.slice(3)))
    assert.equal(sp.name,m.ball)
    const port=type('pcb_port').find(p=>p.source_port_id===sp.source_port_id)
    assert(Math.hypot(port.x-native.route[0].x,port.y-native.route[0].y)<1e-6,'Escape must start on the actual package ball')
    const source=type('source_trace').find(t=>t.name===`RAM_REFERENCE_${m.ball}`);assert(source)
    assert(source.connected_source_port_ids.includes(sp.source_port_id))
    const trace=traces.find(t=>t.source_trace_id===source.source_trace_id);assert(trace)
    const expected=native.route.find(p=>p.route_type==='via')
    const via=vias.find(v=>Math.hypot(v.x-expected.x,v.y-expected.y)<1e-6);assert(via)
    assert.equal(via.source_net_id,type('source_net').find(n=>n.name===m.net).source_net_id)
    assert.equal(via.outer_diameter,.4572);assert.equal(via.hole_diameter,.254)
    assert.deepEqual(via.layers,['top','inner1','inner2','bottom'])
    assert.equal(via.tented_on_top,true);assert.equal(via.tented_on_bottom,true)
    assert.equal(trace.route.length,2)
    assert(trace.route.every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.1016))
    assert(Math.hypot(trace.route[0].x-port.x,trace.route[0].y-port.y)<1e-6)
    assert(Math.hypot(trace.route[1].x-via.x,trace.route[1].y-via.y)<1e-6)
    assert(trace.trace_length>0&&trace.trace_length<.8)
  }
  assert.deepEqual(referenceCounts,{DDR_1V5:18,GND:21})
  if(rotatedD2PowerBridge){
    assert.equal(ramRotation,180)
    const source=type('source_trace').find(t=>t.name==='RAM_D2_B2_INNER2_POWER_BRIDGE');assert(source)
    const net=type('source_net').find(n=>n.name==='DDR_1V5');assert(net)
    assert.deepEqual(source.connected_source_net_ids,[net.source_net_id])
    const trace=traces.find(t=>t.source_trace_id===source.source_trace_id);assert(trace)
    const expected=[[2,-30.2],[2.4,-30.6],[2.4,-31.4],[2,-31.8]]
    assert.equal(trace.route.length,4)
    for(const [i,p] of trace.route.entries()){
      assert.equal(p.route_type,'wire');assert.equal(p.layer,'inner2');assert.equal(p.width,.1016)
      assert(Math.hypot(p.x-expected[i][0],p.y-expected[i][1])<1e-6,'Only the authored D2/B2 power bridge is permitted')
    }
    for(const [i,routeIndex] of [0,3].entries()){
      const point=trace.route[routeIndex]
      const via=vias.find(v=>Math.hypot(v.x-point.x,v.y-point.y)<1e-6);assert(via)
      assert.equal(via.source_net_id,net.source_net_id)
      const id=i===0?point.start_pcb_port_id:point.end_pcb_port_id
      assert(via.pcb_port_ids.includes(id),'The bridge uses existing physical via ports')
      const port=type('pcb_port').find(p=>p.pcb_port_id===id);assert(port)
      assert.deepEqual(port.layers,['inner2'])
      assert(source.connected_source_port_ids.includes(port.source_port_id))
    }
    assert(Math.abs(trace.trace_length-1.9313708498984745)<1e-6)
  }
  for(const loop of loops){
    assert(/^C_DDR_RAM_(\d+|BULK[12])$/.test(loop.capacitor))
    const cap=type('source_component').find(c=>c.name===loop.capacitor);assert(cap)
    const pcb=type('pcb_component').find(c=>c.source_component_id===cap.source_component_id)
    assert.equal(pcb.layer,loop.side)
    for(const [index,terminal] of ['power','ground'].entries()){
      const net=terminal==='power'?'DDR_1V5':'GND',p=loop[terminal]
      const source=type('source_trace').find(t=>t.name===`RAM_BYPASS_${loop.capacitor}_${terminal.toUpperCase()}`);assert(source)
      const sp=type('source_port').find(s=>s.source_component_id===cap.source_component_id&&s.pin_number===index+1)
      assert(source.connected_source_port_ids.includes(sp.source_port_id))
      const port=type('pcb_port').find(p=>p.source_port_id===sp.source_port_id)
      const via=vias.find(v=>Math.hypot(v.x-p.x,v.y-p.y)<1e-6);assert(via)
      assert.equal(via.source_net_id,type('source_net').find(n=>n.name===net).source_net_id)
      assert.equal(via.outer_diameter,.4572);assert.equal(via.hole_diameter,.254)
      assert.deepEqual(via.layers,['top','inner1','inner2','bottom'])
      assert.equal(via.tented_on_top,true);assert.equal(via.tented_on_bottom,true)
      const trace=traces.find(t=>t.source_trace_id===source.source_trace_id);assert(trace)
      assert.equal(trace.route.length,2)
      assert(trace.route.every(p=>p.route_type==='wire'&&p.layer===loop.side&&p.width===.2))
      assert(Math.hypot(trace.route[0].x-port.x,trace.route[0].y-port.y)<1e-6)
      assert(Math.hypot(trace.route[1].x-via.x,trace.route[1].y-via.y)<1e-6)
      assert(trace.trace_length>0&&trace.trace_length<1.4)
    }
  }
  const pours=type('pcb_copper_pour');assert.equal(pours.length,2,'Both reference regions must be generated')
  for(const [layer,net] of [['inner1','GND'],['inner2','DDR_1V5']]){
    const n=type('source_net').find(n=>n.name===net)
    assert.equal(pours.filter(p=>p.layer===layer&&p.source_net_id===n.source_net_id).length,1)
    const pour=pours.find(p=>p.layer===layer&&p.source_net_id===n.source_net_id)
    const vertices=pour.brep_shape?.outer_ring.vertices;assert.equal(vertices?.length,4)
    const extents={minX:Math.min(...vertices.map(p=>p.x)),maxX:Math.max(...vertices.map(p=>p.x)),
      minY:Math.min(...vertices.map(p=>p.y)),maxY:Math.max(...vertices.map(p=>p.y))}
    const expected=layer==='inner1'?{minX:-49.7,maxX:49.7,minY:-61.7,maxY:61.7}:
      {minX:-17.8,maxX:17.8,minY:-38.8,maxY:9.8}
    for(const key of Object.keys(expected))assert(Math.abs(extents[key]-expected[key])<1e-5,'Reference region boundary')
  }
  return {manualBypassLoops:1+loops.length,ramBypassLoops:loops.length,packageReferenceEscapes:39,ramReferenceEscapeCounts:referenceCounts,
    traces:traces.length,throughVias:vias.length,minimumDrillEdgeClearanceMm,
    ...(rotatedD2PowerBridge?{rotatedD2PowerBridge:{traceName:'RAM_D2_B2_INNER2_POWER_BRIDGE',layer:'inner2',newHoles:0,physicalChecksPending:true}}:{}),
    generatedReferenceRegions:2,completePowerRouting:false}
}
