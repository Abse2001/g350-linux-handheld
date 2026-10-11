// Merge distinct experimental alternatives for native conflict selection only.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
const [baselinePath,alternativePath,root]=process.argv.slice(2)
assert(baselinePath&&alternativePath&&root&&!fs.existsSync(root))
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const hashes=[baselinePath,alternativePath].map(hash)
const [a,b]=[baselinePath,alternativePath].map(p=>JSON.parse(fs.readFileSync(p)))
const sources=new Map(a.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_')).map(e=>[e.source_trace_id,e.name]));assert.equal(sources.size,49)
const ids=new Set([...a,...b].filter(e=>e.type==='pcb_trace'&&sources.has(e.source_trace_id)).map(e=>e.pcb_trace_id))
const signal=e=>['pcb_trace','pcb_via'].includes(e.type)&&ids.has(e.pcb_trace_id)
assert.deepEqual(a.filter(e=>!signal(e)),b.filter(e=>!signal(e)),'Foreign records, pads, placement and constraints must stay exact')
const selected=new Set(a.filter(e=>e.type==='pcb_trace'&&sources.has(e.source_trace_id)).map(e=>e.source_trace_id))
const additions=b.filter(e=>e.type==='pcb_trace'&&sources.has(e.source_trace_id)&&!selected.has(e.source_trace_id))
const additionIds=new Set(additions.map(e=>e.pcb_trace_id))
const combined=[...structuredClone(a),...structuredClone(b.filter(e=>['pcb_trace','pcb_via'].includes(e.type)&&additionIds.has(e.pcb_trace_id)))]
const traces=combined.filter(e=>e.type==='pcb_trace'&&sources.has(e.source_trace_id))
assert.equal(new Set(traces.map(t=>t.source_trace_id)).size,traces.length)
assert(traces.every(t=>t.route[0].start_pcb_port_id&&t.route.at(-1).end_pcb_port_id&&t.route.every(p=>p.route_type==='wire'?['top','bottom'].includes(p.layer):['top','bottom'].includes(p.from_layer)&&['top','bottom'].includes(p.to_layer))))
fs.mkdirSync(root);fs.copyFileSync('scripts/merge-g350-outer-ddr-alternative-carriers.mjs',root+'/helper.executed.mjs')
fs.writeFileSync(root+'/unqualified-merged.circuit.json',JSON.stringify(combined,null,2)+'\n')
fs.writeFileSync(root+'/report.json',JSON.stringify({inputs:[baselinePath,alternativePath],hashes,baselineCarriers:selected.size,additionalNames:additions.map(t=>sources.get(t.source_trace_id)),unqualifiedCarriers:traces.length,baselineCopperExactlyPreserved:true,allForeignRecordsExactlyPreserved:true,physicalAndMatchingAndFullSourceCadUnqualified:true,fabricationReady:false},null,2)+'\n')
assert.deepEqual([baselinePath,alternativePath].map(hash),hashes)
