import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import * as checks from '@tscircuit/checks'
import {fanoutTracePath} from '@tscircuit/props'

const [root,configPath]=process.argv.slice(2)
assert(root&&configPath&&!existsSync(root),'Supply a fresh root and authored geometry')
const read=p=>JSON.parse(readFileSync(p,'utf8'))
const artifact=p=>({path:p,sha256:createHash('sha256').update(readFileSync(p)).digest('hex')})
const baseRoot='dist/g350-byte1-access-plan-04',preparation=read(`${baseRoot}/preparation.json`)
for(const file of preparation.files)assert.equal(artifact(file.path).sha256,file.sha256)
const config=read(configPath),circuit=read(`${baseRoot}/candidate.circuit.json`),input=read(`${baseRoot}/solver-input.json`)
const byte0=read(`${baseRoot}/byte0-data-paths.json`),escapes=read(`${baseRoot}/byte1-escape-paths.json`)
const names=new Map(circuit.filter(r=>r.type==='source_trace').map(r=>[r.source_trace_id,r.name]))
const length=route=>route.slice(1).reduce((n,p,i)=>n+(p.route_type==='wire'&&route[i].route_type==='wire'&&p.layer===route[i].layer?Math.hypot(p.x-route[i].x,p.y-route[i].y):0),0)
const wire=([x,y],layer='bottom')=>({route_type:'wire',x,y,layer,width:.1016})
// Open the narrow strobe corridor without moving the old DQM0 holes. The
// shortened incoming diagonal and new landing diagonal exchange equal length.
const maskPath=byte0.find(p=>p.connection==='U_SOC.pin30'),oldMaskLength=length(maskPath.route)
const shift=config.dqm0ShiftX??0
if(shift){
 const route=maskPath.route,index=route.findIndex(p=>p.layer==='bottom'&&Math.abs(p.x-2)<1e-8&&Math.abs(p.y-7.4884047546998875)<1e-8)
 assert(index>=0)
 route[index].x+=shift;route[index].y+=shift
 const end=route[index+1];assert(end.route_type==='wire'&&Math.abs(end.y-2.4)<1e-8)
 const oldEnd={...end};end.x+=shift;end.y+=shift
 route.splice(index+2,0,oldEnd)
 assert(Math.abs(length(route)-oldMaskLength)<1e-8)
 for(const t of [...circuit.filter(r=>r.type==='pcb_trace'),...input.traces])if((t.source_trace_id??t.connection_name)==='source_trace_30')t.route=structuredClone(route)
}
for(const [selector,points]of Object.entries(config.cpuEscapeOverrides??{})){
 const path=escapes.find(p=>p.connection===selector);assert(path)
 const old=path.route,via=old.find(p=>p.route_type==='via'),last=old.at(-1),first=old[0]
 assert(via&&last.layer==='bottom')
 path.route=[{...first},...points.map(p=>wire(p,'top')),{...via},{...last}]
 assert(Math.hypot(path.route.at(-3).x-via.x,path.route.at(-3).y-via.y)<1e-8)
 const port=circuit.find(r=>r.type==='pcb_port'&&Math.hypot(r.x-first.x,r.y-first.y)<1e-8)
 assert(port)
 for(const t of [...circuit.filter(r=>r.type==='pcb_trace'),...input.traces])if(t.pcb_trace_id===`manual_byte1_${port.pcb_port_id}`){
  t.route=structuredClone(path.route)
  if(t.type==='pcb_trace'&&circuit.includes(t))t.route[0].start_pcb_port_id=port.pcb_port_id
 }
}
const lengths={},carrierTraces=[]
for(const [name,points]of Object.entries(config.pairCarrierPoints)){
 const connection=input.connections.find(c=>names.get(c.name)===name);assert(connection)
 const route=points.map(p=>wire(p))
 for(const [i,j]of [[0,0],[1,route.length-1]])assert(Math.hypot(route[j].x-connection.pointsToConnect[i].x,route[j].y-connection.pointsToConnect[i].y)<1e-8)
 const trace={type:'pcb_trace',pcb_trace_id:`manual_strobe_carrier_${name}`,source_trace_id:connection.source_trace_id,connection_name:connection.name,route}
 carrierTraces.push(trace)
 circuit.push({...trace,subcircuit_id:'subcircuit_source_group_0'})
 input.traces.push(trace)
 lengths[name]=input.traces.filter(t=>t.connection_name===connection.name).reduce((n,t)=>n+length(t.route),0)
}
assert.deepEqual(Object.keys(lengths).sort(),['DDR_DQS1','DDR_DQSn1'])
const skew=Math.abs(lengths.DDR_DQS1-lengths.DDR_DQSn1)
const completedNames=new Set(input.connections.filter(c=>Object.keys(lengths).includes(names.get(c.name))).map(c=>c.name))
const originalBus=input.buses.find(b=>b.busId==='DDR_BYTE1');assert(originalBus)
assert.equal(originalBus.connectionNames.length,11);assert.equal(originalBus.maxLengthSkew,.635)
const originalPair=input.differentialPairs[0];assert.equal(originalPair.lengthTolerance,.127)
let nativeSeedSource=null
if(config.nativeCarrierSeedsPath){
 nativeSeedSource=artifact(config.nativeCarrierSeedsPath)
 const snapshots=read(config.nativeCarrierSeedsPath),seeds=snapshots[config.nativeCarrierSeedsSnapshot??0]
 assert(seeds.length>0)
 for(const trace of seeds){
  const connection=input.connections.find(c=>c.name===trace.connection_name);assert(connection)
  const signal=names.get(connection.name);assert(!Object.hasOwn(lengths,signal))
  assert(trace.route.every(p=>p.route_type==='wire'&&p.layer==='bottom'),'Native seeds must remain via-free Bottom carriers')
  for(const [i,j]of [[0,0],[1,trace.route.length-1]])assert(Math.hypot(trace.route[j].x-connection.pointsToConnect[i].x,trace.route[j].y-connection.pointsToConnect[i].y)<1e-8)
  circuit.push({...structuredClone(trace),subcircuit_id:'subcircuit_source_group_0'})
  input.traces.push(structuredClone(trace))
  lengths[signal]=input.traces.filter(t=>t.connection_name===connection.name).reduce((n,t)=>n+length(t.route),0)
  completedNames.add(connection.name)
 }
}
input.connections=input.connections.filter(c=>!completedNames.has(c.name))
input.buses=input.buses.map(b=>({...b,connectionNames:b.connectionNames.filter(n=>!completedNames.has(n)),
 minLength:Math.max(...Object.values(lengths))-.635,maxLength:Math.min(...Object.values(lengths))+.635}))
