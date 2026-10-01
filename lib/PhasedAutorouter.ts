import { AutoroutingPipelineSolver9_PreloadedTraceGraph,
  type SimpleRouteJson } from "@tscircuit/capacity-autorouter"

// Route power around completed signal phases with the official local solver.
export async function routePowerAroundEarlierCopper(input: SimpleRouteJson) {
  const previous = input.traces ?? []
  // GND is the first declared source net on this project. Its pads connect by
  // filled zones and stitching vias; fabrication.mjs verifies this identifier.
  // Final KiCad connectivity and Gerber shorts checks still qualify the copper.
  const routingInput = {...input,connections:input.connections.filter(c=>c.name!=="source_net_0")}
  const solver = new AutoroutingPipelineSolver9_PreloadedTraceGraph(routingInput,{effort:2})
  const listeners: Record<string,((event:any)=>void)[]> = {}
  let output = previous
  const emit = (type:string,event:any) => listeners[type]?.forEach(fn=>fn(event))
  const run = async () => {
    try {
      let steps=0
      while (!solver.solved && !solver.failed) {
        const start=Date.now(),iterations=solver.iterations
        while (Date.now()-start<200 && !solver.solved && !solver.failed) solver.step()
        emit("progress",{steps:++steps,progress:solver.progress,phase:solver.getCurrentPhase(),
          iterationsPerSecond:(solver.iterations-iterations)*1000/Math.max(1,Date.now()-start)})
        await new Promise(resolve=>setTimeout(resolve,0))
      }
      if (solver.failed) throw new Error(solver.error ?? "Power autorouting failed")
      output=solver.getOutputSimplifiedPcbTraces()
      emit("complete",{traces:output})
    } catch (error) { emit("error",{error}) }
  }
  return {
    on(type:string,fn:(event:any)=>void) { (listeners[type]??=[]).push(fn) },
    start() { void run() },
    getOutputSimpleRouteJson() { return {...input,traces:output} },
  }
}
