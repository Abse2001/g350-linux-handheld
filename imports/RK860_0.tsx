import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["A1","VSEL"],
  pin2: ["A2","EN"],
  pin3: ["A3","SCL"],
  pin4: ["A4","VOUT"],
  pin5: ["B1","SDA"],
  pin6: ["B2","GND1"],
  pin7: ["B3","GND2"],
  pin8: ["B4","AGND"],
  pin9: ["C1","GND3"],
  pin10: ["C2","GND4"],
  pin11: ["C3","GND5"],
  pin12: ["C4","GND6"],
  pin13: ["D1","VIN1"],
  pin14: ["D2","VIN2"],
  pin15: ["D3","LX1"],
  pin16: ["D4","LX2"],
  pin17: ["E1","VIN3"],
  pin18: ["E2","VIN4"],
  pin19: ["E3","LX3"],
  pin20: ["E4","LX4"]
} as const

export const RK860_0 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C19188628"
  ]
}}
      manufacturerPartNumber="RK860-0"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-0.599948mm" pcbY="0.8001mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin2"]} pcbX="-0.199898mm" pcbY="0.8001mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin3"]} pcbX="0.199898mm" pcbY="0.8001mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin4"]} pcbX="0.599948mm" pcbY="0.8001mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin5"]} pcbX="-0.599948mm" pcbY="0.40005mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin6"]} pcbX="-0.199898mm" pcbY="0.40005mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin7"]} pcbX="0.199898mm" pcbY="0.40005mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin8"]} pcbX="0.599948mm" pcbY="0.40005mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin9"]} pcbX="-0.599948mm" pcbY="-0mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin10"]} pcbX="-0.199898mm" pcbY="-0mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin11"]} pcbX="0.199898mm" pcbY="-0mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin12"]} pcbX="0.599948mm" pcbY="-0mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin13"]} pcbX="-0.599948mm" pcbY="-0.40005mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin14"]} pcbX="-0.199898mm" pcbY="-0.40005mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin15"]} pcbX="0.199898mm" pcbY="-0.40005mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin16"]} pcbX="0.599948mm" pcbY="-0.40005mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin17"]} pcbX="-0.599948mm" pcbY="-0.8001mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin18"]} pcbX="-0.199898mm" pcbY="-0.8001mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin19"]} pcbX="0.199898mm" pcbY="-0.8001mm" radius="0.0999998mm" shape="circle" />
<smtpad portHints={["pin20"]} pcbX="0.599948mm" pcbY="-0.8001mm" radius="0.0999998mm" shape="circle" />
<silkscreenpath route={[{"x":0.8098282000000836,"y":-1.0000234000001456},{"x":-0.8102345999999443,"y":-1.0000234000001456}]} />
<silkscreenpath route={[{"x":0.8098282000000836,"y":0.9999725999999782},{"x":-0.8102345999999443,"y":0.9999725999999782}]} />
<silkscreenpath route={[{"x":-0.8038338000000067,"y":-1.0000234000001456},{"x":-0.8102345999999443,"y":-1.0000234000001456}]} />
<silkscreenpath route={[{"x":-0.8038338000000067,"y":0.9999725999999782},{"x":-0.8102345999999443,"y":0.9999725999999782}]} />
<silkscreenpath route={[{"x":-0.8102345999999443,"y":0.9999725999999782},{"x":-0.8102345999999443,"y":-1.0000234000001456}]} />
<silkscreenpath route={[{"x":0.8098282000000836,"y":0.9999725999999782},{"x":0.8098282000000836,"y":-1.0000234000001456}]} />
<silkscreenpath route={[{"x":0.8098282000000836,"y":-1.0000234000001456},{"x":0.8036306000000195,"y":-1.0000234000001456}]} />
<silkscreenpath route={[{"x":0.8098282000000836,"y":0.9999725999999782},{"x":0.8035544000000527,"y":0.9999725999999782}]} />
<silkscreencircle pcbX="-1.050036mm" pcbY="0.810006mm" radius="0.070104mm" />
<silkscreentext text="{NAME}" pcbX="-0.155194mm" pcbY="2.02108mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-1.370394000000033,"y":1.2710799999999836},{"x":1.0600059999999303,"y":1.2710799999999836},{"x":1.0600059999999303,"y":-1.2609200000000556},{"x":-1.370394000000033,"y":-1.2609200000000556},{"x":-1.370394000000033,"y":1.2710799999999836}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C19188628.obj?uuid=cbea8282f5384df5b1afa8ad15399b54",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C19188628.step?uuid=cbea8282f5384df5b1afa8ad15399b54",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.00013970000009067007, y: 0.000025400000140507473, z: -0.508 },
      }}
      {...props}
    />
  )
}