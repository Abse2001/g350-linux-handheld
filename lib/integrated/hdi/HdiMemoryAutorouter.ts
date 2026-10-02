import {AutoroutingPipelineSolver9_PreloadedTraceGraph,type SimpleRouteJson,type Obstacle} from "@tscircuit/capacity-autorouter"
import {hdiEscapes,hdiCoreLayers,hdiSignalLayers,hdiCopperObstacles,auditHdiMemory,type HdiTrace} from "./HdiGeometry"
import {repairHdiVias} from "./RepairHdiVias"
import {repairHdiWires} from "./RepairHdiWires"
import {savedHdiMemoryRouting} from "./SavedHdiMemoryRouting"
import {gridHdiFallback} from "../GridHdiCandidate"
import {standardHdi,thinHdi,type HdiProcess} from "./HdiProcess"

const toVirtual:Record<string,string>={inner1:"top",inner3:"inner1",inner5:"inner2",inner6:"bottom"}
const toPhysical:Record<string,string>={top:"inner1",inner1:"inner3",inner2:"inner5",bottom:"inner6"}
const virtual=(layer:string)=>{if(!toVirtual[layer])throw new Error(`HDI routing endpoint on reserved ${layer}`);return toVirtual[layer]}

export const routeThinHdiMemory=(input:SimpleRouteJson)=>routeHdiMemory(input,thinHdi)
export async function routeHdiMemory(input:SimpleRouteJson,process:HdiProcess=standardHdi) {
  const escapes=hdiEscapes(input),escapeSet=new Set(escapes),previous=input.traces??[]
  const obstacles=[...input.obstacles.map(o=>escapeSet.has(o)?{...o,shape:"circle" as const,width:.32,height:.32}:o),
    ...hdiCopperObstacles(previous,true,process)]
  const routing:SimpleRouteJson={...input,traces:undefined,layerCount:4,allowBlindAndBuriedVias:false,
    minViaDiameter:process.coreDiameter,minViaPadDiameter:process.coreDiameter,min_via_pad_diameter:process.coreDiameter,
    minViaHoleDiameter:process.coreHole,min_via_hole_diameter:process.coreHole,
    obstacles:obstacles.map(o=>({...o,layers:o.layers.filter(l=>hdiSignalLayers.includes(l)).map(virtual)})).filter(o=>o.layers.length),
    connections:input.connections.map(c=>({...c,pointsToConnect:c.pointsToConnect.map(p=>{
      if(p.layer!==undefined)return {...p,layer:virtual(p.layer)}
      return {...p,layers:p.layers.map(virtual)}
    })})),
    buses:input.buses?.map(b=>({...b,allowedLayers:b.allowedLayers?.map(virtual),preferredLayer:b.preferredLayer?virtual(b.preferredLayer):undefined,preferredLayers:b.preferredLayers?.map(virtual)}))}
  const listeners:Record<string,((e:any)=>void)[]>={}
  let stopped=false,output=previous
  const emit=(type:string,e:any)=>listeners[type]?.forEach(fn=>fn(e))
  const run=async()=>{
    try {
      const saved=process.id===standardHdi.id?await savedHdiMemoryRouting(input):undefined
      if(saved){output=[...previous,...saved];emit("complete",{traces:output});return}
      const avoid:Obstacle[]=[]
      for(let attempt=0;attempt<5;attempt++) {
        const solver=new AutoroutingPipelineSolver9_PreloadedTraceGraph({...routing,obstacles:[...routing.obstacles,...avoid]},{effort:5})
        let steps=0
        while(!stopped&&!solver.solved&&!solver.failed) {
          const start=Date.now(),iterations=solver.iterations
          while(!stopped&&Date.now()-start<200&&!solver.solved&&!solver.failed)solver.step()
          emit("progress",{attempt,steps:++steps,phase:solver.getCurrentPhase(),progress:solver.progress,iterationsPerSecond:(solver.iterations-iterations)*1000/Math.max(1,Date.now()-start)})
          await new Promise(resolve=>setTimeout(resolve,0))
        }
        if(stopped)return
        let manual:HdiTrace[]|undefined
        let routed:HdiTrace[]=[]
        if(solver.failed) {
          manual=gridHdiFallback(input,process)
          if(!manual)throw new Error(`HDI ${solver.getCurrentPhase()}: ${solver.error}; supplementary manual grid found no accepted route`)
          console.log(`HDI supplementary manual grid route after Pipeline9 ${solver.getCurrentPhase()} failure: ${manual.map(t=>t.connection_name).join(",")}`)
        } else {
          try{routed=solver.getOutputSimplifiedPcbTraces()}
          catch(error) {
            manual=gridHdiFallback(input,process)
            if(!manual)throw error
            console.log(`HDI rejected invalid Pipeline9 output; supplementary manual grid route: ${manual.map(t=>t.connection_name).join(",")}`)
          }
        }
        let traces:HdiTrace[]=manual?manual:routed.map(t=>({...t,route:t.route.map(p=>{
          if(p.route_type==="wire")return {...p,layer:toPhysical[p.layer]}
          if(p.route_type==="via")return {...p,from_layer:toPhysical[p.from_layer],to_layer:toPhysical[p.to_layer],layers:[...hdiCoreLayers],via_diameter:process.coreDiameter,via_hole_diameter:process.coreHole}
          if(p.route_type==="through_obstacle")return {...p,from_layer:toPhysical[p.from_layer],to_layer:toPhysical[p.to_layer]}
          throw new Error("HDI fixture prohibits jumpers")
        })}))
        const covered=new Set(traces.map(t=>t.connection_name))
        if(input.connections.some(c=>!covered.has(c.name))||covered.size!==input.connections.length)throw new Error("HDI router omitted a signal")
        for(const t of traces) {
          let layer:string|undefined
          for(const p of t.route) {
            if(p.route_type==="wire") {
              if(layer&&layer!==p.layer)throw new Error("HDI route changes layer without a via")
              layer=p.layer
            } else if(p.route_type==="via") {
              if(layer&&layer!==p.from_layer)throw new Error("HDI via is disconnected from the arriving wire")
              layer=p.to_layer
            } else if(p.route_type==="through_obstacle") {
              // The manual escapes only connect Top and L2; the solver is
              // routing exclusively inside the core. They cannot furnish
              // a transition to another internal routing layer.
              if(p.from_layer!==p.to_layer||p.from_layer!=="inner1"||
                !escapes.some(o=>o.connectedTo.includes(t.connection_name)&&[p.start,p.end].every(q=>Math.hypot(q.x-o.center.x,q.y-o.center.y)<=.125+p.width/2+1e-5)))
                throw new Error("HDI solver used an unrepresented existing-via transition")
              layer=p.to_layer
            } else throw new Error("Unsupported HDI route primitive")
          }
        }
        const repair=repairHdiVias(input,traces,process)
        traces=repair.traces
        if(repair.moves.length)console.log(`HDI local corrections: ${JSON.stringify(repair.moves)}`)
        // The routing obstacles reserve drill clearance and are larger than
        // their actual lands. Center any solver terminal on its declared L2
        // microvia, then audit the resulting physical attachment/doglegs.
        for(const t of traces) {
          const terminals=input.connections.find(c=>c.name===t.connection_name)!.pointsToConnect
          const matched=new Set<number>()
          for(const index of [0,t.route.length-1]) {
            const p=t.route[index]
            if(p.route_type!=="wire")throw new Error("HDI terminal is not a wire")
            const ti=terminals.findIndex(q=>Math.hypot(q.x-p.x,q.y-p.y)<=.16+p.width/2+1e-5)
            if(ti<0||matched.has(ti)||p.layer!=="inner1")throw new Error(`HDI route misses its physical L2 terminal: ${JSON.stringify(p)}`)
            matched.add(ti)
            t.route[index]={...p,x:terminals[ti].x,y:terminals[ti].y}
          }
        }
        const wireRepair=repairHdiWires(input,traces,process)
        traces=wireRepair.traces
        if(wireRepair.moves.length)console.log(`HDI wire corrections: ${JSON.stringify(wireRepair.moves)}`)
        const audit=wireRepair.audit
        console.log(`HDI phase candidate: ${traces.length} signals, ${audit.newVias} core vias, ${audit.issues.length} physical issues`)
        if(audit.issues.length) {
          console.log("HDI_REJECTED_PHASE_JSON="+JSON.stringify({attempt,traces,audit}))
          if(attempt===4) {
            const alternative=gridHdiFallback(input,process)
            if(alternative&&!auditHdiMemory(input,alternative,process).issues.length) {
              console.log(`HDI supplementary manual grid route after five rejected physical candidates: ${alternative.map(t=>t.connection_name).join(",")}`)
              output=[...previous,...alternative];emit("complete",{traces:output});return
            }
            throw new Error("HDI phase fails physical copper/drill checks")
          }
          for(const issue of audit.issues) {
            if(issue.x!==undefined&&issue.y!==undefined)avoid.push({type:"rect",shape:"circle",center:{x:issue.x,y:issue.y},width:.1,height:.1,layers:["top","inner1","inner2","bottom"],connectedTo:[]})
            else if(issue.index!==undefined) {
              const t=traces.find(t=>t.connection_name===issue.trace)!,a=t.route[issue.index],b=t.route[issue.index+1]
              if(a.route_type!=="wire"||b.route_type!=="wire")throw new Error("Invalid HDI rejected segment")
              avoid.push({type:"rect",shape:"circle",center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},width:.1,height:.1,layers:[virtual(a.layer)],connectedTo:[]})
            }
          }
          continue
        }
        output=[...previous,...traces];emit("complete",{traces:output});return
      }
    }catch(error){emit("error",{error})}
  }
  return {on(type:string,fn:(e:any)=>void){(listeners[type]??=[]).push(fn)},start(){void run()},stop(){stopped=true},getOutputSimpleRouteJson(){return {...input,traces:output}}}
}
