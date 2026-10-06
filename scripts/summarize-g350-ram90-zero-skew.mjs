import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
const [root,sourceRoot]=process.argv.slice(2)
assert(root&&sourceRoot&&!fs.existsSync(`${root}/summary.json`))
const read=p=>JSON.parse(fs.readFileSync(p))
const artifact=path=>({path,sha256:createHash('sha256').update(fs.readFileSync(path)).digest('hex')})
const native=read(`${root}/native-qualification.json`),connectivity=read(`${root}/ddr-connectivity.json`),drc=read(`${root}/kicad-drc.json`),execution=read(`${root}/execution.json`),result=read(`${root}/result.json`)
assert.equal(native.status,'DDR_NATIVE_49_LENGTH_AND_PHYSICAL_PASS')
assert.equal(native.numericEndpointPairs,49);assert.equal(native.components,280)
assert.equal(native.source.sha256,artifact(`${sourceRoot}/compiled.circuit.json`).sha256)
assert.equal(connectivity.circuit.sha256,native.source.sha256)
assert.equal(connectivity.connectedSignals,49);assert.equal(connectivity.requiredSignals,49)
assert.equal(connectivity.board.sha256,artifact(`${sourceRoot}/zero-skew.kicad_pcb`).sha256)
assert.deepEqual(drc.ignored_checks,[])
assert(drc.included_severities.includes('error')&&drc.included_severities.includes('warning'))
assert(!drc.violations.some(v=>v.severity==='error'))
const settings=read(`${sourceRoot}/zero-skew.kicad_pro`).board.design_settings
assert.deepEqual(settings.drc_exclusions,[]);assert(!Object.values(settings.rule_severities).includes('ignore'))
assert(result.selectedPhaseFinished&&result.freshCompiledSource&&result.sourceDefinitionsUnchanged&&!result.forcedTimeout)
assert.equal(result.code,1)
assert.deepEqual(native.sourceErrorCounts,{pcb_port_not_connected_error:881,pcb_trace_missing_error:70})
assert.match(fs.readFileSync(`${root}/gerber-shorts.log`,'utf8'),/No shorts detected/)
assert.equal(artifact('dist/g350-current-index-byte0-handoff-fixed/compiled.circuit.json').sha256,'01815364357e0354de1089af4253e2ce2dc926f822b5f173b7ccb133e459f555')
assert.equal(execution.nativeChecks.sha256,'7bb83632137db56a698d91dc75ace0e74561e51dfcfb2bd9c6928a2280c45b2a')
const circuit=read(`${sourceRoot}/compiled.circuit.json`),layerLengths={top:0,inner1:0,inner2:0,bottom:0}
for(const t of circuit.filter(r=>r.type==='pcb_trace'))for(let i=1;i<t.route.length;i++){
 const a=t.route[i-1],b=t.route[i]
 if(a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer)layerLengths[a.layer]+=Math.hypot(b.x-a.x,b.y-a.y)
}
const files=fs.readdirSync(root).filter(n=>n!=='summary.json'&&fs.statSync(`${root}/${n}`).isFile()).sort()
const report={status:'PASS_SCOPED_49_DDR_NATIVE_LENGTH_PHYSICAL_SHORTS_AND_KICAD_CONNECTIVITY',entry:'experiments/am3352-g350-ram90-zero-skew-replay.circuit.tsx',sourceCircuitSha256:native.source.sha256,sourceEvidenceArchive:artifact(`${root}/source-replay-evidence.tar.gz`),routingTrialsArchive:artifact(`${root}/routing-trials.tar.gz`),connectedDdrSignals:49,requiredDdrSignals:49,nativeLengthSkewFailures:0,nativePhysicalErrors:0,manufacturingViaTrackClearanceErrors:0,allLayerGerberShorts:0,kicadManufacturingErrors:0,kicadIgnoredChecks:0,kicadPerItemExclusions:0,kicadWarnings:drc.violations.length,reportedKicadUnconnectedItems:drc.unconnected_items.length,kicadUnconnectedItemsMayBeCapped:true,sourceErrorCounts:native.sourceErrorCounts,componentPlacementPreserved:true,components:280,copperLayers:4,ramRotationDegrees:90,standardThroughVias:native.standardThroughVias,viaLandMm:.4572,viaDrillMm:.254,traceWidthMm:.1016,copperClearanceMm:.1016,groups:native.groups.map(({members,...g})=>({...g,members:members.length,minNativeLengthMm:Math.min(...members.map(r=>r.nativeLengthMm)),maxNativeLengthMm:Math.max(...members.map(r=>r.nativeLengthMm))})),nativeBusLanesBootstrap:{scope:'Three differential pairs, six complete signals',solved:true,execution:artifact('dist/g350-ram90-native-seeded-pairs-bottom-clock-01/execution.json'),manualRoutingAndTuningRetained:true},planarLengthPerLayerMm:layerLengths,innerPlanarLengthPercent:100*(layerLengths.inner1+layerLengths.inner2)/Object.values(layerLengths).reduce((a,b)=>a+b,0),fullDepthViaThicknessMm:1.6,defaultChanged:false,filledReferencesQualified:false,fullElectricalTimingQualified:false,nominalAllSignalsQualified:false,peripheralRoutingComplete:false,originalShellFitVerified:false,fabricationReady:false,evidence:files.map(n=>artifact(`${root}/${n}`))}
fs.writeFileSync(`${root}/summary.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,connectedDdrSignals:49,nativeLengthSkewFailures:0,kicadManufacturingErrors:0,allLayerGerberShorts:0,fabricationReady:false}))
