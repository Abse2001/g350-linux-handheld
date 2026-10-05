import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertSourceCopper} from './lib/am3352-source-copper.mjs'
import {assertSavedDdrCopper} from './lib/am3352-saved-ddr-copper.mjs'

// Reuse native reservations against the actual byte0 replay. This changes
// no source copper, pad or obstacle, and is pending physical qualification.
const [bootstrap,reservations,directory]=process.argv.slice(2)
assert(bootstrap&&reservations&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),old=read(`${reservations}/result.json`)
for(const r of [prior,old])assert.equal(hash(r.source.path),r.source.sha256)
assert.equal(hash(prior.input.path),prior.input.sha256)
assert.equal(hash(prior.memoryMap.path),prior.memoryMap.sha256)
assert.equal(prior.memoryMap.sha256,old.memoryMap.sha256)
assert.equal(hash(prior.preservedSavedDdr.path),prior.preservedSavedDdr.sha256)
const source=read(prior.source.path),originalSource=read(old.source.path)
const refs=read(prior.ramReferenceLayout.path)
const copper=assertSavedDdrCopper(source,read(prior.preservedSavedDdr.path),{ramRotation:180,rotatedD2PowerBridge:true,ramReferenceEscapes:refs})
assertSourceCopper(originalSource,{ramRotation:180,ramReferenceEscapes:refs})
assert.equal(copper.traces,70);assert.equal(copper.savedDdrSignals,11)
assert(copper.savedDdrNames.every(n=>/^DDR_(D[0-7]|DQM0|DQSn?0)$/.test(n)))
for(const type of ['source_component','pcb_smtpad','pcb_keepout'])
 assert.deepEqual(source.filter(e=>e.type===type),originalSource.filter(e=>e.type===type))
const original=read(prior.input.path),input=structuredClone(original)
assert.equal(input.layerCount,4);assert.equal(input.connections.length,38)
assert.equal(input.traces.length,81);assert.equal(input.allowBlindAndBuriedVias,false)
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,882)
input.buses=input.buses.map(b=>({...b,allowedLayers:['top']}))
assert.deepEqual({...input,buses:original.buses},original)
const nativePath=`${reservations}/signal-escapes.native.json`,allNative=read(nativePath)
assert.equal(allNative.length,96)
const native=allNative.filter(t=>input.connections.some(c=>c.name===t.source_trace_id))
assert.equal(native.length,74)
for(const t of native){
 const connection=input.connections.find(c=>c.name===t.source_trace_id)
 const endpoint=t.pcb_trace_id.endsWith('_1')?1:0,pad=connection.pointsToConnect[endpoint]
 assert.equal(t.pcb_trace_id,`local_dogbone_${connection.name}_${endpoint}`)
 assert.equal(t.route[0].layer,'top')
 assert(Math.hypot(t.route[0].x-pad.x,t.route[0].y-pad.y)<1e-6)
 assert(t.route.every(p=>p.route_type==='wire'?['top','bottom'].includes(p.layer)&&p.width===.1016:
  p.route_type==='via'&&p.via_diameter===.4572&&p.via_hole_diameter===.254))
}
const added=native.flatMap(t=>t.route.filter(p=>p.route_type==='via'))
assert.equal(added.length,63)
const holes=[...source.filter(e=>e.type==='pcb_via').map(v=>({...v,hole:v.hole_diameter})),...added.map(v=>({...v,hole:v.via_hole_diameter}))]
let minimumHoleEdgeClearanceMm=Infinity
for(let i=0;i<holes.length;i++)for(let j=0;j<i;j++)minimumHoleEdgeClearanceMm=Math.min(minimumHoleEdgeClearanceMm,
 Math.hypot(holes[i].x-holes[j].x,holes[i].y-holes[j].y)-(holes[i].hole+holes[j].hole)/2)
assert(minimumHoleEdgeClearanceMm>=.254-1e-6)
mkdirSync(directory,{recursive:true})
const inputPath=`${directory}/input.simple-route.json`,outputPath=`${directory}/signal-escapes.native.json`
writeFileSync(inputPath,JSON.stringify(input)+'\n');writeFileSync(outputPath,JSON.stringify(native,null,2)+'\n')
const report={...prior,status:'PRIOR_NATIVE_JOINT_RESERVATIONS_REUSED_WITH_FIXED_BYTE0_PENDING_CHECKS',error:null,failureCode:null,
 input:{path:inputPath,sha256:hash(inputPath)},sourceCopper:copper,preparedLocalEscapes:74,
 byte1ChannelLayer:'top',commandDogboneBootstrapLayer:'top',
 manualNativeEscapeReuse:{nativeReservations:{path:nativePath,sha256:hash(nativePath)},
  reservationRun:{path:`${reservations}/result.json`,sha256:hash(`${reservations}/result.json`)},
  descriptorsRetained:74,additionalThroughViaBranches:63,existingSourceThroughVias:copper.totalThroughVias,
  unchangedActualPads:882,minimumHoleEdgeClearanceMm,sourceCopperUnchanged:true,physicallyQualified:false},
 completedSignalChannels:0,fabricationReady:false,timingQualified:false,
 scope:'Earlier native bus_lanes descriptors are reused only at identical actual pads against the new byte0-first source. All existing copper/obstacles and original byte/clock limits remain. Combined physical, plane and complete-interface qualification is required.'}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,nativeDescriptors:74,newNativeHoles:63,minimumHoleEdgeClearanceMm}))
