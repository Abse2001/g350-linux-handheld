import HarnessPlacement from './am3352-g350-harness-placement.circuit'
import {criticalPlacement} from '../lib/am3352/placement/CriticalPlacement'

// Preserve the checked harness/display/controls source, then apply a pin-aware
// CPU bypass placement. Routing and fabrication release remain disabled.
export default ()=>criticalPlacement(HarnessPlacement())
