import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["CTG"],
  pin2: ["CELL"],
  pin3: ["VDD"],
  pin4: ["GND"],
  pin5: ["N_ALRT"],
  pin6: ["QSTRT"],
  pin7: ["SCL"],
  pin8: ["SDA"],
  pin9: ["EP"]
} as const

const pinAttributes = {
  pin1: {requiresGround: true},
  pin9: {requiresGround: true},
  pin3: {requiresPower: true},
  pin4: {requiresGround: true}
} as const

export const MAX17048G_T10 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2682616"
  ]
}}
      manufacturerPartNumber="MAX17048G+T10"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-0.750062mm" pcbY="-0.937514mm" width="0.2800096mm" height="0.4249928mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="-0.249936mm" pcbY="-0.937514mm" width="0.2800096mm" height="0.4249928mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="0.249936mm" pcbY="-0.937514mm" width="0.2800096mm" height="0.4249928mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="0.750062mm" pcbY="-0.937514mm" width="0.2800096mm" height="0.4249928mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="0.750062mm" pcbY="0.937514mm" width="0.2800096mm" height="0.4249928mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="0.249936mm" pcbY="0.937514mm" width="0.2800096mm" height="0.4249928mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="-0.249936mm" pcbY="0.937514mm" width="0.2800096mm" height="0.4249928mm" shape="rect" />
<smtpad portHints={["pin8"]} pcbX="-0.750062mm" pcbY="0.937514mm" width="0.2800096mm" height="0.4249928mm" shape="rect" />
<smtpad portHints={["pin9"]} pcbX="0mm" pcbY="-0mm" width="1.1999976mm" height="0.7999984mm" shape="rect" />
<silkscreenpath route={[{"x":-1.076198000000005,"y":1.076198000000005},{"x":-1.076198000000005,"y":-0.5725922000000025}]} />
<silkscreenpath route={[{"x":1.076198000000005,"y":1.076198000000005},{"x":1.076198000000005,"y":-0.5725922000000025}]} />
<silkscreenpath route={[{"x":1.076198000000005,"y":-1.0761980000000193},{"x":1.076198000000005,"y":0.5725921999999883}]} />
<silkscreenpath route={[{"x":-1.076198000000005,"y":-1.0761980000000193},{"x":-1.076198000000005,"y":0.5725921999999883}]} />
<silkscreencircle pcbX="-0.750062mm" pcbY="-1.425702mm" radius="0.100076mm" />
<silkscreentext text="{NAME}" pcbX="0.0127mm" pcbY="2.143mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-1.3168000000000006,"y":1.3929999999999865},{"x":1.3422000000000196,"y":1.3929999999999865},{"x":1.3422000000000196,"y":-1.774000000000001},{"x":-1.3168000000000006,"y":-1.774000000000001},{"x":-1.3168000000000006,"y":1.3929999999999865}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2682616.obj?uuid=9f88ab37f18741bd85a157cdee617c79",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2682616.step?uuid=9f88ab37f18741bd85a157cdee617c79",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.000012700000013410317, z: -0.02 },
      }}
      {...props}
    />
  )
}
