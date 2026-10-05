import ConverterPlacement from './am3352-g350-converter-placement.circuit'
import {g350DdrBootstrap} from '../lib/am3352/placement/G350DdrBootstrap'

// Preserve every placed part and the shaped 76 x 118 mm board. Native
// DDR_BYTE0/1/COMMAND_CLOCK_BUS_LANES phases originate in the host source.
// This is a routing bootstrap, not a fabrication release.
export default ()=>g350DdrBootstrap(ConverterPlacement())
