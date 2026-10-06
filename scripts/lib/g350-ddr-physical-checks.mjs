// Native checks retained for every rotated-RAM routing repair. No ignored rules.
export const g350DdrPhysicalChecks = [
  'checkEachPcbTraceNonOverlapping',
  'checkViaPadClearance',
  'checkViaTraceClearance',
  'checkPcbTraceSelfShorts',
  'checkCopperToBoardEdgeClearance',
  'checkDifferentNetViaSpacing',
  'checkHoleTraceClearance',
  'checkPadTraceClearance',
  'checkViasInPads',
  'checkViasOffBoard',
]

// Enforce the KiCad manufacturing rule explicitly while searching. The native
// check can accept a jog a few microns below the project's 0.1016 mm spacing.
export function checkG350ViaTrackManufacturingClearance(circuit) {
  const traces=circuit.filter(r=>r.type==='pcb_trace')
  const owners=new Map(traces.map(t=>[t.pcb_trace_id,t.source_trace_id]))
  const segments=traces.flatMap(t=>t.route.slice(1).flatMap((b,i)=>{
    const a=t.route[i]
    return a.route_type==='wire'&&b.route_type==='wire'&&a.layer===b.layer&&Math.hypot(a.x-b.x,a.y-b.y)>1e-8?[{a,b,owner:t.source_trace_id,width:b.width??a.width??.1016}]:[]
  }))
  const errors=[]
  for(const v of circuit.filter(r=>r.type==='pcb_via'))for(const s of segments){
    if(owners.get(v.pcb_trace_id)===s.owner)continue
    const required=v.outer_diameter/2+s.width/2+.1016
    if(v.x<Math.min(s.a.x,s.b.x)-required||v.x>Math.max(s.a.x,s.b.x)+required||v.y<Math.min(s.a.y,s.b.y)-required||v.y>Math.max(s.a.y,s.b.y)+required)continue
    const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y
    const f=Math.max(0,Math.min(1,((v.x-s.a.x)*dx+(v.y-s.a.y)*dy)/(dx*dx+dy*dy)))
    const distance=Math.hypot(v.x-s.a.x-f*dx,v.y-s.a.y-f*dy)
    if(distance<required-1e-6)errors.push({pcb_via_id:v.pcb_via_id,source_trace_id:s.owner,clearanceMm:distance-v.outer_diameter/2-s.width/2,requiredClearanceMm:.1016})
  }
  return errors
}
