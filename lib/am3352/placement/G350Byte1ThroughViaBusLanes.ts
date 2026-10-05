import {SOLVERS} from '@tscircuit/core'

type Input=ConstructorParameters<typeof SOLVERS.BusLanesPipelineSolver>[0]

// Native bus_lanes bootstrap with every fixed, full-depth via represented
// on both signal layers. Signal carriers are retained as exact fixed paths.
export async function routeG350Byte1WithThroughViaReservations(input:Input){
 if(input.layerCount!==4||input.allowBlindAndBuriedVias!==false)throw new Error('Expected four-layer through-via routing')
 if(input.connections.length!==11)throw new Error('Expected the complete second DDR byte')
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
 if(sites.size!==119)throw new Error('Expected 97 power and 22 first-byte through-vias')
 const obstacles=[...sites.values()].map((v,index)=>({
  type:'rect' as const,shape:'circle' as const,center:{x:v.x,y:v.y},
  width:v.diameter,height:v.diameter,layers:['top','inner1','inner2','bottom'],
  connectedTo:[v.connection],obstacleId:`g350_byte1_fixed_via_${index}`,
 }))
 // Search within the continuous DDR power reference. The rectangular
 // computational domain does not replace the shaped PCB manufacturing edge.
 const physicalInput={...input,bounds:{minX:-17.5,maxX:17.5,minY:-9.5,maxY:32.5},
  obstacles:[...input.obstacles,...obstacles]}
 const solver=new SOLVERS.BusLanesPipelineSolver(physicalInput)
 const start=Date.now()
 while(!solver.solved&&!solver.failed){
  for(let i=0;i<25&&!solver.solved&&!solver.failed;i++)solver.step()
  if(Date.now()-start>105000)throw new Error('Native byte1 bus_lanes exceeded its 105 second search budget')
  await new Promise<void>(resolve=>setTimeout(resolve,0))
 }
 if(solver.failed)throw new Error(solver.error??'Native byte1 bus_lanes failed')
 return solver.getOutput()
}
