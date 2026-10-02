// Proposed processes, not manufacturer-approved stackups. JLCPCB's HDI
// capabilities permit 0.10mm buried drills only when their drilled
// dielectric span is <=1.0mm. Both variants need filled/capped via-in-pad.
export type HdiProcess={id:string;coreDiameter:number;coreHole:number;finishedThickness:number;maximumCoreDielectric:number}
export const standardHdi:HdiProcess={id:"1+6+1-standard-buried",coreDiameter:.3,coreHole:.15,finishedThickness:1.6,maximumCoreDielectric:2.4}
export const thinHdi:HdiProcess={id:"1+6+1-thin-extreme-buried",coreDiameter:.25,coreHole:.1,finishedThickness:1.0,maximumCoreDielectric:1.0}
export const coreReservation=(p:HdiProcess)=>Math.max(p.coreDiameter,p.coreHole+2*(.2-.09))
