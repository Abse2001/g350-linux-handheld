import type {SimpleRouteJson} from "@tscircuit/capacity-autorouter"
import {gridMemoryCandidate} from "./GridMemoryCandidate"
import {auditMemoryThroughVias} from "./auditMemoryThroughVias"
import {auditMemoryWires} from "./auditMemoryWires"
type Trace=NonNullable<SimpleRouteJson["traces"]>[number]

// Bounded auxiliary search for ONE physical through-via. Test the drill on
// all six layers before planning either leg, then recheck the whole route.
// The temporary routing-model land becomes this same declared physical via
// in the returned trace; it is never an unrepresented electrical transition.
export function gridMemoryViaCandidate(input:SimpleRouteJson,maxLegalSites=100):Trace|undefined {
  if(input.connections.length!==1)throw new Error("One-via search needs one connection")
  const c=input.connections[0],net=c.name,[from,to]=c.pointsToConnect
  const fullLayers=["top","inner1","inner2","inner3","inner4","bottom"]
  const candidates:{x:number;y:number}[]=[]
  for(let x=input.bounds.minX+1;x<=input.bounds.maxX-1;x+=.5)
    for(let y=input.bounds.minY+1;y<=input.bounds.maxY-1;y+=.5)candidates.push({x,y})
  const length=(p:{x:number;y:number})=>Math.hypot(p.x-from.x,p.y-from.y)+Math.hypot(p.x-to.x,p.y-to.y)
  candidates.sort((a,b)=>length(a)-length(b))
  let count=0
  for(const p of candidates) {
    const probe:Trace={type:"pcb_trace",pcb_trace_id:`${net}_via_probe`,connection_name:net,
      route:[{...p,route_type:"via",from_layer:"inner2",to_layer:"inner3",via_diameter:.3,via_hole_diameter:.15}]}
    if(auditMemoryThroughVias(input,[probe]).issues.length)continue
    if(++count>maxLegalSites)break
    const via={type:"rect" as const,shape:"circle" as const,center:p,width:.3,height:.3,layers:fullLayers,
      connectedTo:[net,"breakout:pcb_breakout_point_new_detour"]}
    const mid={...p,layer:"inner2",pointId:"grid_detour_via"}
    const withVia={...input,obstacles:[...input.obstacles,via]}
    for(const firstLayer of ["inner2","inner3","bottom"]) {
      const a=gridMemoryCandidate({...withVia,connections:[{...c,pointsToConnect:[from,mid]}]},[firstLayer])
      if(!a)continue
      for(const lastLayer of ["inner2","inner3","bottom"].filter(l=>l!==firstLayer)) {
        const b=gridMemoryCandidate({...withVia,connections:[{...c,pointsToConnect:[mid,to]}]},[lastLayer])
        if(!b)continue
        const trace:Trace={...a,connectsTo:[from.pointId!,to.pointId!],pcb_trace_id:`${net}_one_via_grid`,
          route:[...a.route,{...p,route_type:"via",from_layer:firstLayer,to_layer:lastLayer,via_diameter:.3,via_hole_diameter:.15},...b.route]}
        if(auditMemoryThroughVias(input,[trace]).issues.length||auditMemoryWires(input,[trace]).issues.length)continue
        return trace
      }
    }
  }
  return undefined
}
