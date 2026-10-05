import assert from 'node:assert/strict'
import {assertSourceCopper} from './am3352-source-copper.mjs'
import {assertDiagnosticCommandOpenings} from './am3352-command-openings.mjs'

// Preserve exactly identified saved DDR copper while auditing all69 original
// power/reference pieces. Unknown extra traces or holes remain fatal.
export const assertSavedDdrCopper=(circuit,saved,options={})=>{
 const byte=b=>[...Array.from({length:8},(_,i)=>`DDR_D${i+8*b}`),`DDR_DQM${b}`,`DDR_DQS${b}`,`DDR_DQSn${b}`]
 const command=[...Array.from({length:15},(_,i)=>`DDR_A${i}`),...Array.from({length:3},(_,i)=>`DDR_BA${i}`),
   'DDR_RASn','DDR_CASn','DDR_WEn','DDR_CSn0','DDR_CKE','DDR_ODT','DDR_CK','DDR_CKn']
 const names=Object.keys(saved).sort(),candidates=[byte(0),byte(1),[...byte(0),...byte(1)]]
 candidates.push([...byte(0),...byte(1),'DDR_RESETn'])
 candidates.push(command)
 if(options.diagnosticOpenCommandChannels){
  assertDiagnosticCommandOpenings(options.diagnosticOpenCommandChannels)
  candidates.push(command.filter(n=>!options.diagnosticOpenCommandChannels.includes(n)))
 }
 candidates.push([...byte(0),...byte(1),...command],[...byte(0),...byte(1),...command,'DDR_RESETn'])
 if(options.diagnosticOpenDqs1Pair)for(const signals of [[...byte(0),...byte(1)],[...byte(0),...byte(1),...command]])
   candidates.push(signals.filter(n=>!['DDR_DQS1','DDR_DQSn1'].includes(n)))
 assert(candidates.some(c=>JSON.stringify(c.sort())===JSON.stringify(names)),'Saved paths must match an exact known DDR phase set; an open DQS1 pair requires explicit diagnostic scope')
 const sources=circuit.filter(e=>e.type==='source_trace'),ids=new Set(sources.filter(s=>Object.hasOwn(saved,s.name)).map(s=>s.source_trace_id))
 assert.equal(ids.size,names.length)
 const traces=circuit.filter(e=>e.type==='pcb_trace'),ddr=traces.filter(t=>ids.has(t.source_trace_id)),traceIds=new Set(ddr.map(t=>t.pcb_trace_id))
 const powerTraceCount=options.rotatedD2PowerBridge?70:69
 assert.equal(ddr.length,names.length);assert.equal(traces.length,powerTraceCount+names.length)
 for(const t of ddr){
  const name=sources.find(s=>s.source_trace_id===t.source_trace_id).name
  const actual=t.route.map(p=>p.route_type==='via'?{x:p.x,y:p.y,via:true,fromLayer:p.from_layer,toLayer:p.to_layer}:{x:p.x,y:p.y})
  assert.deepEqual(actual.slice(1,-1),saved[name])
  assert(Math.hypot(actual[0].x-actual[1].x,actual[0].y-actual[1].y)<1e-6)
  assert(Math.hypot(actual.at(-1).x-actual.at(-2).x,actual.at(-1).y-actual.at(-2).y)<1e-6)
  assert(t.route.every(p=>p.route_type!=='wire'||['top','bottom'].includes(p.layer)))
 }
 const vias=circuit.filter(e=>e.type==='pcb_via'),expected=Object.values(saved).flat().filter(p=>p.via).length
 assert.equal(vias.filter(v=>traceIds.has(v.pcb_trace_id)).length,expected)
 assert.equal(vias.length,69+expected)
 for(const v of vias){assert.equal(v.outer_diameter,.4572);assert.equal(v.hole_diameter,.254)
  assert.deepEqual(new Set(v.layers),new Set(['top','inner1','inner2','bottom']))}
 for(let i=0;i<vias.length;i++)for(let j=0;j<i;j++)assert(Math.hypot(vias[i].x-vias[j].x,vias[i].y-vias[j].y)-.254>=.254-1e-6)
 const power=assertSourceCopper(circuit.filter(e=>!(e.type==='pcb_trace'&&ids.has(e.source_trace_id))&&!(e.type==='pcb_via'&&traceIds.has(e.pcb_trace_id))),options)
 return {...power,savedDdrSignals:names.length,savedDdrNames:names,savedDdrVias:expected,totalSourceTraces:traces.length,totalThroughVias:vias.length}
}
