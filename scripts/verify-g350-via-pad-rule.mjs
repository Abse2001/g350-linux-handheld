import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {checkPadPadClearance,checkViaPadClearance} from '@tscircuit/checks'
import {getFullConnectivityMapFromCircuitJson} from 'circuit-json-to-connectivity-map'

const input='dist/g350-ddr-ram-power-core-2086/compiled.circuit.json'
const circuit=JSON.parse(readFileSync(input,'utf8'))
const board=circuit.find(e=>e.type==='pcb_board')
assert.equal(board.min_pad_edge_to_pad_edge_clearance,.15)
assert.equal(board.min_via_edge_to_pad_edge_clearance,.1016)
assert.equal(circuit.filter(e=>e.type==='pcb_via').length,39)
const explicit=checkViaPadClearance(circuit)
const strictOverride=checkViaPadClearance(circuit,{minClearance:.15})
assert.equal(explicit.length,0,'The explicit via-to-pad rule must be used')
assert.equal(strictOverride.length,73,'An explicit check override must retain precedence')
assert.equal(checkPadPadClearance(circuit).length,0,'SMT pads must still meet 0.15 mm')
const fallback=structuredClone(circuit)
delete fallback.find(e=>e.type==='pcb_board').min_via_edge_to_pad_edge_clearance
assert.equal(checkViaPadClearance(fallback).length,73,'Boards without a via-specific rule must retain the strict fallback')

// Move a real via toward a real foreign-net pad, in memory only. Retain
// IDs and connectivity so this negative control cannot become same-net.
const invalidVia=structuredClone(circuit)
const originalViolation=strictOverride[0]
const via=invalidVia.find(e=>e.pcb_via_id===originalViolation.pcb_pad_ids.find(id=>id.startsWith('pcb_via_')))
const pad=invalidVia.find(e=>e.pcb_smtpad_id===originalViolation.pcb_pad_ids.find(id=>id.startsWith('pcb_smtpad_')))
const distance=Math.hypot(via.x-pad.x,via.y-pad.y)
via.x+=(pad.x-via.x)*.10/distance;via.y+=(pad.y-via.y)*.10/distance
const invalidViaErrors=checkViaPadClearance(invalidVia).filter(e=>e.pcb_pad_ids.includes(via.pcb_via_id))
assert(invalidViaErrors.some(e=>e.actual_clearance<.1016),'A real too-close via must still fail')

// A separate negative control verifies that the SMT-to-SMT 0.15 mm rule
// does not silently become the 4 mil via rule.
const invalidPad=structuredClone(circuit),conn=getFullConnectivityMapFromCircuitJson(invalidPad)
const roundPads=invalidPad.filter(e=>e.type==='pcb_smtpad'&&e.shape==='circle'&&e.layer==='top')
let pair
for(const a of roundPads){
 const b=roundPads.find(b=>a!==b&&Math.abs(Math.hypot(a.x-b.x,a.y-b.y)-.8)<1e-6&&!conn.areIdsConnected(a.pcb_smtpad_id,b.pcb_smtpad_id))
 if(b){pair=[a,b];break}
}
assert(pair,'No adjacent foreign-net BGA pads found')
const [a,b]=pair,spacing=Math.hypot(a.x-b.x,a.y-b.y),shift=spacing-a.radius-b.radius-.14
assert(shift>0)
a.x+=(b.x-a.x)*shift/spacing;a.y+=(b.y-a.y)*shift/spacing
const invalidPadErrors=checkPadPadClearance(invalidPad).filter(e=>e.pcb_pad_ids.includes(a.pcb_smtpad_id)&&e.pcb_pad_ids.includes(b.pcb_smtpad_id))
assert(invalidPadErrors.some(e=>Math.abs(e.actual_clearance-.14)<1e-6),'SMT pads at 0.14 mm must fail the retained 0.15 mm rule')
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const report={status:'PASS_SEPARATE_VIA_PAD_RULE_AND_NEGATIVE_CONTROLS',input,inputSha256:hash(input),checksVersion:'0.0.239',checksSourceSha256:hash('node_modules/@tscircuit/checks/dist/index.js'),patchScriptSha256:hash('scripts/patch-tscircuit-via-pad-check.mjs'),viaRuleMm:.1016,smtPadRuleMm:.15,correctlyClearedViaReports:73,realInvalidViaRejected:true,realInvalidSmtPadRejected:true,strictOverridePreserved:true,fallbackPreserved:true,sourceCircuitUnmodified:true,fabricationReady:false}
writeFileSync('checks/integrated/g350-ddr-bootstrap/via-pad-rule-verification.json',JSON.stringify(report,null,2)+'\n')
console.log('Verified separate via-pad and SMT-pad rules; both physical negative controls fail as required.')
