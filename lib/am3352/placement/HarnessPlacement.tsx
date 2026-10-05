import {Children, cloneElement, Fragment as ReactFragment, isValidElement, type ReactElement, type ReactNode} from "react"
import {DF65_3P_1_7V_21_} from "../../../imports/DF65_3P_1_7V_21_"
import {SM02B_SRSS_TB_LF__SN_} from "../../../imports/SM02B_SRSS_TB_LF__SN_"
import {HostPins} from "../Boot"

type Props = Record<string, unknown> & {children?: ReactNode; name?: string}
const distance=(v:unknown)=>typeof v==="number"?v:Number(String(v).replace(/mm$/, ""))

// TDK VLCF5020-1 manufacturer drawing, p3 (20180831). Rotate the
// recommended land pattern 90 degrees to keep the import's terminal axis.
// The 4.9mm / 3.0mm widths and 45-degree chamfers imply a 0.95mm chamfer.
// Two inscribed rectangular stencil apertures per pad avoid paste outside
// the chamfered copper. Stencil volume still needs assembly qualification.
function backlightInductorFootprint() {
  const left=[{x:-2.75,y:-1.5},{x:-1.8,y:-2.45},{x:-.65,y:-2.45},
    {x:-.65,y:2.45},{x:-1.8,y:2.45},{x:-2.75,y:1.5}]
  return <footprint>
    <smtpad shape="polygon" portHints={["pin1"]} points={left}/>
    <smtpad shape="polygon" portHints={["pin2"]} points={left.map(p=>({x:-p.x,y:p.y})).reverse()}/>
    {[-1,1].map(sign=><ReactFragment key={sign}>
      {/* Core has no solderpaste element. These same-terminal auxiliary
          copper rectangles lie entirely within the main copper polygon:
          their union changes no manufactured copper or exposed mask.
          Their native paste records define the inscribed apertures. */}
      <smtpad shape="rect" portHints={[sign===-1?"pin1":"pin2"]}
        pcbX={sign*1.225} pcbY={0} width={.85} height={4.6} solderPasteMargin={0}/>
      <smtpad shape="rect" portHints={[sign===-1?"pin1":"pin2"]}
        pcbX={sign*1.7} pcbY={0} width={1.8} height={2.7} solderPasteMargin={0}/>
    </ReactFragment>)}
    <courtyardrect pcbX={0} pcbY={0} width={6.1} height={5.8}/>
    <silkscreenpath route={[{x:-2.85,y:2.7},{x:2.85,y:2.7}]}/>
    <silkscreenpath route={[{x:-2.85,y:-2.7},{x:2.85,y:-2.7}]}/>
  </footprint>
}

function footprintFor(node:ReactNode, name:string):ReactNode {
  if(!isValidElement<Props>(node))return node
  const p={...node.props}
  const type=typeof node.type==="string"?node.type:"fragment"
  const children=Children.toArray(p.children).map(n=>footprintFor(n,name))
  if(type!=="smtpad")return cloneElement(node as ReactElement<Props>,p,...children)
  const pin=(p.portHints as string[]|undefined)?.[0]
  if(name.startsWith("KEY_")) {
    // Core clamps width/height + 2*margin at zero and emits no aperture.
    // Keep these exposed for the conductive rubber membrane, without paste.
    p.solderPasteMargin=-Math.max(distance(p.width),distance(p.height))/2
  }
  if(name==="J_LCD" && pin && /^pin\d+$/.test(pin) && Number(pin.slice(3))<=54) {
    // Actual BOOMELE drawing: signal pads 0.30 +/-0.03 by 1.30mm.
    p.width=.30
  }
  if(name==="J_BAT") {
    // Hirose recommended PCB layout p3: 0.6x1.0 signal pads,
    // 0.7x1.8 anchors, 1.025mm from outer signal centre to anchor edge.
    // 5.45mm between signal lower edge and anchor lower edge => centres 5.05.
    p.solderPasteMargin=0 // Hirose p5: 0.1mm stencil, 100% aperture ratio.
    if(pin==="pin6" || pin==="pin7") {
      p.pcbX=pin==="pin6"?3.075:-3.075
      p.pcbY=2.7624786-5.05
      p.width=.7;p.height=1.8
    }
  }
  if(name==="U_KEYS" && (p.shape==="pill" || p.shape==="rotated_pill")) {
    // An axis-aligned capsule is the same copper as a rounded rectangle
    // with radius=min(width,height)/2. Core generates native rect-pad paste
    // but omits paste for rotated_pill (including bottom-side capsules).
    const angle=((distance(p.ccwRotation??p.pcbRotation??0)%360)+360)%360
    if(angle!==0)throw new Error("Unexpected U_KEYS input pad angle")
    p.shape="rect"
    p.cornerRadius=p.radius
    delete p.radius
    delete p.ccwRotation
  }
  return cloneElement(node as ReactElement<Props>,p,...children)
}

// Evaluate the existing pure JSX functions into a new editable source variant.
// The checked 233/275-component studies and their evidence stay unchanged.
export function harnessPlacement(node:ReactNode):ReactNode {
  if(!isValidElement<Props>(node))return node
  if(typeof node.type==="function")return harnessPlacement((node.type as (p:Props)=>ReactNode)(node.props))
  const p={...node.props},type=typeof node.type==="string"?node.type:"fragment"
  if(type==="trace" && p.name==="BATTERY_KELVIN_SENSE")p.to="J_BAT.pin1"
  if(p.name==="U_LCD_BL")p.pcbRotation=180
  if(p.name==="R_LCD_BL_SENSE"){p.pcbX=31;p.pcbY=8.5}
  if(type==="testpoint") {
    // Four host probes had unintentionally used the through-hole default.
    // Use their declared 2mm probe diameter; all remaining probes are 1.5mm.
    const radius=distance(p.padDiameter??1.5)/2
    p.footprintVariant="pad"
    p.footprint=<footprint><smtpad shape="circle" pcbX={0} pcbY={0} radius={radius}
      portHints={["pin1"]} solderPasteMargin={-radius}/>
      <courtyardcircle pcbX={0} pcbY={0} radius={radius+.25}/></footprint>
    p.doNotPlace=true
    if(["TP_BAT_INPUT","TP_BAT_NTC","TP_BAT_GND"].includes(p.name??""))p.pcbY=-38.5
    if(p.name==="TP_SPK_P"){p.pcbX=-6;p.pcbY=-55}
    if(p.name==="TP_SPK_N"){p.pcbX=6;p.pcbY=-55}
  } else if(p.footprint) {
    p.footprint=p.name==="L_LCD_BL"?backlightInductorFootprint():footprintFor(p.footprint as ReactNode,p.name??"")
  }
  return cloneElement(node as ReactElement<Props>,p,...Children.toArray(node.props.children).map(harnessPlacement))
}

export function Harnesses() {
  return <>
    <DF65_3P_1_7V_21_ name="J_BAT" pcbX={-17} pcbY={-26} layer="top" noConnect={["pin6","pin7"]}/>
    <HostPins name="J_BAT" pins={{pin1:"VBAT",pin2:"BAT_NTC",pin3:"GND"}}/>
    <SM02B_SRSS_TB_LF__SN_ name="J_SPK" pcbX={0} pcbY={-52} layer="top" noConnect={["pin3","pin4"]}/>
    <HostPins name="J_SPK" pins={{pin1:"SPK_P",pin2:"SPK_N"}}/>
  </>
}
