import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

// The original checked source remains authoritative. Only two explicitly
// recorded, via-free CPU prefixes may be temporarily absent from solver input.
// No staged result is a complete DDR replay or a fabrication approval.
export function assertOpenCpuTails(report,input,source){
  const a=report.temporaryOpenCpuTails
  if(!a)return []
  assert(a.stagedRepairOnly&&a.exportable===false)
  assert.deepEqual(a.originalSource,report.source)
  assert.equal(createHash('sha256').update(readFileSync(a.path)).digest('hex'),a.sha256)
  const tails=JSON.parse(readFileSync(a.path))
  const restored=report.restoredCpuPrefixNames??[]
  assert(restored.length===0||restored.length===1&&restored[0]==='DDR_D10')
  assert.deepEqual(tails.map(t=>t.name).sort(),['DDR_D10','DDR_D14'])
  const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
  for(const tail of tails){
    const original=source.find(t=>t.type==='pcb_trace'&&t.source_trace_id===tail.sourceTraceId)
    assert(original);assert.deepEqual(geometry(original.route),geometry(tail.originalRoute))
    assert(source.find(t=>t.type==='source_trace'&&t.source_trace_id===tail.sourceTraceId).name===tail.name)
    assert(tail.cutIndex>1&&tail.cutIndex<original.route.length)
    assert.deepEqual(tail.retainedTail,tail.originalRoute.slice(tail.cutIndex))
    assert(tail.originalRoute.slice(0,tail.cutIndex).every(p=>p.route_type==='wire'&&p.layer==='top'))
    assert(Math.abs(tail.retainedTail[0].y+9.68)<1e-8)
  }
  assert.equal(input.traces.length,source.filter(t=>t.type==='pcb_trace').length)
  for(const original of source.filter(t=>t.type==='pcb_trace')){
    const retained=input.traces.find(t=>t.pcb_trace_id===original.pcb_trace_id);assert(retained)
    const tail=tails.find(t=>t.sourceTraceId===original.source_trace_id)
    assert.deepEqual(geometry(retained.route),geometry(tail&&!restored.includes(tail.name)?tail.retainedTail:original.route))
  }
  return tails
}
