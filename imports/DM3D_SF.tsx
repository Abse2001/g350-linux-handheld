import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["DAT2"],
  pin2: ["pin2"],
  pin3: ["CMD"],
  pin4: ["VDD"],
  pin5: ["CLK"],
  pin6: ["VSS"],
  pin7: ["DAT0"],
  pin8: ["DAT1"],
  pin9: ["B"],
  pin10: ["A"],
  pin11: ["GND1"],
  pin12: ["GND2"],
  pin13: ["GND3"],
  pin14: ["GND4"]
} as const

const pinAttributes = {
  pin4: {requiresPower: true},
  pin6: {requiresGround: true},
  pin11: {requiresGround: true},
  pin12: {requiresGround: true},
  pin13: {requiresGround: true},
  pin14: {requiresGround: true}
} as const

export const DM3D_SF = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C719027"
  ]
}}
      manufacturerPartNumber="DM3D-SF"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="3.175mm" pcbY="-5.3500401mm" width="0.5999988mm" height="1.7500092mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="2.074926mm" pcbY="-5.3500401mm" width="0.5999988mm" height="1.7500092mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="0.975106mm" pcbY="-5.3500401mm" width="0.5999988mm" height="1.7500092mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-0.124968mm" pcbY="-5.3500401mm" width="0.5999988mm" height="1.7500092mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="-1.225042mm" pcbY="-5.3500401mm" width="0.5999988mm" height="1.7500092mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="-2.325116mm" pcbY="-5.3500401mm" width="0.5999988mm" height="1.7500092mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="-3.424936mm" pcbY="-5.3500401mm" width="0.5999988mm" height="1.7500092mm" shape="rect" />
<smtpad portHints={["pin8"]} pcbX="-4.52501mm" pcbY="-5.3500401mm" width="0.5999988mm" height="1.7500092mm" shape="rect" />
<smtpad portHints={["pin9"]} pcbX="-5.649976mm" pcbY="3.8749859mm" width="1.4500098mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin10"]} pcbX="5.174996mm" pcbY="5.4500399mm" width="0.999998mm" height="1.5500096mm" shape="rect" />
<smtpad portHints={["pin11"]} pcbX="-5.975096mm" pcbY="2.3751159mm" width="0.7999984mm" height="1.499997mm" shape="rect" />
<smtpad portHints={["pin12"]} pcbX="5.975096mm" pcbY="3.0251019mm" width="0.7999984mm" height="1.3999972mm" shape="rect" />
<smtpad portHints={["pin13"]} pcbX="5.625084mm" pcbY="-5.2248181mm" width="1.499997mm" height="1.499997mm" shape="rect" />
<smtpad portHints={["pin14"]} pcbX="-5.724906mm" pcbY="-5.2248181mm" width="1.2999974mm" height="1.499997mm" shape="rect" />
<silkscreenpath route={[{"x":-6.000013400000171,"y":1.3939392999999427},{"x":-6.000013400000171,"y":-4.243743100000074}]} />
<silkscreenpath route={[{"x":4.44385699999998,"y":5.650217300000008},{"x":-6.000013400000171,"y":5.650217300000008},{"x":-6.000013400000171,"y":4.606226499999934}]} />
<silkscreenpath route={[{"x":6.00001339999983,"y":5.650217300000008},{"x":5.906134999999949,"y":5.650217300000008}]} />
<silkscreenpath route={[{"x":4.643831199999909,"y":-5.849810500000103},{"x":3.7061393999999837,"y":-5.849810500000103}]} />
<silkscreenpath route={[{"x":6.00001339999983,"y":2.0939124999999876},{"x":6.00001339999983,"y":-4.243743100000074}]} />
<silkscreenpath route={[{"x":6.00001339999983,"y":5.650217300000008},{"x":6.00001339999983,"y":3.9561896999999817}]} />
<silkscreentext text="{NAME}" pcbX="0mm" pcbY="7.2326139mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-6.625400000000127,"y":6.482613899999933},{"x":6.6253999999999,"y":6.482613899999933},{"x":6.6253999999999,"y":-6.463386100000093},{"x":-6.625400000000127,"y":-6.463386100000093},{"x":-6.625400000000127,"y":6.482613899999933}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C719027.obj?uuid=38bdefc2b16849a19516217cac32ae4a",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C719027.step?uuid=38bdefc2b16849a19516217cac32ae4a",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.038989000000128726, y: 0.07080250000012711, z: -1.76 },
      }}
      {...props}
    />
  )
}