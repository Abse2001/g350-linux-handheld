import {SOLVERS} from '@tscircuit/core'

type Input=ConstructorParameters<typeof SOLVERS.BusLanesPipelineSolver>[0]

// Phase after the 22 explicitly authored package escapes. Every drill remains
// full-depth; fixed wire copper remains in the native solver's input.
export async function routeG350Byte1FromEscapes(input:Input){
 if(input.layerCount!==4||input.allowBlindAndBuriedVias!==false)throw new Error('Expected four-layer through-via routing')
 if(input.connections.length!==11)throw new Error('Expected the complete byte1 bus')
 if(input.connections.some((c:{pointsToConnect:{layer?:string}[]})=>c.pointsToConnect.some(p=>p.layer!=='bottom')))throw new Error('Manual fanout phase must supply bottom endpoints')
 const sites=new Map<string,{x:number;y:number;diameter:number;connection:string}>()
 for(const trace of input.traces??[])for(const p of trace.route){
  if(p.route_type!=='via')continue
  if(p.via_diameter!==.4572||p.via_hole_diameter!==.254)throw new Error('Unexpected fixed through-via dimensions')
  sites.set(`${p.x.toFixed(8)},${p.y.toFixed(8)}`,{x:p.x,y:p.y,diameter:p.via_diameter,connection:trace.connection_name??''})
 }
 if(sites.size!==141)throw new Error('Expected 119 old and 22 byte1 through-vias')
 const nativeInput={...input,bounds:{minX:-17.5,maxX:17.5,minY:-9.5,maxY:32.5},
  allowedLayers:['bottom'],buses:input.buses?.map((b:Record<string,unknown>)=>({...b,allowedLayers:['bottom']})),
  obstacles:[...input.obstacles,...[...sites.values()].map((v,i)=>({
   type:'rect' as const,shape:'circle' as const,center:{x:v.x,y:v.y},width:v.diameter,height:v.diameter,
   layers:['top','inner1','inner2','bottom'],connectedTo:[v.connection],obstacleId:`g350_escaped_byte1_via_${i}`,
  }))]}
 const solver=new SOLVERS.BusLanesSolver(nativeInput,{smoothTuning:false,denseSearch:true,maxSearchIterations:50000})
 const start=Date.now()
 while(!solver.solved&&!solver.failed){
  for(let i=0;i<25&&!solver.solved&&!solver.failed;i++)solver.step()
  if(Date.now()-start>105000)throw new Error('Native escaped byte1 bus_lanes exceeded its 105 second search budget')
  await new Promise<void>(resolve=>setTimeout(resolve,0))
 }
 if(solver.failed)throw new Error(solver.error??'Native escaped byte1 bus_lanes failed')
 return solver.getOutput()
}
