import {pinLabels as cpuLabels} from "../../imports/AM3352BZCZ100"
import {pinLabels as ramLabels} from "../../imports/MT41K256M16TW_107_P"
import cpu from "./cpu-ball-map.json"
import ram from "./ram-ball-map.json"
import type {PinAttributeMap} from "@tscircuit/props"

// ChipProps requires entries for every numeric pin and every alias when
// overriding pinAttributes. Give each alias its physical pin's attributes.
export const allPinAttributes=<L extends Record<string,readonly string[]>>(
  labels:L,selected:Record<string,PinAttributeMap>,
):Record<keyof L|L[keyof L][number],PinAttributeMap>=>
  Object.fromEntries(Object.entries(labels).flatMap(([pin,hints])=>
    [pin,...hints].map(hint=>[hint,selected[pin]??{}]))) as Record<keyof L|L[keyof L][number],PinAttributeMap>

// SLVU551I Figure 5/Table 5 and SPRS717L Tables 5-10, 5-13..15.
// Unused GPMC-only HV1..3 domains use 1.8V; LCD/MMC/control HV4..6 use
// 3.3V. A separate SD supply is required: no storage load on PMIC LDO4.
export const supplyRails=["VSYS","USB_5V","VBAT","VIO_BOOST5V","DDR_1V5",
  "VDD_MPU","VDD_CORE","VDDS_1V8","ANALOG_1V8","IO_3V3","LDO2_3V3"]
export const cpuNetForFunction=(fn:string):string|undefined=>{
  if(fn.startsWith("VSS")||fn==="RTC_KALDO_ENn"||
    /^(VDDA_ADC|VREFP|VREFN|AIN[0-7])$/.test(fn))return "GND"
  if(fn==="VPP")return undefined // GP functional operation: no connection, TI E2E 649479.
  if(fn==="VDDS_DDR")return "DDR_1V5"
  if(fn==="VDD_MPU"||fn==="VDD_MPU_MON")return "VDD_MPU"
  if(fn==="VDD_CORE")return "VDD_CORE"
  if(fn==="VDDS"||fn==="VDDS_RTC")return "VDDS_1V8"
  if(/^VDDSHV[1-3]$/.test(fn))return "ANALOG_1V8"
  if(/^VDDSHV[4-6]$/.test(fn)||/^VDDA3P3V_USB[01]$/.test(fn))return "IO_3V3"
  if(/^VDDS_(OSC|PLL_DDR|PLL_CORE_LCD|PLL_MPU|SRAM_CORE_BG|SRAM_MPU_BB)$/.test(fn)||
    /^VDDA1P8V_USB[01]$/.test(fn))return "ANALOG_1V8"
  if(fn.startsWith("CAP_"))return fn // Internal outputs: local capacitor only.
  if(fn==="DDR_VREF"||fn==="DDR_VTP")return fn
  if(/^VDD/.test(fn))throw new Error(`Unmapped CPU supply domain ${fn}`)
  return ({PMIC_POWER_EN:"PMIC_ENABLE",PWRONRSTn:"CPU_PORn",RTC_PWRONRSTn:"RTC_PORn",
    EXT_WAKEUP:"PMIC_WAKEUPn",EXTINTn:"PMIC_INTn",I2C0_SDA:"I2C0_SDA",I2C0_SCL:"I2C0_SCL"} as Record<string,string>)[fn]
}
export const cpuPowerConnections=Object.entries(cpuLabels).flatMap(([pin,labels])=>{
  const ball=labels[0],fn=(cpu.pins as Record<string,string>)[ball],net=cpuNetForFunction(fn)
  return net?[{pin,ball,function:fn,net}]:[]
})
export const ramPowerConnections=Object.entries(ramLabels).flatMap(([pin,labels])=>{
  const ball=labels[0],fn=(ram.pins as Record<string,string>)[ball]
  const net=fn.startsWith("VSS")?"GND":fn.startsWith("VDD")?"DDR_1V5":
    fn.startsWith("VREF")?"DDR_VREF":fn==="ZQ"?"DDR_ZQ":undefined
  return net?[{pin,ball,function:fn,net}]:[]
})
export const cpuPowerPinAttributes=allPinAttributes(cpuLabels,Object.fromEntries(cpuPowerConnections.filter(c=>
  c.function.startsWith("VSS")||/^VDD/.test(c.function)).map(c=>[c.pin,
    c.net==="GND"?{requiresGround:true}:{requiresPower:true}])))
