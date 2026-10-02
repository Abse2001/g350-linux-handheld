// Imported with tsci from JLCPCB C2912103. Pad centers corrected to the
// manufacturer page-6 0.8 x 0.65 mm grid; original supplier file had 18 offsets.
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["AB1"],
  pin2: ["AA1"],
  pin3: ["Y1"],
  pin4: ["W1"],
  pin5: ["V1"],
  pin6: ["P1"],
  pin7: ["R1"],
  pin8: ["T1"],
  pin9: ["U1"],
  pin10: ["N1"],
  pin11: ["K1"],
  pin12: ["A5"],
  pin13: ["A4"],
  pin14: ["A3"],
  pin15: ["A2"],
  pin16: ["A1"],
  pin17: ["D1"],
  pin18: ["F5"],
  pin19: ["F4"],
  pin20: ["F3"],
  pin21: ["F2"],
  pin22: ["F1"],
  pin23: ["G1"],
  pin24: ["H1"],
  pin25: ["J1"],
  pin26: ["F8"],
  pin27: ["F9"],
  pin28: ["F10"],
  pin29: ["F11"],
  pin30: ["F12"],
  pin31: ["A8"],
  pin32: ["A9"],
  pin33: ["A10"],
  pin34: ["A11"],
  pin35: ["A12"],
  pin36: ["B1"],
  pin37: ["B2"],
  pin38: ["B3"],
  pin39: ["B4"],
  pin40: ["B5"],
  pin41: ["B8"],
  pin42: ["B9"],
  pin43: ["B10"],
  pin44: ["B11"],
  pin45: ["B12"],
  pin46: ["C1"],
  pin47: ["C2"],
  pin48: ["C3"],
  pin49: ["C4"],
  pin50: ["C5"],
  pin51: ["C8"],
  pin52: ["C9"],
  pin53: ["C10"],
  pin54: ["C11"],
  pin55: ["C12"],
  pin56: ["D2"],
  pin57: ["D3"],
  pin58: ["D4"],
  pin59: ["D5"],
  pin60: ["D8"],
  pin61: ["D9"],
  pin62: ["D10"],
  pin63: ["D11"],
  pin64: ["D12"],
  pin65: ["E1"],
  pin66: ["E2"],
  pin67: ["E3"],
  pin68: ["E4"],
  pin69: ["E5"],
  pin70: ["E8"],
  pin71: ["E9"],
  pin72: ["E10"],
  pin73: ["E11"],
  pin74: ["E12"],
  pin75: ["G2"],
  pin76: ["G3"],
  pin77: ["G4"],
  pin78: ["G5"],
  pin79: ["G8"],
  pin80: ["G9"],
  pin81: ["G10"],
  pin82: ["G11"],
  pin83: ["G12"],
  pin84: ["H2"],
  pin85: ["H3"],
  pin86: ["H4"],
  pin87: ["H5"],
  pin88: ["H8"],
  pin89: ["H9"],
  pin90: ["H10"],
  pin91: ["H11"],
  pin92: ["H12"],
  pin93: ["J2"],
  pin94: ["J3"],
  pin95: ["J4"],
  pin96: ["J5"],
  pin97: ["J8"],
  pin98: ["J9"],
  pin99: ["J10"],
  pin100: ["J11"],
  pin101: ["J12"],
  pin102: ["K2"],
  pin103: ["K3"],
  pin104: ["K4"],
  pin105: ["K5"],
  pin106: ["K8"],
  pin107: ["K9"],
  pin108: ["K10"],
  pin109: ["K11"],
  pin110: ["K12"],
  pin111: ["N2"],
  pin112: ["N3"],
  pin113: ["N4"],
  pin114: ["N5"],
  pin115: ["N8"],
  pin116: ["N9"],
  pin117: ["N10"],
  pin118: ["N11"],
  pin119: ["N12"],
  pin120: ["P2"],
  pin121: ["P3"],
  pin122: ["P4"],
  pin123: ["P5"],
  pin124: ["P8"],
  pin125: ["P9"],
  pin126: ["P10"],
  pin127: ["P11"],
  pin128: ["P12"],
  pin129: ["R2"],
  pin130: ["R3"],
  pin131: ["R4"],
  pin132: ["R5"],
  pin133: ["R8"],
  pin134: ["R9"],
  pin135: ["R10"],
  pin136: ["R11"],
  pin137: ["R12"],
  pin138: ["T2"],
  pin139: ["T3"],
  pin140: ["T4"],
  pin141: ["T5"],
  pin142: ["T8"],
  pin143: ["T9"],
  pin144: ["T10"],
  pin145: ["T11"],
  pin146: ["T12"],
  pin147: ["U4"],
  pin148: ["U2"],
  pin149: ["U3"],
  pin150: ["U5"],
  pin151: ["U8"],
  pin152: ["U9"],
  pin153: ["U10"],
  pin154: ["U11"],
  pin155: ["U12"],
  pin156: ["V2"],
  pin157: ["V3"],
  pin158: ["V4"],
  pin159: ["V5"],
  pin160: ["V8"],
  pin161: ["V9"],
  pin162: ["V10"],
  pin163: ["V11"],
  pin164: ["V12"],
  pin165: ["W2"],
  pin166: ["W3"],
  pin167: ["W4"],
  pin168: ["W5"],
  pin169: ["W8"],
  pin170: ["W9"],
  pin171: ["W10"],
  pin172: ["W11"],
  pin173: ["W12"],
  pin174: ["Y2"],
  pin175: ["Y3"],
  pin176: ["Y4"],
  pin177: ["Y5"],
  pin178: ["Y8"],
  pin179: ["Y9"],
  pin180: ["Y10"],
  pin181: ["Y11"],
  pin182: ["Y12"],
  pin183: ["AA2"],
  pin184: ["AA3"],
  pin185: ["AA4"],
  pin186: ["AA5"],
  pin187: ["AA8"],
  pin188: ["AA9"],
  pin189: ["AA10"],
  pin190: ["AA11"],
  pin191: ["AA12"],
  pin192: ["AB2"],
  pin193: ["AB3"],
  pin194: ["AB4"],
  pin195: ["AB5"],
  pin196: ["AB8"],
  pin197: ["AB9"],
  pin198: ["AB10"],
  pin199: ["AB11"],
  pin200: ["AB12"]
} as const

