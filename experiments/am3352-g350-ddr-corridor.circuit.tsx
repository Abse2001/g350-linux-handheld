import PinAllocation from './am3352-g350-pin-allocation.circuit'
import {ddrCorridorPlacement} from '../lib/am3352/placement/DdrCorridorPlacement'

// Complete 280-part source placement on the provisional 76 x 118 mm outline.
// Routing remains disabled until critical circuit layout review is complete.
export default ()=>ddrCorridorPlacement(PinAllocation())
