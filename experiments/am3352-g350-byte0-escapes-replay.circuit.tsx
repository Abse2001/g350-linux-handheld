import {Children,cloneElement,type ReactElement,type ReactNode} from 'react'
import {fanoutTracePath} from '@tscircuit/props'
import StrobeReplay from './am3352-g350-dqs0-center-approach.circuit'
import nativePaths from '../lib/am3352/placement/ddr-byte0-native-escapes.json'

const paths=nativePaths.map(p=>fanoutTracePath.parse(p))

// Keep all placed components, power copper and the center strobe approach.
// Replay the native package-access bootstrap separately from lane routing.
export default ()=>{
 const board=StrobeReplay() as ReactElement<{children?:ReactNode}>
 return cloneElement(board,{},...Children.toArray(board.props.children),
  <autoroutingphase name="G350_BYTE0_PACKAGE_ESCAPES" phaseIndex={2}
   autorouter="fanout" connections={paths.map(p=>p.connection)}
   fanoutRoutingLayers={['bottom']} pcbTracePaths={paths}/>)
}