export const H9HCNNN8KUMLHR_NME = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2912103"
  ]
}}
      manufacturerPartNumber="H9HCNNN8KUMLHR-NME"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-4.400000mm" pcbY="-6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin2"]} pcbX="-4.400000mm" pcbY="-6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin3"]} pcbX="-4.400000mm" pcbY="-5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin4"]} pcbX="-4.400000mm" pcbY="-4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin5"]} pcbX="-4.400000mm" pcbY="-4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin6"]} pcbX="-4.400000mm" pcbY="-1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin7"]} pcbX="-4.400000mm" pcbY="-2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin8"]} pcbX="-4.400000mm" pcbY="-2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin9"]} pcbX="-4.400000mm" pcbY="-3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin10"]} pcbX="-4.400000mm" pcbY="-0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin11"]} pcbX="-4.400000mm" pcbY="0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin12"]} pcbX="-1.200000mm" pcbY="6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin13"]} pcbX="-2.000000mm" pcbY="6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin14"]} pcbX="-2.800000mm" pcbY="6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin15"]} pcbX="-3.600000mm" pcbY="6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin16"]} pcbX="-4.400000mm" pcbY="6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin17"]} pcbX="-4.400000mm" pcbY="4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin18"]} pcbX="-1.200000mm" pcbY="3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin19"]} pcbX="-2.000000mm" pcbY="3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin20"]} pcbX="-2.800000mm" pcbY="3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin21"]} pcbX="-3.600000mm" pcbY="3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin22"]} pcbX="-4.400000mm" pcbY="3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin23"]} pcbX="-4.400000mm" pcbY="2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin24"]} pcbX="-4.400000mm" pcbY="2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin25"]} pcbX="-4.400000mm" pcbY="1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin26"]} pcbX="1.200000mm" pcbY="3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin27"]} pcbX="2.000000mm" pcbY="3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin28"]} pcbX="2.800000mm" pcbY="3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin29"]} pcbX="3.600000mm" pcbY="3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin30"]} pcbX="4.400000mm" pcbY="3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin31"]} pcbX="1.200000mm" pcbY="6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin32"]} pcbX="2.000000mm" pcbY="6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin33"]} pcbX="2.800000mm" pcbY="6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin34"]} pcbX="3.600000mm" pcbY="6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin35"]} pcbX="4.400000mm" pcbY="6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin36"]} pcbX="-4.400000mm" pcbY="6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin37"]} pcbX="-3.600000mm" pcbY="6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin38"]} pcbX="-2.800000mm" pcbY="6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin39"]} pcbX="-2.000000mm" pcbY="6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin40"]} pcbX="-1.200000mm" pcbY="6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin41"]} pcbX="1.200000mm" pcbY="6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin42"]} pcbX="2.000000mm" pcbY="6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin43"]} pcbX="2.800000mm" pcbY="6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin44"]} pcbX="3.600000mm" pcbY="6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin45"]} pcbX="4.400000mm" pcbY="6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin46"]} pcbX="-4.400000mm" pcbY="5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin47"]} pcbX="-3.600000mm" pcbY="5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin48"]} pcbX="-2.800000mm" pcbY="5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin49"]} pcbX="-2.000000mm" pcbY="5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin50"]} pcbX="-1.200000mm" pcbY="5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin51"]} pcbX="1.200000mm" pcbY="5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin52"]} pcbX="2.000000mm" pcbY="5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin53"]} pcbX="2.800000mm" pcbY="5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin54"]} pcbX="3.600000mm" pcbY="5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin55"]} pcbX="4.400000mm" pcbY="5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin56"]} pcbX="-3.600000mm" pcbY="4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin57"]} pcbX="-2.800000mm" pcbY="4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin58"]} pcbX="-2.000000mm" pcbY="4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin59"]} pcbX="-1.200000mm" pcbY="4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin60"]} pcbX="1.200000mm" pcbY="4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin61"]} pcbX="2.000000mm" pcbY="4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin62"]} pcbX="2.800000mm" pcbY="4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin63"]} pcbX="3.600000mm" pcbY="4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin64"]} pcbX="4.400000mm" pcbY="4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin65"]} pcbX="-4.400000mm" pcbY="4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin66"]} pcbX="-3.600000mm" pcbY="4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin67"]} pcbX="-2.800000mm" pcbY="4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin68"]} pcbX="-2.000000mm" pcbY="4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin69"]} pcbX="-1.200000mm" pcbY="4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin70"]} pcbX="1.200000mm" pcbY="4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin71"]} pcbX="2.000000mm" pcbY="4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin72"]} pcbX="2.800000mm" pcbY="4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin73"]} pcbX="3.600000mm" pcbY="4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin74"]} pcbX="4.400000mm" pcbY="4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin75"]} pcbX="-3.600000mm" pcbY="2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin76"]} pcbX="-2.800000mm" pcbY="2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin77"]} pcbX="-2.000000mm" pcbY="2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin78"]} pcbX="-1.200000mm" pcbY="2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin79"]} pcbX="1.200000mm" pcbY="2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin80"]} pcbX="2.000000mm" pcbY="2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin81"]} pcbX="2.800000mm" pcbY="2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin82"]} pcbX="3.600000mm" pcbY="2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin83"]} pcbX="4.400000mm" pcbY="2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin84"]} pcbX="-3.600000mm" pcbY="2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin85"]} pcbX="-2.800000mm" pcbY="2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin86"]} pcbX="-2.000000mm" pcbY="2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin87"]} pcbX="-1.200000mm" pcbY="2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin88"]} pcbX="1.200000mm" pcbY="2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin89"]} pcbX="2.000000mm" pcbY="2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin90"]} pcbX="2.800000mm" pcbY="2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin91"]} pcbX="3.600000mm" pcbY="2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin92"]} pcbX="4.400000mm" pcbY="2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin93"]} pcbX="-3.600000mm" pcbY="1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin94"]} pcbX="-2.800000mm" pcbY="1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin95"]} pcbX="-2.000000mm" pcbY="1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin96"]} pcbX="-1.200000mm" pcbY="1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin97"]} pcbX="1.200000mm" pcbY="1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin98"]} pcbX="2.000000mm" pcbY="1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin99"]} pcbX="2.800000mm" pcbY="1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin100"]} pcbX="3.600000mm" pcbY="1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin101"]} pcbX="4.400000mm" pcbY="1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin102"]} pcbX="-3.600000mm" pcbY="0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin103"]} pcbX="-2.800000mm" pcbY="0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin104"]} pcbX="-2.000000mm" pcbY="0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin105"]} pcbX="-1.200000mm" pcbY="0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin106"]} pcbX="1.200000mm" pcbY="0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin107"]} pcbX="2.000000mm" pcbY="0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin108"]} pcbX="2.800000mm" pcbY="0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin109"]} pcbX="3.600000mm" pcbY="0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin110"]} pcbX="4.400000mm" pcbY="0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin111"]} pcbX="-3.600000mm" pcbY="-0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin112"]} pcbX="-2.800000mm" pcbY="-0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin113"]} pcbX="-2.000000mm" pcbY="-0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin114"]} pcbX="-1.200000mm" pcbY="-0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin115"]} pcbX="1.200000mm" pcbY="-0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin116"]} pcbX="2.000000mm" pcbY="-0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin117"]} pcbX="2.800000mm" pcbY="-0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin118"]} pcbX="3.600000mm" pcbY="-0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin119"]} pcbX="4.400000mm" pcbY="-0.975000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin120"]} pcbX="-3.600000mm" pcbY="-1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin121"]} pcbX="-2.800000mm" pcbY="-1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin122"]} pcbX="-2.000000mm" pcbY="-1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin123"]} pcbX="-1.200000mm" pcbY="-1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin124"]} pcbX="1.200000mm" pcbY="-1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin125"]} pcbX="2.000000mm" pcbY="-1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin126"]} pcbX="2.800000mm" pcbY="-1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin127"]} pcbX="3.600000mm" pcbY="-1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin128"]} pcbX="4.400000mm" pcbY="-1.625000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin129"]} pcbX="-3.600000mm" pcbY="-2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin130"]} pcbX="-2.800000mm" pcbY="-2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin131"]} pcbX="-2.000000mm" pcbY="-2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin132"]} pcbX="-1.200000mm" pcbY="-2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin133"]} pcbX="1.200000mm" pcbY="-2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin134"]} pcbX="2.000000mm" pcbY="-2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin135"]} pcbX="2.800000mm" pcbY="-2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin136"]} pcbX="3.600000mm" pcbY="-2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin137"]} pcbX="4.400000mm" pcbY="-2.275000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin138"]} pcbX="-3.600000mm" pcbY="-2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin139"]} pcbX="-2.800000mm" pcbY="-2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin140"]} pcbX="-2.000000mm" pcbY="-2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin141"]} pcbX="-1.200000mm" pcbY="-2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin142"]} pcbX="1.200000mm" pcbY="-2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin143"]} pcbX="2.000000mm" pcbY="-2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin144"]} pcbX="2.800000mm" pcbY="-2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin145"]} pcbX="3.600000mm" pcbY="-2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin146"]} pcbX="4.400000mm" pcbY="-2.925000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin147"]} pcbX="-2.000000mm" pcbY="-3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin148"]} pcbX="-3.600000mm" pcbY="-3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin149"]} pcbX="-2.800000mm" pcbY="-3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin150"]} pcbX="-1.200000mm" pcbY="-3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin151"]} pcbX="1.200000mm" pcbY="-3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin152"]} pcbX="2.000000mm" pcbY="-3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin153"]} pcbX="2.800000mm" pcbY="-3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin154"]} pcbX="3.600000mm" pcbY="-3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin155"]} pcbX="4.400000mm" pcbY="-3.575000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin156"]} pcbX="-3.600000mm" pcbY="-4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin157"]} pcbX="-2.800000mm" pcbY="-4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin158"]} pcbX="-2.000000mm" pcbY="-4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin159"]} pcbX="-1.200000mm" pcbY="-4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin160"]} pcbX="1.200000mm" pcbY="-4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin161"]} pcbX="2.000000mm" pcbY="-4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin162"]} pcbX="2.800000mm" pcbY="-4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin163"]} pcbX="3.600000mm" pcbY="-4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin164"]} pcbX="4.400000mm" pcbY="-4.225000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin165"]} pcbX="-3.600000mm" pcbY="-4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin166"]} pcbX="-2.800000mm" pcbY="-4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin167"]} pcbX="-2.000000mm" pcbY="-4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin168"]} pcbX="-1.200000mm" pcbY="-4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin169"]} pcbX="1.200000mm" pcbY="-4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin170"]} pcbX="2.000000mm" pcbY="-4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin171"]} pcbX="2.800000mm" pcbY="-4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin172"]} pcbX="3.600000mm" pcbY="-4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin173"]} pcbX="4.400000mm" pcbY="-4.875000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin174"]} pcbX="-3.600000mm" pcbY="-5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin175"]} pcbX="-2.800000mm" pcbY="-5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin176"]} pcbX="-2.000000mm" pcbY="-5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin177"]} pcbX="-1.200000mm" pcbY="-5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin178"]} pcbX="1.200000mm" pcbY="-5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin179"]} pcbX="2.000000mm" pcbY="-5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin180"]} pcbX="2.800000mm" pcbY="-5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin181"]} pcbX="3.600000mm" pcbY="-5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin182"]} pcbX="4.400000mm" pcbY="-5.525000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin183"]} pcbX="-3.600000mm" pcbY="-6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin184"]} pcbX="-2.800000mm" pcbY="-6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin185"]} pcbX="-2.000000mm" pcbY="-6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin186"]} pcbX="-1.200000mm" pcbY="-6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin187"]} pcbX="1.200000mm" pcbY="-6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin188"]} pcbX="2.000000mm" pcbY="-6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin189"]} pcbX="2.800000mm" pcbY="-6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin190"]} pcbX="3.600000mm" pcbY="-6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin191"]} pcbX="4.400000mm" pcbY="-6.175000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin192"]} pcbX="-3.600000mm" pcbY="-6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin193"]} pcbX="-2.800000mm" pcbY="-6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin194"]} pcbX="-2.000000mm" pcbY="-6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin195"]} pcbX="-1.200000mm" pcbY="-6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin196"]} pcbX="1.200000mm" pcbY="-6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin197"]} pcbX="2.000000mm" pcbY="-6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin198"]} pcbX="2.800000mm" pcbY="-6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin199"]} pcbX="3.600000mm" pcbY="-6.825000mm" radius="0.1200023mm" shape="circle" />
