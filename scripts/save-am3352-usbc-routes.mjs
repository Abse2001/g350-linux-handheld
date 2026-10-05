import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [directory,destination]=process.argv.slice(2);assert(directory&&destination)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const result=read(`${directory}/result.json`),source=read(result.source.path),output=read(result.output.path)
assert.equal(hash(result.source.path),result.source.sha256);assert.equal(hash(result.output.path),result.output.sha256)
const point=(name,pin)=>{
  const component=source.find(c=>c.type==='source_component'&&c.name===name);assert(component)
  const sp=source.find(p=>p.type==='source_port'&&p.source_component_id===component.source_component_id&&p.pin_number===pin);assert(sp)
  const pp=source.find(p=>p.type==='pcb_port'&&p.source_port_id===sp.source_port_id);assert(pp)
  return {x:pp.x,y:pp.y}
}
const wire=(x,y)=>({x,y}),via=(x,y,fromLayer,toLayer)=>({x,y,via:true,fromLayer,toLayer})
const paths={}
for(const name of ['USB0_DP','USB0_DM']){
  const original=source.find(t=>t.type==='source_trace'&&t.name===name);assert(original)
  const route=output.traces.find(t=>t.source_trace_id===original.source_trace_id);assert(route)
  assert(route.route.every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.15))
  paths[name]=route.route.map(({x,y})=>({x,y}))
}
// Add 0.0635mm to the native D- tuning loop, keeping its rounded bends
// intact. This moves both horizontal loop legs by 0.03175mm and leaves
// margin below the 0.127mm source skew limit for export rounding.
paths.USB0_DM=paths.USB0_DM.map(p=>p.x<-2.2?{...p,x:p.x-.03175}:p)
const traces=result.definitions.map(d=>{
  const route=output.traces.find(t=>t.source_trace_id===d.sourceTraceId);assert(route)
  assert(route.route.every(p=>p.route_type==='wire'&&p.layer==='top'&&p.width===.2))
  return {name:d.name,from:`${d.from[0]}.pin${d.from[1]}`,to:`${d.to[0]}.pin${d.to[1]}`,width:.2,
    points:route.route.map(({x,y})=>({x,y})),provenance:'native bus_lanes'}
})
// Move the CC2 bend below the two local VBUS via sites. The native CC1
// route and both CPU data channels remain exact solver output.
traces.find(t=>t.name==='USB_CC2_ROUTE').points=[point('J_USB',12),wire(-1.75006,51.2),wire(-6,51.2),point('R_USB_CC2',1)]
traces.find(t=>t.name==='USB_CC2_ROUTE').provenance='manual bend repair of native bus_lanes route'
const add=(name,from,to,width,points)=>traces.push({name,from,to,width,points,provenance:'manual local connection'})
add('USB_DP_CONNECTOR','J_USB.pin8','U_USB_ESD.pin4',.15,[point('J_USB',8),wire(.249936,50.2),wire(.94996,49.499976),point('U_USB_ESD',4)])
add('USB_DM_CONNECTOR','J_USB.pin9','U_USB_ESD.pin6',.15,[point('J_USB',9),wire(-.249936,51.4),wire(-.94996,50.699976),point('U_USB_ESD',6)])
add('USB_DP_CONNECTOR_DUPLICATE','J_USB.pin10','J_USB.pin8',.15,[point('J_USB',10),wire(-.750062,51.6),
  via(-.750062,51.6,'top','bottom'),wire(-.750062,50.5259568),wire(.249936,50.5259568),wire(.249936,51.6),
  via(.249936,51.6,'bottom','top'),point('J_USB',8)])
add('USB_DM_CONNECTOR_DUPLICATE','J_USB.pin7','J_USB.pin9',.15,[point('J_USB',7),wire(.750062,53.9),
  via(.750062,53.9,'top','bottom'),wire(-.249936,53.9),via(-.249936,53.9,'bottom','top'),point('J_USB',9)])
// Explicit copper also makes both physical pads of each flow-through I/O
// channel inspectable with KiCad's copper engine, without assuming silicon.
add('USB_DP_ESD_FLOWTHROUGH','U_USB_ESD.pin3','U_USB_ESD.pin4',.15,[point('U_USB_ESD',3),point('U_USB_ESD',4)])
add('USB_DM_ESD_FLOWTHROUGH','U_USB_ESD.pin1','U_USB_ESD.pin6',.15,[point('U_USB_ESD',1),point('U_USB_ESD',6)])
// Shared power vias are explicit physical parts, reused by their port.
// Repeating the same inline via in several pcbPaths would duplicate drills.
const powerVias=[{name:'V_USB_ESD_VBUS',x:0,y:48.2},{name:'V_USB_ESD_CAP_VBUS',x:2.579884,y:49.9},
  {name:'V_USB_VBUS_LEFT',x:-2.4001603,y:51.8},{name:'V_USB_VBUS_RIGHT',x:2.3999571,y:51.8}]
