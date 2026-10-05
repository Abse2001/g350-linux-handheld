import {Children,cloneElement,Fragment,isValidElement,type ReactElement,type ReactNode} from 'react'
import {SN74LVC1G125DBVR} from '../../../imports/SN74LVC1G125DBVR'
import {A_0402WGF3302TCE} from '../../../imports/A_0402WGF3302TCE'
import {CL05B104KO5NNNC} from '../../../imports/CL05B104KO5NNNC'
import {cpuSignalPin} from '../HostSignals'

type Props=Record<string,unknown>&{children?:ReactNode;name?:string}

// The frozen earlier study accidentally merged SD_CD with LCD_BL_PWM at C18.
// Preserve SD_CD/C18. U14/GPMC_A2 supplies eHRPWM1A in mode6, on VDDSHV3=1.8V.
// Apply only this pin change and the buffered CTRL connection in editable JSX.
export function backlightPinAllocation(node:ReactNode):ReactNode {
 if(!isValidElement<Props>(node))return node
 if(typeof node.type==='function')return backlightPinAllocation((node.type as (p:Props)=>ReactNode)(node.props))
 const p={...node.props}
 if(node.type==='trace'&&p.to==='net.LCD_BL_PWM'){
  if(p.from===`U_SOC.${cpuSignalPin('ECAP0_IN_PWM0_OUT')}`){
   p.from=`U_SOC.${cpuSignalPin('GPMC_A2')}`
   p.name='LCD_BACKLIGHT_EHRPWM1A_U14'
  } else if(p.from==='U_LCD_BL.CTRL'){
   p.to='net.LCD_BL_CTRL'
   p.name='LCD_BACKLIGHT_BUFFERED_CTRL'
  }
 }
 if(node.type==='resistor'&&p.name==='R_LCD_BL_PD'){
  // The 0402 lands are unchanged. 33k holds the buffer input below VIL
  // even with 8uA CPU leakage plus 5uA buffer-input leakage during reset.
  p.resistance='33kohm'
  p.manufacturerPartNumber='0402WGF3302TCE'
  p.supplierPartNumbers={jlcpcb:['C25779']}
 }
 return cloneElement(node as ReactElement<Props>,p,...Children.toArray(node.props.children).map(backlightPinAllocation))
}

// TI DBV0005A (4214839/K, 08/2024), recommended PCB land pattern.
// Rotate the drawing 90 degrees CCW to preserve the supplier's pin1 location.
// 0.6x1.1mm lands, 0.95mm lead pitch, 2.6mm pad-row spacing.
function bufferFootprint(){
 const pads=[{pin:1,x:-.95,y:-1.3},{pin:2,x:0,y:-1.3},{pin:3,x:.95,y:-1.3},
  {pin:4,x:.95,y:1.3},{pin:5,x:-.95,y:1.3}]
 return <footprint>
  {pads.map(p=><Fragment key={p.pin}><smtpad shape="rect" portHints={[`pin${p.pin}`]}
    pcbX={p.x} pcbY={p.y} width={.6} height={1.1}/></Fragment>)}
  <courtyardrect pcbX={0} pcbY={0} width={3.4} height={4.2}/>
  <silkscreenpath route={[{x:-1.55,y:-.7},{x:-1.55,y:.7}]}/>
  <silkscreenpath route={[{x:1.55,y:-.7},{x:1.55,y:.7}]}/>
  <silkscreencircle pcbX={-1.5} pcbY={-1.3} radius={.1}/>
 </footprint>
}

const Pins=({name,pins}:{name:string;pins:Record<string,string>})=><>
 {Object.entries(pins).map(([pin,net])=><trace key={pin} name={`${name}_${pin}_${net}`}
  from={`${name}.${pin}`} to={`net.${net}`} thickness={.2} routingPhaseIndex={10}/>)}
</>

export function BufferedBacklight(){return <>
 {/* Always enabled, non-inverting. The revised 33k PWM-input pulldown
     and U14's reset pulldown hold A low. 33k on Y keeps CTRL low with the
     buffer unpowered (10uA worst-case Ioff). Shared 1.8V supply is deliberate:
     CPU VOL<=.45V is valid at this buffer input, while Y VOL<=.1V at <=100uA
     meets TPS61165 VIL<=.4V; Y VOH>=VCC-.1V meets VIH>=1.2V. */}
 <SN74LVC1G125DBVR name="U_LCD_PWM_BUF" pcbX={27} pcbY={5} layer="bottom" footprint={bufferFootprint()}/>
 <Pins name="U_LCD_PWM_BUF" pins={{pin1:'GND',pin2:'LCD_BL_PWM',pin3:'GND',pin4:'LCD_BL_CTRL',pin5:'ANALOG_1V8'}}/>
 <CL05B104KO5NNNC name="C_LCD_PWM_BUF" pcbX={27.95} pcbY={8.1} layer="bottom"/>
 <Pins name="C_LCD_PWM_BUF" pins={{pin1:'ANALOG_1V8',pin2:'GND'}}/>
 <A_0402WGF3302TCE name="R_LCD_CTRL_PD" pcbX={30.5} pcbY={5} layer="bottom"/>
 <Pins name="R_LCD_CTRL_PD" pins={{pin1:'LCD_BL_CTRL',pin2:'GND'}}/>
</>}
