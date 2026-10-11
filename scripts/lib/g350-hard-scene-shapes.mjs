import assert from 'node:assert/strict'
// Conservative real copper model; callers supply logical net canonicalization.
export function g350HardSceneShapes(circuit,find,routingLayers=['top','inner1','inner2','bottom']){
 const shapes=[],ports=new Map(circuit.filter(e=>e.type==='pcb_port').map(e=>[e.pcb_port_id,e.source_port_id])),owners=new Map(circuit.filter(e=>e.type==='pcb_trace').map(e=>[e.pcb_trace_id,find(e.source_trace_id)]))
 for(const p of circuit.filter(e=>e.type==='pcb_smtpad')){
  const poly=p.shape==='polygon',xs=poly?p.points.map(q=>q.x):[],ys=poly?p.points.map(q=>q.y):[]
  const x=poly?(Math.min(...xs)+Math.max(...xs))/2:p.x,y=poly?(Math.min(...ys)+Math.max(...ys))/2:p.y,w=poly?Math.max(...xs)-Math.min(...xs):p.width??2*p.radius,h=poly?Math.max(...ys)-Math.min(...ys):p.height??w
  assert([x,y,w,h].every(Number.isFinite));shapes.push({kind:p.shape==='circle'?'circle':'rect',x,y,w,h,layers:[p.layer],pad:true,owner:find(ports.get(p.pcb_port_id)??p.pcb_smtpad_id)})
 }
 for(const v of circuit.filter(e=>e.type==='pcb_via'))shapes.push({kind:'circle',x:v.x,y:v.y,w:v.outer_diameter,h:v.outer_diameter,hole:v.hole_diameter,layers:['top','inner1','inner2','bottom'],owner:owners.get(v.pcb_trace_id)??'FIXED_HOLE'})
 for(const t of circuit.filter(e=>e.type==='pcb_trace'))for(let i=1;i<t.route.length;i++){const a=t.route[i-1],b=t.route[i];if(a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer&&Math.hypot(a.x-b.x,a.y-b.y)>1e-8)shapes.push({kind:'segment',a,b,w:b.width??.1016,layers:[a.layer],owner:find(t.source_trace_id)})}
 // Inner copper still blocks drilling a full-depth hole even when the
 // signal search only traverses the outer layers.
 return shapes.map(s=>({...s,viaOnly:!s.layers.some(l=>routingLayers.includes(l)),layers:s.layers.filter(l=>routingLayers.includes(l))}))
}
