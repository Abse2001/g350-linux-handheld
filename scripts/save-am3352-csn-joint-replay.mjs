import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'

const [channelDirectory,repairDirectory,destination]=process.argv.slice(2);assert(channelDirectory&&repairDirectory&&destination)
assert(!existsSync(destination),'Do not overwrite a saved joint replay')
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),checked=a=>assert.equal(hash(a.path),a.sha256)
const channelPath=`${channelDirectory}/result.json`,repairPath=`${repairDirectory}/result.json`,channel=read(channelPath),repair=read(repairPath)
assert.equal(channel.status,'GUIDED_NATIVE_CHANNEL_ROUTED_UNQUALIFIED');assert.equal(channel.exportable,false);assert.equal(channel.totalDdrSignalsAfterPhase,26)
assert.equal(repair.status,'STAGED_DDR_D14_CPU_PREFIX_MANUAL_REPAIR_READY_REPLAY_AND_MATCHING_REQUIRED');assert.deepEqual(repair.restoredCpuPrefixNames,['DDR_D10'])
const {summary,registration}=readCheckedCommandSummary(channel.checkedSourceSummary);assert.equal(registration.signals,27)
assert.deepEqual(repair.source,summary.source);assert.deepEqual(repair.cpuPrefixRebuild.stagedNativeCommand,artifact(channelPath))
for(const a of [channel.source,channel.output,channel.channel.input,channel.priorLocalRun,channel.temporaryOpenCpuTails,repair.source,repair.stagedFixedCopper])checked(a)
const prior=read(summary.paths.path),paths=structuredClone(prior),tails=read(channel.temporaryOpenCpuTails.path)
const cpuRepairPath=`${repairDirectory}/local-escapes.json`,prefixes=read(cpuRepairPath);assert.equal(prefixes.length,1);assert.equal(prefixes[0].source_trace_id,'source_trace_40')
const commandLocalPath=channel.priorLocalRun.path.replace(/result\.json$/,'local-escapes.json'),local=read(commandLocalPath),output=read(channel.output.path),input=read(channel.channel.input.path)
assert.deepEqual(output.traces.slice(0,input.traces.length),input.traces);assert.equal(output.traces.length,input.traces.length+1)
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8,reverse=r=>r.toReversed().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:{...p})
const asPath=parts=>{
  for(let i=1;i<parts.length;i++)assert(near(parts[i-1].at(-1),parts[i][0]))
  const clean=[]
  for(const p of parts.flat()){const q=clean.at(-1);if(q&&p.route_type==='wire'&&q.route_type==='wire'&&p.layer===q.layer&&near(p,q))continue;clean.push(p)}
  let layer='top'
  const path=clean.map(p=>{if(p.route_type==='via'){assert.equal(p.from_layer,layer);layer=p.to_layer;assert.equal(p.via_diameter,.4572);assert.equal(p.via_hole_diameter,.254);return{x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}}assert.equal(p.layer,layer);assert.equal(p.width,.1016);assert(['top','bottom'].includes(layer));return{x:p.x,y:p.y}})
  assert.equal(layer,'top');return path
}
const cpu=local.find(t=>t.source_trace_id==='source_trace_5'&&t.route[0].y>-15),ram=local.find(t=>t.source_trace_id==='source_trace_5'&&t.route[0].y<-15)
let carrier=output.traces.at(-1).route;if(!near(cpu.route.at(-1),carrier[0]))carrier=reverse(carrier)
paths.DDR_CSn0=asPath([cpu.route,carrier,reverse(ram.route)])
const d14=tails.find(t=>t.name==='DDR_D14');paths.DDR_D14=asPath([prefixes[0].route,d14.retainedTail])
for(const name of Object.keys(prior))if(name!=='DDR_D14')assert.deepEqual(paths[name],prior[name])
const length=r=>r.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-r[i].x,p.y-r[i].y),0)
const source=read(summary.source.path),newVias=prefixes[0].route.filter(p=>p.route_type==='via'),holes=[...source.filter(e=>e.type==='pcb_via'),...newVias]
assert.equal(newVias.length,2);assert.equal(paths.DDR_CSn0.filter(p=>p.via).length,0)
let minimumHoleEdgeGapMm=Infinity
for(let i=0;i<holes.length;i++)for(let j=0;j<i;j++){const gap=Math.hypot(holes[i].x-holes[j].x,holes[i].y-holes[j].y)-.254;minimumHoleEdgeGapMm=Math.min(minimumHoleEdgeGapMm,gap);assert(gap>=.254-1e-8)}
writeFileSync(destination,JSON.stringify(paths,null,2)+'\n')
const preparationPath=repair.nativeBootstrap.path.replace(/signal-escapes.native\.json$/,'result.json'),prep=read(preparationPath)
assert.equal(prep.status,'STAGED_D14_CPU_PREFIX_REPAIR_D10_RESTORED_NOT_EXPORTABLE')
const provenance={status:'DDR28_CSN_NATIVE_CHANNEL_AND_D14_CPU_REPAIR_REPLAY_INDEPENDENT_CHECKS_REQUIRED',source:summary.source,priorCheckedSummary:channel.checkedSourceSummary,priorPaths:{...summary.paths,signals:27},paths:artifact(destination),
  nativeChannelRun:artifact(channelPath),nativeChannelInput:channel.channel.input,nativeChannelOutput:channel.output,manualLocalRun:channel.priorLocalRun,manualLocalCopper:artifact(commandLocalPath),nativeBootstrap:channel.nativeBootstrap,
  newSignals:['DDR_CSn0'],changedExistingSignals:['DDR_D14'],sourceTraceId:'source_trace_5',priorSignalsPreserved:27,connectedCandidateSignals:28,remainingUnroutedDdrSignals:21,
  planarMm:length(paths.DDR_CSn0),throughVias:0,csnNominalLengthPass:length(paths.DDR_CSn0)>=41.75&&length(paths.DDR_CSn0)<=44.29,
  cpuPrefixRepair:{signal:'DDR_D14',sourceTraceId:'source_trace_40',manualRun:artifact(repairPath),manualCopper:artifact(cpuRepairPath),preparation:artifact(preparationPath),originalTails:channel.temporaryOpenCpuTails,cutIndex:d14.cutIndex,newPhysicalVias:2,planarMm:length(paths.DDR_D14),restoredD10Preflight:prep.restoredD10CommandCopperPreflight},
  preservedSourceTracePieces:128,preservedSourceHoles:147,newPhysicalVias:2,minimumHoleEdgeGapMm,fullCommandClassMatchingDeferred:true,nativeBusLanesBootstrap:true,manualLocalRepairs:true,copperLayers:4,defaultChanged:false,fullElectricalTimingQualified:false,fabricationReady:false}
writeFileSync(destination.replace(/\.json$/,'.provenance.json'),JSON.stringify(provenance,null,2)+'\n');console.log(JSON.stringify({status:provenance.status,csnMm:provenance.planarMm,d14Mm:provenance.cpuPrefixRepair.planarMm,newVias:2,minimumHoleEdgeGapMm,fabricationReady:false}))
