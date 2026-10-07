// Use the pinned tsci converter with a finite budget sized to the board.
// Its fixed 1,000-step stage limit rejects boards with >1,000 trace records.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {resolve} from 'node:path'
const [inputArg,outArg]=process.argv.slice(2)
assert(inputArg&&outArg)
// tsci resolves output relative to its input directory. Absolute paths keep
// a project-relative output from being prefixed with that directory twice.
const input=resolve(inputArg),out=resolve(outArg)
assert(!fs.existsSync(out))
const circuit=JSON.parse(fs.readFileSync(input));const budget=Math.max(1000,circuit.length+2)
let exportInput=input
if(process.env.G350_EXPORT_WITHOUT_POURS==='1'){
 const nets=new Map(circuit.filter(e=>e.type==='source_net').map(e=>[e.source_net_id,e.name]))
 assert(circuit.filter(e=>e.type==='pcb_copper_pour').every(e=>nets.get(e.source_net_id)==='GND'),'Only GND fills may be rebuilt')
 exportInput=out+'.unfilled.circuit.json'
 assert(!fs.existsSync(exportInput))
 fs.writeFileSync(exportInput,JSON.stringify(circuit.filter(e=>e.type!=='pcb_copper_pour'),null,2)+'\n')
}
const cli='node_modules/@tscircuit/cli/dist/cli/main.js',source=fs.readFileSync(cli,'utf8')
assert.equal(JSON.parse(fs.readFileSync('node_modules/@tscircuit/cli/package.json')).version,'0.1.2258')
const needle='var ConverterStage = class {\n  MAX_ITERATIONS = 1000;'
assert.equal(source.split(needle).length,2)
const root='.cloud-tools/tsci-large-kicad';fs.mkdirSync(root,{recursive:true})
const adapted=source.replace(needle,`var ConverterStage = class {\n  MAX_ITERATIONS = ${budget};`)
fs.writeFileSync(`${root}/main.js`,adapted)
const hash=s=>createHash('sha256').update(s).digest('hex')
fs.writeFileSync(out+'.converter.json',JSON.stringify({pinnedCli:'0.1.2258',originalCliSha256:hash(source),adaptedCliSha256:hash(adapted),originalStageBudget:1000,stageBudget:budget,circuitRecords:circuit.length,onlyChange:'ConverterStage finite iteration budget',exportInput,sourceSha256:hash(fs.readFileSync(input)),groundFillsRequireFreshReconstruction:exportInput!==input,nativeChecksChanged:false},null,2)+'\n')
const result=spawnSync('bun',[`${root}/main.js`,'export',exportInput,'-f','kicad_pcb','-o',out],{stdio:'inherit'})
assert.equal(hash(fs.readFileSync(cli,'utf8')),hash(source),'Pinned CLI must remain unchanged')
process.exitCode=result.status??1
