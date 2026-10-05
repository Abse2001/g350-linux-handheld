import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertDiagnosticCommandOpenings} from './lib/am3352-command-openings.mjs'
import {readRoutingSourceSnapshot} from './lib/am3352-routing-source-snapshot.mjs'
import {assertSourceCopper} from './lib/am3352-source-copper.mjs'
import {assertSavedDdrCopper} from './lib/am3352-saved-ddr-copper.mjs'

// Restore the source's final outer-layer allocation after joint temporary
// bottom dogbone preparation. Native escapes and all source copper stay fixed.
const [bootstrap,directory]=process.argv.slice(2);assert(bootstrap&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),original=read(`${bootstrap}/input.simple-route.json`),input=structuredClone(original)
const openCommand=prior.temporaryOpenCommandChannels!==undefined
const openingCount=openCommand?assertDiagnosticCommandOpenings(prior.temporaryOpenCommandChannels):0
if(openCommand)assert.equal(prior.preservedSavedDdr.signals,26-openingCount)
const commandFirst=prior.preservedSavedDdr?.signals===26||openCommand
const powerBridge=prior.sourceCopper.rotatedD2PowerBridge!==undefined
const byte0First=powerBridge&&prior.preservedSavedDdr?.signals===11
const nativeCount=commandFirst?44:byte0First?74:96
const powerTraceCount=powerBridge?70:69
if(powerBridge){
  assert(!commandFirst)
  const source=readRoutingSourceSnapshot(prior.source).circuit
  const options={ramRotation:180,rotatedD2PowerBridge:true,
    ramReferenceEscapes:read('lib/am3352/ram-reference-escapes-rotated-180.json')}
  if(byte0First){
    assert.equal(hash(prior.preservedSavedDdr.path),prior.preservedSavedDdr.sha256)
    const copper=assertSavedDdrCopper(source,read(prior.preservedSavedDdr.path),options)
    assert.equal(copper.savedDdrSignals,11)
    assert.deepEqual(new Set(copper.savedDdrNames),new Set([...Array.from({length:8},(_,i)=>`DDR_D${i}`),'DDR_DQM0','DDR_DQS0','DDR_DQSn0']))
  }else assertSourceCopper(source,options)
}
assert.equal(prior.preparedLocalEscapes,nativeCount);assert.equal(prior.sourceCopper.traces,powerTraceCount)
assert.equal(prior.sourceCopper.totalSourceTraces??prior.sourceCopper.traces,commandFirst?95-openingCount:byte0First?81:powerTraceCount)
assert.equal(input.connections.length,commandFirst?23+openingCount:byte0First?38:49);assert.equal(input.layerCount,4)
if(byte0First)assert.deepEqual(input.buses.map(b=>b.name),['DDR_BYTE1','DDR_COMMAND_CLOCK','DDR_RESET'])
if(commandFirst)assert.deepEqual(input.buses.map(b=>b.name),openCommand?['DDR_BYTE0','DDR_BYTE1','DDR_COMMAND_CLOCK','DDR_RESET']:['DDR_BYTE0','DDR_BYTE1','DDR_RESET'])
if(openCommand)assert.equal(input.buses.find(b=>b.name==='DDR_COMMAND_CLOCK').connectionNames.length,openingCount)
input.buses=input.buses.map(b=>({...b,allowedLayers:[b.name==='DDR_BYTE0'?'bottom':'top']}))
assert.deepEqual({...input,buses:original.buses},original,'Only the final channel layer allocation may change')
const nativePath=`${bootstrap}/signal-escapes.native.json`,native=read(nativePath);assert.equal(native.length,nativeCount)
mkdirSync(directory,{recursive:true})
writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(input)+'\n')
writeFileSync(`${directory}/signal-escapes.native.json`,readFileSync(nativePath))
const report={...prior,status:'JOINT_NATIVE_BREAKOUTS_RETAINED_FINAL_CHANNEL_LAYERS_SELECTED',byte1ChannelLayer:'top',
  input:{path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)},
  manualChannelLayerAllocation:{bootstrapInput:{path:`${bootstrap}/input.simple-route.json`,sha256:hash(`${bootstrap}/input.simple-route.json`)},
    nativeEscapes:{path:nativePath,sha256:hash(nativePath)},nativeEscapesRetained:nativeCount,
    finalLayers:{DDR_BYTE0:'bottom',DDR_BYTE1:'top',DDR_COMMAND_CLOCK:'top',DDR_RESET:'top'},
    sourcePowerAndObstaclesUnchanged:true,newCompletedChannels:0,
    scope:'Channel layers match the actual source constraints. Full-depth native dogbones remain available on both outer layers; saved paths must record every real layer change.'}}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,nativeEscapesRetained:nativeCount}))
