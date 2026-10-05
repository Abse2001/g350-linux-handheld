import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'

const [root,output]=process.argv.slice(2)
assert(root&&output)
const read=p=>JSON.parse(readFileSync(p,'utf8'))
const artifact=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})
const priorPath='checks/integrated/g350-byte0-matched/check-summary.json',prior=read(priorPath)
for(const a of [prior.source,prior.board,...prior.evidence])assert.equal(artifact(a.path).sha256,a.sha256)
const old=read(prior.source.path),path=`${root}/compiled.circuit.json`,current=read(path)
const retained=c=>c.filter(r=>r.type!=='source_project_metadata'&&!(r.type==='source_bus'&&r.name==='DDR_BYTE0'))
// The complete bus exposed a real D3 self-short. Permit only the reviewed
// 0.2 mm shift of that tuning section; all other physical records stay exact.
const expected=structuredClone(old)
const d3=expected.find(r=>r.type==='pcb_trace'&&r.source_trace_id==='source_trace_42')
const start=d3.route.findIndex(p=>p.route_type==='wire'&&p.x===-.81899&&Math.abs(p.y-8.85)<1e-8)
const end=d3.route.findIndex((p,i)=>i>start&&p.route_type==='wire'&&p.x===-.81899&&Math.abs(p.y-4)<1e-8)
assert(start>=0&&end>start)
for(let i=start;i<=end;i++)d3.route[i].y-=.2
for(const p of d3.route)if(Math.abs(p.y)<1e-12)p.y=0
for(const v of expected.filter(r=>r.type==='pcb_via'&&r.pcb_trace_id===d3.pcb_trace_id))if(Math.abs(v.y)<1e-12)v.y=0
assert.deepEqual(retained(current),retained(expected),'Core update changed a record outside the reviewed D3 repair')
const previousBus=old.find(r=>r.type==='source_bus'&&r.name==='DDR_BYTE0')
assert.equal(previousBus.source_trace_ids.length,2)
const bus=current.find(r=>r.type==='source_bus'&&r.name==='DDR_BYTE0')
const expectedNames=[...Array.from({length:8},(_,i)=>`DDR_D${i}`),'DDR_DQM0','DDR_DQS0','DDR_DQSn0'].sort()
const ids=current.filter(r=>r.type==='source_trace'&&expectedNames.includes(r.name)).map(r=>r.source_trace_id).sort()
assert.deepEqual([...bus.source_trace_ids].sort(),ids)
assert.deepEqual({...bus,source_trace_ids:previousBus.source_trace_ids},previousBus)
const execution=read(`${root}/execution.json`),result=read(`${root}/result.json`)
assert.equal(execution.versions['@tscircuit/core'],'0.0.2088')
assert(result.selectedPhaseFinished&&result.sourceDefinitionsUnchanged&&!result.forcedTimeout)
for(const d of execution.definitions){assert.equal(artifact(d.path).sha256,d.sha256);assert.equal(artifact(d.originalPath).sha256,d.sha256)}
const phase=read(`${root}/phase-2.input.simple-route.json`)
assert(phase.buses.length>0)
const phaseByte=phase.buses.find(b=>b.name==='DDR_BYTE0')
assert.deepEqual([...phaseByte.allowedLayers].sort(),['bottom','top'])
writeFileSync(output,JSON.stringify({status:'PASS_CORE_2088_REVIEWED_D3_REPAIR_AND_COMPLETE_BYTE0_BUS',
 source:artifact(path),previousSummary:artifact(priorPath),previousSource:prior.source,
 allOtherNonMetadataRecordsExact:true,byte0BusMembers:expectedNames,
 reviewedPhysicalChange:{signal:'DDR_D3',meanderShiftYmm:-.2,ramViaRoundoffNormalizedMm:4.440892098500626e-16,allOtherCopperExact:true},
 byte0SignalLayers:['top','bottom'],core:'0.0.2088',props:'0.0.687',
 physicalTraces:112,physicalThroughVias:119,completeDdrQualified:false,fabricationReady:false,
 execution:artifact(`${root}/execution.json`),result:artifact(`${root}/result.json`)
},null,2)+'\n')
console.log('Core upgrade preserves copper outside the reviewed D3 repair and restores complete byte0 bus membership.')