<smtpad portHints={["pin200"]} pcbX="4.400000mm" pcbY="-6.825000mm" radius="0.1200023mm" shape="circle" />
<silkscreenpath route={[{"x":-5.450027200000022,"y":6.825107000000116},{"x":-5.450027200000022,"y":7.825105000000121},{"x":-4.450029200000131,"y":7.825105000000121}]} />
<silkscreenrect pcbX="0mm" pcbY="0mm" width="9.99998mm" height="14.99997mm" strokeWidth="0.254mm" />
<silkscreentext text="{NAME}" pcbX="-0.23749mm" pcbY="8.816215mm" anchorAlignment="center" fontSize="1mm" />
<fabricationnotepath route={[{"x":-4.999990000000025,"y":7.149973000000159},{"x":-4.999990000000025,"y":7.499985000000038},{"x":-4.649952600000006,"y":7.499985000000038},{"x":-4.999990000000025,"y":7.149973000000159}]} strokeWidth="0.254mm" />
<courtyardoutline outline={[{"x":-5.707190000000082,"y":8.066215000000057},{"x":5.2322099999998954,"y":8.066215000000057},{"x":5.2322099999998954,"y":-7.749984999999924},{"x":-5.707190000000082,"y":-7.749984999999924},{"x":-5.707190000000082,"y":8.066215000000057}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2912103.obj?uuid=af79c29875f642d8b2f861b377320f9c",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2912103.step?uuid=af79c29875f642d8b2f861b377320f9c",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.4 },
      }}
      {...props}
    />
  )
}