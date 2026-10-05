import {Fragment} from "react"
import {ddrGroups as timingGroups,differentialPairs} from "./DdrConstraints"

export {differentialPairs}
export const copperLayers=["top","inner1","inner2","bottom"] as const
// SPRS717L Tables7-61/62: L1 signal / L2 GND / L3 DDR power / L4 signal.
// Reserve both inner layers throughout the DDR region. Previous trials
// which used an inner signal layer are diagnostics, not this stackup.
export const ddrSignalLayers=["top","bottom"] as const
export const ddrReferenceRegion={minX:-18,maxX:18,minY:-39,maxY:10} as const
export const ddrVia={land:.4572,drill:.254} as const
export const ddrGroups=timingGroups.map((g,i)=>({...g,
  layer:(["bottom","bottom","top"] as const)[i]}))
export const ddrResetLayer="top" as const
export const FourLayerReferencePlanes=({ddrPowerClearance=.2}:{ddrPowerClearance?:.12|.2}={})=> {
  // tscircuit also insets an explicit pour outline by its clearance. Preserve
  // the checked copper boundary while only reducing the local via antipads.
  const retainedBoundaryInset=.2-ddrPowerClearance
  return <>
  <copperpour name="GND_REFERENCE" layer="inner1" connectsTo="net.GND" unbroken
    clearance={.2} boardEdgeMargin={.3}/>
  <copperpour name="DDR_POWER_REFERENCE" layer="inner2" connectsTo="net.DDR_1V5" unbroken
    // The .12 mm option repairs the isolated J9 supply in the CKE trial.
    // With 18/10 mil vias it keeps .2216 mm copper-to-drill separation,
    // above the unchanged .20 mm rule, and .1028 mm plane necks at .8 pitch.
    clearance={ddrPowerClearance} outline={[
      {x:ddrReferenceRegion.minX+retainedBoundaryInset,y:ddrReferenceRegion.minY+retainedBoundaryInset},
      {x:ddrReferenceRegion.maxX-retainedBoundaryInset,y:ddrReferenceRegion.minY+retainedBoundaryInset},
      {x:ddrReferenceRegion.maxX-retainedBoundaryInset,y:ddrReferenceRegion.maxY-retainedBoundaryInset},
      {x:ddrReferenceRegion.minX+retainedBoundaryInset,y:ddrReferenceRegion.maxY-retainedBoundaryInset},
    ]}/>
</>
}
type SignalLayer="top"|"bottom"|"both"
const allowedSignalLayers=(layer:SignalLayer)=>layer==="both"?[...ddrSignalLayers]:[layer]
export const FourLayerDdrConstraints=({pairGap=.12,byte0Layer="bottom",byte1Layer="bottom",commandLayer="top",resetLayer="top",nativePhaseFixedPairNames=[]}:{pairGap?:number,byte0Layer?:SignalLayer,byte1Layer?:SignalLayer,commandLayer?:SignalLayer,resetLayer?:SignalLayer,nativePhaseFixedPairNames?:string[]}={})=> <>
  <bus name="DDR_RESET" connections={["DDR_RESETn"]} pcbAllowedLayers={allowedSignalLayers(resetLayer)} pcbTraceWidth={.1016}/>
  {ddrGroups.map(g=><Fragment key={g.name}><bus name={g.name} connections={g.signals}
    pcbAllowedLayers={allowedSignalLayers(g.name==="DDR_BYTE0"?byte0Layer:g.name==="DDR_BYTE1"?byte1Layer:commandLayer)} pcbTraceWidth={.1016} maxLengthSkew={.635}/></Fragment>)}
  {differentialPairs.filter(p=>!nativePhaseFixedPairNames.includes(p.name)).map(p=><Fragment key={p.name}><differentialpair {...p}
    maxLengthSkew={.127} pcbTraceGap={pairGap}/></Fragment>)}
</>
