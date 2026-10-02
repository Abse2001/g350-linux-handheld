import type { ChipProps } from "@tscircuit/props"

export const pinLabels = {
  pin1: ["A1","VSS1"],
  pin2: ["B1","DDR_A5"],
  pin3: ["C1","DDR_A9"],
  pin4: ["D1","DDR_CKn"],
  pin5: ["E1","DDR_BA1"],
  pin6: ["F1","DDR_CASn"],
  pin7: ["G1","DDR_ODT"],
  pin8: ["H1","DDR_A1"],
  pin9: ["J1","DDR_D8"],
  pin10: ["K1","DDR_D9"],
  pin11: ["L1","DDR_DQS1"],
  pin12: ["M1","DDR_D15"],
  pin13: ["N1","DDR_D2"],
  pin14: ["P1","DDR_DQS0"],
  pin15: ["R1","LCD_DATA0"],
  pin16: ["T1","LCD_DATA4"],
  pin17: ["U1","LCD_DATA8"],
  pin18: ["V1","VSS2"],
  pin19: ["A2","VDD_MPU_MON"],
  pin20: ["B2","DDR_WEn"],
  pin21: ["C2","DDR_A4"],
  pin22: ["D2","DDR_CK"],
  pin23: ["E2","DDR_A7"],
  pin24: ["F2","DDR_A11"],
  pin25: ["G2","DDR_RESETn"],
  pin26: ["H2","DDR_CSn0"],
  pin27: ["J2","DDR_DQM1"],
  pin28: ["K2","DDR_D10"],
  pin29: ["L2","DDR_DQSn1"],
  pin30: ["M2","DDR_DQM0"],
  pin31: ["N2","DDR_D3"],
  pin32: ["P2","DDR_DQSn0"],
  pin33: ["R2","LCD_DATA1"],
  pin34: ["T2","LCD_DATA5"],
  pin35: ["U2","LCD_DATA9"],
  pin36: ["V2","LCD_DATA12"],
  pin37: ["A3","RESERVED"],
  pin38: ["B3","DDR_BA2"],
  pin39: ["C3","DDR_A3"],
  pin40: ["D3","DDR_A15"],
  pin41: ["E3","DDR_A12"],
  pin42: ["F3","DDR_A0"],
  pin43: ["G3","DDR_CKE"],
  pin44: ["H3","DDR_A13"],
  pin45: ["J3","DDR_VTP"],
  pin46: ["K3","DDR_D11"],
  pin47: ["L3","DDR_D13"],
  pin48: ["M3","DDR_D0"],
  pin49: ["N3","DDR_D4"],
  pin50: ["P3","DDR_D6"],
  pin51: ["R3","LCD_DATA2"],
  pin52: ["T3","LCD_DATA6"],
  pin53: ["U3","LCD_DATA10"],
  pin54: ["V3","LCD_DATA13"],
  pin55: ["A4","RTC_XTALOUT"],
  pin56: ["B4","RTC_KALDO_ENn"],
  pin57: ["C4","DDR_BA0"],
  pin58: ["D4","DDR_A8"],
  pin59: ["E4","DDR_A2"],
  pin60: ["F4","DDR_A10"],
  pin61: ["G4","DDR_RASn"],
  pin62: ["H4","DDR_A14"],
  pin63: ["J4","DDR_VREF"],
  pin64: ["K4","DDR_D12"],
  pin65: ["L4","DDR_D14"],
  pin66: ["M4","DDR_D1"],
  pin67: ["N4","DDR_D5"],
  pin68: ["P4","DDR_D7"],
  pin69: ["R4","LCD_DATA3"],
  pin70: ["T4","LCD_DATA7"],
  pin71: ["U4","LCD_DATA11"],
  pin72: ["V4","LCD_DATA14"],
  pin73: ["A5","VSS_RTC"],
  pin74: ["B5","RTC_PWRONRSTn"],
  pin75: ["C5","EXT_WAKEUP"],
  pin76: ["D5","DDR_A6"],
  pin77: ["E5","VDDS_DDR1"],
  pin78: ["F5","VDDS_DDR2"],
  pin79: ["G5","VDDS_DDR3"],
  pin80: ["H5","VDDS_DDR4"],
  pin81: ["J5","VDDS_DDR5"],
  pin82: ["K5","VDDS_DDR6"],
  pin83: ["L5","VDDS_DDR7"],
  pin84: ["M5","VPP"],
  pin85: ["N5","VDDSHV61"],
  pin86: ["P5","VDDSHV62"],
  pin87: ["R5","LCD_HSYNC"],
  pin88: ["T5","LCD_DATA15"],
  pin89: ["U5","LCD_VSYNC"],
  pin90: ["V5","LCD_PCLK"],
  pin91: ["A6","RTC_XTALIN"],
  pin92: ["B6","AIN0"],
  pin93: ["C6","PMIC_POWER_EN"],
  pin94: ["D6","CAP_VDD_RTC"],
  pin95: ["E6","VDDS1"],
  pin96: ["F6","VDD_CORE1"],
  pin97: ["G6","VDD_CORE2"],
  pin98: ["H6","VSS3"],
  pin99: ["J6","VSS4"],
  pin100: ["K6","VDD_CORE3"],
  pin101: ["L6","VDD_CORE4"],
  pin102: ["M6","VSS5"],
  pin103: ["N6","VDDS2"],
  pin104: ["P6","VDDSHV63"],
  pin105: ["R6","LCD_AC_BIAS_EN"],
  pin106: ["T6","GPMC_BEn0_CLE"],
  pin107: ["U6","GPMC_WEn"],
  pin108: ["V6","GPMC_CSn0"],
  pin109: ["A7","AIN3"],
  pin110: ["B7","AIN2"],
  pin111: ["C7","AIN1"],
  pin112: ["D7","VDDS_RTC"],
  pin113: ["E7","VDDS_PLL_DDR"],
  pin114: ["F7","VDD_CORE5"],
  pin115: ["G7","VDD_CORE6"],
  pin116: ["H7","VSS6"],
  pin117: ["J7","VSS7"],
  pin118: ["K7","VSS8"],
  pin119: ["L7","VDD_CORE7"],
  pin120: ["M7","VSS9"],
  pin121: ["N7","VSS10"],
  pin122: ["P7","VDDSHV11"],
  pin123: ["R7","GPMC_ADVn_ALE"],
  pin124: ["T7","GPMC_OEn_REn"],
  pin125: ["U7","GPMC_AD0"],
  pin126: ["V7","GPMC_AD1"],
  pin127: ["A8","AIN6"],
  pin128: ["B8","AIN5"],
  pin129: ["C8","AIN4"],
  pin130: ["D8","VDDA_ADC"],
  pin131: ["E8","VSSA_ADC"],
  pin132: ["F8","VSS11"],
  pin133: ["G8","VSS12"],
  pin134: ["H8","VSS13"],
  pin135: ["J8","VSS14"],
  pin136: ["K8","VDD_CORE8"],
  pin137: ["L8","VDD_CORE9"],
  pin138: ["M8","VSS15"],
  pin139: ["N8","VDD_CORE10"],
  pin140: ["P8","VDDSHV12"],
  pin141: ["R8","GPMC_AD2"],
  pin142: ["T8","GPMC_AD3"],
  pin143: ["U8","GPMC_AD4"],
  pin144: ["V8","GPMC_AD5"],
  pin145: ["A9","VREFN"],
  pin146: ["B9","VREFP"],
  pin147: ["C9","AIN7"],
  pin148: ["D9","CAP_VDD_SRAM_CORE"],
  pin149: ["E9","VDDS_SRAM_CORE_BG"],
  pin150: ["F9","VDDS3"],
  pin151: ["G9","VSS16"],
  pin152: ["H9","VSS17"],
  pin153: ["J9","VSS18"],
  pin154: ["K9","VSS19"],
  pin155: ["L9","VDD_CORE11"],
  pin156: ["M9","VSS20"],
  pin157: ["N9","VDD_CORE12"],
  pin158: ["P9","VDDS4"],
  pin159: ["R9","GPMC_AD6"],
  pin160: ["T9","GPMC_AD7"],
  pin161: ["U9","GPMC_CSn1"],
  pin162: ["V9","GPMC_CSn2"],
  pin163: ["A10","WARMRSTn"],
  pin164: ["B10","TRSTn"],
  pin165: ["C10","CAP_VBB_MPU"],
  pin166: ["D10","VDDS_SRAM_MPU_BB"],
  pin167: ["E10","VDDSHV64"],
  pin168: ["F10","VDD_MPU1"],
  pin169: ["G10","VDD_CORE13"],
  pin170: ["H10","VSS21"],
  pin171: ["J10","VSS22"],
  pin172: ["K10","VSS23"],
  pin173: ["L10","VSS24"],
  pin174: ["M10","VSS25"],
  pin175: ["N10","VSS26"],
  pin176: ["P10","VDDSHV21"],
  pin177: ["R10","VDDS_PLL_CORE_LCD"],
  pin178: ["T10","GPMC_AD9"],
  pin179: ["U10","GPMC_AD8"],
  pin180: ["V10","XTALIN"],
  pin181: ["A11","TDO"],
  pin182: ["B11","TDI"],
  pin183: ["C11","TMS"],
  pin184: ["D11","CAP_VDD_SRAM_MPU"],
  pin185: ["E11","VDDSHV65"],
  pin186: ["F11","VDD_MPU2"],
  pin187: ["G11","VSS27"],
  pin188: ["H11","VDD_CORE14"],
  pin189: ["J11","VSS28"],
  pin190: ["K11","VSS29"],
  pin191: ["L11","VSS30"],
  pin192: ["M11","VDD_CORE15"],
  pin193: ["N11","VSS31"],
  pin194: ["P11","VDDSHV22"],
  pin195: ["R11","VDDS_OSC"],
  pin196: ["T11","GPMC_AD10"],
  pin197: ["U11","XTALOUT"],
  pin198: ["V11","VSS_OSC"],
  pin199: ["A12","TCK"],
  pin200: ["B12","MCASP0_ACLKR"],
  pin201: ["C12","MCASP0_AHCLKR"],
  pin202: ["D12","MCASP0_AXR0"],
  pin203: ["E12","VDDSHV66"],
  pin204: ["F12","VDD_MPU3"],
  pin205: ["G12","VSS32"],
  pin206: ["H12","VSS33"],
  pin207: ["J12","VDD_CORE16"],
  pin208: ["K12","VDD_CORE17"],
  pin209: ["L12","VSS34"],
  pin210: ["M12","VSS35"],
  pin211: ["N12","VDD_CORE18"],
  pin212: ["P12","VDDSHV31"],
  pin213: ["R12","GPMC_AD13"],
  pin214: ["T12","GPMC_AD12"],
  pin215: ["U12","GPMC_AD11"],
  pin216: ["V12","GPMC_CLK"],
  pin217: ["A13","MCASP0_ACLKX"],
  pin218: ["B13","MCASP0_FSX"],
  pin219: ["C13","MCASP0_FSR"],
  pin220: ["D13","MCASP0_AXR1"],
  pin221: ["E13","VDDSHV67"],
  pin222: ["F13","VDD_MPU4"],
  pin223: ["G13","VDD_MPU5"],
  pin224: ["H13","VDD_MPU6"],
  pin225: ["J13","VDD_MPU7"],
  pin226: ["K13","VDDS5"],
  pin227: ["L13","VSS36"],
  pin228: ["M13","VDD_CORE19"],
  pin229: ["N13","VDD_CORE20"],
  pin230: ["P13","VDDSHV32"],
  pin231: ["R13","GPMC_A0"],
  pin232: ["T13","GPMC_CSn3"],
  pin233: ["U13","GPMC_AD15"],
  pin234: ["V13","GPMC_AD14"],
  pin235: ["A14","MCASP0_AHCLKX"],
  pin236: ["B14","EMU1"],
  pin237: ["C14","EMU0"],
  pin238: ["D14","XDMA_EVENT_INTR1"],
  pin239: ["E14","VDDS6"],
  pin240: ["F14","VDDSHV68"],
  pin241: ["G14","VDDSHV69"],
  pin242: ["H14","VDDSHV41"],
  pin243: ["J14","VDDSHV42"],
  pin244: ["K14","VDDSHV51"],
  pin245: ["L14","VDDSHV52"],
  pin246: ["M14","VSSA_USB1"],
  pin247: ["N14","VSSA_USB2"],
  pin248: ["P14","VDDS7"],
  pin249: ["R14","GPMC_A4"],
  pin250: ["T14","GPMC_A3"],
  pin251: ["U14","GPMC_A2"],
  pin252: ["V14","GPMC_A1"],
  pin253: ["A15","XDMA_EVENT_INTR0"],
  pin254: ["B15","PWRONRSTn"],
  pin255: ["C15","SPI0_CS1"],
  pin256: ["D15","UART1_TXD"],
  pin257: ["E15","UART0_RXD"],
  pin258: ["F15","USB1_DRVVBUS"],
  pin259: ["G15","MMC0_DAT1"],
  pin260: ["H15","VDDS_PLL_MPU"],
  pin261: ["J15","MII1_RX_ER"],
  pin262: ["K15","MII1_TXD2"],
  pin263: ["L15","MII1_RXD1"],
  pin264: ["M15","USB0_CE"],
  pin265: ["N15","VDDA3P3V_USB0"],
  pin266: ["P15","USB0_VBUS"],
  pin267: ["R15","VDDA3P3V_USB1"],
  pin268: ["T15","GPMC_A7"],
  pin269: ["U15","GPMC_A6"],
  pin270: ["V15","GPMC_A5"],
  pin271: ["A16","SPI0_CS0"],
  pin272: ["B16","SPI0_D1"],
  pin273: ["C16","I2C0_SCL"],
  pin274: ["D16","UART1_RXD"],
  pin275: ["E16","UART0_TXD"],
  pin276: ["F16","USB0_DRVVBUS"],
  pin277: ["G16","MMC0_DAT0"],
  pin278: ["H16","MII1_COL"],
  pin279: ["J16","MII1_TX_EN"],
  pin280: ["K16","MII1_TXD1"],
  pin281: ["L16","MII1_RXD2"],
  pin282: ["M16","MII1_RXD0"],
  pin283: ["N16","VDDA1P8V_USB0"],
  pin284: ["P16","USB0_ID"],
  pin285: ["R16","VDDA1P8V_USB1"],
  pin286: ["T16","GPMC_A10"],
  pin287: ["U16","GPMC_A9"],
  pin288: ["V16","GPMC_A8"],
  pin289: ["A17","SPI0_SCLK"],
  pin290: ["B17","SPI0_D0"],
  pin291: ["C17","I2C0_SDA"],
  pin292: ["D17","UART1_RTSn"],
  pin293: ["E17","UART0_RTSn"],
  pin294: ["F17","MMC0_DAT3"],
  pin295: ["G17","MMC0_CLK"],
  pin296: ["H17","MII1_CRS"],
  pin297: ["J17","MII1_RX_DV"],
  pin298: ["K17","MII1_TXD0"],
  pin299: ["L17","MII1_RXD3"],
  pin300: ["M17","MDIO"],
  pin301: ["N17","USB0_DP"],
  pin302: ["P17","USB1_ID"],
  pin303: ["R17","USB1_DP"],
  pin304: ["T17","GPMC_WAIT0"],
  pin305: ["U17","GPMC_WPn"],
  pin306: ["V17","GPMC_A11"],
  pin307: ["A18","VSS37"],
  pin308: ["B18","EXTINTn"],
  pin309: ["C18","ECAP0_IN_PWM0_OUT"],
  pin310: ["D18","UART1_CTSn"],
  pin311: ["E18","UART0_CTSn"],
  pin312: ["F18","MMC0_DAT2"],
  pin313: ["G18","MMC0_CMD"],
  pin314: ["H18","RMII1_REF_CLK"],
  pin315: ["J18","MII1_TXD3"],
  pin316: ["K18","MII1_TX_CLK"],
  pin317: ["L18","MII1_RX_CLK"],
  pin318: ["M18","MDC"],
  pin319: ["N18","USB0_DM"],
  pin320: ["P18","USB1_CE"],
  pin321: ["R18","USB1_DM"],
  pin322: ["T18","USB1_VBUS"],
  pin323: ["U18","GPMC_BEn1"],
  pin324: ["V18","VSS38"]
} as const

