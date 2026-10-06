// Remove tiny grid steps at a terminal corner only when the complete native
// checks accept the resulting geometry. Keep endpoints and all physical vias.
export function repairG350TerminalStaircases(circuit,trace,physical){
 const onlySelf=errors=>errors.every(e=>e.pcb_trace_error_id?.startsWith(`self_short_${trace.pcb_trace_id}`))
 if(!onlySelf(physical(circuit)))return false
 for(const side of ['end','start']){
  const original=structuredClone(trace.route),anchor=side==='end'?original.length-2:1
  let safe=null
  for(let count=2;count<=12;count++){
   const far=side==='end'?anchor-count:anchor+count
   if(far<0||far>=original.length)break
   const range=original.slice(Math.min(anchor,far),Math.max(anchor,far)+1)
   if(!range.every(p=>p.route_type==='wire'&&p.layer===original[anchor].layer))break
   if(Math.hypot(original[far].x-original[anchor].x,original[far].y-original[anchor].y)>2)break
   trace.route=side==='end'?[...original.slice(0,far+1),...original.slice(anchor)]:[...original.slice(0,anchor+1),...original.slice(far)]
   const errors=physical(circuit)
   if(!errors.length)return true
   if(onlySelf(errors))safe=structuredClone(trace.route)
  }
  trace.route=safe??original
 }
 return physical(circuit).length===0
}
