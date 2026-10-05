import {Children,cloneElement,type ReactElement,type ReactNode} from 'react'
import Bootstrap from './am3352-g350-ddr-bootstrap.circuit'
import {cpuPowerConnections,ramPowerConnections} from '../lib/am3352/PowerNetworks'
import {fanoutTracePath} from '@tscircuit/props'
import ramPowerPaths from '../lib/am3352/placement/ddr-ram-power-fanout.json'
import cpuPowerPaths from '../lib/am3352/placement/ddr-cpu-power-fanout-repaired.json'

// Reserve ground and DDR supply escapes before signal interconnects. Keep
// all other processor voltage domains separate and retain all placed parts.
const cpuConnections=cpuPowerConnections.filter(p=>['GND','DDR_1V5'].includes(p.net)).map(p=>`U_SOC.${p.pin}`)
const ramConnections=ramPowerConnections.filter(p=>['GND','DDR_1V5'].includes(p.net)).map(p=>`U_RAM.${p.pin}`)
if(cpuConnections.length!==62||ramConnections.length!==39)throw new Error('Expected 76 ground and 25 DDR supply terminals')
const checkedRamPowerPaths=ramPowerPaths.map(p=>fanoutTracePath.parse(p))
const cpuPowerBootstrapPaths=cpuPowerPaths.map(p=>fanoutTracePath.parse(p))

export default ()=>{
 const board=Bootstrap() as ReactElement<{children?:ReactNode}>
 return cloneElement(board,{},...Children.toArray(board.props.children),
  <autoroutingphase name="G350_RAM_POWER_ESCAPES" phaseIndex={-1}
   autorouter="fanout" connections={ramConnections}
   fanoutRoutingLayers={['top','bottom']} fanoutBoundaryPadding={4}
   pcbTracePaths={checkedRamPowerPaths}
   fanoutPourNetMap={{inner1:'GND',inner2:'DDR_1V5'}}/>,
  <autoroutingphase name="G350_CPU_POWER_ESCAPES" phaseIndex={0}
   autorouter="fanout" connections={cpuConnections}
   fanoutRoutingLayers={['top','bottom']} fanoutBoundaryPadding={6}
   pcbTracePaths={cpuPowerBootstrapPaths}
   fanoutPourNetMap={{inner1:'GND',inner2:'DDR_1V5'}}/>)
}
