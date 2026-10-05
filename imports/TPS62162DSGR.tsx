import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["PGND"],
  pin2: ["VIN"],
  pin3: ["EN"],
  pin4: ["AGND"],
  pin5: ["FB"],
  pin6: ["VOS"],
  pin7: ["SW"],
  pin8: ["PG"],
  pin9: ["EP"]
} as const

const pinAttributes = {
  pin1: {requiresGround: true},
  pin2: {requiresPower: true},
  pin4: {requiresGround: true}
} as const

export const TPS62162DSGR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C40256"
  ]
}}
      manufacturerPartNumber="TPS62162DSGR"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-0.94996mm" pcbY="0.750062mm" width="0.5210048mm" height="0.2500122mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="-0.94996mm" pcbY="0.249936mm" width="0.5210048mm" height="0.2500122mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="-0.94996mm" pcbY="-0.249936mm" width="0.5210048mm" height="0.2500122mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-0.94996mm" pcbY="-0.750062mm" width="0.5210048mm" height="0.2500122mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="0.94996mm" pcbY="-0.750062mm" width="0.5210048mm" height="0.2500122mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="0.94996mm" pcbY="-0.249936mm" width="0.5210048mm" height="0.2500122mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="0.94996mm" pcbY="0.249936mm" width="0.5210048mm" height="0.2500122mm" shape="rect" />
<smtpad portHints={["pin8"]} pcbX="0.94996mm" pcbY="0.750062mm" width="0.5210048mm" height="0.2500122mm" shape="rect" />
<smtpad portHints={["pin9"]} pcbX="0mm" pcbY="0mm" width="0.8999982mm" height="1.5999968mm" shape="rect" />
<silkscreenpath route={[{"x":-1.040002999999956,"y":-1.0599928000000318},{"x":1.059052999999949,"y":-1.0599928000000318}]} />
<silkscreenpath route={[{"x":1.0500359999998636,"y":1.0627359999999726},{"x":-1.0500359999999773,"y":1.0627359999999726}]} />
<silkscreencircle pcbX="-1.397mm" pcbY="1.143mm" radius="0.0762mm" />
<silkscreentext text="{NAME}" pcbX="-0.127mm" pcbY="2.2319mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-1.7232000000000198,"y":1.481899999999996},{"x":1.469199999999887,"y":1.481899999999996},{"x":1.469199999999887,"y":-1.3041000000000622},{"x":-1.7232000000000198,"y":-1.3041000000000622},{"x":-1.7232000000000198,"y":1.481899999999996}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C40256.obj?uuid=2be2baea8d8242eebd2ce617314d92a1",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C40256.step?uuid=2be2baea8d8242eebd2ce617314d92a1",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}