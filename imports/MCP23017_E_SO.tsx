import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["GPB0"],
  pin2: ["GPB1"],
  pin3: ["GPB2"],
  pin4: ["GPB3"],
  pin5: ["GPB4"],
  pin6: ["GPB5"],
  pin7: ["GPB6"],
  pin8: ["GPB7"],
  pin9: ["VDD"],
  pin10: ["VSS"],
  pin11: ["NC1"],
  pin12: ["SCL"],
  pin13: ["SDA"],
  pin14: ["NC2"],
  pin15: ["A0"],
  pin16: ["A1"],
  pin17: ["A2"],
  pin18: ["N_RESET"],
  pin19: ["INTB"],
  pin20: ["INTA"],
  pin21: ["GPA0"],
  pin22: ["GPA1"],
  pin23: ["GPA2"],
  pin24: ["GPA3"],
  pin25: ["GPA4"],
  pin26: ["GPA5"],
  pin27: ["GPA6"],
  pin28: ["GPA7"]
} as const

const pinAttributes = {
  pin9: {requiresPower: true},
  pin10: {requiresGround: true},
  pin11: {doNotConnect: true},
  pin14: {doNotConnect: true}
} as const

export const MCP23017_E_SO = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C47023"
  ]
}}
      manufacturerPartNumber="MCP23017-E/SO"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-8.255mm" pcbY="-5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin2"]} pcbX="-6.985mm" pcbY="-5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin3"]} pcbX="-5.715mm" pcbY="-5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin4"]} pcbX="-4.445mm" pcbY="-5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin5"]} pcbX="-3.175mm" pcbY="-5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin6"]} pcbX="-1.905mm" pcbY="-5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin7"]} pcbX="-0.635mm" pcbY="-5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin8"]} pcbX="0.635mm" pcbY="-5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin9"]} pcbX="1.905mm" pcbY="-5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin10"]} pcbX="3.175mm" pcbY="-5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin11"]} pcbX="4.445mm" pcbY="-5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin12"]} pcbX="5.715mm" pcbY="-5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin13"]} pcbX="6.985mm" pcbY="-5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin14"]} pcbX="8.255mm" pcbY="-5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin28"]} pcbX="-8.255mm" pcbY="5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin27"]} pcbX="-6.985mm" pcbY="5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin26"]} pcbX="-5.715mm" pcbY="5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin25"]} pcbX="-4.445mm" pcbY="5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin24"]} pcbX="-3.175mm" pcbY="5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin23"]} pcbX="-1.905mm" pcbY="5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin22"]} pcbX="-0.635mm" pcbY="5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin21"]} pcbX="0.635mm" pcbY="5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin20"]} pcbX="1.905mm" pcbY="5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin19"]} pcbX="3.175mm" pcbY="5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin18"]} pcbX="4.445mm" pcbY="5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin17"]} pcbX="5.715mm" pcbY="5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin16"]} pcbX="6.985mm" pcbY="5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<smtpad portHints={["pin15"]} pcbX="8.255mm" pcbY="5.057521mm" width="0.5999988mm" height="2.2999954mm" radius="0.2999994mm" shape="pill" />
<silkscreenpath route={[{"x":-9.050020000000004,"y":2.4923749999999814},{"x":-9.050020000000004,"y":3.420490999999984},{"x":9.05001999999999,"y":3.420490999999984},{"x":9.05001999999999,"y":-3.5076130000000063},{"x":-9.050020000000004,"y":-3.5076130000000063},{"x":-9.050020000000004,"y":2.4923749999999814}]} />
<silkscreenpath route={[{"x":-8.049260000000004,"y":-2.206879000000015},{"x":-8.260194378607892,"y":-2.296087359429947},{"x":-8.34671671176774,"y":-2.508137658499436},{"x":-8.258402117039068,"y":-2.719447799829169},{"x":-8.046720000000008,"y":-2.806867047119127},{"x":-7.835037882960933,"y":-2.719447799829169},{"x":-7.746723288232289,"y":-2.508137658499436},{"x":-7.833245621392109,"y":-2.296087359429947},{"x":-8.044180000000011,"y":-2.206879000000015}]} />
<silkscreenpath route={[{"x":-9.100819999999999,"y":-5.356479000000007},{"x":-9.249561055997674,"y":-5.507121029703939},{"x":-9.099550000000008,"y":-5.656498424014757},{"x":-8.949538944002327,"y":-5.507121029703939},{"x":-9.098280000000003,"y":-5.356479000000007}]} />
<silkscreentext text="{NAME}" pcbX="-0.1016mm" pcbY="6.918581mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-9.49560000000001,"y":6.168580999999989},{"x":9.2924,"y":6.168580999999989},{"x":9.2924,"y":-6.142419000000004},{"x":-9.49560000000001,"y":-6.142419000000004},{"x":-9.49560000000001,"y":6.168580999999989}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C47023.obj?uuid=1787df1233ec4c78b05b202f6f794fef",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C47023.step?uuid=1787df1233ec4c78b05b202f6f794fef",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.10001249999999118, y: 0, z: -0.049425 },
      }}
      {...props}
    />
  )
}