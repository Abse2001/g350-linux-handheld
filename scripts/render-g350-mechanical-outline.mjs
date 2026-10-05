import {readFileSync,writeFileSync} from "node:fs"
import {Resvg} from "@resvg/resvg-js"

// All dimensions come from the same provisional JSON used by tscircuit.
// No mounting holes or inferred original PCB coordinates are introduced.
const g=JSON.parse(readFileSync("mechanical/g350-provisional-outline.json"))
const marginX=(g.caseWidth-g.width)/2,marginY=(g.caseHeight-g.height)/2
const envelope=JSON.parse(readFileSync("checks/mechanical/g350-current-envelope-check.json"))
const usb=envelope.circuits.find(c=>c.entry==='index.circuit.tsx').projectingCourtyards.find(c=>c.name==='J_USB')
const usbProjection=(-usb.minimumVertexClearanceMm).toFixed(3)
const cx=55,cy=85
const left=cx-g.width/2,right=cx+g.width/2,top=cy-g.height/2,bottom=cy+g.height/2
const bodyBottom=top+g.mainBodyHeight,tabLeft=cx-g.speakerTongueWidth/2,tabRight=cx+g.speakerTongueWidth/2
const path=g.outline.map((p,i)=>`${i?'L':'M'} ${cx+p.x} ${cy-p.y}`).join(' ')+' Z'
const dim=(x1,y1,x2,y2,label,tx,ty,rotate=0)=>`<path d="M${x1} ${y1} L${x2} ${y2}" class="dim" marker-start="url(#arrow)" marker-end="url(#arrow)"/><text x="${tx}" y="${ty}" transform="rotate(${rotate} ${tx} ${ty})" class="dimension">${label}</text>`
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="110mm" height="176mm" viewBox="0 0 110 176">
<defs><marker id="arrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M4 0 L0 2 L4 4" fill="none" stroke="#26394e" stroke-width=".35"/></marker></defs>
<style>text{font-family:Arial,sans-serif;fill:#182b40;text-anchor:middle}.title{font-size:4.2;font-weight:bold}.small{font-size:2.65}.dimension{font-size:3.1;font-weight:bold;paint-order:stroke;stroke:#fff;stroke-width:1.6;stroke-linejoin:round}.dim{fill:none;stroke:#26394e;stroke-width:.25}.extension{fill:none;stroke:#718499;stroke-width:.18}</style>
<rect width="110" height="176" fill="#fff"/>
<text x="55" y="7" class="title">G350 provisional PCB outline</text>
<text x="55" y="12" class="small">Engineering dimensions — original shell fit unverified</text>
<rect x="${cx-g.caseWidth/2}" y="${cy-g.caseHeight/2}" width="${g.caseWidth}" height="${g.caseHeight}" fill="#f5f7fa" stroke="#8697aa" stroke-width=".25" stroke-dasharray="1.5 1.5"/>
<path d="${path}" fill="#dcefe8" stroke="#12664a" stroke-width=".5"/>
<path d="M${left} 18 V${bodyBottom-4} M${right} 18 V${bodyBottom-4} M${right} ${top} H106 M${tabRight} ${bottom} H106 M${left} ${top} H8 M${left+2} ${bodyBottom} H8 M${tabLeft} ${bottom} V152 M${tabRight} ${bottom} V152 M69 ${bodyBottom} H34 M${tabLeft} ${bottom} H34" class="extension"/>
${dim(left,18,right,18,`${g.width} mm`,55,17)}
${dim(104,top,104,bottom,`${g.height} mm`,102,85,-90)}
${dim(9,top,9,bodyBottom,`${g.mainBodyHeight} mm body`,6,75,-90)}
${dim(tabLeft,152,tabRight,152,`${g.speakerTongueWidth} mm`,55,151)}
${dim(35,bodyBottom,35,bottom,`${g.speakerTongueExtension} mm`,32,135,-90)}
<text x="55" y="58" class="title">${g.width} × ${g.height} mm</text>
<text x="55" y="65" class="small">4 copper layers · provisional 1.6 mm thickness</text>
<text x="55" y="74" class="small">Mounting holes and case openings</text>
<text x="55" y="79" class="small">require measured alignment</text>
<text x="55" y="88" class="dimension">Nominal outer-case margins</text>
<text x="55" y="94" class="small">${marginX} mm each side · ${marginY} mm each end</text>
<text x="55" y="100" class="small">These are not measured internal clearances</text>
<text x="55" y="111" class="small">Lower corners left open for enclosure contents</text>
<text x="55" y="134" class="small">Speaker tab</text>
<text x="55" y="159" class="small">Dashed: published ${g.caseWidth} × ${g.caseHeight} mm outside case envelope.</text>
<text x="55" y="164" class="small">USB-C assembly space projects ${usbProjection} mm past the top edge.</text>
<text x="55" y="170" class="small">Print at 100% / actual size. Do not order from this drawing.</text>
</svg>`
writeFileSync("mechanical/g350-provisional-outline.svg",svg)
writeFileSync("mechanical/g350-provisional-outline.png",new Resvg(svg,{fitTo:{mode:"width",value:1100},font:{loadSystemFonts:true}}).render().asPng())

const template=`<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="150mm" viewBox="0 0 100 150">
<rect width="100" height="150" fill="white"/>
<path d="${g.outline.map((p,i)=>`${i?'L':'M'} ${50+p.x} ${69-p.y}`).join(' ')} Z" fill="none" stroke="black" stroke-width=".15"/>
<g font-family="Arial,sans-serif" text-anchor="middle" fill="black"><text x="50" y="52" font-size="4">G350 ${g.width} × ${g.height} mm</text><text x="50" y="60" font-size="3">Provisional paper-fit template</text><text x="50" y="68" font-size="2.6">No measured shell or mounting geometry</text><text x="50" y="75" font-size="2.6">Cut on outline; inspect ribs, bosses and ports</text><text x="50" y="140" font-size="2.6">50 mm calibration — print at actual size</text><text x="50" y="147" font-size="2.6">Placement study only; not a manufacturing drawing</text></g>
<path d="M25 133 H75 M25 130 V136 M75 130 V136" fill="none" stroke="black" stroke-width=".15"/>
</svg>`
writeFileSync("mechanical/g350-paper-fit-template.svg",template)
console.log("Rendered dimensioned provisional outline and an actual-size paper template.")
