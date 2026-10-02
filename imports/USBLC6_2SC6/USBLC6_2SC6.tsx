import objPath from "./USBLC6_2SC6.obj"
import stepPath from "./USBLC6_2SC6.step"
import { type ChipProps } from "tscircuit"
const pinLabels = {
  "pin1": [],
  "pin2": [],
  "pin3": [],
  "pin4": [],
  "pin5": [],
  "pin6": []
} as const
export const USBLC6_2SC6 = (props: ChipProps<typeof pinLabels>) => (
  <chip
    footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-0.9499599999999191mm" pcbY="-1.1490959999998722mm" layer="top" width="0.532003mm" height="1.0720070000000002mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="0mm" pcbY="-1.1490959999998722mm" layer="top" width="0.532003mm" height="1.0720070000000002mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="0.9499599999998054mm" pcbY="-1.1490959999998722mm" layer="top" width="0.532003mm" height="1.0720070000000002mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="0.9499599999998054mm" pcbY="1.149095999999986mm" layer="top" width="0.532003mm" height="1.0720070000000002mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="0mm" pcbY="1.149095999999986mm" layer="top" width="0.532003mm" height="1.0720070000000002mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="-0.9499599999999191mm" pcbY="1.149095999999986mm" layer="top" width="0.532003mm" height="1.0720070000000002mm" shape="rect" />
<silkscreenpath route={[{"x":1.5391891999998961,"y":-0.8892031999998835},{"x":1.5391891999998961,"y":0.8892031999999972}]} strokeWidth={0.15239999999999998} />
<silkscreenpath route={[{"x":-1.5391892000000098,"y":-0.8892031999998835},{"x":-1.5391892000000098,"y":0.8892031999999972}]} strokeWidth={0.15239999999999998} />
<silkscreencircle pcbX={-1.6682720000001154} pcbY={-1.3014960000000428} radius={0.150114} layer="top" strokeWidth={0.29999939999999997} />
<courtyardoutline outline={[{"x":-2.078800000000001,"y":1.9264000000000578},{"x":1.7739999999998872,"y":1.9264000000000578},{"x":1.7739999999998872,"y":-2.0279999999999063},{"x":-2.078800000000001,"y":-2.0279999999999063},{"x":-2.078800000000001,"y":1.9264000000000578}]} layer="top" />
      </footprint>}
    pinLabels={pinLabels}
    pinAttributes={{
  "pin1": {
    "isPassive": true
  },
  "pin2": {
    "mustBeConnected": true,
    "requiresGround": true
  },
  "pin3": {
    "isPassive": true
  },
  "pin4": {
    "isPassive": true
  },
  "pin5": {
    "isPassive": true,
    "mustBeConnected": true,
    "shouldHaveDecouplingCapacitor": true,
    "recommendedDecouplingCapacitorCapacitance": "100nF"
  },
  "pin6": {
    "isPassive": true
  }
}}
    supplierPartNumbers={{
  "jlcpcb": [
    "C7519"
  ]
}}
    manufacturerPartNumber="USBLC6-2SC6"
    cadModel={{
        objUrl: objPath,
        stepUrl: stepPath,
        pcbRotationOffset: 90,
        modelOriginPosition: {"x":-0.000012700000070253736,"y":0.000012700000070253736,"z":-0.048939},
    }}
    {...props}
  />
)