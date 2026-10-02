import type { ChipProps } from "@tscircuit/props"

export const pinLabels = {
  pin1: ["A1","VDDQ1"],
  pin2: ["B1","VSSQ1"],
  pin3: ["C1","VDDQ2"],
  pin4: ["D1","VSSQ2"],
  pin5: ["E1","VSS1"],
  pin6: ["F1","VDDQ3"],
  pin7: ["G1","VSSQ3"],
  pin8: ["H1","VREFDQ"],
  pin9: ["J1","NC1"],
  pin10: ["K1","ODT"],
  pin11: ["L1","NC2"],
  pin12: ["M1","VSS2"],
  pin13: ["N1","VDD1"],
  pin14: ["P1","VSS3"],
  pin15: ["R1","VDD2"],
  pin16: ["T1","VSS4"],
  pin17: ["A2","DQ13"],
  pin18: ["B2","VDD3"],
  pin19: ["C2","DQ11"],
  pin20: ["D2","VDDQ4"],
  pin21: ["E2","VSSQ4"],
  pin22: ["F2","DQ2"],
  pin23: ["G2","DQ6"],
  pin24: ["H2","VDDQ5"],
  pin25: ["J2","VSS5"],
  pin26: ["K2","VDD4"],
  pin27: ["L2","CSn"],
  pin28: ["M2","BA0"],
  pin29: ["N2","RAM_A3"],
  pin30: ["P2","RAM_A5"],
  pin31: ["R2","RAM_A7"],
  pin32: ["T2","RESETn"],
  pin33: ["A3","DQ15"],
  pin34: ["B3","VSS6"],
  pin35: ["C3","DQ9"],
  pin36: ["D3","UDM"],
  pin37: ["E3","DQ0"],
  pin38: ["F3","LDQS"],
  pin39: ["G3","LDQSn"],
  pin40: ["H3","DQ4"],
  pin41: ["J3","RASn"],
  pin42: ["K3","CASn"],
  pin43: ["L3","WEn"],
  pin44: ["M3","BA2"],
  pin45: ["N3","RAM_A0"],
  pin46: ["P3","RAM_A2"],
  pin47: ["R3","RAM_A9"],
  pin48: ["T3","RAM_A13"],
  pin49: ["A7","DQ12"],
  pin50: ["B7","UDQSn"],
  pin51: ["C7","UDQS"],
  pin52: ["D7","DQ8"],
  pin53: ["E7","LDM"],
  pin54: ["F7","DQ1"],
  pin55: ["G7","VDD5"],
  pin56: ["H7","DQ7"],
  pin57: ["J7","CK"],
  pin58: ["K7","CKn"],
  pin59: ["L7","RAM_A10"],
  pin60: ["M7","NC3"],
  pin61: ["N7","RAM_A12"],
  pin62: ["P7","RAM_A1"],
  pin63: ["R7","RAM_A11"],
  pin64: ["T7","RAM_A14"],
  pin65: ["A8","VDDQ6"],
  pin66: ["B8","DQ14"],
  pin67: ["C8","DQ10"],
  pin68: ["D8","VSSQ5"],
  pin69: ["E8","VSSQ6"],
  pin70: ["F8","DQ3"],
  pin71: ["G8","VSS7"],
  pin72: ["H8","DQ5"],
  pin73: ["J8","VSS8"],
  pin74: ["K8","VDD6"],
  pin75: ["L8","ZQ"],
  pin76: ["M8","VREFCA"],
  pin77: ["N8","BA1"],
  pin78: ["P8","RAM_A4"],
  pin79: ["R8","RAM_A6"],
  pin80: ["T8","RAM_A8"],
  pin81: ["A9","VSS9"],
  pin82: ["B9","VSSQ7"],
  pin83: ["C9","VDDQ7"],
  pin84: ["D9","VDD7"],
  pin85: ["E9","VDDQ8"],
  pin86: ["F9","VSSQ8"],
  pin87: ["G9","VSSQ9"],
  pin88: ["H9","VDDQ9"],
  pin89: ["J9","NC4"],
  pin90: ["K9","CKE"],
  pin91: ["L9","NC5"],
  pin92: ["M9","VSS10"],
  pin93: ["N9","VDD8"],
  pin94: ["P9","VSS11"],
  pin95: ["R9","VDD9"],
  pin96: ["T9","VSS12"]
} as const