add('USB_ESD_VBUS_PAD','U_USB_ESD.pin5','.V_USB_ESD_VBUS > port.top',.2,[point('U_USB_ESD',5),wire(0,48.2)])
add('USB_ESD_VBUS_CAP_PAD','C_USB_ESD.pin1','.V_USB_ESD_CAP_VBUS > port.top',.2,[point('C_USB_ESD',1),wire(2.579884,49.9)])
add('USB_ESD_VBUS_BYPASS','.V_USB_ESD_VBUS > port.bottom','.V_USB_ESD_CAP_VBUS > port.bottom',.2,[wire(0,48.2),
  wire(1.699884,48.2),wire(2.579884,49.08),wire(2.579884,49.9)])
add('USB_VBUS_CONTACT_RIGHT','J_USB.pin16','.V_USB_VBUS_RIGHT > port.top',.5,[point('J_USB',16),wire(2.3999571,51.8)])
add('USB_VBUS_CONTACT_LEFT','J_USB.pin15','.V_USB_VBUS_LEFT > port.top',.5,[point('J_USB',15),wire(-2.4001603,51.8)])
add('USB_VBUS_RIGHT_FEED','.V_USB_VBUS_RIGHT > port.bottom','.V_USB_ESD_CAP_VBUS > port.bottom',.5,[wire(2.3999571,51.8),
  wire(2.3999571,50.0799269),wire(2.579884,49.9)])
add('USB_VBUS_CONTACT_BRIDGE','.V_USB_VBUS_LEFT > port.bottom','.V_USB_VBUS_RIGHT > port.bottom',.5,[wire(-2.4001603,51.8),
  wire(-2.4001603,49.5),wire(2.3999571,49.5),wire(2.3999571,51.8)])
add('USB_GROUND_CONTACT_RIGHT','J_USB.pin13','J_USB.pin4',.3,[point('J_USB',13),wire(3.1999555,53.2),point('J_USB',4)])
add('USB_GROUND_CONTACT_LEFT','J_USB.pin14','J_USB.pin1',.3,[point('J_USB',14),wire(-3.2000063,53.2),point('J_USB',1)])
const groundVias=[{name:'V_USB_ESD_GND',x:0,y:47.6,from:'U_USB_ESD.pin2'},
  {name:'V_USB_ESD_CAP_GND',x:4.2,y:49.2,from:'C_USB_ESD.pin2'},
  {name:'V_USB_CC1_GND',x:6.8,y:52.753364,from:'R_USB_CC1.pin2'},
  {name:'V_USB_CC2_GND',x:-6.8,y:52.753364,from:'R_USB_CC2.pin2'}]
for(const v of groundVias){const [name,p]=v.from.split('.');add(`USB_GROUND_${v.name}`,v.from,`.${v.name} > port.top`,.3,[point(name,Number(p.slice(3))),wire(v.x,v.y)])}
// pcbPath uses the from-component transform, including socket rotation.
// Retain global authoring points for audit and apply its exact inverse.
for(const t of traces){
  const name=t.from.startsWith('.')?/^\.([^ >]+)/.exec(t.from)[1]:t.from.split('.')[0]
  const namedVia=[...groundVias,...powerVias].find(v=>v.name===name)
  let center,angle=0
  if(namedVia)center={x:namedVia.x,y:namedVia.y}
  else{
    const sc=source.find(c=>c.type==='source_component'&&c.name===name);assert(sc)
    const pc=source.find(c=>c.type==='pcb_component'&&c.source_component_id===sc.source_component_id);assert(pc)
    assert.equal(pc.position_mode,'relative_to_group_anchor')
    // pcb_component.center is the footprint's bounding-box centre, which
    // differs from its path origin for this asymmetric USB receptacle.
    center={x:pc.display_offset_x,y:pc.display_offset_y};angle=pc.rotation*Math.PI/180
  }
  const cos=Math.cos(angle),sin=Math.sin(angle)
  t.globalPoints=structuredClone(t.points)
  t.points=t.points.map(p=>({...p,x:cos*(p.x-center.x)+sin*(p.y-center.y),y:-sin*(p.x-center.x)+cos*(p.y-center.y)}))
}
const layout={paths,traces,groundVias,powerVias}
writeFileSync(destination,JSON.stringify(layout,null,2)+'\n')
writeFileSync(destination.replace(/\.json$/,'.provenance.json'),JSON.stringify({source:result.source,nativeCcRun:{path:`${directory}/result.json`,sha256:hash(`${directory}/result.json`)},
  nativePairRun:result.priorPair,layout:{path:destination,sha256:hash(destination)},nativeCpuDpPathUnchanged:true,
  manualCpuDmLoopAddedPlanarMm:.0635,nativeLongCoupledChannelUnchanged:true,
  manualCc2BendRepair:true,manualConnectorAndEsdConnections:true,controlledImpedanceQualified:false,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({paths:Object.keys(paths),localTraces:traces.length,groundVias:groundVias.length,powerVias:powerVias.length,destination}))
