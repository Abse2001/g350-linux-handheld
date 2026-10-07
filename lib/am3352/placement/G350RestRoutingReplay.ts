import cache from './g350-rest-routing-cache.json'
import type {SOLVERS} from '@tscircuit/core'

type Input=ConstructorParameters<typeof SOLVERS.AutoroutingPipelineSolver8>[0]
type ReplayCache={
 ports:{id:string;x:number;y:number}[]
 connections:{name:string;pointsToConnect:{pcb_port_id:string;x:number;y:number}[]}[]
 traces:{type:string;pcb_trace_id:string;source_trace_id:string;connection_name:string;route:{route_type:string;x:number;y:number;[key:string]:unknown}[]}[]
}
// Replay real imported copper. Port coordinates and connection membership are
// checked before any trace is returned; connectivity still requires the checks.
export function createG350RestReplay(savedCache:ReplayCache){return async function(input:Input){
 const cache=savedCache
 if(input.layerCount!==4||input.allowBlindAndBuriedVias!==false)throw new Error('Four copper layers and through-vias required')
 if(input.minViaPadDiameter!==.4572||input.minViaHoleDiameter!==.254)throw new Error('Standard 18/10 mil vias required')
 const savedPorts=new Map(cache.ports.map(p=>[p.id,p]))
 const savedConnections=new Map(cache.connections.map(c=>[c.name,c]))
 for(const c of input.connections){
  const saved=savedConnections.get(c.name)
  if(!saved)throw new Error('Unknown routing connection '+c.name)
  const ids=c.pointsToConnect.map(p=>p.pcb_port_id).sort()
  if(JSON.stringify(ids)!==JSON.stringify(saved.pointsToConnect.map(p=>p.pcb_port_id).sort()))throw new Error('Changed connection '+c.name)
  for(const p of c.pointsToConnect){
   const saved=savedPorts.get(p.pcb_port_id!)
   if(!saved||Math.hypot(p.x-saved.x,p.y-saved.y)>1e-7)throw new Error('Changed port position '+p.pcb_port_id)
  }
 }
 // Core partitions this physical inventory into explicit and implicit phases.
 // Every requested connection still must match the saved numeric membership.
 const requested=new Set(input.connections.map(c=>c.name))
 const traces=cache.traces.filter(t=>requested.has(t.connection_name))
 const listeners=new Map<string,((event:any)=>void)[]>()
 const autorouter={
  on(event:string,callback:(event:any)=>void){listeners.set(event,[...(listeners.get(event)??[]),callback]);return autorouter},
  start(){queueMicrotask(()=>{for(const callback of listeners.get('complete')??[])callback({traces:structuredClone(traces)})})},
  stop(){},
  getOutputSimpleRouteJson(){return {...input,traces:[...(input.traces??[]),...structuredClone(traces)]}},
 }
 return autorouter
}}
export const replayG350RestRouting=createG350RestReplay(cache)
