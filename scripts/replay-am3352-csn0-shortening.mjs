import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'

const [runPath,stem='am3352-ddr-usbc-casn-csn0-nominal-d3-matched']=process.argv.slice(2)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const run=read(runPath),{summary}=readCheckedCommandSummary(run.priorCheckedSummary)
assert.equal(run.status,'COMMAND_NOMINAL_WIRE_SHORTCUT_FOUND_INDEPENDENT_REPLAY_CHECKS_REQUIRED')
for(const a of [run.source,run.paths,run.priorPaths,run.priorProvenance,run.priorSourceValidation,run.executionHelper])verify(a)
assert.deepEqual(run.source,summary.source);assert.equal(run.signal,'DDR_CSn0');assert.equal(run.newVias,0)
const paths=read(run.paths.path),before=read(run.priorPaths.path);let route=before.DDR_CSn0
for(const cut of run.cuts){assert.equal(cut.layer,'top');assert(route.slice(cut.from,cut.to+1).every(p=>!p.via));route=route.filter((p,i)=>i<=cut.from||i>=cut.to)}
assert.deepEqual(route,paths.DDR_CSn0);for(const [name,p] of Object.entries(before))if(name!=='DDR_CSn0')assert.deepEqual(paths[name],p)
const pathsPath=`routing/${stem}-paths.json`,provenancePath=`routing/${stem}-paths.provenance.json`,entryPath=`experiments/${stem}.circuit.tsx`
for(const p of [pathsPath,provenancePath,entryPath])assert(!existsSync(p),'Do not overwrite an immutable replay')
writeFileSync(pathsPath,readFileSync(run.paths.path))
const provenance=read(run.priorProvenance.path)
provenance.status='DDR33_CASN_CSN0_NOMINAL_D3_MATCHED_REPLAY_FRESH_CHECKS_REQUIRED';provenance.paths=artifact(pathsPath)
provenance.routes.DDR_CSn0.planarMm=run.planarMm
provenance.manualWireShortcuts=[{signal:run.signal,run:artifact(runPath),priorReplayPaths:run.priorPaths,priorReplayProvenance:run.priorProvenance,priorCheckedSummary:run.priorCheckedSummary,cuts:run.cuts,newPhysicalHoles:0,fullElectricalTimingQualified:false}]
writeFileSync(provenancePath,JSON.stringify(provenance,null,2)+'\n')
writeFileSync(entryPath,`import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"\nimport memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"\nimport paths from "../${pathsPath}"\nimport escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"\nimport usb from "../routing/am3352-ddr-usbc-final-routes.json"\nimport type {UsbRouteLayout} from "../lib/am3352/UsbCDevice"\n\n// Native bus_lanes bootstrap with declared guarded wire-only CSn0 shortcuts.\n// DDR, complete power, Linux boot and original-shell fit remain unqualified.\nexport default ()=><Host schematicDisabled memoryConnections={memory}\n  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes}\n  byte1Layer="top" commandLayer="both" usbCDevice usbRouteLayout={usb as UsbRouteLayout}\n  ddrPowerPourClearance={.12}/>\n`)
console.log(JSON.stringify({entry:artifact(entryPath),paths:artifact(pathsPath),provenance:artifact(provenancePath),csnPlanarMm:run.planarMm,holesAdded:0,fabricationReady:false}))
