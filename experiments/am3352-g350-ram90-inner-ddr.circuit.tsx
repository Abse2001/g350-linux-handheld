import {Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react'
import Bootstrap from './am3352-g350-ddr-bootstrap.circuit'
import {SOLVERS} from '@tscircuit/core'

type Props=Record<string,unknown>&{name?:string;children?:ReactNode}
type Input=ConstructorParameters<typeof SOLVERS.BusLanesPipelineSolver>[0]
// New placement/stackup trial. No frozen DDR or RAM power paths are reused.
async function innerDdrBusLanes(input:Input){
 if(input.layerCount!==4||input.allowBlindAndBuriedVias!==false)throw new Error('Four layers and standard through-vias required')
 const layers=['inner1','inner2']
 const nativeInput={...input,outline:undefined,allowedLayers:layers,
  buses:input.buses?.map((b:Record<string,unknown>)=>({...b,allowedLayers:layers}))}
 const solver=new SOLVERS.BusLanesPipelineSolver(nativeInput,{smoothTuning:true,denseSearch:true,maxSearchIterations:50000})
 const start=Date.now()
 while(!solver.solved&&!solver.failed){
  for(let i=0;i<25&&!solver.solved&&!solver.failed;i++)solver.step()
  if(Date.now()-start>65000)throw new Error('Rotated RAM inner-layer bus lanes search budget exhausted')
  await new Promise<void>(resolve=>setTimeout(resolve,0))
 }
 if(solver.failed)throw new Error(solver.error??'Inner DDR bus lanes failed')
 return solver.getOutput()
}
function rotated(node:ReactNode):ReactNode{
 if(!isValidElement<Props>(node))return node
 const p={...node.props}
 if(p.name==='U_RAM')p.pcbRotation=90
 if(p.name==='R_DDR_ZQ'){p.pcbX=10;p.pcbY=-7}
 if(node.type==='bus'&&String(p.name).startsWith('DDR_'))p.pcbAllowedLayers=['inner1','inner2']
 if(node.type==='autoroutingphase'&&String(p.name).includes('BUS_LANES')){
  p.autorouter='bus_lanes';p.algorithmFn=innerDdrBusLanes
 }
 // Outer GND pours are provisional references for the new inner signals.
 // DDR supply distribution and filled return-path continuity need fresh checks.
 if(node.type==='copperpour'&&p.name==='G350_GND_REFERENCE')p.layer='top'
 if(node.type==='copperpour'&&p.name==='G350_DDR_POWER_REFERENCE'){
  p.name='G350_BOTTOM_GND_REFERENCE';p.layer='bottom';p.connectsTo='net.GND'
 }
 if(node.type==='board')p.title='G350 RAM rotated 90 degrees — Inner1/Inner2 DDR bus lanes trial, unqualified'
 return cloneElement(node as ReactElement<Props>,p,...Children.toArray(node.props.children).map(rotated))
}
export default()=>rotated(Bootstrap())
