import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readRoutingSourceSnapshot} from './lib/am3352-routing-source-snapshot.mjs'

// Route a single native phase directly from its reserved bottom dogbones.
// Single-point local descriptors add no copper. All other native escapes,
// source power, real pads and socket keepouts remain routing obstacles.
const [bootstrap,directory]=process.argv.slice(2);assert(bootstrap&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),original=read(`${bootstrap}/input.simple-route.json`)
const source=readRoutingSourceSnapshot(prior.source).circuit
assert.equal(prior.source.path,'dist/experiments/am3352-joint-ddr-bottom-command-host/circuit.json')
assert.equal(prior.preparedLocalEscapes,96);assert.equal(prior.sourceCopper.traces,69)
assert.equal(original.layerCount,4);assert.equal(original.traces.length,69)
const bus=original.buses.find(b=>b.name==='DDR_COMMAND_CLOCK');assert(bus)
assert.deepEqual(bus.allowedLayers,['bottom']);assert.equal(bus.maxLengthSkew,.635)
const ids=new Set(bus.connectionNames),connections=original.connections.filter(c=>ids.has(c.name))
const sourceBus=source.find(e=>e.type==='source_bus'&&e.name===bus.name)
assert.equal(connections.length,26);assert.deepEqual(new Set(sourceBus.source_trace_ids),ids)
const nativePath=`${bootstrap}/signal-escapes.native.json`,native=read(nativePath);assert.equal(native.length,96)
const local=[],localResults=[]
const channelConnections=connections.map(c=>({...c,pointsToConnect:c.pointsToConnect.map((actual,i)=>{
  const escape=native.find(t=>t.pcb_trace_id===`local_dogbone_${c.name}_${i}`);assert(escape)
  assert(Math.hypot(actual.x-escape.route[0].x,actual.y-escape.route[0].y)<1e-6)
  const end=escape.route.at(-1);assert.equal(end.layer,'bottom')
  local.push({...escape,pcb_trace_id:`guided_${escape.pcb_trace_id}`,route:[{...end}]})
  localResults.push({name:c.name,package:i?'U_RAM':'U_SOC',end:{x:end.x,y:end.y},newVias:0,length:0,nativeExitOnly:true})
  return {x:end.x,y:end.y,layer:'bottom'}
})}))
const channel={...structuredClone(original),traces:[...original.traces,...native,...local],buses:[bus],
  connections:channelConnections,differentialPairs:original.differentialPairs.filter(p=>p.connectionNames.every(n=>ids.has(n)))}
assert.equal(channel.differentialPairs.length,1);assert.equal(channel.differentialPairs[0].lengthTolerance,.127)
mkdirSync(directory,{recursive:true})
const path=`${directory}/channel.input.simple-route.json`;writeFileSync(path,JSON.stringify(channel)+'\n')
writeFileSync(`${directory}/local-escapes.json`,JSON.stringify(local,null,2)+'\n')
const declaration='experiments/am3352-joint-ddr-bottom-command-host.circuit.tsx'
assert(readFileSync(declaration,'utf8').includes('commandLayer="bottom"'))
const report={...prior,status:'NATIVE_DOGBONE_EXITS_READY_FOR_COMMAND_CHANNEL_ROUTING',bus:bus.name,
  nativeBootstrap:{path:nativePath,sha256:hash(nativePath),dogbones:native.length},sourceTracesRetained:69,
  channelLayer:'bottom',commandChannelRequiredLayer:'bottom',localEscapes:localResults,
  channelLayerDeclaration:{path:declaration,sha256:hash(declaration)},
  channel:{input:{path,sha256:hash(path)}},completedSignals:0,timingQualified:false,fabricationReady:false,
  scope:'Direct native command/clock channel trial from actual joint dogbones. All other DDR breakout copper stays reserved; no whole-board completion is claimed.'}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,localDescriptors:local.length,nativeEscapesRetained:96}))