export const MT41K256M16TW_107_P = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C253882"
  ]
}}
      manufacturerPartNumber="MT41K256M16TW-107:P"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-3.2mm" pcbY="6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin2"]} pcbX="-3.2mm" pcbY="5.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin3"]} pcbX="-3.2mm" pcbY="4.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin4"]} pcbX="-3.2mm" pcbY="3.6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin5"]} pcbX="-3.2mm" pcbY="2.8mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin6"]} pcbX="-3.2mm" pcbY="2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin7"]} pcbX="-3.2mm" pcbY="1.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin8"]} pcbX="-3.2mm" pcbY="0.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin9"]} pcbX="-3.2mm" pcbY="-0.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin10"]} pcbX="-3.2mm" pcbY="-1.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin11"]} pcbX="-3.2mm" pcbY="-2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin12"]} pcbX="-3.2mm" pcbY="-2.8mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin13"]} pcbX="-3.2mm" pcbY="-3.6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin14"]} pcbX="-3.2mm" pcbY="-4.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin15"]} pcbX="-3.2mm" pcbY="-5.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin16"]} pcbX="-3.2mm" pcbY="-6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin17"]} pcbX="-2.4mm" pcbY="6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin18"]} pcbX="-2.4mm" pcbY="5.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin19"]} pcbX="-2.4mm" pcbY="4.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin20"]} pcbX="-2.4mm" pcbY="3.6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin21"]} pcbX="-2.4mm" pcbY="2.8mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin22"]} pcbX="-2.4mm" pcbY="2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin23"]} pcbX="-2.4mm" pcbY="1.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin24"]} pcbX="-2.4mm" pcbY="0.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin25"]} pcbX="-2.4mm" pcbY="-0.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin26"]} pcbX="-2.4mm" pcbY="-1.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin27"]} pcbX="-2.4mm" pcbY="-2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin28"]} pcbX="-2.4mm" pcbY="-2.8mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin29"]} pcbX="-2.4mm" pcbY="-3.6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin30"]} pcbX="-2.4mm" pcbY="-4.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin31"]} pcbX="-2.4mm" pcbY="-5.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin32"]} pcbX="-2.4mm" pcbY="-6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin33"]} pcbX="-1.6mm" pcbY="6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin34"]} pcbX="-1.6mm" pcbY="5.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin35"]} pcbX="-1.6mm" pcbY="4.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin36"]} pcbX="-1.6mm" pcbY="3.6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin37"]} pcbX="-1.6mm" pcbY="2.8mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin38"]} pcbX="-1.6mm" pcbY="2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin39"]} pcbX="-1.6mm" pcbY="1.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin40"]} pcbX="-1.6mm" pcbY="0.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin41"]} pcbX="-1.6mm" pcbY="-0.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin42"]} pcbX="-1.6mm" pcbY="-1.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin43"]} pcbX="-1.6mm" pcbY="-2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin44"]} pcbX="-1.6mm" pcbY="-2.8mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin45"]} pcbX="-1.6mm" pcbY="-3.6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin46"]} pcbX="-1.6mm" pcbY="-4.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin47"]} pcbX="-1.6mm" pcbY="-5.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin48"]} pcbX="-1.6mm" pcbY="-6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin49"]} pcbX="1.6mm" pcbY="6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin50"]} pcbX="1.6mm" pcbY="5.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin51"]} pcbX="1.6mm" pcbY="4.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin52"]} pcbX="1.6mm" pcbY="3.6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin53"]} pcbX="1.6mm" pcbY="2.8mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin54"]} pcbX="1.6mm" pcbY="2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin55"]} pcbX="1.6mm" pcbY="1.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin56"]} pcbX="1.6mm" pcbY="0.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin57"]} pcbX="1.6mm" pcbY="-0.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin58"]} pcbX="1.6mm" pcbY="-1.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin59"]} pcbX="1.6mm" pcbY="-2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin60"]} pcbX="1.6mm" pcbY="-2.8mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin61"]} pcbX="1.6mm" pcbY="-3.6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin62"]} pcbX="1.6mm" pcbY="-4.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin63"]} pcbX="1.6mm" pcbY="-5.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin64"]} pcbX="1.6mm" pcbY="-6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin65"]} pcbX="2.4mm" pcbY="6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin66"]} pcbX="2.4mm" pcbY="5.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin67"]} pcbX="2.4mm" pcbY="4.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin68"]} pcbX="2.4mm" pcbY="3.6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin69"]} pcbX="2.4mm" pcbY="2.8mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin70"]} pcbX="2.4mm" pcbY="2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin71"]} pcbX="2.4mm" pcbY="1.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin72"]} pcbX="2.4mm" pcbY="0.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin73"]} pcbX="2.4mm" pcbY="-0.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin74"]} pcbX="2.4mm" pcbY="-1.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin75"]} pcbX="2.4mm" pcbY="-2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin76"]} pcbX="2.4mm" pcbY="-2.8mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin77"]} pcbX="2.4mm" pcbY="-3.6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin78"]} pcbX="2.4mm" pcbY="-4.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin79"]} pcbX="2.4mm" pcbY="-5.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin80"]} pcbX="2.4mm" pcbY="-6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin81"]} pcbX="3.2mm" pcbY="6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin82"]} pcbX="3.2mm" pcbY="5.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin83"]} pcbX="3.2mm" pcbY="4.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin84"]} pcbX="3.2mm" pcbY="3.6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin85"]} pcbX="3.2mm" pcbY="2.8mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin86"]} pcbX="3.2mm" pcbY="2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin87"]} pcbX="3.2mm" pcbY="1.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin88"]} pcbX="3.2mm" pcbY="0.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin89"]} pcbX="3.2mm" pcbY="-0.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin90"]} pcbX="3.2mm" pcbY="-1.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin91"]} pcbX="3.2mm" pcbY="-2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin92"]} pcbX="3.2mm" pcbY="-2.8mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin93"]} pcbX="3.2mm" pcbY="-3.6mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin94"]} pcbX="3.2mm" pcbY="-4.4mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin95"]} pcbX="3.2mm" pcbY="-5.2mm" radius="0.21mm" shape="circle" />
