// Freeze one completed retained planning batch while its worker keeps running.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
const [input,root]=process.argv.slice(2);assert(input&&root&&!fs.existsSync(root))
const hash=b=>createHash('sha256').update(b).digest('hex')
const strip=x=>Array.isArray(x)?x.map(strip):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).filter(([k])=>!['copper_pour_id','is_inside_copper_pour'].includes(k)).map(([k,v])=>[k,strip(v)])):x
let saved
for(let attempt=0;attempt<10&&!saved;attempt++){
 try{
  const reportBytes=fs.readFileSync(input+'/report.json'),r=JSON.parse(reportBytes),candidate=fs.readFileSync(input+'/candidate.circuit.json'),filled=fs.readFileSync(input+'/fresh-filled.circuit.json')
  const batch=r.batchChecks.at(-1),ground=r.groundChecks.at(-1)
  assert(batch?.passed&&ground?.passed&&ground.portErrors===0&&batch.round===ground.round)
  assert.equal(hash(candidate),batch.candidateSha256)
  assert.equal(hash(candidate),ground.candidateSha256)
  const c=JSON.parse(candidate),f=JSON.parse(filled)
  assert.deepEqual(strip(c.filter(e=>e.type!=='pcb_copper_pour')),strip(f.filter(e=>e.type!=='pcb_copper_pour')))
  assert.equal(checks.checkEachPcbPortConnectedToPcbTraces(f).length,0)
  assert.equal(hash(fs.readFileSync(input+'/report.json')),hash(reportBytes))
  saved={r,reportBytes,candidate,filled}
 }catch(e){if(attempt===9)throw e;await new Promise(r=>setTimeout(r,1000))}
}
fs.mkdirSync(root)
for(const [name,data]of [['candidate.circuit.json',saved.candidate],['fresh-filled.circuit.json',saved.filled],['report.json',saved.reportBytes]])fs.writeFileSync(root+'/'+name,data)
fs.copyFileSync('scripts/snapshot-g350-ground-guarded-planning.mjs',root+'/snapshot.executed.mjs')
fs.writeFileSync(root+'/snapshot.json',JSON.stringify({input,retainedRound:saved.r.batchChecks.at(-1).round,frozenUtc:new Date().toISOString(),candidateSha256:hash(saved.candidate),filledSha256:hash(saved.filled),reportSha256:hash(saved.reportBytes),nativePortErrors:0,requiresFreshSourceAndIndependentQualification:true,fabricationReady:false},null,2)+'\n')
