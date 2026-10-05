import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [nativeDirectory,directory]=process.argv.slice(2);assert(nativeDirectory&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${nativeDirectory}/result.json`),input=read(prior.input.path),source=read(prior.source.path)
for(const a of [prior.source,prior.input,prior.localEscapes])assert.equal(hash(a.path),a.sha256)
assert.equal(prior.status,'NATIVE_DDR_LOCAL_ESCAPES_PREPARED_CHANNELS_UNROUTED')
assert.equal(prior.mode,'prepare-cpu');assert.equal(prior.preparedEscapes,2)
const native=read(prior.localEscapes.path);assert.equal(native.length,2)
assert.equal(input.layerCount,4);assert.equal(input.allowBlindAndBuriedVias,false)
input.connections=input.connections.map(c=>{
  const d=prior.definitions.find(d=>d.sourceTraceId===c.name);assert(d)
  for(const p of d.pointsToConnect){
    const actual=source.find(e=>e.type==='pcb_port'&&e.pcb_port_id===p.pcb_port_id);assert(actual)
    assert.equal(p.x,actual.x);assert.equal(p.y,actual.y);assert.deepEqual(actual.layers,['top'])
  }
  const t=native.find(t=>t.source_trace_id===c.name);assert(t)
  assert.deepEqual({x:t.route[0].x,y:t.route[0].y,layer:t.route[0].layer},
    {x:d.pointsToConnect[0].x,y:d.pointsToConnect[0].y,layer:'top'})
  assert.equal(t.route.at(-1).layer,'bottom')
  return {...c,pointsToConnect:structuredClone(d.pointsToConnect)}
})
input.buses=input.buses.map(b=>({...b,name:'DDR_COMMAND_CLOCK',busId:'DDR_COMMAND_CLOCK',allowedLayers:['top']}))
assert.equal(input.connections.length,2);assert.equal(input.differentialPairs.length,1)
mkdirSync(directory,{recursive:true});writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(input)+'\n')
writeFileSync(`${directory}/signal-escapes.native.json`,JSON.stringify(native)+'\n')
const paths='routing/am3352-ddr-usbc-clock-access-paths.json',refs='lib/am3352/ram-reference-escapes-byte1-access.json'
const report={...prior,status:'NATIVE_CPU_CLOCK_ESCAPES_WITH_EXACT_RAM_TOP_PADS_READY_FOR_LOCAL_EDIT',
  nativePreparation:{path:`${nativeDirectory}/result.json`,sha256:hash(`${nativeDirectory}/result.json`)},
  input:{path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)},
  preparedLocalEscapes:2,sourceCopper:{traces:69,totalSourceTraces:source.filter(e=>e.type==='pcb_trace').length},
  memoryMap:prior.connectionMap,ramReferenceLayout:{path:refs,sha256:hash(refs)},
  preservedSavedDdr:{path:paths,sha256:hash(paths),signals:Object.keys(read(paths)).length},
  virtualPreparationTargetsRemoved:2,allChannelEndpointsActualTopPads:true,temporarilyOpenedSignals:['DDR_DQS1'],
  defaultChanged:false,fabricationReady:false}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,tracesRetained:report.sourceCopper.totalSourceTraces}))
