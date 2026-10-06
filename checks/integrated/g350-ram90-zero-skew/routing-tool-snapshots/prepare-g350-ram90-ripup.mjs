import fs from 'node:fs'
import assert from 'node:assert/strict'
import * as checks from '@tscircuit/checks'
import {g350DdrPhysicalChecks,checkG350ViaTrackManufacturingClearance} from './lib/g350-ddr-physical-checks.mjs'
const [prior,root,csv]=process.argv.slice(2)
assert(prior&&root&&csv&&!fs.existsSync(root));fs.mkdirSync(root)
const circuit=JSON.parse(fs.readFileSync(`${prior}/candidate.circuit.json`)),solved=JSON.parse(fs.readFileSync(`${prior}/solved.json`))
const ripped=new Set(csv.split(',')),sourceIds=new Set(circuit.filter(r=>r.type==='source_trace'&&ripped.has(r.name)).map(r=>r.source_trace_id))
assert.equal(sourceIds.size,ripped.size)
const ids=new Set(circuit.filter(r=>r.type==='pcb_trace'&&(sourceIds.has(r.source_trace_id)||r.pcb_trace_id.startsWith('local_dogbone_'))).map(r=>r.pcb_trace_id))
const c=circuit.filter(r=>!((r.type==='pcb_trace'||r.type==='pcb_via')&&ids.has(r.pcb_trace_id)))
const errors=g350DdrPhysicalChecks.flatMap(n=>checks[n](c)).concat(checkG350ViaTrackManufacturingClearance(c))
assert.equal(errors.length,0)
fs.writeFileSync(`${root}/worker.executed.mjs`,fs.readFileSync('scripts/prepare-g350-ram90-ripup.mjs'))
fs.writeFileSync(`${root}/candidate.circuit.json`,JSON.stringify(c,null,2)+'\n')
fs.writeFileSync(`${root}/solved.json`,JSON.stringify(solved.filter(s=>!ripped.has(s.name)),null,2)+'\n')
fs.writeFileSync(`${root}/preparation.json`,JSON.stringify({prior,ripped:[...ripped],removedPendingEscapes:true,physicalErrors:0,fabricationReady:false},null,2)+'\n')
