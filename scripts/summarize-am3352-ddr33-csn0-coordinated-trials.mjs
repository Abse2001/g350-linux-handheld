import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'

const [reportPath='checks/integrated/am3352-ddr33-csn0-coordinated-trial-status.json',last='702']=process.argv.slice(2);assert.equal(Number(last),702)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const verify=a=>assert.equal(hash(a.path),a.sha256,`Changed bound artifact: ${a.path}`)
const verifyArtifacts=x=>{if(!x||typeof x!=='object')return;if(typeof x.path==='string'&&typeof x.sha256==='string')verify(x);for(const v of Object.values(x))verifyArtifacts(v)}
const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
const trials=[],byAttempt=new Map()
for(const dir of readdirSync('dist').filter(d=>/^am3352-ddr33-.*-attempt-\d+$/.test(d))){
 const attempt=Number(dir.match(/(\d+)$/)[1]);if(attempt<689||attempt>702)continue;assert(!byAttempt.has(attempt));const path=`dist/${dir}/result.json`;assert(existsSync(path));const run=read(path);verifyArtifacts(run)
 assert.equal(run.fabricationReady,false);assert.equal(run.defaultChanged,false)
 const checked=run.checkedSourceSummary??run.priorCheckedSummary,{summary,registration}=readCheckedCommandSummary(checked);assert.equal(registration.signals,33);assert.deepEqual(run.source,summary.source)
 const source=read(run.source.path),traces=source.filter(t=>t.type==='pcb_trace'),holes=source.filter(t=>t.type==='pcb_via')
 if(run.input){
  const input=read(run.input.path);assert.equal(input.layerCount,4);assert.equal(input.minViaPadDiameter,.4572);assert.equal(input.minViaHoleDiameter,.254);assert.equal(input.allowBlindAndBuriedVias,false)
  let openedTraces=[],openedHoles=[]
  if(run.openedCopper){
   const stage=read(run.openedCopper.path);assert.deepEqual(stage.source,run.source);assert.equal(stage.exportable,false)
   openedTraces=stage.openedTraces;openedHoles=stage.openedHoles
   assert.equal(openedTraces.length,attempt>=700?33:10);assert.equal(openedHoles.length,attempt>=700?80:28)
   for(const t of openedTraces)assert.deepEqual(t,traces.find(p=>p.pcb_trace_id===t.pcb_trace_id))
   for(const v of openedHoles){assert.deepEqual(v,holes.find(p=>p.pcb_via_id===v.pcb_via_id));assert(openedTraces.some(t=>t.pcb_trace_id===v.pcb_trace_id))}
   assert.deepEqual(openedHoles,holes.filter(v=>openedTraces.some(t=>t.pcb_trace_id===v.pcb_trace_id)))
   assert.equal(run.pendingOpenedSignalRepairs,openedTraces.length);assert.equal(run.exportable,false)
  }
  const retained=traces.filter(t=>!openedTraces.some(p=>p.pcb_trace_id===t.pcb_trace_id));assert.equal(input.traces.length,retained.length)
  for(const t of retained){const actual=input.traces.find(p=>p.pcb_trace_id===t.pcb_trace_id);assert(actual);assert.deepEqual(geometry(actual.route),geometry(t.route));for(const p of actual.route.filter(p=>p.route_type==='via')){assert.equal(p.via_diameter,.4572);assert.equal(p.via_hole_diameter,.254);assert.deepEqual(new Set(p.layers),new Set(['top','inner1','inner2','bottom']))}}
  const pads=source.filter(p=>p.type==='pcb_smtpad');assert.equal(pads.length,912);assert.equal(input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_smtpad_id).length,912)
  for(const p of pads){const o=input.obstacles.find(o=>o.circuitJsonMetadata?.pcb_smtpad_id===p.pcb_smtpad_id);const center=p.shape==='polygon'?{x:(Math.min(...p.points.map(p=>p.x))+Math.max(...p.points.map(p=>p.x)))/2,y:(Math.min(...p.points.map(p=>p.y))+Math.max(...p.points.map(p=>p.y)))/2}:p;assert(o&&Math.hypot(o.center.x-center.x,o.center.y-center.y)<1e-8)}
  const retainedHoles=holes.filter(v=>!openedHoles.some(p=>p.pcb_via_id===v.pcb_via_id))
  for(const o of input.obstacles.filter(o=>o.circuitJsonMetadata?.pcb_via_id))assert(retainedHoles.some(v=>v.pcb_via_id===o.circuitJsonMetadata.pcb_via_id))
  for(const v of retainedHoles){const o=input.obstacles.find(o=>o.circuitJsonMetadata?.pcb_via_id===v.pcb_via_id);if(o){assert(Math.hypot(o.center.x-v.x,o.center.y-v.y)<1e-8);assert.equal(o.width,v.outer_diameter);assert.equal(o.height,v.outer_diameter);assert.deepEqual(new Set(o.layers),new Set(v.layers))}else{assert(input.traces.some(t=>t.route.some(p=>p.route_type==='via'&&Math.hypot(p.x-v.x,p.y-v.y)<1e-8&&p.via_diameter===v.outer_diameter&&p.via_hole_diameter===v.hole_diameter)),'Every physical hole must be present as an obstacle or a fixed-route via')}}
 }
 if([693,695].includes(attempt)){
  assert.equal(run.signal,'DDR_CSn0');assert.equal(run.newVias,0);assert(run.nominalLengthPass);const before=read(run.priorPaths.path),after=read(run.paths.path);let route=before.DDR_CSn0
  for(const cut of run.cuts){assert.equal(cut.layer,'top');assert(route.slice(cut.from,cut.to+1).every(p=>!p.via));route=route.filter((p,i)=>i<=cut.from||i>=cut.to)}
  assert.deepEqual(route,after.DDR_CSn0);for(const [name,p] of Object.entries(before))if(name!=='DDR_CSn0')assert.deepEqual(after[name],p)
 }else{assert(!run.output&&!run.paths);assert.equal(run.newConnectedSignals??0,0)}
 if(attempt===692){assert.equal(run.searchStarted,false);assert.equal(run.solverStarted,false);assert.equal(run.exitCode,1);assert(readFileSync(run.log.path,'utf8').includes("Identifier 'checked' has already been declared"))}
 byAttempt.set(attempt,run);trials.push({...artifact(path),attempt,status:run.status,source:run.source,...(run.elapsedSeconds!==undefined?{elapsedSeconds:run.elapsedSeconds}:{}),...(run.failureCode?{failureCode:run.failureCode}:{}),...(run.openedCopper?{openedCopper:run.openedCopper,openedTracePieces:run.openedTracePieces,openedThroughVias:run.openedThroughVias,exportable:false}:{}),...(run.stats?{terminalNativeStats:run.stats}:{}),...(run.planarMm?{csnPlanarMm:run.planarMm,shortcuts:run.cuts.length}:{}),newQualifiedSignals:0,fabricationReady:false})
}
for(let n=689;n<=702;n++)assert(byAttempt.has(n),`Missing terminal phase ${n}`);trials.sort((a,b)=>a.attempt-b.attempt)
assert.equal(byAttempt.get(700).input.sha256,byAttempt.get(701).input.sha256)
const latest=artifact('checks/integrated/am3352-ddr-usbc-casn-csn0-nominal-d3-matched-check-summary.json'),{summary}=readCheckedCommandSummary(latest);verifyArtifacts(summary)
assert(summary.csnNominalLengthPass&&summary.casnNominalLengthPass&&summary.bothBytePlanarTimingPass);assert.equal(summary.manualWireShortcuts[0].run.path,trials.find(r=>r.attempt===695).path)
const spacing=artifact('checks/integrated/am3352-ddr33-casn-csn0-class-spacing.json'),spacingReport=read(spacing.path);verifyArtifacts(spacingReport);assert.deepEqual(spacingReport.source,summary.source);assert.equal(spacingReport.status,'PARTIAL_DDR_CLASS_SPACING_FAIL');assert.deepEqual(spacingReport.results.filter(r=>!r.reducedSpacingLengthPass).map(r=>r.name),['DDR_D12'])
const report={status:'DDR33_CSN0_NOMINAL_COPPER_REPAIR_CHECKED_COORDINATED_REPLANS_INCOMPLETE_D12_CLASS_SPACING_FAIL',trials,currentCopperEvidence:latest,currentCopperSource:summary.source,csnPlanarMm:summary.csnPlanarMm,csnNominalLengthPass:true,casnNominalLengthPass:true,holesAddedByCsnRepair:0,connectedDdrSignals:33,remainingDdrSignals:16,pendingNominalRepairSignals:summary.pendingNominalRepairSignals,spacingAudit:spacing,pendingSpacingRepairSignals:['DDR_D12'],defaultDdrSignals:30,defaultChanged:false,activeSolverHandles:[],copperLayers:4,allOpenedReplanStagesNonexportable:true,newQualifiedDdrSignals:0,bothByteRelativePlanarTimingPass:true,independentPhysicalDrcViolations:0,gerberShortsAllLayers:0,fullElectricalTimingQualified:false,originalShellFitVerified:false,fabricationReady:false,nextAction:'Repair D12 class spacing; design coordinated command and byte fanouts with clear escape corridors. Restore all opened nets before replay and independent checks, then finish nominal lengths, stackup/pair/return/termination qualification, power, storage, display, controls, audio and Linux with measured original G350 shell integration.'}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,trials:trials.length,csnPlanarMm:summary.csnPlanarMm,connected:33,open:16,spacingFailures:1,fabricationReady:false}))
