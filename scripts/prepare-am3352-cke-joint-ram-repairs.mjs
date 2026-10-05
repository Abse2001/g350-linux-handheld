import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [runDirectory,directory]=process.argv.slice(2);assert(runDirectory&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const r=read(`${runDirectory}/result.json`)
assert.equal(r.status,'GUIDED_NATIVE_CHANNEL_ROUTED_UNQUALIFIED');assert(r.stagedPartialCommandPhase&&r.exportable===false)
for(const a of [r.source,r.output,r.nativeBootstrap,r.priorLocalRun,r.temporaryOpenRamTails])assert.equal(hash(a.path),a.sha256)
const source=read(r.source.path),native=read(r.nativeBootstrap.path),local=read(r.priorLocalRun.path.replace(/result\.json$/,'local-escapes.json'))
const input=read(r.channel.input.path),output=read(r.output.path),tails=read(r.temporaryOpenRamTails.path)
assert.equal(hash(r.channel.input.path),r.channel.input.sha256)
assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces)
assert.equal(output.traces.length,input.traces.length+1)
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
const reverse=t=>t.route.toReversed().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:{...p})
const cpu=native.find(t=>t.pcb_trace_id==='local_dogbone_source_trace_48_0'),ram=native.find(t=>t.pcb_trace_id==='local_dogbone_source_trace_48_1')
const cpuLocal=local.find(t=>t.route[0].y>-15),ramLocal=local.find(t=>t.route[0].y<-15)
let channel=output.traces.at(-1).route
if(!near(channel[0],cpuLocal.route.at(-1)))channel=reverse({route:channel})
const parts=[cpu.route,cpuLocal.route,channel,reverse(ramLocal),reverse(ram)]
for(let i=1;i<parts.length;i++)assert(near(parts[i-1].at(-1),parts[i][0]))
const route=parts.flat(),cke={type:'pcb_trace',pcb_trace_id:'staged_complete_cke',source_trace_id:'source_trace_48',route}
let layer='top'
for(const p of route){if(p.route_type==='via'){assert.equal(p.from_layer,layer);layer=p.to_layer;assert.equal(p.via_diameter,.4572);assert.equal(p.via_hole_diameter,.254)}else{assert.equal(p.layer,layer);assert.equal(p.width,.1016)}}
assert.equal(layer,'top');assert.equal(route.filter(p=>p.route_type==='via').length,4)
assert(near(route[0],{x:-2,y:-5.2})&&near(route.at(-1),{x:3.2,y:-28.2}))
const mapPath='lib/am3352/memory-byte1-top-centered-swizzled-connections.json',map=read(mapPath)
const names=['DDR_DQSn1','DDR_D1','DDR_D7'],connections=names.map(name=>{
  const d=map.find(d=>d.name===name),t=source.find(t=>t.type==='source_trace'&&t.name===name)
  const pointsToConnect=[['U_SOC',d.socPin],['U_RAM',d.ramPin]].map(([name,pin])=>{
    const c=source.find(c=>c.type==='source_component'&&c.name===name),sp=source.find(p=>p.type==='source_port'&&p.source_component_id===c.source_component_id&&p.pin_number===Number(pin.slice(3)))
    assert(t.connected_source_port_ids.includes(sp.source_port_id))
    const p=source.find(p=>p.type==='pcb_port'&&p.source_port_id===sp.source_port_id)
    return {x:p.x,y:p.y,layer:'top',pcb_port_id:p.pcb_port_id,pointId:p.pcb_port_id}
  })
  return {name:t.source_trace_id,source_trace_id:t.source_trace_id,width:.1016,nominalTraceWidth:.1016,pointsToConnect}
})
const bootstrapPath='dist/am3352-ddr25-cke-joint-tail-prep-attempt-457/input.simple-route.json',base=read(bootstrapPath)
assert.equal(base.traces.length,127);base.traces.push(cke);base.connections=connections
base.buses=[{name:'DDR_RAM_ACCESS',busId:'DDR_RAM_ACCESS',connectionNames:connections.map(c=>c.name),traceWidth:.1016,allowedLayers:['bottom'],maxLengthSkew:.635}];base.differentialPairs=[]
const ramEscapes=connections.filter(c=>c.name!=='source_trace_27').map(c=>{
  const t=tails.find(t=>t.sourceTraceId===c.name),idx=t.originalRoute.findLastIndex(p=>p.route_type==='via')
  assert(idx>0);const route=reverse({route:t.originalRoute.slice(idx-1)})
  assert(near(route[0],c.pointsToConnect[1]));assert.equal(route.at(-1).layer,'bottom')
  return {type:'pcb_trace',pcb_trace_id:`local_dogbone_${c.name}_1`,connection_name:c.name,source_trace_id:c.name,route}
})
const summaryPath='checks/integrated/am3352-ddr-usbc-cke-access-check-summary.json',summary=read(summaryPath);assert.deepEqual(summary.source,r.source)
mkdirSync(directory,{recursive:true})
const write=(name,value)=>{const path=`${directory}/${name}`;writeFileSync(path,JSON.stringify(value,null,2)+'\n');return {path,sha256:hash(path)}}
const ckeArtifact=write('staged-cke.trace.json',cke),sections=write('checked-cpu-channel-sections.json',tails.map(t=>({source_trace_id:t.sourceTraceId,route:t.retainedPrefix})))
const report={status:'JOINT_RAM_TAIL_REBUILD_PREPARATION_STAGED_CKE_RETAINED_NOT_EXPORTABLE',source:r.source,
  input:write('input.simple-route.json',base),sourceCopper:{traces:69,totalSourceTraces:127},preparedLocalEscapes:ramEscapes.length,
  memoryMap:{path:mapPath,sha256:hash(mapPath)},ramReferenceLayout:r.ramReferenceLayout,preservedSavedDdr:r.preservedSavedDdr,
  checkedCpuChannelReuse:{source:r.source,paths:r.preservedSavedDdr,checkedSummary:{path:summaryPath,sha256:hash(summaryPath)},sections,
    handoffs:tails.map(t=>({sourceTraceId:t.sourceTraceId,...t.retainedPrefix.at(-1)}))},
  retainedStagedCkeCopper:{...ckeArtifact,nativeChannelRun:{path:`${runDirectory}/result.json`,sha256:hash(`${runDirectory}/result.json`)},tracePieces:1,throughVias:4,accepted:false},
  temporaryOpenRamTails:r.temporaryOpenRamTails,actualPackagePadStartsAllowed:true,allChannelEndpointsActualTopPads:true,
  layeredRamHandoffsRequired:true,acceptedDefaultDdrSignals:25,stagedConnectedDdrSignals:23,pendingRamTailRepairs:3,exportable:false,fabricationReady:false}
write('signal-escapes.native.json',ramEscapes);write('result.json',report)
console.log(JSON.stringify({status:report.status,stagedCkePlanarMm:route.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-route[i].x,p.y-route[i].y),0),stagedCkeVias:4,pendingRamTails:3}))
