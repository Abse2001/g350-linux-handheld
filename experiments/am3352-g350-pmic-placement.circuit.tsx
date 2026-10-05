import DdrCorridor from './am3352-g350-ddr-corridor.circuit'
import {pmicPlacement} from '../lib/am3352/placement/PmicPlacement'

// Move the PMIC support parts at source level. The reviewed DDR corridor,
// card-detect/PWM allocation and provisional outline remain unchanged.
export default ()=>pmicPlacement(DdrCorridor())
