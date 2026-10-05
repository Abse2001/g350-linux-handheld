import PmicPlacement from './am3352-g350-pmic-placement.circuit'
import {converterPlacement} from '../lib/am3352/placement/ConverterPlacement'

// Shorten converter supply/return paths before the full-board DDR bootstrap.
// The complete 280-part source, pin allocation and outline are inherited.
export default ()=>converterPlacement(PmicPlacement())
