import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {readCheckedCommandSummary} from './am3352-checked-command-sources.mjs'

// Only hash-bound, via-free CPU wire prefixes may be absent from staged
// inputs. The authoritative circuit and every physical hole remain intact.
export function assertOpenCommandPrefixes(report,input,source){
  const a=report.temporaryOpenCommandPrefixes
  if(!a)return []
  assert(a.stagedRepairOnly&&a.exportable===false&&a.physicalHolesRemoved===0)
  assert.deepEqual(a.originalSource,report.source)
  assert.equal(createHash('sha256').update(readFileSync(a.path)).digest('hex'),a.sha256)
  const {summary,registration}=readCheckedCommandSummary(report.checkedSourceSummary)
  assert.deepEqual(summary.source,report.source)
  assert.equal(source.filter(e=>e.type==='pcb_trace').length,registration.traces)
  assert.equal(source.filter(e=>e.type==='pcb_via').length,registration.holes)
  const prefixes=JSON.parse(readFileSync(a.path))
  assert(prefixes.length>=1&&prefixes.length<=2)
  assert.deepEqual(a.names,prefixes.map(p=>p.name))
  assert.equal(new Set(a.names).size,a.names.length)
  const geometry=r=>r.map(({route_type,x,y,layer,width,from_layer,to_layer})=>({route_type,x,y,layer,width,from_layer,to_layer}))
  for(const p of prefixes){
    assert(/^DDR_(A\d+|BA\d+|CASn|RASn|WEn|CSn0|CKE|ODT|RESETn)$/.test(p.name))
    const original=source.find(e=>e.type==='pcb_trace'&&e.source_trace_id===p.sourceTraceId),st=source.find(e=>e.type==='source_trace'&&e.source_trace_id===p.sourceTraceId)
    assert(original&&st);assert.equal(st.name,p.name)
    assert.deepEqual(geometry(p.originalRoute),geometry(original.route))
    assert(Number.isInteger(p.cutIndex)&&p.cutIndex>1&&p.cutIndex<original.route.length)
    assert.deepEqual(p.retainedTail,p.originalRoute.slice(p.cutIndex))
    assert(p.originalRoute.slice(0,p.cutIndex+1).every(q=>q.route_type==='wire'&&q.layer==='top'&&q.width===.1016&&q.y>-15&&q.y<9.5&&q.x>=-17.5&&q.x<=17.5))
    const cpu=source.find(e=>e.type==='pcb_port'&&e.source_port_id===st.connected_source_port_ids[0]);assert(cpu&&cpu.y>-15)
    assert(Math.hypot(cpu.x-p.originalRoute[0].x,cpu.y-p.originalRoute[0].y)<1e-8)
    assert.deepEqual(p.originalRoute.filter(q=>q.route_type==='via'),p.retainedTail.filter(q=>q.route_type==='via'))
  }
  assert.equal(input.traces.length,registration.traces)
  for(const original of source.filter(e=>e.type==='pcb_trace')){
    const retained=input.traces.find(t=>t.pcb_trace_id===original.pcb_trace_id);assert(retained)
    assert.equal(retained.source_trace_id,original.source_trace_id)
    const p=prefixes.find(p=>p.sourceTraceId===original.source_trace_id)
    assert.deepEqual(geometry(retained.route),geometry(p?p.retainedTail:original.route))
  }
  return prefixes
}
