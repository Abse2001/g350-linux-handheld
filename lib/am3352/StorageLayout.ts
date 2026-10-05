// Hirose DM3 catalogue page9 mounting pattern. Datum: pin8 centre in X,
// signal-land top edge in Y. Expand each hatched no-conductive-trace
// rectangle by 0.2mm rather than treating its MAX/MIN limits as exact.
// Imported pin8 = (-4.525010,-5.3500401), land length 1.7500092.
const pin8X=-4.525010,landTopY=-5.3500401+1.7500092/2
export const sdPosition={x:41,y:20,rotation:90} as const
const localRects=[
  {name:"SD_CONTACT_KEEP_OUT",left:pin8X-.6,right:pin8X+8.3,bottom:landTopY+3.8,top:landTopY+6.2},
  {name:"SD_LATCH_KEEP_OUT",left:pin8X+2.35,right:pin8X+5.25,bottom:landTopY+8,top:landTopY+10.4},
]
export const sdCopperKeepouts=localRects.map(r=>({name:r.name,
  x:sdPosition.x-(r.bottom+r.top)/2,y:sdPosition.y+(r.left+r.right)/2,
  width:r.top-r.bottom,height:r.right-r.left,
}))