input.differentialPairs=input.differentialPairs.filter(p=>!p.connectionNames.every(n=>completedNames.has(n)))
assert.equal(input.connections.length,11-Object.keys(lengths).length)
assert.equal(input.traces.length,134+Object.keys(lengths).length)
const carrierLayer=config.nativeCarrierLayer??'bottom'
assert(['top','bottom'].includes(carrierLayer))
input.allowedLayers=[carrierLayer]
input.buses=input.buses.map(b=>({...b,allowedLayers:[carrierLayer]}))
for(const c of input.connections)for(const p of c.pointsToConnect)p.layer=carrierLayer
const physicalChecks=preparation.physicalChecks
const errors=physicalChecks.flatMap(name=>checks[name](circuit).map(e=>({check:name,...e})))
mkdirSync(root)
const objects={'candidate.circuit.json':circuit,'solver-input.json':input,'solver-options.json':{smoothTuning:false,denseSearch:true,maxSearchIterations:50000},'byte0-data-paths.json':byte0,'byte1-escape-paths.json':escapes,'strobe-carriers.traces.json':carrierTraces,'physical-errors.json':errors,'authored-geometry.json':config}
for(const [name,obj]of Object.entries(objects))writeFileSync(`${root}/${name}`,JSON.stringify(obj,null,2)+'\n')
writeFileSync(`${root}/prepare.executed.mjs`,readFileSync('scripts/prepare-g350-byte1-strobe-seed.mjs'))
const report={status:errors.length?'STROBE_SEED_PHYSICAL_ERRORS':skew>.127?'STROBE_SEED_PAIR_SKEW_FAILED':'STROBE_SEED_GEOMETRY_AND_PLANAR_PAIR_CHECKED_REPLAY_REQUIRED',
 source:artifact(`${baseRoot}/preparation.json`),authoredGeometry:artifact(configPath),nativeSeedSource,files:[...Object.keys(objects),'prepare.executed.mjs'].map(p=>artifact(`${root}/${p}`)),
 physicalChecks,physicalErrors:errors.length,strobePlanarLengthsMm:{DDR_DQS1:lengths.DDR_DQS1,DDR_DQSn1:lengths.DDR_DQSn1},fixedMemberPlanarLengthsMm:lengths,pairPlanarSkewMm:skew,pairPlanarLimitMm:.127,
 fullSourceBusMembers:11,fullSourceBusPlanarSkewLimitMm:.635,remainingNativeCarriers:input.connections.length,
 nativeCarrierLayer:carrierLayer,
 nativeCarrierTotalLengthRangeMm:{min:input.buses[0].minLength,max:input.buses[0].maxLength},
 fixedPairAndRemainingBusLimitsPreserveFullElevenMemberSkew:true,oldViaLocationsPreserved:true,
 dqm0PlanarLengthUnchanged:true,defaultChanged:false,qualifiedNewSignals:0,fabricationReady:false}
writeFileSync(`${root}/preparation.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,lengths,skew,errors:errors.map(e=>({check:e.check,message:e.message})).slice(0,12)}))
process.exitCode=errors.length||skew>.127?1:0
