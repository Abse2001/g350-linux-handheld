import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertRetainedPhaseCopper} from './lib/am3352-retained-phase-copper.mjs'

const [bootstrap,byte0Directory,directory]=process.argv.slice(2)
assert(bootstrap&&byte0Directory&&directory)
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const prior=read(`${bootstrap}/result.json`),run=read(`${byte0Directory}/result.json`)
const input=read(`${bootstrap}/input.simple-route.json`),nativePath=`${bootstrap}/signal-escapes.native.json`
assert.equal(prior.source.sha256,run.source.sha256)
assert.equal(prior.manualUnusedBranchPruning.retainedByte1CpuThroughDogbones,11)
assert.equal(hash(nativePath),run.nativeBootstrap.sha256)
const output=read(run.output.path)
assert.equal(input.traces.length,69);assert.deepEqual(output.traces.slice(0,69),input.traces)
const paths=output.traces.slice(165)
mkdirSync(directory,{recursive:true})
const path=`${directory}/retained-byte0-paths.json`
writeFileSync(path,JSON.stringify(paths,null,2)+'\n')
input.traces.push(...paths)
const report={...prior,status:'NATIVE_BYTE0_COPPER_RETAINED_BYTE1_PHASE_UNROUTED',
  nativeBootstrap:{path:nativePath,sha256:hash(nativePath),dogbones:96},
  retainedPhaseCopper:{phase:'DDR_BYTE0',tracePieces:33,completedNativeChannels:11,timingQualified:false,
    paths:{path,sha256:hash(path)},nativeRun:{path:`${byte0Directory}/result.json`,sha256:hash(`${byte0Directory}/result.json`)}}}
assert.equal(assertRetainedPhaseCopper(report,input),33)
writeFileSync(`${directory}/input.simple-route.json`,JSON.stringify(input)+'\n')
writeFileSync(`${directory}/signal-escapes.native.json`,readFileSync(nativePath))
report.input={path:`${directory}/input.simple-route.json`,sha256:hash(`${directory}/input.simple-route.json`)}
writeFileSync(`${directory}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({status:report.status,retainedByte0Pieces:33,nativeTerminals:96,byte0TimingQualified:false}))
