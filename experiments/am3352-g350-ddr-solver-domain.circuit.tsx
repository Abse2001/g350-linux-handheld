import {cloneElement,type ReactElement} from 'react'
import PowerFanout from './am3352-g350-ddr-power-fanout.circuit'

// Computational bootstrap only: core2085's lane solver rejects custom
// outlines. Retain all 280 parts, positions, nets, rules and four layers;
// use rectangular solver bounds for the interconnect computation. Never
// adopt this diagnostic board or its pours as a fabrication source.
// Replay accepted trace paths on the actual shaped-board source and check
// every copper edge, plane/reference crossing, via and connection there.
export default ()=>cloneElement(PowerFanout() as ReactElement<Record<string,unknown>>,
 {outline:undefined,title:'G350 DDR computational domain — actual outline requires checked replay'})
