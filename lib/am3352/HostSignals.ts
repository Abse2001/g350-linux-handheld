import {pinLabels} from "../../imports/AM3352BZCZ100"
import cpu from "./cpu-ball-map.json"

// Resolve primary ZCZ ball functions to the individually verified import's
// numeric pins. Never rely on fuzzy aliases or a different AM335x package.
export const cpuSignalPin=(fn:string):keyof typeof pinLabels=>{
  const matches=Object.entries(pinLabels).filter(([,labels])=>
    (cpu.pins as Record<string,string>)[labels[0]]===fn)
  if(matches.length!==1)throw new Error(`Expected one AM3352 ZCZ terminal for ${fn}`)
  return matches[0][0] as keyof typeof pinLabels
}

// SPRUH73Q Table 26-7: 24 MHz, reserved fields zero, CLKOUT1 disabled,
// MMC0 -> SPI0 -> UART0 -> USB0. All 16 inputs have external termination.
// LCD_DATA is in VDDSHV6, which this design supplies from IO_3V3.
export const sysbootWord=0x4017
export const bootStraps=Array.from({length:16},(_,bit)=>({
  bit,pin:cpuSignalPin(`LCD_DATA${bit}`),net:`LCD_DATA${bit}`,
  high:Boolean(sysbootWord&(1<<bit)),
}))