<smtpad portHints={["pin96"]} pcbX="3.2mm" pcbY="-6mm" radius="0.21mm" shape="circle" />
<silkscreenpath route={[{"x":-4.076191999999992,"y":7.0762114000001475},{"x":4.076191999999992,"y":7.0762114000001475},{"x":4.076191999999992,"y":-7.076211400000034},{"x":-4.076191999999992,"y":-7.076211400000034},{"x":-4.076191999999992,"y":7.0762114000001475}]} />
<silkscreenpath route={[{"x":-3.4361882000000605,"y":7.304811400000062},{"x":-4.30479200000002,"y":7.304811400000062},{"x":-4.30479200000002,"y":6.436207599999989}]} />
<silkscreencircle pcbX="-4.445mm" pcbY="6.477mm" radius="0.100076mm" />
<silkscreentext text="{NAME}" pcbX="-0.2413mm" pcbY="8.3152mm" anchorAlignment="center" fontSize="1mm" />
<fabricationnotepath route={[{"x":-3.436188199999947,"y":7.076211400000034},{"x":-4.076191999999992,"y":6.436207599999989},{"x":-4.076191999999992,"y":7.076211400000034},{"x":-3.436188199999947,"y":7.076211400000034}]} strokeWidth="0.254mm" />
<courtyardoutline outline={[{"x":-4.796600000000126,"y":7.565200000000118},{"x":4.3139999999999645,"y":7.565200000000118},{"x":4.3139999999999645,"y":-7.311199999999872},{"x":-4.796600000000126,"y":-7.311199999999872},{"x":-4.796600000000126,"y":7.565200000000118}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C253882.obj?uuid=725f4b734fb64131b17d53834ab96bec",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C253882.step?uuid=725f4b734fb64131b17d53834ab96bec",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}