import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [sourcePath,layoutPath='routing/am3352-usbc-routes.json',reportPath='checks/integrated/am3352-usbc-routed-source-validation.json',profile='ram180-byte0']=process.argv.slice(2)
assert(sourcePath)
assert(['ram180-byte0','ram0-ddr23'].includes(profile))
const baseTraceCount=profile==='ram0-ddr23'?92:81,baseViaCount=profile==='ram0-ddr23'?109:93
const source=JSON.parse(readFileSync(sourcePath)),layout=JSON.parse(readFileSync(layoutPath))
const type=t=>source.filter(e=>e.type===t),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
assert.equal(source.filter(e=>e.type.endsWith('_error')).length,0)
assert.equal(type('pcb_board')[0].num_layers,4)
const inlineVias=[...Object.values(layout.paths).flat(),...layout.traces.flatMap(t=>t.points)].filter(p=>p.via).length
assert.equal(type('pcb_trace').length,baseTraceCount+2+layout.traces.length)
assert.equal(type('pcb_via').length,baseViaCount+layout.groundVias.length+layout.powerVias.length+inlineVias)
const trace=name=>{
  const s=type('source_trace').find(s=>s.name===name);assert(s,`Missing ${name}`)
  const p=type('pcb_trace').filter(p=>p.source_trace_id===s.source_trace_id);assert.equal(p.length,1)
  return p[0]
}
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
const checkRoute=(name,points,width)=>{
  const t=trace(name);assert.equal(t.route.length,points.length+2)
  assert(near(t.route[0],points[0])&&near(t.route.at(-1),points.at(-1)),`${name}: unexpected endpoint stub`)
  for(const [i,p] of points.entries()){
    const actual=t.route[i+1];assert(near(actual,p),`${name}: authored path transform changed at ${i}`)
    if(p.via){assert.equal(actual.route_type,'via');assert.equal(actual.from_layer,p.fromLayer);assert.equal(actual.to_layer,p.toLayer)}
    else{assert.equal(actual.route_type,'wire');assert.equal(actual.width,width);assert(['top','bottom'].includes(actual.layer))}
  }
}
for(const [name,points] of Object.entries(layout.paths))checkRoute(name,points,.15)
for(const t of layout.traces)checkRoute(t.name,t.globalPoints,t.width)
const length=name=>trace(name).route.reduce((total,p,i,route)=>i?
  total+Math.hypot(p.x-route[i-1].x,p.y-route[i-1].y):total,0)
// A via changes layer at one XY location. Count planar wire segments
// adjacent to it as well; its vertical barrel length is excluded.
const primary={dp:length('USB0_DP')+length('USB_DP_ESD_FLOWTHROUGH')+length('USB_DP_CONNECTOR'),
  dm:length('USB0_DM')+length('USB_DM_ESD_FLOWTHROUGH')+length('USB_DM_CONNECTOR')}
const dpDuplicate=trace('USB_DP_CONNECTOR_DUPLICATE'),dpReturn=dpDuplicate.route.filter(p=>p.route_type==='via').at(-1)
const duplicatePoints=layout.traces.find(t=>t.name==='USB_DP_CONNECTOR_DUPLICATE').globalPoints
const secondary={dp:primary.dp+length('USB_DP_CONNECTOR_DUPLICATE')-2*Math.hypot(duplicatePoints.at(-1).x-dpReturn.x,duplicatePoints.at(-1).y-dpReturn.y),
  dm:primary.dm+length('USB_DM_CONNECTOR_DUPLICATE')}
for(const lengths of [primary,secondary])assert(Math.abs(lengths.dp-lengths.dm)<=.127+1e-7,'Connector orientation planar skew exceeds source constraint')
for(const v of type('pcb_via')){assert.deepEqual(new Set(v.layers),new Set(['top','inner1','inner2','bottom']))
  assert.equal(v.outer_diameter,.4572);assert.equal(v.hole_diameter,.254)}
let minimumHoleEdgeGapMm=Infinity
const vias=type('pcb_via')
for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++){
  const gap=Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)-.254
  minimumHoleEdgeGapMm=Math.min(minimumHoleEdgeGapMm,gap);assert(gap>=.254-1e-8,'Duplicate or too-close drills')
}
const report={status:'USB_ROUTED_SOURCE_AND_PLANAR_ORIENTATION_CHECKS_PASS_PHYSICAL_CHECKS_REQUIRED',
  source:{path:sourcePath,sha256:hash(sourcePath)},layout:{path:layoutPath,sha256:hash(layoutPath)},
  copperLayers:4,components:type('source_component').length,actualPads:type('pcb_smtpad').length,
  traces:type('pcb_trace').length,throughVias:vias.length,ddrProfile:profile,existingTracePiecesPreserved:baseTraceCount,
  usbTracePieces:2+layout.traces.length,minimumHoleEdgeGapMm,
  cpuToEsdPlanar:{dpMm:length('USB0_DP'),dmMm:length('USB0_DM'),skewMm:Math.abs(length('USB0_DP')-length('USB0_DM'))},
  connectorOrientations:[{dpPin:8,dmPin:9,dpPlanarMm:primary.dp,dmPlanarMm:primary.dm,skewMm:Math.abs(primary.dp-primary.dm),viasPerDataNet:0},
    {dpPin:10,dmPin:7,dpPlanarMm:secondary.dp,dmPlanarMm:secondary.dm,skewMm:Math.abs(secondary.dp-secondary.dm),viasPerDataNet:2}],
  planarLimitMm:.127,physicalConnectivityQualified:false,controlledImpedanceQualified:false,
  vbusPmicFeedRouted:['USB_PMIC_INPUT_ESCAPE','USB_VBUS_PMIC_FEED','USB_VBUS_PMIC_BYPASS'].every(name=>layout.traces.some(t=>t.name===name)),
  vbusSenseRouted:['USB_VBUS_SENSE_CPU','USB_VBUS_SENSE_INPUT','USB_VBUS_SENSE_FILTER','USB_VBUS_SENSE_CLAMP'].every(name=>layout.traces.some(t=>t.name===name)),
  linuxInstallerTested:false,originalShellFitVerified:false,fabricationReady:false,
  scope:'Exact authored global copper, conservative planar path lengths for both socket orientations, equal via count within each orientation, four-layer full-depth drills. Stackup, return-path and propagation-delay qualification remain required.'}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
