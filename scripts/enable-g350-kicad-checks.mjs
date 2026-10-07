import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
const [boardPath,drcPath,reportPath]=process.argv.slice(2)
assert(boardPath&&drcPath&&reportPath&&!fs.existsSync(reportPath))
const projectPath=boardPath.replace(/\.kicad_pcb$/,'.kicad_pro')
assert(projectPath!==boardPath&&!fs.existsSync(projectPath),'Only create a new trial project; preserve existing projects')
const defaults=JSON.parse(fs.readFileSync(drcPath)),presentation=new Set(['missing_courtyard','footprint_filters_mismatch','footprint_type_mismatch'])
// An already-audited input report has no ignored checks. A new minimal project
// would otherwise restore KiCad's default ignored severities. Retain the five
// defaults explicitly enabled in the checked G350 KiCad 10 project.
const retained=['missing_courtyard','track_not_centered_on_via','tuning_profile_track_geometries','footprint_filters_mismatch','footprint_type_mismatch']
const rules=Object.fromEntries([...new Set([...retained,...(defaults.ignored_checks??[]).map(r=>r.key)])].map(key=>[key,presentation.has(key)?'warning':'error']))
const project={meta:{filename:projectPath.split('/').at(-1),version:1},board:{design_settings:{drc_exclusions:[],rule_severities:rules}}}
fs.writeFileSync(projectPath,JSON.stringify(project,null,2)+'\n')
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
fs.writeFileSync(reportPath,JSON.stringify({defaultReport:{path:drcPath,sha256:hash(drcPath)},project:{path:projectPath,sha256:hash(projectPath)},enabledDefaultIgnoredChecks:rules,noPerItemExclusions:true,allPreviouslyEnabledRulesRetained:true,finalDrcMustHaveNoIgnoredChecks:true,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({enabledDefaultIgnoredChecks:rules,noPerItemExclusions:true}))
