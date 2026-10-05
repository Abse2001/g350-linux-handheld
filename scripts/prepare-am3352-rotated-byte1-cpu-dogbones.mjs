import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {SOLVERS} from '@tscircuit/core'
import {readRoutingSourceSnapshot} from './lib/am3352-routing-source-snapshot.mjs'

// Reserve CPU escapes together before long fanouts can trap adjacent balls.
// RAM bottom targets exist only in the native preparation diagnostic input.
// All saved channel endpoints remain the actual top numeric package pads.
const [bootstrap,ramDirectory,directory]=process.argv.slice(2)
assert(bootstrap&&ramDirectory&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),ram=read(`${ramDirectory}/result.json`),actual=read(`${bootstrap}/input.simple-route.json`)
assert.deepEqual(prior.source,ram.source);assert.equal(prior.preservedSavedDdr.signals,11)
assert.equal(prior.ramPlacementVariant.rotationDeg,180)
assert.equal(prior.sourceCopper.totalSourceTraces,80);assert.equal(prior.sourceCopper.totalThroughVias,99)
assert.equal(ram.bus,'DDR_BYTE1');assert.equal(ram.channelLayer,'top')
const source=readRoutingSourceSnapshot(prior.source).circuit
assert.equal(source.filter(e=>e.type==='pcb_trace').length,80)
const bus=actual.buses.find(b=>b.name==='DDR_BYTE1');assert.equal(bus.connectionNames.length,11)
assert.deepEqual(bus.allowedLayers,['top'])
const names=new Set(bus.connectionNames),input=structuredClone(actual)
input.connections=input.connections.filter(c=>names.has(c.name)).map(c=>{
  assert(c.pointsToConnect.every(p=>p.layer==='top'))
  return {...c,pointsToConnect:[c.pointsToConnect[0],{x:c.pointsToConnect[1].x,y:c.pointsToConnect[1].y,layer:'bottom'}]}
})
input.buses=[{...structuredClone(bus),allowedLayers:['bottom']}]
input.differentialPairs=input.differentialPairs.filter(p=>p.connectionNames.every(n=>names.has(n)))
assert.deepEqual(input.traces,actual.traces);assert.deepEqual(input.obstacles,actual.obstacles)
assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,882)
assert.equal(input.allowBlindAndBuriedVias,false)
assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254)
const solver=new SOLVERS.BusLanesPipelineSolver(input)
let error
try{solver.prepare()}catch(e){error=e.message}
mkdirSync(directory,{recursive:true})
writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(actual)+'\n')
writeFileSync(`${directory}/native-cpu-preparation.input.json`,JSON.stringify(input)+'\n')
const report={...prior,status:error?'NATIVE_BYTE1_CPU_ONLY_PREPARATION_FAILED':'NATIVE_BYTE1_CPU_DOGBONES_PREPARED_RAM_FANOUTS_RETAINED',
  error:error??null,input:{path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)},
  preparedLocalEscapes:error?0:solver.escapes.length,completedSignalChannels:0,fabricationReady:false,timingQualified:false}
if(!error){
  assert.equal(solver.escapes.length,11)
  for(const t of solver.escapes){
    const c=actual.connections.find(c=>c.name===t.source_trace_id);assert(c)
    assert.equal(t.pcb_trace_id,`local_dogbone_${c.name}_0`)
    assert(Math.hypot(t.route[0].x-c.pointsToConnect[0].x,t.route[0].y-c.pointsToConnect[0].y)<1e-6)
    assert.equal(t.route[0].layer,'top');assert.equal(t.route.at(-1).layer,'bottom')
    const vias=t.route.filter(p=>p.route_type==='via');assert.equal(vias.length,1)
    assert.equal(vias[0].via_diameter,.4572);assert.equal(vias[0].via_hole_diameter,.254)
    assert.deepEqual(vias[0].layers,['top','inner1','inner2','bottom'])
  }
  const holes=[...source.filter(e=>e.type==='pcb_via').map(v=>({x:v.x,y:v.y,hole:v.hole_diameter})),
    ...solver.escapes.flatMap(t=>t.route.filter(p=>p.route_type==='via').map(v=>({x:v.x,y:v.y,hole:v.via_hole_diameter})))]
  let minimumHoleEdgeClearanceMm=Infinity
  for(let i=0;i<holes.length;i++)for(let j=0;j<i;j++)minimumHoleEdgeClearanceMm=Math.min(minimumHoleEdgeClearanceMm,
    Math.hypot(holes[i].x-holes[j].x,holes[i].y-holes[j].y)-(holes[i].hole+holes[j].hole)/2)
  assert(minimumHoleEdgeClearanceMm>=.254-1e-6)
  const paths=read(`${ramDirectory}/local-escapes.json`).filter(t=>t.route[0].y<-15)
  const records=ram.localEscapes.filter(t=>t.package==='U_RAM'&&!t.error)
  assert.equal(paths.length,11);assert.equal(records.length,11)
  assert.deepEqual(new Set(paths.map(t=>t.source_trace_id)),names)
  for(const t of paths){
    const pad=actual.connections.find(c=>c.name===t.source_trace_id).pointsToConnect[1]
    assert.equal(t.route[0].layer,'top');assert.equal(t.route.at(-1).layer,'top')
    assert(Math.hypot(t.route[0].x-pad.x,t.route[0].y-pad.y)<1e-6)
  }
  const nativePath=`${directory}/signal-escapes.native.json`
  writeFileSync(nativePath,JSON.stringify(solver.escapes,null,2)+'\n')
  writeFileSync(`${directory}/local-escapes.json`,JSON.stringify(paths,null,2)+'\n')
  Object.assign(report,{bus:ram.bus,channelLayer:ram.channelLayer,localModificationGridMm:ram.localModificationGridMm,
    lanePitchMm:ram.lanePitchMm,freeDqExitPermutation:true,localEscapes:records,
    nativeBootstrap:{path:nativePath,sha256:hash(nativePath),dogbones:11},
    reusedRamFanouts:{path:`${ramDirectory}/local-escapes.json`,sha256:hash(`${ramDirectory}/local-escapes.json`),count:11},
    nativeCpuOnlyPreparation:{input:{path:`${directory}/native-cpu-preparation.input.json`,sha256:hash(`${directory}/native-cpu-preparation.input.json`)},
      solver:'@tscircuit/core SOLVERS.BusLanesPipelineSolver.prepare',cpuPadDogbones:11,virtualRamTargetDescriptors:11,
      virtualRamTargetsExported:false,actualRamPadEndpointsUnchanged:true,minimumHoleEdgeClearanceMm,
      scope:'CPU-only native dogbones. RAM preparation targets are not hardware; saved fanouts begin at the actual numeric top RAM pads.'}})
}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,error:report.error,nativeCpuEscapes:report.preparedLocalEscapes}))
process.exitCode=error?1:0