export const ramPowerPinAttributes=allPinAttributes(ramLabels,Object.fromEntries(ramPowerConnections.filter(c=>
  /^VSS|^VDD/.test(c.function)).map(c=>[c.pin,c.net==="GND"?{requiresGround:true}:{requiresPower:true}])))
export const cpuNoConnect=Object.entries(cpuLabels).filter(([,labels])=>
  (cpu.pins as Record<string,string>)[labels[0]]==="VPP").map(([pin])=>pin as keyof typeof cpuLabels)
export const ramNoConnect=Object.entries(ramLabels).filter(([,labels])=>
  (ram.pins as Record<string,string>)[labels[0]]==="NC").map(([pin])=>pin as keyof typeof ramLabels)

// Pin numbers from SLVSB64I Table 1. The generic checklist's VIN_DCDC3
// pin29 is a typo; the actual input is pin32. VIO=1.8V follows the AM335x
// connection diagram, preserving 1.8V RTC reset logic.
export const pmicConnections:Record<string,string>={
  pin1:"LDO2_3V3",pin2:"VIO_BOOST5V",pin3:"VDDS_1V8",pin4:"VBAT",pin5:"VBAT",
  pin7:"VSYS",pin8:"VSYS",pin9:"PMIC_ENABLE",pin11:"BAT_NTC",pin12:"USB_5V",pin13:"PMIC_WAKEUPn",
  pin18:"VDDS_1V8",pin19:"DDR_1V5",pin20:"SW_DDR",pin21:"VSYS",pin22:"VSYS",pin23:"SW_MPU",pin24:"VDD_MPU",
  pin25:"PMIC_BUTTONn",pin26:"CPU_PORn",pin27:"I2C0_SDA",pin28:"I2C0_SCL",pin29:"VDD_CORE",pin30:"GND",pin31:"SW_CORE",
  pin32:"VSYS",pin39:"VSYS",pin40:"ANALOG_1V8",pin41:"GND",pin42:"VIO_BOOST5V",pin43:"IO_3V3",pin44:"PMIC_RESETn",
  pin45:"PMIC_INTn",pin46:"RTC_PORn",pin47:"PMIC_BYPASS",pin48:"PMIC_INT_LDO",pin49:"GND",
}

export type Bypass={name:string,net:string,value:"100nF"|"10nF"|"1uF"|"22uF",x:number,y:number,side:"top"|"bottom",purpose:string}
export const decouplers:Bypass[]=[]
const add=(name:string,net:string,value:Bypass["value"],x:number,y:number,side:Bypass["side"],purpose:string)=>
  decouplers.push({name,net,value,x,y,side,purpose})
