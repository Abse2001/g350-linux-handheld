import PowerFanout from './am3352-g350-ddr-power-fanout.circuit'
import {g350DdrPowerReplay} from '../lib/am3352/placement/G350DdrPowerReplay'

// Native fanout bootstrap replay on the real shaped 76 × 118 mm outline.
// All 280 components remain placed; signal and other power routing remain.
export default ()=>g350DdrPowerReplay(PowerFanout())
