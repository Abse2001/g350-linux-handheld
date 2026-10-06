import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import * as checks from '@tscircuit/checks'
import {tuneOneG350DdrTrace,ddrRouteLength} from './lib/g350-ddr-trace-tuning.mjs'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'

const [prior,root]=process.argv.slice(2)
assert(prior&&root&&!fs.existsSync(root))
fs.mkdirSync(root)
fs.writeFileSync(`${root}/retarget.executed.mjs`,fs.readFileSync('scripts/retarget-g350-ram90-seeded-pairs.mjs'))
const input=fs.readFileSync(`${prior}/candidate.circuit.json`),circuit=JSON.parse(input)
const names=new Map(circuit.filter(r=>r.type==='source_trace').map(r=>[r.source_trace_id,r.name]))
const seeded=circuit.filter(r=>r.type==='pcb_trace'&&r.pcb_trace_id.startsWith('native_'))
assert.equal(seeded.length,6)
assert.deepEqual(new Set(seeded.map(t=>names.get(t.source_trace_id))),new Set(['DDR_DQS0','DDR_DQSn0','DDR_DQS1','DDR_DQSn1','DDR_CK','DDR_CKn']))
const trials=[]
for(const trace of seeded){
 const name=names.get(trace.source_trace_id),goal=/CK/.test(name)?37.2:34
 const tuning=tuneOneG350DdrTrace(circuit,trace,goal,30,{protectEscapeRegions:process.env.G350_PROTECT_BGA==='1'})
 trials.push({name,goal,actual:ddrRouteLength(trace.route),tuning})
 console.log(JSON.stringify(trials.at(-1)))
}
const physical=g350DdrPhysicalChecks.flatMap(n=>checks[n](circuit)).concat(checkG350ViaTrackManufacturingClearance(circuit))
const skew=checks.checkPcbBusLengthSkew(circuit)
fs.writeFileSync(`${root}/candidate.circuit.json`,JSON.stringify(circuit,null,2)+'\n')
fs.writeFileSync(`${root}/report.json`,JSON.stringify({source:{path:prior,sha256:createHash('sha256').update(input).digest('hex')},trials,physical,skew,requiredCompleteSignals:49,seededCompleteSignals:6,sourceReplayRequired:true,fabricationReady:false},null,2)+'\n')
assert.equal(physical.length,0)
assert(trials.every(t=>Math.abs(t.actual-t.goal)<.05))
for(const bus of circuit.filter(r=>r.type==='source_bus'&&/_PAIR$/.test(r.name))){
 assert.equal(bus.max_length_skew,.127)
 const lengths=seeded.filter(t=>bus.source_trace_ids.includes(t.source_trace_id)).map(t=>ddrRouteLength(t.route))
 assert.equal(lengths.length,2)
 assert(Math.max(...lengths)-Math.min(...lengths)<=.127)
}
console.log('All six seeded paths retargeted; complete DDR replay and independent checks remain required')
