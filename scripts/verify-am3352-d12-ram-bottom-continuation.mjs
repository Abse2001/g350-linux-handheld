import {readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'

const prefix='checks/integrated/am3352-ddr33-d12-ram-bottom',read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),artifact=path=>({path,sha256:hash(path)})
const trials=read(`${prefix}-trial-status.json`);assert.equal(trials.trials.length,7);assert.deepEqual(trials.activeSolverHandles,[]);assert(!trials.fabricationReady)
const current=['scripts/repair-am3352-d12-spacing.mjs','scripts/replay-am3352-d12-spacing.mjs','scripts/check-am3352-d12-spacing-source.mjs','scripts/summarize-am3352-d12-spacing-checks.mjs','scripts/lib/am3352-ddr-spacing-geometry.mjs','scripts/check-am3352-ddr-class-spacing.mjs','scripts/check-am3352-ram-bottom-source.mjs','scripts/summarize-am3352-ram-bottom-checks.mjs','scripts/route-am3352-ram-bottom-native.mjs','scripts/route-am3352-ram-bottom-ordered-fanouts.mjs','scripts/summarize-am3352-d12-ram-bottom-trials.mjs','scripts/lib/am3352-checked-command-sources.mjs','scripts/verify-am3352-d12-ram-bottom-continuation.mjs']
const executed=trials.trials.map(t=>read(t.path).executionHelper.path),rows=[]
for(const path of [...current,...executed]){const result=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});assert.equal(result.status,0,`${path}: ${result.stderr}`);rows.push({...artifact(path),status:'PASS'})}
writeFileSync(`${prefix}-helper-syntax.json`,JSON.stringify({status:'PASS',currentHelpers:current.length,executedHelpers:executed.length,rows},null,2)+'\n')
assert.equal(readFileSync(`${prefix}-final-typecheck.log`,'utf8').trim(),'')
const equivalent=read('checks/integrated/am3352-ddr33-d12-default-frozen-equivalence.json');assert.equal(equivalent.equalNonMetadataRecords,7957);assert.equal(equivalent.connectedDdrSignals,30);assert.equal(hash(equivalent.active.path),equivalent.active.sha256);assert.equal(hash('dist/index/circuit.json'),equivalent.active.sha256)
assert(/^No shorts detected in circuit\.json\s*$/.test(readFileSync('checks/integrated/am3352-ddr33-d12-default-final-shorts.log','utf8').trim()))
const checkpoints=read(`${prefix}-checkpoint-revalidation.json`);assert.equal(checkpoints.registeredSourcesVerified,6);assert(checkpoints.rows.every(r=>r.status==='PASS'))
const design=read('design-status.json');assert.equal(design.fabricationReady,false);assert.equal(design.originalShellFit.verified,false)
const files=()=>readdirSync('fabrication',{recursive:true}).map(p=>`fabrication/${p}`).filter(p=>statSync(p).isFile()).sort().map(artifact),before=files()
assert.equal(before.length,205);assert.deepEqual(before,read('checks/integrated/am3352-ddr33-csn0-fabrication-guard.json').existingFiles.slice().sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0))
const result=spawnSync(process.execPath,['scripts/export-fabrication.mjs'],{encoding:'utf8'});const logPath=`${prefix}-fabrication-guard.log`;writeFileSync(logPath,result.stdout+result.stderr);assert.equal(result.status,1);assert((result.stdout+result.stderr).includes('Fabrication export blocked: integrated handheld routing, original G350 shell fit and release checks remain incomplete'))
assert.deepEqual(files(),before)
const report={status:'EXPECTED_BLOCK_BEFORE_ORDERING_FILES',exitCode:1,log:artifact(logPath),existingFabricationFiles:205,allExistingFilesUnchanged:true,existingFiles:before,defaultSource:equivalent.active,defaultNonMetadataEquivalencePass:true,defaultGerberShortsAllLayers:0,typecheck:artifact(`${prefix}-final-typecheck.log`),helperSyntax:artifact(`${prefix}-helper-syntax.json`),checkpointRevalidation:artifact(`${prefix}-checkpoint-revalidation.json`),terminalTrials:artifact(`${prefix}-trial-status.json`),sourceAndNativeCopperEvidenceOnly:true,originalShellFitVerified:false,fabricationReady:false}
writeFileSync(`${prefix}-fabrication-guard.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:'PASS',currentHelpers:current.length,executedHelpers:executed.length,registeredSources:6,defaultEqualRecords:7957,defaultShorts:0,fabricationGuard:'BLOCKED_AS_EXPECTED',historicalFilesUnchanged:205}))
