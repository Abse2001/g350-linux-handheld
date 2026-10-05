import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './lib/am3352-checked-command-sources.mjs'
const [runPath,stem='am3352-ddr-usbc-d12-spacing-repaired']=process.argv.slice(2)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)}),verify=a=>assert.equal(hash(a.path),a.sha256)
const run=read(runPath),{summary}=readCheckedCommandSummary(run.checkedSourceSummary)
assert.equal(run.status,'D12_GUARDED_SPACING_SHORTCUT_FOUND_REPLAY_AND_PHYSICAL_CHECKS_REQUIRED');assert.equal(run.signal,'DDR_D12');assert.equal(run.newPhysicalHoles,0)
for(const a of [run.source,run.priorPaths,run.paths,run.executionHelper,run.spacingGeometryHelper])verify(a);assert.deepEqual(run.source,summary.source)
const paths=read(run.paths.path),old=read(run.priorPaths.path);let route=old.DDR_D12
for(const c of run.cuts){assert(route.slice(c.from,c.to+1).every(p=>!p.via));route=route.filter((p,i)=>i<=c.from||i>=c.to)}assert.deepEqual(route,paths.DDR_D12)
for(const [name,p] of Object.entries(old))if(name!=='DDR_D12')assert.deepEqual(paths[name],p)
const pathsPath=`routing/${stem}-paths.json`,provenancePath=`routing/${stem}-paths.provenance.json`,entryPath=`experiments/${stem}.circuit.tsx`;for(const p of [pathsPath,provenancePath,entryPath])assert(!existsSync(p),'Immutable replay already exists')
writeFileSync(pathsPath,readFileSync(run.paths.path))
writeFileSync(provenancePath,JSON.stringify({status:'D12_SPACING_REPLAY_FRESH_SOURCE_AND_PHYSICAL_CHECKS_REQUIRED',source:summary.source,priorCheckedSummary:run.checkedSourceSummary,priorPaths:summary.paths,paths:artifact(pathsPath),spacingShortcutRun:artifact(runPath),signal:'DDR_D12',cuts:run.cuts,beforePlanarMm:run.beforePlanarMm,afterPlanarMm:run.afterPlanarMm,beforeExposureMm:run.beforeExposureMm,afterExposureMm:run.afterExposureMm,newPhysicalHoles:0,nativeBusLanesBootstrapRetained:true,defaultChanged:false,fullElectricalTimingQualified:false,originalShellFitVerified:false,fabricationReady:false},null,2)+'\n')
writeFileSync(entryPath,`import Host,{type GuidedDdrPathMap} from "./am3352-powered-host.circuit"\nimport memory from "../lib/am3352/memory-byte1-top-centered-swizzled-connections.json"\nimport paths from "../${pathsPath}"\nimport escapes from "../lib/am3352/ram-reference-escapes-byte1-access.json"\nimport usb from "../routing/am3352-ddr-usbc-final-routes.json"\nimport type {UsbRouteLayout} from "../lib/am3352/UsbCDevice"\n\n// Declared D12 wire shortcut retains the native DDR bootstrap and every hole.\n// Complete DDR/host electrical checks and original-shell fit remain required.\nexport default ()=><Host schematicDisabled memoryConnections={memory}\n  guidedDdrPaths={paths as GuidedDdrPathMap} ramReferenceEscapes={escapes}\n  byte1Layer="top" commandLayer="both" usbCDevice usbRouteLayout={usb as UsbRouteLayout}\n  ddrPowerPourClearance={.12}/>\n`)
console.log(JSON.stringify({entry:artifact(entryPath),paths:artifact(pathsPath),provenance:artifact(provenancePath),fabricationReady:false}))
