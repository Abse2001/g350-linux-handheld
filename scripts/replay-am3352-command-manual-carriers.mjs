import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const [runPath,stem]=process.argv.slice(2);assert(runPath&&/^am3352-[a-z0-9-]+$/.test(stem))
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const run=read(runPath);assert(['flexible','negotiate'].includes(run.mode));assert.equal(hash(run.state.path),run.state.sha256)
const state=read(run.state.path),source=read(run.source.path)
assert.equal(hash(run.source.path),run.source.sha256)
const fixedPath='routing/am3352-ddr23-command-replan-fixed-paths.json',paths=read(fixedPath)
assert.equal(Object.keys(paths).length,23)
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-7
for(const t of state.carriers){
 const s=source.find(e=>e.type==='source_trace'&&e.source_trace_id===t.source_trace_id);assert(s&&!Object.hasOwn(paths,s.name))
 const ports=s.connected_source_port_ids.map(id=>source.find(e=>e.type==='pcb_port'&&e.source_port_id===id))
 assert(ports.every(Boolean));assert(near(t.route[0],ports[0])&&t.route[0].layer==='top');assert(near(t.route.at(-1),ports[1])&&t.route.at(-1).layer==='top')
 let layer='top'
 for(const p of t.route){if(p.route_type==='via'){assert.equal(p.from_layer,layer);assert(['top','bottom'].includes(p.to_layer));assert.equal(p.via_diameter,.4572);assert.equal(p.via_hole_diameter,.254);layer=p.to_layer}else{assert.equal(p.route_type,'wire');assert.equal(p.layer,layer);assert.equal(p.width,.1016)}}
 assert.equal(layer,'top')
 paths[s.name]=t.route.slice(1,-1).map(p=>p.route_type==='via'?{x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}:{x:p.x,y:p.y})
}
const path=`routing/${stem}-paths.json`,entry=`experiments/${stem}.circuit.tsx`,nativeEntry=`experiments/${stem}-native-phase.circuit.tsx`,provenance=`routing/${stem}-paths.provenance.json`
for(const p of [path,entry,nativeEntry,provenance])assert(!existsSync(p))
writeFileSync(path,JSON.stringify(paths,null,2)+'\n')
const imports=`import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"\nimport memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"\nimport paths from "../${path}"\nimport escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"\nimport usb from "../routing/am3352-ddr-usbc-final-routes.json"\nimport type {UsbRouteLayout} from "../lib/am3352/UsbCDevice"\n`
const props=`schematicDisabled memoryConnections={memory} guidedDdrPaths={paths as GuidedDdrPathMap}\n  ramReferenceEscapes={escapes} byte1Layer="top" commandLayer="both"\n  usbCDevice usbRouteLayout={usb as UsbRouteLayout} ddrPowerPourClearance={.12}`
writeFileSync(entry,`${imports}\n// Editable real-pad replay. All pair declarations restored; checks required.\nexport default ()=><Host ${props}/>\n`)
const fixedPairs=[['DDR_DQS0_PAIR','DDR_DQS0','DDR_DQSn0'],['DDR_DQS1_PAIR','DDR_DQS1','DDR_DQSn1'],['DDR_CK_PAIR','DDR_CK','DDR_CKn']].filter(([,a,b])=>paths[a]&&paths[b]).map(([n])=>n)
// A fixed-mode continuation retains the clock geometry but may omit the prior
// state's hardCarrierIds metadata. Attribute retained clocks from actual paths.
const checkedClockPathsPath='routing/am3352-ddr-usbc-d12-spacing-repaired-paths.json',checkedClockPaths=read(checkedClockPathsPath)
const retainedCheckedClockNames=['DDR_CK','DDR_CKn'].filter(name=>Object.hasOwn(paths,name)&&JSON.stringify(paths[name])===JSON.stringify(checkedClockPaths[name]))
if(state.hardCarrierIds?.length)assert.equal(retainedCheckedClockNames.length,state.hardCarrierIds.length)
writeFileSync(nativeEntry,`${imports}\n// Native continuation only: omit declarations for already fixed pairs.\n// Replay entry above restores every pair before independent qualification.\nexport default ()=><Host ${props}\n  nativePhaseFixedPairNames={${JSON.stringify(fixedPairs)}}/>\n`)
writeFileSync(provenance,JSON.stringify({status:'COMMAND_MANUAL_CARRIER_REPLAY_REQUIRES_ALL_INDEPENDENT_CHECKS',run:artifact(runPath),state:run.state,source:run.source,fixedPaths:artifact(fixedPath),entry:artifact(entry),nativeEntry:artifact(nativeEntry),paths:artifact(path),stagedDdrSignals:Object.keys(paths).length,retainedDataResetSignals:23,manualCommandChannels:state.carriers.length-retainedCheckedClockNames.length,retainedCheckedClockChannels:retainedCheckedClockNames.length,retainedCheckedClockNames,checkedClockPaths:artifact(checkedClockPathsPath),executionHelper:artifact('scripts/replay-am3352-command-manual-carriers.mjs'),original125TracePiecesAnd141ViasRetained:true,uncommittedFanoutReservationsReplanned:true,fullElectricalTimingQualified:false,defaultChanged:false,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({entry,nativeEntry,staged:Object.keys(paths).length,newCommandChannels:state.carriers.length,fabricationReady:false}))
