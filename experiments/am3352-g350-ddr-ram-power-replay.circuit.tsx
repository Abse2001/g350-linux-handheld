import PowerFanout from './am3352-g350-ddr-power-fanout.circuit'
import {g350RamPowerReplay} from '../lib/am3352/placement/G350RamPowerReplay'

// Replay native autorouter output in an editable source-level phase on the
// actual outline. This board is incomplete and must not be fabricated.
export default ()=>g350RamPowerReplay(PowerFanout())
