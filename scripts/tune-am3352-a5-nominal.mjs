import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'

const [inputPath,destination]=process.argv.slice(2);assert(inputPath&&destination&&!existsSync(destination))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const priorProvenancePath=inputPath.replace(/\.json$/,'.provenance.json'),prior=read(priorProvenancePath)
const {summary,registration}=readCheckedCommandSummary(prior.priorCheckedSummary);assert.equal(registration.signals,28)
assert.deepEqual(prior.newSignals,['DDR_A5']);assert.equal(prior.throughVias,2);assert.equal(prior.connectedCandidateSignals,29)
assert.equal(hash(inputPath),prior.paths.sha256)
const paths=read(inputPath),path=paths.DDR_A5,length=r=>r.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-r[i].x,p.y-r[i].y),0)
assert.equal(length(path),prior.planarMm)
const x=-12.41899,index=path.findIndex((p,i)=>!p.via&&!path[i+1]?.via&&Math.abs(p.x-x)<1e-8&&Math.abs(path[i+1]?.x-x)<1e-8&&p.y>-15.4&&path[i+1]?.y<-20.6)
assert(index>=0)
let layer='top';for(const p of path.slice(0,index+1))if(p.via)layer=p.toLayer;assert.equal(layer,'bottom')
const targetMm=summary.placementNominalReview.nominalMm,chamferMm=.6,additionalMm=targetMm-prior.planarMm
assert(additionalMm>0&&additionalMm<6)
const offsetMm=(additionalMm+4*chamferMm*(2-Math.SQRT2))/2
const insertedPoints=[{x,y:-15.4},{x:x-chamferMm,y:-16},{x:x-offsetMm+chamferMm,y:-16},{x:x-offsetMm,y:-16.6},{x:x-offsetMm,y:-19.4},{x:x-offsetMm+chamferMm,y:-20},{x:x-chamferMm,y:-20},{x,y:-20.6}]
assert(insertedPoints.every(p=>p.x>-17&&p.x<-12&&p.y>=-21&&p.y<=-15))
path.splice(index+1,0,...insertedPoints)
assert(Math.abs(length(path)-targetMm)<1e-8)
for(const n of Object.keys(read(inputPath)))if(n!=='DDR_A5')assert.deepEqual(paths[n],read(inputPath)[n])
assert.deepEqual(path.filter(p=>p.via),read(inputPath).DDR_A5.filter(p=>p.via))
writeFileSync(destination,JSON.stringify(paths,null,2)+'\n')
const tuning={status:'A5_BOTTOM_WIRE_NOMINAL_TUNING_REPLAY_REQUIRES_FULL_PHYSICAL_CHECKS',priorPaths:artifact(inputPath),priorProvenance:artifact(priorProvenancePath),signal:'DDR_A5',layer:'bottom',afterIndex:index,insertedPoints,offsetMm,chamferMm,priorPlanarMm:prior.planarMm,targetPlanarMm:targetMm,addedPlanarMm:additionalMm,newVias:0,retainedNativeBusLanesCarrier:true,allPreviouslyCheckedSignalsUnchanged:true}
const provenance={...prior,status:'DDR29_A5_NATIVE_CARRIER_MANUAL_NOMINAL_TUNING_REPLAY_INDEPENDENT_CHECKS_REQUIRED',paths:artifact(destination),planarMm:length(path),nominalLengthPass:true,manualNominalTuning:tuning}
writeFileSync(destination.replace(/\.json$/,'.provenance.json'),JSON.stringify(provenance,null,2)+'\n')
console.log(JSON.stringify({status:provenance.status,planarMm:provenance.planarMm,additionalMm,newVias:0,offsetMm,fabricationReady:false}))