export const AM3352BZCZ100 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C468247"
  ]
}}
      manufacturerPartNumber="AM3352BZCZ100"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-6.8mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin2"]} pcbX="-6mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin3"]} pcbX="-5.2mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin4"]} pcbX="-4.4mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin5"]} pcbX="-3.6mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin6"]} pcbX="-2.8mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin7"]} pcbX="-2mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin8"]} pcbX="-1.2mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin9"]} pcbX="-0.4mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin10"]} pcbX="0.4mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin11"]} pcbX="1.2mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin12"]} pcbX="2mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin13"]} pcbX="2.8mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin14"]} pcbX="3.6mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin15"]} pcbX="4.4mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin16"]} pcbX="5.2mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin17"]} pcbX="6mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin18"]} pcbX="6.8mm" pcbY="-6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin19"]} pcbX="-6.8mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin20"]} pcbX="-6mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin21"]} pcbX="-5.2mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin22"]} pcbX="-4.4mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin23"]} pcbX="-3.6mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin24"]} pcbX="-2.8mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin25"]} pcbX="-2mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin26"]} pcbX="-1.2mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin27"]} pcbX="-0.4mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin28"]} pcbX="0.4mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin29"]} pcbX="1.2mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin30"]} pcbX="2mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin31"]} pcbX="2.8mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin32"]} pcbX="3.6mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin33"]} pcbX="4.4mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin34"]} pcbX="5.2mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin35"]} pcbX="6mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin36"]} pcbX="6.8mm" pcbY="-6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin37"]} pcbX="-6.8mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin38"]} pcbX="-6mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin39"]} pcbX="-5.2mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin40"]} pcbX="-4.4mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin41"]} pcbX="-3.6mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin42"]} pcbX="-2.8mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin43"]} pcbX="-2mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin44"]} pcbX="-1.2mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin45"]} pcbX="-0.4mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin46"]} pcbX="0.4mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin47"]} pcbX="1.2mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin48"]} pcbX="2mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin49"]} pcbX="2.8mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin50"]} pcbX="3.6mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin51"]} pcbX="4.4mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin52"]} pcbX="5.2mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin53"]} pcbX="6mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin54"]} pcbX="6.8mm" pcbY="-5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin55"]} pcbX="-6.8mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin56"]} pcbX="-6mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin57"]} pcbX="-5.2mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin58"]} pcbX="-4.4mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin59"]} pcbX="-3.6mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin60"]} pcbX="-2.8mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin61"]} pcbX="-2mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin62"]} pcbX="-1.2mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin63"]} pcbX="-0.4mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin64"]} pcbX="0.4mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin65"]} pcbX="1.2mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin66"]} pcbX="2mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin67"]} pcbX="2.8mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin68"]} pcbX="3.6mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin69"]} pcbX="4.4mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin70"]} pcbX="5.2mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin71"]} pcbX="6mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin72"]} pcbX="6.8mm" pcbY="-4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin73"]} pcbX="-6.8mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin74"]} pcbX="-6mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin75"]} pcbX="-5.2mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin76"]} pcbX="-4.4mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin77"]} pcbX="-3.6mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin78"]} pcbX="-2.8mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin79"]} pcbX="-2mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin80"]} pcbX="-1.2mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin81"]} pcbX="-0.4mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin82"]} pcbX="0.4mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin83"]} pcbX="1.2mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin84"]} pcbX="2mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin85"]} pcbX="2.8mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin86"]} pcbX="3.6mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin87"]} pcbX="4.4mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin88"]} pcbX="5.2mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin89"]} pcbX="6mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin90"]} pcbX="6.8mm" pcbY="-3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin91"]} pcbX="-6.8mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin92"]} pcbX="-6mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin93"]} pcbX="-5.2mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin94"]} pcbX="-4.4mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin95"]} pcbX="-3.6mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin96"]} pcbX="-2.8mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin97"]} pcbX="-2mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin98"]} pcbX="-1.2mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin99"]} pcbX="-0.4mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin100"]} pcbX="0.4mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin101"]} pcbX="1.2mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin102"]} pcbX="2mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin103"]} pcbX="2.8mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin104"]} pcbX="3.6mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin105"]} pcbX="4.4mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin106"]} pcbX="5.2mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin107"]} pcbX="6mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin108"]} pcbX="6.8mm" pcbY="-2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin109"]} pcbX="-6.8mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin110"]} pcbX="-6mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin111"]} pcbX="-5.2mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin112"]} pcbX="-4.4mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin113"]} pcbX="-3.6mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin114"]} pcbX="-2.8mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin115"]} pcbX="-2mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin116"]} pcbX="-1.2mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin117"]} pcbX="-0.4mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin118"]} pcbX="0.4mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin119"]} pcbX="1.2mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin120"]} pcbX="2mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin121"]} pcbX="2.8mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin122"]} pcbX="3.6mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin123"]} pcbX="4.4mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin124"]} pcbX="5.2mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin125"]} pcbX="6mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin126"]} pcbX="6.8mm" pcbY="-2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin127"]} pcbX="-6.8mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin128"]} pcbX="-6mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin129"]} pcbX="-5.2mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin130"]} pcbX="-4.4mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin131"]} pcbX="-3.6mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin132"]} pcbX="-2.8mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin133"]} pcbX="-2mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin134"]} pcbX="-1.2mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin135"]} pcbX="-0.4mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin136"]} pcbX="0.4mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin137"]} pcbX="1.2mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin138"]} pcbX="2mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin139"]} pcbX="2.8mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin140"]} pcbX="3.6mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin141"]} pcbX="4.4mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin142"]} pcbX="5.2mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin143"]} pcbX="6mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin144"]} pcbX="6.8mm" pcbY="-1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin145"]} pcbX="-6.8mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin146"]} pcbX="-6mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin147"]} pcbX="-5.2mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin148"]} pcbX="-4.4mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin149"]} pcbX="-3.6mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin150"]} pcbX="-2.8mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin151"]} pcbX="-2mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin152"]} pcbX="-1.2mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin153"]} pcbX="-0.4mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin154"]} pcbX="0.4mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin155"]} pcbX="1.2mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin156"]} pcbX="2mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin157"]} pcbX="2.8mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin158"]} pcbX="3.6mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin159"]} pcbX="4.4mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin160"]} pcbX="5.2mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin161"]} pcbX="6mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin162"]} pcbX="6.8mm" pcbY="-0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin163"]} pcbX="-6.8mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin164"]} pcbX="-6mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin165"]} pcbX="-5.2mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin166"]} pcbX="-4.4mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin167"]} pcbX="-3.6mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin168"]} pcbX="-2.8mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin169"]} pcbX="-2mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin170"]} pcbX="-1.2mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin171"]} pcbX="-0.4mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin172"]} pcbX="0.4mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin173"]} pcbX="1.2mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin174"]} pcbX="2mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin175"]} pcbX="2.8mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin176"]} pcbX="3.6mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin177"]} pcbX="4.4mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin178"]} pcbX="5.2mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin179"]} pcbX="6mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin180"]} pcbX="6.8mm" pcbY="0.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin181"]} pcbX="-6.8mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin182"]} pcbX="-6mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin183"]} pcbX="-5.2mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin184"]} pcbX="-4.4mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin185"]} pcbX="-3.6mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin186"]} pcbX="-2.8mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin187"]} pcbX="-2mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin188"]} pcbX="-1.2mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin189"]} pcbX="-0.4mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin190"]} pcbX="0.4mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin191"]} pcbX="1.2mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin192"]} pcbX="2mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin193"]} pcbX="2.8mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin194"]} pcbX="3.6mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin195"]} pcbX="4.4mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin196"]} pcbX="5.2mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin197"]} pcbX="6mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin198"]} pcbX="6.8mm" pcbY="1.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin199"]} pcbX="-6.8mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin200"]} pcbX="-6mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin201"]} pcbX="-5.2mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin202"]} pcbX="-4.4mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin203"]} pcbX="-3.6mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin204"]} pcbX="-2.8mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin205"]} pcbX="-2mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin206"]} pcbX="-1.2mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin207"]} pcbX="-0.4mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin208"]} pcbX="0.4mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin209"]} pcbX="1.2mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin210"]} pcbX="2mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin211"]} pcbX="2.8mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin212"]} pcbX="3.6mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin213"]} pcbX="4.4mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin214"]} pcbX="5.2mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin215"]} pcbX="6mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin216"]} pcbX="6.8mm" pcbY="2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin217"]} pcbX="-6.8mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin218"]} pcbX="-6mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin219"]} pcbX="-5.2mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin220"]} pcbX="-4.4mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin221"]} pcbX="-3.6mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin222"]} pcbX="-2.8mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin223"]} pcbX="-2mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin224"]} pcbX="-1.2mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin225"]} pcbX="-0.4mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin226"]} pcbX="0.4mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin227"]} pcbX="1.2mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin228"]} pcbX="2mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin229"]} pcbX="2.8mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin230"]} pcbX="3.6mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin231"]} pcbX="4.4mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin232"]} pcbX="5.2mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin233"]} pcbX="6mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin234"]} pcbX="6.8mm" pcbY="2.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin235"]} pcbX="-6.8mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin236"]} pcbX="-6mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin237"]} pcbX="-5.2mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin238"]} pcbX="-4.4mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin239"]} pcbX="-3.6mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin240"]} pcbX="-2.8mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin241"]} pcbX="-2mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin242"]} pcbX="-1.2mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin243"]} pcbX="-0.4mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin244"]} pcbX="0.4mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin245"]} pcbX="1.2mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin246"]} pcbX="2mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin247"]} pcbX="2.8mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin248"]} pcbX="3.6mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin249"]} pcbX="4.4mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin250"]} pcbX="5.2mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin251"]} pcbX="6mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin252"]} pcbX="6.8mm" pcbY="3.6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin253"]} pcbX="-6.8mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin254"]} pcbX="-6mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin255"]} pcbX="-5.2mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin256"]} pcbX="-4.4mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin257"]} pcbX="-3.6mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin258"]} pcbX="-2.8mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin259"]} pcbX="-2mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin260"]} pcbX="-1.2mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin261"]} pcbX="-0.4mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin262"]} pcbX="0.4mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin263"]} pcbX="1.2mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin264"]} pcbX="2mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin265"]} pcbX="2.8mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin266"]} pcbX="3.6mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin267"]} pcbX="4.4mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin268"]} pcbX="5.2mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin269"]} pcbX="6mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin270"]} pcbX="6.8mm" pcbY="4.4mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin271"]} pcbX="-6.8mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin272"]} pcbX="-6mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin273"]} pcbX="-5.2mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin274"]} pcbX="-4.4mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin275"]} pcbX="-3.6mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin276"]} pcbX="-2.8mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin277"]} pcbX="-2mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin278"]} pcbX="-1.2mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin279"]} pcbX="-0.4mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin280"]} pcbX="0.4mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin281"]} pcbX="1.2mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin282"]} pcbX="2mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin283"]} pcbX="2.8mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin284"]} pcbX="3.6mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin285"]} pcbX="4.4mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin286"]} pcbX="5.2mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin287"]} pcbX="6mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin288"]} pcbX="6.8mm" pcbY="5.2mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin289"]} pcbX="-6.8mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin290"]} pcbX="-6mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin291"]} pcbX="-5.2mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin292"]} pcbX="-4.4mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin293"]} pcbX="-3.6mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin294"]} pcbX="-2.8mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin295"]} pcbX="-2mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin296"]} pcbX="-1.2mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin297"]} pcbX="-0.4mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin298"]} pcbX="0.4mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin299"]} pcbX="1.2mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin300"]} pcbX="2mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin301"]} pcbX="2.8mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin302"]} pcbX="3.6mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin303"]} pcbX="4.4mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin304"]} pcbX="5.2mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin305"]} pcbX="6mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin306"]} pcbX="6.8mm" pcbY="6mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin307"]} pcbX="-6.8mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin308"]} pcbX="-6mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin309"]} pcbX="-5.2mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin310"]} pcbX="-4.4mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin311"]} pcbX="-3.6mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin312"]} pcbX="-2.8mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin313"]} pcbX="-2mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin314"]} pcbX="-1.2mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin315"]} pcbX="-0.4mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin316"]} pcbX="0.4mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin317"]} pcbX="1.2mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin318"]} pcbX="2mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin319"]} pcbX="2.8mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin320"]} pcbX="3.6mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin321"]} pcbX="4.4mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin322"]} pcbX="5.2mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin323"]} pcbX="6mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<smtpad portHints={["pin324"]} pcbX="6.8mm" pcbY="6.8mm" radius="0.2mm" shape="circle" />
