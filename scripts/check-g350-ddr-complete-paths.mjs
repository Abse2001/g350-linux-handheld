// Source-bound channel gate. Native per-port copper checks alone also pass
// disconnected CPU/RAM pad-to-via prefixes; require complete real pad paths.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {ddrRouteLength} from './lib/g350-full-board-length-tuning.mjs'
const [input,output]=process.argv.slice(2)
assert(input&&output&&!fs.existsSync(output))
const c=JSON.parse(fs.readFileSync(input)),ports=new Map(c.filter(e=>e.type==='pcb_port').map(e=>[e.pcb_port_id,e]))
const sources=c.filter(e=>e.type==='source_trace'&&e.name?.startsWith('DDR_'))
assert.equal(sources.length,49)
const near=(a,b)=>a&&b&&Math.hypot(a.x-b.x,a.y-b.y)<1e-7
const rows=sources.map(s=>{
 const errors=[],ts=c.filter(e=>e.type==='pcb_trace'&&e.source_trace_id===s.source_trace_id)
 if(ts.length!==1)errors.push(`Expected one CPU-to-RAM path; found ${ts.length}`)
 if(ts.length===1){
  const t=ts[0],r=t.route,a=r[0],b=r.at(-1),p=ports.get(a?.start_pcb_port_id),q=ports.get(b?.end_pcb_port_id)
  if(a?.route_type!=='wire'||b?.route_type!=='wire'||!near(a,p)||!near(b,q))errors.push('Real pad endpoint coordinates missing or changed')
  if(!p||!q||p.pcb_port_id===q.pcb_port_id||JSON.stringify([p?.source_port_id,q?.source_port_id].sort())!==JSON.stringify([...s.connected_source_port_ids].sort()))errors.push('CPU/RAM source-port ownership does not match')
  for(const [endpoint,port]of [[a,p],[b,q]])if(port&&!c.some(e=>e.type==='pcb_smtpad'&&e.pcb_port_id===port.pcb_port_id&&e.layer===endpoint.layer&&near(e,endpoint)))errors.push('Endpoint layer does not match its actual SMT pad')
  for(let i=1;i<r.length;i++){
   const x=r[i-1],y=r[i]
   if(x.route_type==='wire'&&y.route_type==='wire'){if(x.layer!==y.layer)errors.push(`Unbarrelled layer change at ${i}`)}
   else if(x.route_type==='wire'&&y.route_type==='via'){if(!near(x,y)||x.layer!==y.from_layer)errors.push(`Invalid barrel entry at ${i}`)}
   else if(x.route_type==='via'&&y.route_type==='wire'){if(!near(x,y)||x.to_layer!==y.layer)errors.push(`Invalid barrel exit at ${i}`)}
   else errors.push(`Unsupported path elements at ${i}`)
  }
  const barrels=r.filter(e=>e.route_type==='via'),actual=c.filter(e=>e.type==='pcb_via'&&e.pcb_trace_id===t.pcb_trace_id)
  if(barrels.length!==actual.length)errors.push('Path barrel and actual hole counts differ')
  for(const v of barrels)if(v.from_layer===v.to_layer||actual.filter(e=>near(e,v)&&Math.abs(e.outer_diameter-.4572)<1e-8&&Math.abs(e.hole_diameter-.254)<1e-8&&e.layers?.length===4&&['top','inner1','inner2','bottom'].every(l=>e.layers.includes(l))).length!==1)errors.push('Missing or ambiguous standard full-depth barrel')
 }
 return {name:s.name,complete:errors.length===0,errors,traceCount:ts.length,nativeLengthMm:ts.length===1?ddrRouteLength(ts[0].route):null}
})
const report={input:{path:input,sha256:createHash('sha256').update(fs.readFileSync(input)).digest('hex')},required:49,complete:rows.filter(r=>r.complete).length,rows,passed:rows.every(r=>r.complete),sourcePathGateOnly:true,requiresFreshIndependentNumericConnectivityGroundAndAllNativeChecks:true,fabricationReady:false}
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({complete:report.complete,required:49,passed:report.passed,failed:rows.filter(r=>!r.complete).map(r=>({name:r.name,errors:r.errors}))}))
process.exitCode=report.passed?0:1