const banks=[
  ["CORE","VDD_CORE",8],["MPU","VDD_MPU",5],["VDDS","VDDS_1V8",4],
  ["SRAM_CORE","ANALOG_1V8",1],["SRAM_MPU","ANALOG_1V8",1],
  ...Array.from({length:6},(_,i)=>[`HV${i+1}`,i<3?"ANALOG_1V8":"IO_3V3",i===5?6:2]),
] as [string,string,number][]
let smallIndex=0
banks.forEach(([name,net,count],i)=>{
  add(`C_${name}_BULK`,net,"22uF",-13-(i%3)*6,15-Math.floor(i/3)*3,"bottom",`${name} bulk bypass; TI minimum nominal 10uF`)
  for(let n=0;n<count;n++,smallIndex++)add(`C_${name}_${n+1}`,net,"10nF",
    -7+(smallIndex%7)*2.4,3+Math.floor(smallIndex/7)*1.8,"bottom",`${name} domain high-frequency bypass`)
})
for(const c of cpuPowerConnections.filter(c=>/^VDDS_(OSC|PLL_DDR|PLL_CORE_LCD|PLL_MPU|RTC)$|^VDDA[13]P[83]V_USB[01]$/.test(c.function))) {
  add(`C_${c.function}`,c.net,"10nF",-7+(smallIndex%7)*2.4,3+Math.floor(smallIndex/7)*1.8,"bottom",`${c.function} local bypass`)
  smallIndex++
}
for(const [i,fn] of ["CAP_VDD_SRAM_CORE","CAP_VDD_SRAM_MPU","CAP_VBB_MPU","CAP_VDD_RTC"].entries())
  add(`C_${fn}`,fn,"1uF",-5+i*2.4,1,"bottom",`${fn} stability; no external loads`)
for(const [chip,count] of [["CPU",20],["RAM",12]] as const) {
  // Reserve the signal dogbone corridors. Three CPU capacitors remain
  // beneath the package; the others sit to its left. RAM capacitors sit
  // outside both side edges, within the TI 150mil distance requirement.
  // The eighteenth CPU capacitor uses the upper row to stay within 400mil
  // of a DDR supply ball without crowding the three under-package parts.
  for(let i=0;i<count;i++)add(`C_DDR_${chip}_${i+1}`,"DDR_1V5","100nF",
    chip==="CPU"?(i<3?-5.7+i*2.4:i===17?-10.8:-8.4-((i-3)%3)*2.4):(i%2===0?-5.3:5.3),
    chip==="CPU"?(i<3?-1.5:i===17?.9:-.9-Math.floor((i-3)/3)*1.8):-22-Math.floor(i/2)*2,"bottom",
    `${chip} DDR high-speed bypass; placement/vias still require physical qualification`)
  for(let i=0;i<2;i++)add(`C_DDR_${chip}_BULK${i+1}`,"DDR_1V5","22uF",-11,
    (chip==="CPU"?-3:-25)-i*3,"top",`${chip} DDR bulk; two parts and >=20uF effective required`)
}
for(const [i,location] of ["CPU","RAM_CA","RAM_DQ"].entries())
  add(`C_VREF_${location}`,"DDR_VREF","100nF",i===0?1.4:0,i===0?-2:i===1?-29.8:-26.6,"bottom",`${location} VREF local bypass`)

// Conservative domain maxima from SPRS717L Table 5-10, not a complete
// handheld load/thermal budget. Analog ADC is unused and grounded.
export const cpuRailBudget=[
  {rail:"VDDS_1V8",domains:{VDDS:50,VDDS_RTC:5},cpuMaxMa:55,pmicLimitMa:100},
  {rail:"ANALOG_1V8",domains:{VDDSHV1:50,VDDSHV2:50,VDDSHV3:50,SRAM_CORE:10,SRAM_MPU:10,PLL_DDR:10,PLL_CORE_LCD:20,PLL_MPU:10,OSC:5,USB0_1V8:25,USB1_1V8:25},cpuMaxMa:265,pmicLimitMa:400},
  {rail:"IO_3V3",domains:{VDDSHV4:50,VDDSHV5:50,VDDSHV6:100,USB0_3V3:40,USB1_3V3:40},cpuMaxMa:280,pmicLimitMa:400},
  {rail:"VDD_CORE",domains:{VDD_CORE:400},cpuMaxMa:400,pmicLimitMa:1200},
  {rail:"VDD_MPU",domains:{VDD_MPU_NITRO_1GHZ:1000},cpuMaxMa:1000,pmicLimitMa:1200},
  {rail:"DDR_1V5",domains:{VDDS_DDR:250},cpuMaxMa:250,pmicLimitMa:1200},
]