<silkscreenpath route={[{"x":-7.792339000000084,"y":-7.026148000000148},{"x":-7.792339000000084,"y":-7.804759600000125},{"x":-7.013778200000161,"y":-7.804759600000125}]} />
<silkscreenpath route={[{"x":-7.563764400000196,"y":-7.576185000000123},{"x":-7.563764400000196,"y":7.5762357999999494},{"x":7.563611999999921,"y":7.5762357999999494},{"x":7.563611999999921,"y":-7.576185000000123},{"x":-7.563764400000196,"y":-7.576185000000123}]} />
<silkscreencircle pcbX="-6.800088mm" pcbY="-7.976108mm" radius="0.100076mm" />
<silkscreentext text="{NAME}" pcbX="-0.105664mm" pcbY="8.585964mm" anchorAlignment="center" fontSize="1mm" />
<fabricationnotepath route={[{"x":-7.563764400000196,"y":-7.0261734000000615},{"x":-7.013778200000047,"y":-7.576185000000123},{"x":-7.563764400000196,"y":-7.576185000000123},{"x":-7.563764400000196,"y":-7.0261734000000615}]} strokeWidth="0.254mm" />
<courtyardoutline outline={[{"x":-8.039164000000028,"y":7.835963999999876},{"x":7.8278360000000475,"y":7.835963999999876},{"x":7.8278360000000475,"y":-8.310435999999982},{"x":-8.039164000000028,"y":-8.310435999999982},{"x":-8.039164000000028,"y":7.835963999999876}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C468247.obj?uuid=081c6ec87b3943f1b027fab412176686",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C468247.step?uuid=081c6ec87b3943f1b027fab412176686",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}