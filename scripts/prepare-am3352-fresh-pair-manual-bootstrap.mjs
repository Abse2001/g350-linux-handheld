import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// Retain real native CPU dogbones and restore both actual top-side pad
// endpoints after an explicitly non-exportable CPU-only preparation.
const [nativeDirectory,directory,pathsPath,channelLayer='top']=process.argv.slice(2)
assert(nativeDirectory&&directory&&pathsPath)
assert(['top','bottom'].includes(channelLayer))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${nativeDirectory}/result.json`),input=read(prior.input.path),source=read(prior.source.path)
for(const a of [prior.source,prior.input,prior.localEscapes,prior.connectionMap])assert.equal(hash(a.path),a.sha256)
assert.equal(prior.status,'NATIVE_DDR_LOCAL_ESCAPES_PREPARED_CHANNELS_UNROUTED')
assert.equal(prior.mode,'prepare-cpu');assert.equal(prior.preparedEscapes,2)
assert(['strobe','clock'].includes(prior.selection))
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
const busName=prior.selection==='strobe'?'DDR_BYTE1':'DDR_COMMAND_CLOCK'
input.buses=input.buses.map(b=>({...b,name:busName,busId:busName,allowedLayers:[channelLayer]}))
assert.equal(input.connections.length,2);assert.equal(input.differentialPairs.length,1)
const paths=read(pathsPath),names=new Set(source.filter(e=>e.type==='source_trace').map(e=>e.name))
assert(Object.keys(paths).every(n=>names.has(n)));assert(prior.definitions.every(d=>!paths[d.name]))
const refs='lib/am3352/ram-reference-escapes-byte1-access.json'
mkdirSync(directory,{recursive:true})
const inputPath=`${directory}/input.simple-route.json`
const escapesPath=`${directory}/signal-escapes.native.json`
writeFileSync(inputPath,JSON.stringify(input)+'\n');writeFileSync(escapesPath,JSON.stringify(native)+'\n')
const report={...prior,status:'NATIVE_CPU_PAIR_ESCAPES_WITH_EXACT_RAM_TOP_PADS_READY_FOR_LOCAL_EDIT',
  nativePreparation:{path:`${nativeDirectory}/result.json`,sha256:hash(`${nativeDirectory}/result.json`)},
  input:{path:inputPath,sha256:hash(inputPath)},localEscapes:{path:escapesPath,sha256:hash(escapesPath)},
  preparedLocalEscapes:2,sourceCopper:{traces:69,totalSourceTraces:source.filter(e=>e.type==='pcb_trace').length},
  memoryMap:prior.connectionMap,ramReferenceLayout:{path:refs,sha256:hash(refs)},
  preservedSavedDdr:{path:pathsPath,sha256:hash(pathsPath),signals:Object.keys(paths).length},
  virtualPreparationTargetsRemoved:2,allChannelEndpointsActualTopPads:true,
  actualPackagePadStartsAllowed:true,
  temporaryOpenSignals:prior.definitions.map(d=>d.name),defaultChanged:false,fabricationReady:false}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,bus:busName,tracesRetained:report.sourceCopper.totalSourceTraces}))
