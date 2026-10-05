import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [runPath,stem]=process.argv.slice(2)
assert(runPath&&stem&&/^am3352-[a-z0-9-]+$/.test(stem))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const run=read(runPath);assert(['BOTTOM_RAM_NEGOTIATED_ALL49_PLANNED_REPLAY_AND_ALL_CHECKS_REQUIRED','BOTTOM_RAM_NEGOTIATED_PLANNING_STEP_LIMIT_DDR_INCOMPLETE','BOTTOM_RAM_NEGOTIATED_PLANNING_STOPPED_AFTER_FIVE_UNFINISHED_ROUTES'].includes(run.status));verify(run.state)
const state=read(run.state.path)
assert.equal(state.status,'BOTTOM_RAM_NATIVE_AND_MANUAL_STAGED_DDR_COPPER_UNCHECKED');assert(!state.exportable&&!state.fabricationReady)
for(const a of [state.source,state.checkedPlacementSummary,state.sourceValidation,state.nativeBootstrapRun,state.nativePartialSeed,state.nativeOriginalInput])verify(a)
assert.equal(state.originalFixedTraces.length,102);assert.equal(state.definitions.length,49)
const seed=read(state.nativePartialSeed.path),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8
const reverse=r=>r.toReversed().map(p=>p.route_type==='via'?{...p,from_layer:p.to_layer,to_layer:p.from_layer}:{...p})
const expected={}
for(const c of seed.carriers){
 const d=state.definitions.find(d=>d.sourceTraceId===c.source_trace_id),a=seed.escapes.find(t=>near(t.route[0],d.endpoints[0])&&near(t.route.at(-1),c.route[0])),b=seed.escapes.find(t=>t!==a&&near(t.route[0],d.endpoints[1])&&near(t.route.at(-1),c.route.at(-1)))
 expected[c.source_trace_id]=[...(a?.route.slice(0,-1)??[]),...c.route,...(b?reverse(b.route).slice(1):[])]
}
const manual=[]
for(const step of state.manualSteps){
 const r=read(step.run);assert.equal(r.status,'BOTTOM_RAM_MANUAL_ROUTE_PLAN_FOUND_REPLAY_AND_ALL_CHECKS_REQUIRED');assert.equal(r.reservations,'replan-unrouted');verify(r.manualCarrierPlan)
 const route=read(r.manualCarrierPlan.path);assert(!expected[step.sourceTraceId]);expected[step.sourceTraceId]=route;manual.push(artifact(step.run))
}
for(const opened of state.openedInitialStagedPaths){verify(opened.route);assert.deepEqual(expected[opened.sourceTraceId],read(opened.route.path));delete expected[opened.sourceTraceId]}
for(const step of state.negotiatedSteps){
 verify(step.route)
 for(const opened of step.openedStagedPaths){verify(opened.route);assert.deepEqual(expected[opened.sourceTraceId],read(opened.route.path));delete expected[opened.sourceTraceId]}
 assert(!expected[step.sourceTraceId]);expected[step.sourceTraceId]=read(step.route.path)
}
assert.deepEqual(Object.keys(expected).sort(),Object.keys(state.fullPaths).sort())
for(const [id,route] of Object.entries(expected))assert.deepEqual(state.fullPaths[id].route,route)
for(const id of state.nativeCarrierIds){const c=seed.carriers.find(c=>c.source_trace_id===id);assert(c);assert(!state.negotiatedSteps.some(s=>s.openedStagedPaths.some(o=>o.sourceTraceId===id)))}
const paths={}
for(const d of state.definitions){
 const route=expected[d.sourceTraceId];if(!route)continue
 assert(near(route[0],d.endpoints[0])&&route[0].layer===d.endpoints[0].layer);assert(near(route.at(-1),d.endpoints[1])&&route.at(-1).layer===d.endpoints[1].layer)
 let layer=d.endpoints[0].layer
 for(const p of route){if(p.route_type==='via'){assert.equal(p.from_layer,layer);assert.equal(p.via_diameter,.4572);assert.equal(p.via_hole_diameter,.254);assert.deepEqual(new Set(p.layers),new Set(['top','inner1','inner2','bottom']));layer=p.to_layer}else{assert.equal(p.route_type,'wire');assert.equal(p.layer,layer);assert.equal(p.width,.1016)}}
 assert.equal(layer,d.endpoints[1].layer)
 paths[d.name]=route.slice(1,-1).map(p=>p.route_type==='via'?{x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}:{x:p.x,y:p.y})
}
const pathsPath=`routing/${stem}-paths.json`,provenancePath=`routing/${stem}-paths.provenance.json`,entryPath=`experiments/${stem}.circuit.tsx`
for(const p of [pathsPath,provenancePath,entryPath])assert(!existsSync(p),'Immutable replay already exists')
writeFileSync(pathsPath,JSON.stringify(paths,null,2)+'\n')
writeFileSync(entryPath,`import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"\nimport memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"\nimport paths from "../${pathsPath}"\nimport escapes from "../lib/am3352/ram-reference-escapes-bottom-mirrored.json"\nimport usb from "../routing/am3352-ddr-usbc-final-routes.json"\nimport type {UsbRouteLayout} from "../lib/am3352/UsbCDevice"\n\n// Actual bus_lanes partial bootstrap plus declared manual paths.\n// Independent shorts, connectivity, physical and complete DDR checks required.\nexport default ()=><Host schematicDisabled ramLayer="bottom" guidedPathsRamLayer="bottom"\n  memoryConnections={memory} guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes}\n  byte0Layer="both" byte1Layer="both" commandLayer="both" resetLayer="both"\n  usbCDevice usbRouteLayout={usb as UsbRouteLayout} ddrPowerPourClearance={.12}/>\n`)
writeFileSync(provenancePath,JSON.stringify({status:'BOTTOM_RAM_STAGED_ROUTE_REPLAY_INDEPENDENT_CHECKS_REQUIRED',entry:artifact(entryPath),paths:artifact(pathsPath),stageRun:artifact(runPath),stageState:run.state,source:state.source,checkedPlacementSummary:state.checkedPlacementSummary,nativeBootstrapRun:state.nativeBootstrapRun,nativePartialSeed:state.nativePartialSeed,manualRuns:manual,initialNativeCarrierCount:seed.carriers.length,nativeCarrierCount:state.nativeCarrierIds.length,negotiatedRepairRun:artifact(runPath),negotiatedRepairSteps:state.negotiatedSteps.length,fixedNativeFanoutsReserved:49,openedInitialStagedPaths:state.openedInitialStagedPaths,stagedDdrRoutes:Object.keys(paths).length,remainingDdrSignals:49-Object.keys(paths).length,original89SourceHolesPreserved:true,original102SourcePiecesPreserved:true,fullElectricalTimingQualified:false,originalShellFitVerified:false,defaultChanged:false,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({entry:artifact(entryPath),paths:artifact(pathsPath),provenance:artifact(provenancePath),staged:Object.keys(paths).length,fabricationReady:false}))
