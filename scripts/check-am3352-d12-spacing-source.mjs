import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
import {routeSegments,measureRouteExposure} from './lib/am3352-ddr-spacing-geometry.mjs'
const [sourcePath,pathsPath,reportPath]=process.argv.slice(2);assert(sourcePath&&pathsPath&&reportPath)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const provenancePath=pathsPath.replace(/\.json$/,'.provenance.json'),provenance=read(provenancePath),{summary}=readCheckedCommandSummary(provenance.priorCheckedSummary)
for(const a of [provenance.source,provenance.priorPaths,provenance.paths,provenance.spacingShortcutRun])verify(a);assert.deepEqual(provenance.source,summary.source)
const source=read(sourcePath),prior=read(summary.source.path),paths=read(pathsPath),before=read(summary.paths.path),owner=prior.find(s=>s.type==='source_trace'&&s.name==='DDR_D12').source_trace_id,run=read(provenance.spacingShortcutRun.path)
assert.deepEqual(run.cuts,provenance.cuts);assert.equal(run.newPhysicalHoles,0);for(const a of [run.executionHelper,run.spacingGeometryHelper,run.paths])verify(a)
let expected=before.DDR_D12;for(const c of run.cuts){assert(expected.slice(c.from,c.to+1).every(p=>!p.via));expected=expected.filter((p,i)=>i<=c.from||i>=c.to)}assert.deepEqual(paths.DDR_D12,expected)
for(const [name,p] of Object.entries(before))if(name!=='DDR_D12')assert.deepEqual(paths[name],p)
const fixed=s=>s.filter(e=>!['pcb_trace','pcb_copper_pour','source_project_metadata'].includes(e.type));assert.deepEqual(fixed(source),fixed(prior),'Changed fixed physical/logical records including holes')
assert.deepEqual(source.filter(e=>e.type==='pcb_copper_pour'),prior.filter(e=>e.type==='pcb_copper_pour'))
const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
for(const t of prior.filter(t=>t.type==='pcb_trace'&&t.source_trace_id!==owner))assert.deepEqual(geometry(source.find(p=>p.type==='pcb_trace'&&p.source_trace_id===t.source_trace_id).route),geometry(t.route))
const oldTrace=prior.find(t=>t.type==='pcb_trace'&&t.source_trace_id===owner),trace=source.find(t=>t.type==='pcb_trace'&&t.source_trace_id===owner)
assert.deepEqual(trace.route[0],oldTrace.route[0]);assert.deepEqual(trace.route.at(-1),oldTrace.route.at(-1));assert.equal(trace.route.length,expected.length+2)
let layer='top';for(const [i,p] of expected.entries()){const q=trace.route[i+1];assert(Math.hypot(q.x-p.x,q.y-p.y)<1e-8);if(p.via){assert.equal(q.route_type,'via');assert.equal(q.from_layer,layer);assert.equal(q.to_layer,p.toLayer);layer=p.toLayer}else{assert.equal(q.route_type,'wire');assert.equal(q.layer,layer);assert.equal(q.width,.1016)}}assert.equal(layer,'top')
const mapping=read(summary.memoryMap.path),traces=source.filter(t=>t.type==='pcb_trace').map(t=>({...t,name:source.find(s=>s.type==='source_trace'&&s.source_trace_id===t.source_trace_id)?.name})).filter(t=>mapping.some(m=>m.name===t.name)),segments=traces.flatMap(t=>routeSegments(t.name,t.route))
const spacing=traces.map(t=>({name:t.name,...measureRouteExposure(t.name,t.route,segments)})).map(r=>({name:r.name,planarMm:r.planarMm,exposureMm:r.exposureMm,partialExposurePass:r.exposureMm<=31.75+1e-8}));assert(spacing.every(r=>r.partialExposurePass))
const d12=spacing.find(r=>r.name==='DDR_D12');assert(Math.abs(d12.planarMm-run.afterPlanarMm)<1e-8);assert(Math.abs(d12.exposureMm-run.afterExposureMm)<1e-8)
assert.equal(source.filter(t=>t.type==='pcb_trace').length,135);assert.equal(source.filter(t=>t.type==='pcb_via').length,169);assert.equal(source.filter(t=>t.type==='pcb_smtpad').length,912);assert.equal(source.filter(t=>t.type.endsWith('_error')).length,0)
const report={status:'D12_SPACING_SHORTCUT_EXACT_SOURCE_REPLAY_AND_PARTIAL_CLASS_EXPOSURE_VERIFIED',source:artifact(sourcePath),paths:artifact(pathsPath),provenance:artifact(provenancePath),previousSource:summary.source,priorCheckedSummary:provenance.priorCheckedSummary,spacingGeometryHelper:artifact('scripts/lib/am3352-ddr-spacing-geometry.mjs'),memoryMap:summary.memoryMap,changedSignals:['DDR_D12'],allOther32DdrPathsPreserved:true,allOther134TracePiecesPreserved:true,all169PhysicalHolesPreserved:true,allFixedRecordsAndPlanesPreserved:true,d12PlanarMm:d12.planarMm,d12ReducedSpacingExposureMm:d12.exposureMm,partialSpacingResults:spacing,completeSpacingQualified:false,nativeBusLanesBootstrapRetained:true,fullElectricalTimingQualified:false,defaultChanged:false,originalShellFitVerified:false,fabricationReady:false}
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,d12PlanarMm:d12.planarMm,d12ExposureMm:d12.exposureMm,holes:169,fabricationReady:false}))
