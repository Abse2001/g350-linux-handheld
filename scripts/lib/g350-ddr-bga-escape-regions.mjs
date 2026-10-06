import assert from 'node:assert/strict'

export function g350BgaEscapeRegions(circuit){
 const names=new Map(circuit.filter(r=>r.type==='source_component').map(r=>[r.source_component_id,r.name]))
 return ['U_SOC','U_RAM'].map(name=>{
  const component=circuit.find(r=>r.type==='pcb_component'&&names.get(r.source_component_id)===name)
  assert(component)
  const pads=circuit.filter(r=>r.type==='pcb_smtpad'&&r.pcb_component_id===component.pcb_component_id)
  assert(pads.length)
  return {name,minX:Math.min(...pads.map(p=>p.x))-.65,maxX:Math.max(...pads.map(p=>p.x))+.65,minY:Math.min(...pads.map(p=>p.y))-.65,maxY:Math.max(...pads.map(p=>p.y))+.65}
 })
}

export function g350AvoidsEscapeRegions(points,regions){
 for(const box of regions)for(let i=0;i<points.length;i++){
  const a=points[i],b=points[i+1]??a
  let enter=0,leave=1
  for(const axis of ['x','y']){
   const delta=b[axis]-a[axis],min=box[axis==='x'?'minX':'minY'],max=box[axis==='x'?'maxX':'maxY']
   if(Math.abs(delta)<1e-12){if(a[axis]<min||a[axis]>max){enter=2;break}}
   else {const lo=(min-a[axis])/delta,hi=(max-a[axis])/delta;enter=Math.max(enter,Math.min(lo,hi));leave=Math.min(leave,Math.max(lo,hi))}
  }
  if(enter<=leave)return false
 }
 return true
}
