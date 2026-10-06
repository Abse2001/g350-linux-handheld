import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
const [boardPath,drcPath,reportPath]=process.argv.slice(2)
assert(boardPath&&drcPath&&reportPath&&!fs.existsSync(reportPath))
const projectPath=boardPath.replace(/\.kicad_pcb$/,'.kicad_pro')
assert(projectPath!==boardPath&&!fs.existsSync(projectPath),'Only create a new trial project; preserve existing projects')
const defaults=JSON.parse(fs.readFileSync(drcPath)),presentation=new Set(['missing_courtyard','footprint_filters_mismatch','footprint_type_mismatch'])
const rules=Object.fromEntries((defaults.ignored_checks??[]).map(r=>[r.key,presentation.has(r.key)?'warning':'error']))
const project={meta:{filename:projectPath.split('/').at(-1),version:1},board:{design_settings:{drc_exclusions:[],rule_severities:rules}}}
fs.writeFileSync(projectPath,JSON.stringify(project,null,2)+'\n')
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
fs.writeFileSync(reportPath,JSON.stringify({defaultReport:{path:drcPath,sha256:hash(drcPath)},project:{path:projectPath,sha256:hash(projectPath)},enabledDefaultIgnoredChecks:rules,noPerItemExclusions:true,allPreviouslyEnabledRulesRetained:true,finalDrcMustHaveNoIgnoredChecks:true,fabricationReady:false},null,2)+'\n')
console.log(JSON.stringify({enabledDefaultIgnoredChecks:rules,noPerItemExclusions:true}))
