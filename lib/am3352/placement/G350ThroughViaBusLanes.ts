import {SOLVERS} from '@tscircuit/core'

type Input=ConstructorParameters<typeof SOLVERS.BusLanesPipelineSolver>[0]

// Preserve physical drill lands on every layer. Saved plane-fanout paths
// describe electrical contact to an inner plane, although their standard
// through-vias also occupy the opposite signal layer. Reserve those lands
// explicitly before invoking the same native bus_lanes pipeline.
export async function routeG350Byte0WithThroughViaReservations(input:Input){
 if(input.layerCount!==4||input.allowBlindAndBuriedVias!==false)throw new Error('Expected four-layer through-via routing')
 if(input.connections.length!==9)throw new Error('This bootstrap is only the remaining nine byte0 signals')
 const sites=new Map<string,{x:number;y:number;diameter:number;connection:string}>()
 for(const trace of input.traces??[]){
  for(const point of trace.route){
   if(point.route_type!=='via')continue
   const key=`${point.x.toFixed(8)},${point.y.toFixed(8)}`
   const diameter=point.via_diameter??input.minViaPadDiameter
   if(diameter===undefined||Math.abs(diameter-.4572)>1e-8)throw new Error('Unexpected fixed via land')
   sites.set(key,{x:point.x,y:point.y,diameter,connection:trace.connection_name??''})
  }
 }
 if(sites.size!==101)throw new Error('Expected all 97 power and four strobe through-vias')
 const obstacles=[...sites.values()].map((v,index)=>({
  type:'rect' as const,shape:'circle' as const,center:{x:v.x,y:v.y},
  width:v.diameter,height:v.diameter,layers:['top','inner1','inner2','bottom'],
  connectedTo:[v.connection],
  obstacleId:`g350_fixed_through_via_${index}`,
 }))
 const physicalInput={...input,obstacles:[...input.obstacles,...obstacles]}
 const solver=new SOLVERS.BusLanesPipelineSolver(physicalInput)
 const start=Date.now()
 while(!solver.solved&&!solver.failed){
  for(let i=0;i<25&&!solver.solved&&!solver.failed;i++)solver.step()
  if(Date.now()-start>105000)throw new Error('Native bus_lanes bootstrap exceeded its 105 second search budget')
  await new Promise<void>(resolve=>setTimeout(resolve,0))
 }
 if(solver.failed)throw new Error(solver.error??'Native bus_lanes bootstrap failed')
 return solver.getOutput()
}
